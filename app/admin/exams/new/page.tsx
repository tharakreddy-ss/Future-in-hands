import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { studentRepository } from "@/repositories/student.repository";
import { classService } from "@/services/class.service";
import { syllabusService } from "@/services/syllabus.service";
import { ExamWizard } from "@/components/exams/exam-wizard";
import { notFound, redirect } from "next/navigation";

export default async function NewExamPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; studentId?: string; source?: string; topic?: string }>;
}) {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const { classId, studentId, source, topic } = await searchParams;
  if (!classId) notFound();
  const institutionId = requireTenant(user);
  const cls = await classService.get(classId, institutionId);
  if (!cls) {
    if (studentId) {
      const student = await studentRepository.get(studentId);
      if (student?.institutionId === institutionId) {
        const enrolledClassId = student.enrollments[0]?.classId;
        if (enrolledClassId) redirect(`/admin/exams/new?classId=${enrolledClassId}&studentId=${studentId}`);
        redirect(`/admin/students/${studentId}`);
      }
    }
    redirect("/admin/classes");
  }
  const student = cls.enrollments.find((row) => row.studentId === studentId)?.student;
  if (studentId && !student) notFound();
  const syllabuses = await syllabusService.list(classId);

  const classLabel = cls.section ? `${cls.name} · ${cls.section}` : cls.name;
  return (
    <div>
      {student ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Create Exam for</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {student.firstName} {student.lastName}
          </h1>
          <p className="mt-1 text-slate-400">{classLabel}</p>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Generate test</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{cls.name}</h1>
          <p className="mt-1 text-slate-400">
            {cls.subject} · {cls._count.enrollments} students
          </p>
        </>
      )}
      <div className="mt-8">
        <ExamWizard
          portal="/admin"
          classId={cls.id}
          className={classLabel}
          strength={student ? 1 : cls._count.enrollments}
          subjects={cls.subjects.map((item) => ({ id: item.subject.id, name: item.subject.name }))}
          studentId={student?.id}
          studentName={student ? `${student.firstName} ${student.lastName}` : undefined}
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
