import { KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STAFF_CATEGORY_LABELS, type StaffCategory, type StaffStatus } from "@/components/staff/types";

const CATEGORY_TONE: Record<StaffCategory, "purple" | "teal" | "amber" | "green" | "slate" | "red"> = {
  TEACHING: "purple",
  NON_TEACHING: "teal",
  LIBRARY: "green",
  SECURITY: "amber",
  MANAGEMENT: "red",
  OTHER: "slate",
};

export function StaffCategoryBadge({ category }: { category: StaffCategory }) {
  return <Badge tone={CATEGORY_TONE[category]}>{STAFF_CATEGORY_LABELS[category]}</Badge>;
}

export function StaffStatusBadge({ status }: { status: StaffStatus }) {
  return status === "ACTIVE" ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Inactive</Badge>;
}

export function StaffAccountBadge({ linked, active }: { linked: boolean; active?: boolean | null }) {
  if (!linked) return <span className="text-xs text-slate-500">No login</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-300">
      <KeyRound className="h-3.5 w-3.5 text-violet-300" />
      {active === false ? "Login disabled" : "Login linked"}
    </span>
  );
}
