import { requireSession } from "@/lib/auth";
import { studentService } from "@/services/student.service";
import { examWindow } from "@/lib/exam-window";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";
import { EmptyState } from "@/components/layout/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { StartTestButton } from "@/components/tests/start-test-button";
import { ExamCountdown } from "@/components/exams/exam-countdown";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import Link from "next/link";

function formatDateTime(value: Date) {
  return value.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function windowLabel(test: { status: string; startAt: Date | null; endAt: Date | null }) {
  const window = examWindow(test);
  if (window === "LOCKED" && test.startAt) {
    return (
      <>
        Upcoming · starts in <ExamCountdown startAt={test.startAt.toISOString()} />
      </>
    );
  }
  if (window === "LIVE") return "Exam live";
  if (window === "CLOSED") return "Exam closed";
  return "Scheduled";
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-white">{value}</dd>
    </div>
  );
}

export default async function StudentClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();

  const classroom = await studentService.classroomForStudent(user.studentId, classId);
  if (!classroom) notFound();

  const cls = classroom.class;
  const attemptByTest = new Map(classroom.attempts.map((row) => [row.testId, row]));

  const upcoming = classroom.assignments.filter((row) => {
    const window = examWindow(row.test);
    const attempt = attemptByTest.get(row.testId);
    return window !== "CLOSED" && attempt?.status !== "SUBMITTED";
  });
  const completed = classroom.assignments.filter((row) => attemptByTest.get(row.testId)?.status === "SUBMITTED");
  const closed = classroom.assignments.filter((row) => {
    const window = examWindow(row.test);
    const attempt = attemptByTest.get(row.testId);
    return window === "CLOSED" && attempt?.status !== "SUBMITTED";
  });

  const materials = cls.subjects.flatMap((link) => {
    const subject = link.subject;
    const files: Array<{ id: string; title: string; type: string; href: string; date: Date }> = [];
    if (subject.syllabusFileName) {
      files.push({
        id: `${subject.id}-syllabus`,
        title: subject.syllabusFileName,
        type: "Syllabus PDF",
        href: `/api/student/class-resources/${classId}/${subject.id}/syllabus`,
        date: subject.createdAt,
      });
    }
    if (subject.materialFileName) {
      files.push({
        id: `${subject.id}-material`,
        title: subject.materialFileName,
        type: "Study material",
        href: `/api/student/class-resources/${classId}/${subject.id}/material`,
        date: subject.createdAt,
      });
    }
    return files;
  });
  const syllabusResources = cls.syllabuses.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.inputType === "PDF" ? "Class syllabus (PDF source)" : "Class syllabus",
    date: item.createdAt,
  }));
  const resourceCount = materials.length + syllabusResources.length;
  const hasTopicTree = cls.syllabuses.some((item) => item.topics.length > 0) || cls.subjects.some((link) => link.subject.units.length > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={cls.subject}
        title={cls.name}
        subtitle={cls.description ?? undefined}
      />

      <section>
        <h2 className="text-lg font-semibold text-white">Class overview</h2>
        <Card className="mt-3">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Subject" value={cls.subject} />
            <InfoRow label="Academic year" value={cls.academicYear} />
            <InfoRow label="Section" value={cls.section} />
            <InfoRow label="Group" value={cls.groupName && cls.groupName !== "General" ? cls.groupName : null} />
            <InfoRow label="Program" value={cls.program} />
            <InfoRow label="Created by" value={cls.createdBy?.name} />
          </dl>
          {!cls.description ? (
            <p className="mt-4 text-sm text-slate-500">No description has been added for this class.</p>
          ) : null}
          {!cls.createdBy?.name ? (
            <p className="mt-2 text-sm text-slate-500">No creator name is stored for this class.</p>
          ) : null}
        </Card>
      </section>

      <section>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Assigned exams" value={classroom.assignments.length} hint="Assigned to you in this class" />
          <StatCard label="Upcoming" value={upcoming.length} hint="Live or scheduled, not submitted" />
          <StatCard label="Completed" value={completed.length} hint="Submitted exams" />
          <StatCard label="Resources" value={resourceCount} hint="Syllabus entries and linked files" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Upcoming / available exams</h2>
        <p className="mt-1 text-sm text-slate-500">Assigned exams that are still open or waiting to start.</p>
        <div className="mt-4 space-y-3">
          {classroom.assignments.length === 0 ? (
            <EmptyState
              title="No exams in this class"
              description="Assigned exams for this class will appear here when your institution schedules them."
              actionHref="/student/tests"
              actionLabel="View all exams"
            />
          ) : upcoming.length === 0 ? (
            <EmptyState title="No upcoming exams" description="You have no live or scheduled exams remaining in this class." />
          ) : (
            upcoming.map((row) => {
              const attempt = attemptByTest.get(row.testId);
              const window = examWindow(row.test);
              const subjectName = row.test.subject?.name || row.test.class.subject;
              return (
                <Card key={row.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/student/tests/${row.testId}`} className="text-lg font-semibold text-white hover:text-violet-300">
                      {row.test.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      {subjectName} · {row.test._count.questions} questions · {row.test.durationMinutes} min
                      {row.test.startAt ? ` · ${formatDateTime(row.test.startAt)}` : row.test.examDate ? ` · ${formatDate(row.test.examDate)}` : ""}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-violet-300">{windowLabel(row.test)}</p>
                  </div>
                  <StartTestButton
                    assignmentId={row.id}
                    attemptId={attempt?.id}
                    status={attempt?.status}
                    window={window}
                  />
                </Card>
              );
            })
          )}
        </div>
      </section>

      {classroom.assignments.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-white">Completed exams</h2>
          <p className="mt-1 text-sm text-slate-500">Submitted results for this class.</p>
          <div className="mt-4 space-y-3">
            {completed.length === 0 ? (
              <EmptyState title="No completed exams" description="After you submit an exam for this class, it will appear here." />
            ) : (
              completed.map((row) => {
                const attempt = attemptByTest.get(row.testId);
                const subjectName = row.test.subject?.name || row.test.class.subject;
                return (
                  <Card key={row.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-white">{row.test.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {subjectName} · {row.test.durationMinutes} min
                      </p>
                    </div>
                    {attempt?.id ? (
                      <Link
                        href={`/student/results/${attempt.id}`}
                        className="text-sm font-medium text-violet-300 hover:text-white"
                      >
                        View result
                      </Link>
                    ) : null}
                  </Card>
                );
              })
            )}
          </div>
        </section>
      ) : null}

      {closed.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-white">Closed exams</h2>
          <p className="mt-1 text-sm text-slate-500">The exam window ended before a result was submitted.</p>
          <div className="mt-4 space-y-3">
            {closed.map((row) => (
              <Card key={row.id}>
                <p className="font-medium text-white">{row.test.title}</p>
                <p className="mt-1 text-sm text-slate-500">Exam closed</p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-white">Learning materials</h2>
        <p className="mt-1 text-sm text-slate-500">Files and syllabus entries linked to this class.</p>
        <div className="mt-4 space-y-3">
          {resourceCount === 0 ? (
            <EmptyState
              title="No learning resources yet"
              description="Study materials and class syllabus files will appear here when your institution adds them to this class."
            />
          ) : (
            <>
              {materials.map((item) => (
                <Card key={item.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.type} · {formatDate(item.date)}
                    </p>
                  </div>
                  <a href={item.href} className="text-sm font-medium text-violet-300 hover:text-white">
                    Open
                  </a>
                </Card>
              ))}
              {syllabusResources.map((item) => (
                <Card key={item.id}>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.type} · {formatDate(item.date)}
                  </p>
                </Card>
              ))}
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Syllabus / topics</h2>
        <p className="mt-1 text-sm text-slate-500">Topics stored for this class. Progress is not shown because this project does not track topic completion.</p>
        <div className="mt-4 space-y-4">
          {!hasTopicTree ? (
            <EmptyState
              title="No syllabus topics yet"
              description="When staff add a class syllabus or link a subject with units, topics will appear here."
            />
          ) : (
            <>
              {cls.syllabuses.map((syllabus) => (
                <Card key={syllabus.id}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">{cls.subject}</p>
                  <h3 className="mt-1 font-semibold text-white">{syllabus.title}</h3>
                  {syllabus.topics.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No topics stored on this syllabus.</p>
                  ) : (
                    <ul className="mt-3 space-y-1 text-sm text-slate-300">
                      {syllabus.topics.map((topic) => (
                        <li key={topic.id} className={topic.parentTopicId ? "pl-4 text-slate-400" : ""}>
                          {topic.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
              {cls.subjects.map((link) => (
                <Card key={link.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{link.subject.name}</h3>
                    <Badge tone="purple">Subject library</Badge>
                  </div>
                  {link.subject.description ? (
                    <p className="mt-2 text-sm text-slate-500">{link.subject.description}</p>
                  ) : null}
                  {link.subject.units.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No units or chapters stored for this subject.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {link.subject.units.map((unit) => (
                        <li key={unit.id}>
                          <p className="text-sm font-medium text-white">{unit.name}</p>
                          {unit.topics.length ? (
                            <p className="mt-1 text-sm text-slate-400">{unit.topics.map((topic) => topic.name).join(" · ")}</p>
                          ) : (
                            <p className="mt-1 text-sm text-slate-500">No topics in this unit.</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/student/classes" className="text-violet-300 hover:text-white">
          Back to Classes
        </Link>
        <Link href="/student/dashboard" className="text-violet-300 hover:text-white">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
