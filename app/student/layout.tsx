import { cookies } from "next/headers";
import { requireSession } from "@/lib/auth";
import { StudentApp, type StudentShellContext } from "@/components/dashboard/student-shell";
import { STUDENT_SIDEBAR_COOKIE } from "@/lib/nav";
import { getStudentPortalContext } from "@/services/student-dashboard.service";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession(["STUDENT"]);
  const [student, cookieStore] = await Promise.all([
    user.studentId ? getStudentPortalContext(user.studentId) : null,
    cookies(),
  ]);
  const currentClass = student?.enrollments[0]?.class ?? null;
  const context: StudentShellContext = {
    name: student ? `${student.firstName} ${student.lastName}`.trim() : user.name,
    firstName: student?.firstName || user.name.split(" ")[0] || user.name,
    studentIdentifier: student?.studentIdentifier ?? null,
    className: currentClass?.name ?? null,
    academicYear: currentClass?.academicYear ?? student?.academicYear ?? null,
    photoUrl: student?.photoKey ? "/api/student/profile/photo" : null,
  };
  return (
    <StudentApp
      role={user.role}
      context={context}
      initialCollapsed={cookieStore.get(STUDENT_SIDEBAR_COOKIE)?.value === "collapsed"}
    >
      {children}
    </StudentApp>
  );
}
