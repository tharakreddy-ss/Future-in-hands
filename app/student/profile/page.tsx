import { requireSession } from "@/lib/auth";
import { analyticsService } from "@/services/analytics.service";
import { studentService } from "@/services/student.service";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { formatDate, formatPercent } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProfilePage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const student = await studentService.get(user.studentId);
  const stats = await analyticsService.student(user.studentId);
  const institution = await db.institution.findUnique({
    where: { id: user.institutionId ?? "" },
  });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <Card>
        <p className="text-sm text-slate-500">Name</p>
        <p className="mt-1 text-lg font-medium">
          {student?.firstName} {student?.lastName}
        </p>
        <p className="mt-4 text-sm text-slate-500">Student ID</p>
        <p className="mt-1">{student?.studentIdentifier}</p>
        <p className="mt-4 text-sm text-slate-500">Institution</p>
        <p className="mt-1">{institution?.name ?? "—"}</p>
        <p className="mt-4 text-sm text-slate-500">Classes</p>
        <p className="mt-1">{student?.enrollments.map((row) => row.class.name).join(", ") || "—"}</p>
      </Card>
      <Card>
        <h2 className="font-semibold">Performance summary</h2>
        <ul className="mt-3 space-y-1 text-sm">
          <li>Tests Attempted: {stats.attempted}</li>
          <li>Average Score: {formatPercent(stats.averageScore)}</li>
          <li>Highest Score: {formatPercent(stats.highestScore)}</li>
          <li>Lowest Score: {formatPercent(stats.lowestScore)}</li>
          <li>Latest Score: {formatPercent(stats.latestScore)}</li>
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold">Test history</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {stats.history.map((attempt) => (
            <li key={attempt.id} className="flex justify-between">
              <span>
                {attempt.test.title} · {attempt.test.class.name} ·{" "}
                {formatDate(attempt.submittedAt ?? attempt.startedAt)}
              </span>
              <Link className="text-violet-300 hover:text-white" href={`/student/results/${attempt.id}`}>
                View Result
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
