import Link from "next/link";
import { FadeUp, GlassCard, SectionHeading } from "@/components/marketing/ui";

const plans = [
  {
    name: "Starter",
    price: "₹4,999/mo",
    seats: "50 students",
    note: "1 campus, AI drafts, mock tests",
  },
  {
    name: "Growth",
    price: "₹12,999/mo",
    seats: "200 students",
    note: "Analytics, live monitor, more classes",
    featured: true,
  },
  {
    name: "Campus",
    price: "Talk to us",
    seats: "Unlimited",
    note: "SSO, SLA, custom models",
  },
];

export default function PricingPage() {
  return (
    <main className="px-4 py-16 md:px-6">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <SectionHeading
            title="Pricing"
            subtitle="Institution billing. Students never pay. Scale from a single coaching batch to a full campus."
          />
        </FadeUp>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <GlassCard
              key={plan.name}
              className={plan.featured ? "ring-1 ring-violet-400/40 shadow-[0_0_40px_rgba(139,108,255,0.2)]" : ""}
            >
              <p className="text-sm text-violet-300">{plan.name}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{plan.price}</p>
              <p className="mt-4 text-sm text-slate-300">{plan.seats}</p>
              <p className="mt-1 text-sm text-slate-500">{plan.note}</p>
              <Link
                href="/auth/login"
                className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Get Started
              </Link>
            </GlassCard>
          ))}
        </div>
      </div>
    </main>
  );
}
