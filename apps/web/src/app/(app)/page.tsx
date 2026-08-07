import HeroSection from "@/features/home/components/hero";
import FeaturesSection from "@/features/home/components/features";
import PricingSection from "@/features/home/components/pricing";
import TestimonialSection from "@/features/home/components/testimonial";
import FAQSection from "@/features/home/components/faq";
import CTASection from "@/features/home/components/cta";

export default async function RootPage() {


    return (
        <>
            <HeroSection />
            <FeaturesSection />
            <PricingSection />
            <TestimonialSection />
            <FAQSection />
            <CTASection />
        </>
    )
}
