import { requireSession } from "@/lib/auth";
import { studentService } from "@/services/student.service";
import { Card } from "@/components/ui/card";

export default async function StudentClassesPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) throw new Error("Student profile missing");
  const enrollments = await studentService.classesForStudent(user.studentId);

  return (
    <div>
      <h1 className="text-2xl font-semibold">My classes</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {enrollments.map((row) => (
          <Card key={row.id}>
            <p className="text-sm text-violet-300">{row.class.subject}</p>
            <h2 className="mt-1 text-lg font-semibold">{row.class.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{row.class.description}</p>
            <p className="mt-3 text-sm text-slate-500">{row.class.tests.length} tests</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
