import Link from "next/link";
import { ArrowRight, GraduationCap, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";

const SECTIONS = [
  {
    title: "Students",
    description: "Manage student accounts, profiles and academic records",
    href: "/admin/students",
    icon: GraduationCap,
  },
  {
    title: "Staff",
    description: "Manage teaching faculty and other institution staff",
    href: "/admin/staff",
    icon: UserRound,
  },
];

export default async function UsersPage() {
  await requireSession(["INSTITUTION_ADMIN"]);

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage the people in your institution." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {SECTIONS.map(({ title, description, href, icon: Icon }) => (
          <Card key={href} className="flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
              </div>
            </div>
            <Link
              href={href}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.28)] hover:brightness-110"
            >
              Open {title}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
