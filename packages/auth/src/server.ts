import { eq } from "@adscrush/db/drizzle"
import { accounts, employees, mediaBuyers, sessions, users, verifications } from "@adscrush/db/schema"
import { MagicLinkEmail, PasswordResetEmail, render } from "@adscrush/email"
import { ADMIN_ROLES, ROLES } from "@adscrush/shared/constants/roles"
import type { BetterAuthOptions } from "better-auth"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { admin as adminPlugin, captcha, customSession, magicLink, openAPI } from "better-auth/plugins"
import { randomInt } from "node:crypto"
import nodemailer from "nodemailer"
import { ac, admin, advertiser, mediaBuyer, employee, superAdmin, user } from "./permissions/ac"

const ALL_ROLES = Object.values(ROLES)
type Role = (typeof ROLES)[keyof typeof ROLES]

/**
 * Derive the parent domain for cross-subdomain cookies from a URL.
 * Returns empty string for localhost / IP addresses.
 */
function deriveCookieDomain(appURL: string): string {
  try {
    const hostname = new URL(appURL).hostname
    if (hostname === "localhost" || hostname === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return ""
    }
    const parts = hostname.split(".")
    if (parts.length >= 2) {
      return "." + parts.slice(-2).join(".")
    }
    return ""
  } catch {
    return ""
  }
}

export interface AuthConfig {
  db: Parameters<typeof drizzleAdapter>[0]
  secret?: string
  port?: number
  /**
   * Explicit API base URL (e.g. "https://api.sehatvati.shop").
   * Falls back to the NODE_ENV-based default if omitted.
   */
  apiURL?: string
  /**
   * Explicit app/frontend URL (e.g. "https://app.sehatvati.shop").
   * Falls back to the NODE_ENV-based default if omitted.
   */
  appURL?: string
  /**
   * Explicit cookie domain for cross-subdomain cookies (e.g. ".sehatvati.shop").
   * If omitted, it's derived automatically from `appURL`.
   */
  cookieDomain?: string
  /**
   * Additional trusted origins beyond the primary `appURL`.
   * The `appURL` is always included automatically.
   */
  extraTrustedOrigins?: string[]
  /**
   * Cloudflare Turnstile secret key. When provided, the captcha plugin is
   * enabled and requires a valid `x-captcha-response` header on the
   * email/password sign-in endpoint.
   */
  turnstileSecretKey?: string
}

export function createAuth(config: AuthConfig) {
  const nodeEnv = process.env.NODE_ENV ?? "development"
  const isProd = nodeEnv === "production"
  const isDev = nodeEnv === "development"

  const port = config.port ?? 4000

  // Allow explicit overrides; fall back to NODE_ENV-based defaults
  const baseURL =
    config.apiURL ??
    (isProd ? "https://api.sehatvati.shop" : isDev ? "http://localhost:4000" : `http://localhost:${port}`)

  const appURL =
    config.appURL ??
    (isProd ? "https://app.sehatvati.shop" : isDev ? "http://localhost:3000" : "http://localhost:3000")

  // If an explicit cookieDomain is given, use it; otherwise derive from appURL
  const cookieDomain = config.cookieDomain ?? deriveCookieDomain(appURL)

  // Build trusted origins: include the primary appURL plus any extras (deduplicated)
  const trustedOrigins = [...new Set([appURL, ...(config.extraTrustedOrigins ?? ["http://localhost:3000"])])]

  const secret = config.secret ?? process.env["BETTER_AUTH_SECRET"] ?? "please-change-this-secret"

  // Captcha is enforced on the server whenever the secret key is present. If
  // the client site key (NEXT_PUBLIC_TURNSTILE_SITE_KEY) is not deployed too,
  // the widget never renders and every password sign-in will be blocked.
  // The server can't see NEXT_PUBLIC_ vars, so surface this coupling during
  // local setup (non-production) rather than every prod boot.
  if (config.turnstileSecretKey && !isProd) {
    console.warn(
      "[auth] Turnstile captcha is ENABLED for sign-in. Ensure NEXT_PUBLIC_TURNSTILE_SITE_KEY is set in the web app, or all password sign-ins will be blocked."
    )
  }

  const transporter = nodemailer.createTransport({
    host: process.env["SMTP_HOST"] ?? "smtp.mailtrap.io",
    port: parseInt(process.env["SMTP_PORT"] ?? "2525", 10),
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASS"],
    },
  })

  const smtpFrom = process.env["SMTP_FROM"] ?? "noreply@adscrush.local"

  const sendEmail = async (to: string, subject: string, emailComponent: Parameters<typeof render>[0]) => {
    const html = await render(emailComponent)
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
    })
  }

  const options = {
    baseURL,
    basePath: "/api/v1/auth",
    secret,
    trustedOrigins,
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: cookieDomain,
      },
    },
    database: drizzleAdapter(config.db, {
      provider: "pg",
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
      },
    }),
    databaseHooks: {
      session: {
        create: {
          async before(session) {
            if (!session.userId) {
              return {
                data: session,
              }
            }
            const user = await config.db.query.users.findFirst({
              where: eq(users.id, session.userId),
              columns: { role: true },
            })

            return {
              data: {
                ...session,
                role: user?.role ?? "employee",
              },
            }
          },
        },
        update: {
          async before(session) {
            if (!session.userId) {
              return {
                data: session,
              }
            }
            const user = await config.db.query.users.findFirst({
              where: eq(users.id, session.userId),
              columns: { role: true },
            })

            return {
              data: {
                ...session,
                role: user?.role ?? "employee",
              },
            }
          },
        },
      },
    },
    user: {
      additionalFields: {
        role: {
          type: [...ALL_ROLES],
          defaultValue: "employee" satisfies Role,
          input: false,
        },
      },
    },
    session: {
      expiresIn: 30 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
      cookieCache: {
        enabled: true,
        maxAge: 24 * 60 * 60,
      },
      additionalFields: {
        role: {
          type: [...ALL_ROLES],
          input: false,
          required: false,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      sendResetPassword: async ({ user, url, token }) => {
        setImmediate(() => {
          sendEmail(user.email, "Reset your Adscrush password", PasswordResetEmail({ url, token })).catch(console.error)
        })
      },
    },
    socialProviders: {
      google: {
        clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
        clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
      },
    },
    plugins: [
      ...(config.turnstileSecretKey
        ? [
            captcha({
              provider: "cloudflare-turnstile",
              secretKey: config.turnstileSecretKey,
              // Only protect password sign-in. Sign-up / password-reset forms
              // don't render the widget yet, so they must not be blocked.
              endpoints: ["/sign-in/email"],
            }),
          ]
        : []),
      openAPI(),
      magicLink({
        expiresIn: 15 * 60 * 1000,
        disableSignUp: false,
        generateToken: async () => {
          const letters = "abcdefghijklmnopqrstuvwxyz"
          const getRandomLetter = () => letters[randomInt(0, 26)]!
          const prefix = getRandomLetter() + getRandomLetter()
          const part1 = randomInt(100, 1000)
          const part2 = randomInt(1000, 10000)
          const suffix = getRandomLetter()
          return `${prefix}${part1}-${part2}${suffix}`
        },
        sendMagicLink: async ({ email, url, token }) => {
          setImmediate(() => {
            sendEmail(email, "Sign in to Adscrush", MagicLinkEmail({ url, token })).catch(console.error)
          })
        },
      }),
      adminPlugin({
        adminRoles: [...ADMIN_ROLES],
        defaultRole: ROLES.USER,
        defaultBanReason: "Abusive use of service",
        defaultBanExpiresIn: 30 * 24 * 60 * 60, // 30 days
        impersonation: {
          enabled: true,
        },
        ac,
        roles: {
          super_admin: superAdmin,
          admin: admin,
          employee: employee,
          advertiser: advertiser,
          media_buyer: mediaBuyer,
          user: user,
        } satisfies Partial<Record<Role, unknown>>,
      }),
    ],
  } satisfies BetterAuthOptions

  return betterAuth({
    ...options,

    plugins: [
      ...(options.plugins ?? []),
      customSession(async ({ user, session }) => {
        // Capability, not role: a user "is a media buyer" iff a media_buyers
        // row exists for them. This covers both external buyers and in-house
        // employees who also run traffic (two hats) — the single `user.role`
        // enum can't express the latter. Exposed to the client via
        // customSessionClient<Auth>() so UI gates check the capability flag.
        const buyerProfile = await config.db.query.mediaBuyers.findFirst({
          where: eq(mediaBuyers.userId, user.id),
          columns: { id: true },
        })
        return {
          user: {
            ...user,
            role: user.role,
            mediaBuyerId: buyerProfile?.id ?? null,
          },
          session: {
            ...session,
            role: user.role,
          },
        }
      }, options),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-in/email") {
          const body = ctx.body as { email?: string }
          if (!body?.email) return

          // Find user by email
          const user = await config.db.query.users.findFirst({
            where: eq(users.email, body.email),
          })

          if (user?.role === ROLES.EMPLOYEE) {
            const employee = await config.db.query.employees.findFirst({
              where: eq(employees.userId, user.id),
            })

            if (employee?.status !== "approved") {
              throw new APIError("UNAUTHORIZED", {
                message: "Your account is not approved. Please contact an administrator.",
              })
            }
          }

          if (user?.role === ROLES.MEDIA_BUYER) {
            const buyer = await config.db.query.mediaBuyers.findFirst({
              where: eq(mediaBuyers.userId, user.id),
              columns: { status: true },
            })

            if (buyer?.status !== "active") {
              throw new APIError("UNAUTHORIZED", {
                message: "Your account is suspended. Please contact your account manager.",
              })
            }
          }
        }
      }),
    },
  } satisfies BetterAuthOptions)
}

export type Auth = ReturnType<typeof createAuth>
