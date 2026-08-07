import { z } from "zod"
import { ROLES } from "../constants/roles"

// Password
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character")

// Sign In
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

// Sign Up
export const signUpBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(ROLES).default(ROLES.EMPLOYEE),
})

export const signUpSchema = signUpBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  },
)

// Reset Password
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// Forgot Password
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
})

// Magic Link
export const magicLinkRequestSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
})

export const magicLinkVerifySchema = z.object({
  token: z
    .string()
    .length(10, "Token must be exactly 10 characters")
    .regex(/^[a-z]{2}\d{3}-\d{4}[a-z]$/, "Invalid token format"),
})

// TYPES (keep in same file for now)
export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestSchema>
export type MagicLinkVerifyInput = z.infer<typeof magicLinkVerifySchema>

// FORM TYPES
export type SignInForm = SignInInput
export type SignUpForm = Pick<SignUpInput, "name" | "email" | "password">
export type ForgotPasswordForm = ForgotPasswordInput
export type MagicLinkRequestForm = MagicLinkRequestInput
export type ResetPasswordForm = ResetPasswordInput
