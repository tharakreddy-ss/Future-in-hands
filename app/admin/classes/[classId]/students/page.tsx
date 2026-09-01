import { classService } from "@/services/class.service";
import { analyticsService } from "@/services/analytics.service";
import { StudentForm } from "@/components/students/student-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPercent } from "@/lib/utils";

export default async function ClassStudentsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const cls = await classService.get(classId);
  if (!cls) notFound();
  const performance = await analyticsService.classPerformance(classId);
  const byId = new Map(performance.students.map((row) => [row.id, row]));

  return (
    <div className="space-y-6">
      <StudentForm classId={classId} />
      <div className="overflow-x-auto rounded-2xl border border-white/8 bg-[#11182A]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/8 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Student Name</th>
              <th className="px-4 py-3 font-medium">Student ID</th>
              <th className="px-4 py-3 font-medium">Tests Attempted</th>
              <th className="px-4 py-3 font-medium">Average Score</th>
              <th className="px-4 py-3 font-medium">Highest Score</th>
              <th className="px-4 py-3 font-medium">Latest Score</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cls.enrollments.map((row) => {
              const stats = byId.get(row.studentId);
              return (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {row.student.firstName} {row.student.lastName}
                  </td>
                  <td className="px-4 py-3">{row.student.studentIdentifier}</td>
                  <td className="px-4 py-3">{stats?.attempts ?? 0}</td>
                  <td className="px-4 py-3">{stats ? formatPercent(stats.averageScore) : "—"}</td>
                  <td className="px-4 py-3">{stats ? formatPercent(stats.highestScore) : "—"}</td>
                  <td className="px-4 py-3">{stats ? formatPercent(stats.latestScore) : "—"}</td>
                  <td className="px-4 py-3">
                    <Link className="text-violet-300 hover:text-white" href={`/admin/students/${row.studentId}`}>
                      View Student
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
