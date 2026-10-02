import { FadeUp, SectionHeading } from "@/components/marketing/ui";

export default function AboutPage() {
  return (
    <main id="about" className="px-4 py-16 md:px-6">
      <div className="mx-auto max-w-3xl">
        <FadeUp>
          <SectionHeading
            title="About Us"
            subtitle="EduAssess AI helps schools, colleges, and coaching institutes run fair, intelligent exams — from syllabus to analytics — without drowning staff in paper work."
          />
        </FadeUp>
        <FadeUp className="mt-10 space-y-4 text-sm leading-relaxed text-slate-400" delay={0.08}>
          <p>
            We built EduAssess AI for Super Admins, institution admins, teachers, and students who need one
            trustworthy system for question generation, shuffled papers, timed conduct, and performance insight.
          </p>
          <p>
            Help center, privacy, and terms pages are on the way. Reach the team from the contact link in the footer.
          </p>
        </FadeUp>
      </div>
    </main>
  );
}
