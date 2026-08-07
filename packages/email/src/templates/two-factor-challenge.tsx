import {
  Body,
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

interface TwoFactorChallengeProps {
  email?: string
  code?: string
}

export const TwoFactorChallenge = ({ email, code }: TwoFactorChallengeProps) => (
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
        <Preview>Your AdsCrush two-factor authentication code</Preview>
        <Container className="mx-auto my-0 max-w-[560px] px-0 pt-5 pb-12">
          <Img
            src={logoUrl}
            width="42"
            height="42"
            alt="AdsCrush"
            className="h-[42px] w-[42px] rounded-md"
          />
          <Heading className="px-0 pt-[17px] pb-0 text-[24px] leading-[1.3] font-normal tracking-[-0.5px] text-[#484848]">
            Your two-factor authentication code
          </Heading>
          <Text className="mx-0 mt-[20px] mb-[15px] text-[15px] leading-[1.4] text-[#3c4149]">
            We received a sign-in attempt for your AdsCrush account. Enter the code below to complete the authentication.
          </Text>
          <Text className="mx-0 mb-[15px] text-[15px] leading-[1.4] text-[#3c4149]">
            Account: <strong>{email}</strong>
          </Text>
          <code className="rounded bg-[#dfe1e4] px-1 py-px font-mono text-[21px] font-bold tracking-[-0.3px] text-[#3c4149]">
            {code}
          </code>
          <Text className="mx-0 mt-[20px] mb-0 text-[15px] leading-[1.4] text-[#3c4149]">
            This code will expire in 5 minutes. If you didn&apos;t attempt to sign in, your account may be at risk — please change your password immediately and contact support.
          </Text>
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

TwoFactorChallenge.PreviewProps = {
  email: "user@example.com",
  code: "tt226-5398",
} as TwoFactorChallengeProps

export default TwoFactorChallenge
