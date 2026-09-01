import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { classService } from "@/services/class.service";
import { syllabusService } from "@/services/syllabus.service";
import { ExamWizard } from "@/components/exams/exam-wizard";
import { notFound } from "next/navigation";

export default async function NewExamPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; source?: string; topic?: string }>;
}) {
  const user = await requireSession(["INSTITUTION_ADMIN", "TEACHER"]);
  const { classId, source, topic } = await searchParams;
  if (!classId) notFound();
  const cls = await classService.get(classId, requireTenant(user));
  if (!cls) notFound();
  const syllabuses = await syllabusService.list(classId);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Generate test</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{cls.name}</h1>
      <p className="mt-1 text-slate-400">
        {cls.subject} · {cls._count.enrollments} students
      </p>
      <div className="mt-8">
        <ExamWizard
          portal="/admin"
          classId={cls.id}
          className={cls.name}
          strength={cls._count.enrollments}
          initialSource={
            source === "topic" || source === "image" || source === "document" || source === "bank"
              ? source
              : topic
                ? "topic"
                : "syllabus"
          }
          initialTopic={topic ?? ""}
          syllabuses={syllabuses.map((item) => ({ id: item.id, title: item.title }))}
        />
      </div>
    </div>
  );
}
