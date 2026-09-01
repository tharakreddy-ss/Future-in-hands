import { HeroSection } from "@/components/marketing/hero";
import { AiGenerationSection } from "@/components/marketing/ai-generation";
import { HowItWorksSection } from "@/components/marketing/how-it-works";
import { FeaturesSection } from "@/components/marketing/features";
import { WorkflowSection } from "@/components/marketing/workflow";
import { AnalyticsSection } from "@/components/marketing/analytics";
import { RolesSection } from "@/components/marketing/roles";
import { TestimonialsSection } from "@/components/marketing/testimonials";
import { FinalCtaSection } from "@/components/marketing/final-cta";

export default function PublicHomePage() {
  return (
    <main>
      <HeroSection />
      <AiGenerationSection />
      <HowItWorksSection />
      <FeaturesSection />
      <WorkflowSection />
      <AnalyticsSection />
      <RolesSection />
      <TestimonialsSection />
      <FinalCtaSection />
    </main>
  );
}
