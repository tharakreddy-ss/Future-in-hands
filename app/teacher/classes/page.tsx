import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { classService } from "@/services/class.service";
import { ClassCard } from "@/components/classes/class-card";
import { PageHeader } from "@/components/layout/skeleton";

export default async function TeacherClassesPage() {
  const user = await requireSession(["TEACHER"]);
  const classes = await classService.list(requireTenant(user)!);
  return (
    <div>
      <PageHeader title="Classes" subtitle="Your assigned classrooms." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {classes.map((cls) => (
          <ClassCard
            key={cls.id}
            id={cls.id}
            name={cls.name}
            subject={cls.subject}
            students={cls._count.enrollments}
            tests={cls._count.tests}
            createdAt={cls.createdAt}
            classroomHref="/teacher/generate"
            generateHref={`/teacher/exams/new?classId=${cls.id}`}
          />
        ))}
      </div>
    </div>
  );
}
