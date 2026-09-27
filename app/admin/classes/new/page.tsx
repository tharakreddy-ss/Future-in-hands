import { ClassOnboardingForm } from "@/components/classes/class-onboarding-form";
export default async function NewClassPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  return <ClassOnboardingForm defaultYear={(await searchParams).year} />;
}
