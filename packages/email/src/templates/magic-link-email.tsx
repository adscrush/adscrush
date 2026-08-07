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

interface MagicLinkEmailProps {
  url?: string
  token?: string
}

export const MagicLinkEmail = ({ url, token }: MagicLinkEmailProps) => (
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
        <Preview>Your login code for AdsCrush</Preview>
        <Container className="mx-auto my-0 max-w-[560px] px-0 pt-5 pb-12">
          <Img
            src={logoUrl}
            width="42"
            height="42"
            alt="AdsCrush"
            className="h-[42px] w-[42px] rounded-md"
          />
          <Heading className="px-0 pt-[17px] pb-0 text-[24px] leading-[1.3] font-normal tracking-[-0.5px] text-[#484848]">
            Your login code for AdsCrush
          </Heading>
          <Section className="px-0 py-[27px]">
            <Button
              className="block rounded-md bg-[#5e6ad2] px-[23px] py-[11px] text-center text-[15px] font-semibold text-white no-underline"
              href={url}
            >
              Login to Adscrush
            </Button>
          </Section>
          <Text className="mx-0 mt-0 mb-[15px] text-[15px] leading-[1.4] text-[#3c4149]">
            This link and code will only be valid for the next 5 minutes. If the link does not work, you can use the login verification code directly:
          </Text>
          <code className="rounded bg-[#dfe1e4] px-1 py-px font-mono text-[21px] font-bold tracking-[-0.3px] text-[#3c4149]">
            {token}
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

MagicLinkEmail.PreviewProps = {
  url: "http://localhost:3000",
  token: "tt226-5398x",
} as MagicLinkEmailProps

export default MagicLinkEmail
