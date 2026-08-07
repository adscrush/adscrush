import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  pixelBasedPreset,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

const logoUrl = `https://adscrush.com/wp-content/uploads/2023/08/favicon.png`
const companyAddress = "83, Pocket D, Okhla Phase II, Delhi 110020"

interface VerifyEmailProps {
  email?: string
  verifyUrl?: string
}

export const VerifyEmail = ({ email, verifyUrl }: VerifyEmailProps) => (
  <Html>
    <Head />
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
        theme: {
          fontFamily: {
            linear: ["Linear", "sans-serif"],
          },
        },
      }}
    >
      <Body className="font-linear bg-white">
        <Preview>Verify your AdsCrush account</Preview>
        <Container className="mx-auto my-0 max-w-[560px] px-0 pt-5 pb-12">
          <Img
            src={logoUrl}
            width="42"
            height="42"
            alt="AdsCrush"
            className="h-[42px] w-[42px] rounded-md"
          />
          <Heading className="px-0 pt-[17px] pb-0 text-[24px] leading-[1.3] font-normal tracking-[-0.5px] text-[#484848]">
            Verify your email address
          </Heading>
          <Text className="mx-0 mt-[20px] mb-[15px] text-[15px] leading-[1.4] text-[#3c4149]">
            You&apos;re almost there! Click the button below to confirm your email address. If you didn&apos;t create an AdsCrush account, you can safely ignore this email.
          </Text>
          <Text className="mx-0 mt-0 mb-[15px] text-[15px] leading-[1.4] text-[#3c4149]">
            Confirming your email: <strong>{email}</strong>
          </Text>
          <Section className="px-0 py-[27px]">
            <Button
              className="block rounded-md bg-[#5e6ad2] px-[23px] py-[11px] text-center text-[15px] font-semibold text-white no-underline"
              href={verifyUrl}
            >
              Verify Email Address
            </Button>
          </Section>
          <Text className="mx-0 mt-0 mb-[15px] text-[15px] leading-[1.4] text-[#3c4149]">
            This link will expire in 24 hours. If the button doesn&apos;t work, copy and paste this URL into your browser:
          </Text>
          <code className="rounded bg-[#dfe1e4] px-1 py-px font-mono text-[12px] tracking-[-0.3px] break-all text-[#3c4149]">
            {verifyUrl}
          </code>
          <Hr className="mt-[42px] mb-[26px] border-[#dfe1e4]" />
          <Section className="pt-[45px]">
            <Img
              className="max-w-full"
              width={620}
              src={`https://app.adscrush.local/emails/footer.png`}
              alt="Adscrush footer decoration"
            />
          </Section>
          <Text className="text-center text-xs leading-[24px] text-black/70">
            © 2026 | Adscrush Pvt. Ltd. | {companyAddress} | adscrush.com
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

VerifyEmail.PreviewProps = {
  email: "user@example.com",
  verifyUrl: "http://localhost:3000/auth/verify-email?token=abc123",
} as VerifyEmailProps

export default VerifyEmail
