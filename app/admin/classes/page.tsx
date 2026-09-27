import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { classService } from "@/services/class.service";
import { ClassDirectory } from "@/components/classes/class-directory";

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const classes = await classService.list(requireTenant(user)!);
  const { year } = await searchParams;
  return <ClassDirectory classes={classes} initialYear={year} />;
}
