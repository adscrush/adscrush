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

interface PasswordResetSuccessProps {
  email?: string
  timestamp?: string
}

export const PasswordResetSuccess = ({ email, timestamp }: PasswordResetSuccessProps) => (
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
        <Preview>Your AdsCrush password has been reset</Preview>
        <Container className="mx-auto my-0 max-w-[560px] px-0 pt-5 pb-12">
          <Img
            src={logoUrl}
            width="42"
            height="42"
            alt="AdsCrush"
            className="h-[42px] w-[42px] rounded-md"
          />
          <Heading className="px-0 pt-[17px] pb-0 text-[24px] leading-[1.3] font-normal tracking-[-0.5px] text-[#484848]">
            Password changed successfully
          </Heading>
          <Text className="mx-0 mt-[20px] mb-[15px] text-[15px] leading-[1.4] text-[#3c4149]">
            Your AdsCrush password has been changed. If this was you, you&apos;re all set — you can now sign in with your new password.
          </Text>
          <Text className="mx-0 mb-[15px] text-[15px] leading-[1.4] text-[#3c4149]">
            Account: <strong>{email}</strong>
          </Text>
          <Text className="mx-0 mb-0 text-[15px] leading-[1.4] text-[#3c4149]">
            Changed at: <strong>{timestamp}</strong>
          </Text>
          <Text className="mx-0 mt-[20px] mb-0 text-[15px] leading-[1.4] text-[#3c4149]">
            If you didn&apos;t change your password, contact us immediately at <a href="mailto:support@adscrush.com" className="text-[#5e6ad2]">support@adscrush.com</a>.
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
            © 2026 | Adscrush Pvt. Ltd. | {companyAddress} | adcrush.com
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

PasswordResetSuccess.PreviewProps = {
  email: "user@example.com",
  timestamp: "May 8, 2026 at 10:30 AM UTC",
} as PasswordResetSuccessProps

export default PasswordResetSuccess
