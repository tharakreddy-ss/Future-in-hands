import { requireSession } from "@/lib/auth";
import { studentService } from "@/services/student.service";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";
import { formatDate, fullName } from "@/lib/utils";
import { initials } from "@/components/students/types";
import { StudentProfileForms } from "@/components/students/own-profile-forms";
import Link from "next/link";
import { notFound } from "next/navigation";

function display(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Not provided";
}

export default async function ProfilePage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const student = await studentService.get(user.studentId);
  if (!student) notFound();

  const name = fullName(student.firstName, student.lastName);
  const enrollments = student.enrollments;
  const dob = student.dateOfBirth ? student.dateOfBirth.toISOString().slice(0, 10) : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Profile" subtitle="Your account details. Class enrollment is managed by your institution." />

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {student.photoKey ? (
          // Authenticated private photo; next/image cannot fetch the session-gated URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/api/student/profile/photo"
            alt=""
            className="h-20 w-20 rounded-2xl object-cover"
          />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-violet-500/20 text-xl font-semibold text-violet-100">
            {initials(name) || "ST"}
          </div>
        )}
        <div>
          <p className="text-xl font-semibold text-white">{name}</p>
          <p className="mt-1 text-sm text-slate-400">{student.studentIdentifier}</p>
          <p className="mt-1 text-sm text-slate-500">{student.institution.name}</p>
        </div>
      </Card>

      <section>
        <h2 className="text-lg font-semibold text-white">Personal information</h2>
        <Card className="mt-3">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500">Full name</dt>
              <dd className="mt-1 text-white">{name}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Phone</dt>
              <dd className="mt-1 text-white">{display(student.phone)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Gender</dt>
              <dd className="mt-1 text-white">{display(student.gender)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Date of birth</dt>
              <dd className="mt-1 text-white">{student.dateOfBirth ? formatDate(student.dateOfBirth) : "Not provided"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500">Address</dt>
              <dd className="mt-1 text-white">{display(student.address)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Guardian name</dt>
              <dd className="mt-1 text-white">{display(student.guardianName)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Guardian phone</dt>
              <dd className="mt-1 text-white">{display(student.guardianPhone)}</dd>
            </div>
          </dl>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Academic information</h2>
        <Card className="mt-3 space-y-3">
          <p className="text-sm text-slate-400">
            Academic year on your record: <span className="text-white">{display(student.academicYear)}</span>
            {student.rollNumber ? ` · Roll number ${student.rollNumber}` : ""}
          </p>
          {enrollments.length === 0 ? (
            <p className="text-sm text-slate-500">You are not enrolled in a class yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-300">
              {enrollments.map((row) => (
                <li key={row.id}>
                  {row.class.name}
                  {row.class.subject ? ` · ${row.class.subject}` : ""}
                  {row.class.section ? ` · Section ${row.class.section}` : ""}
                  {row.class.academicYear ? ` · ${row.class.academicYear}` : ""}
                </li>
              ))}
            </ul>
          )}
          <Link href="/student/classes" className="inline-block text-sm font-medium text-violet-300 hover:text-white">
            View classes
          </Link>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Account</h2>
        <Card className="mt-3">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500">Student ID</dt>
              <dd className="mt-1 text-white">{student.studentIdentifier}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Email</dt>
              <dd className="mt-1 text-white">{student.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Role</dt>
              <dd className="mt-1 text-white">Student</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Member since</dt>
              <dd className="mt-1 text-white">{formatDate(student.createdAt)}</dd>
            </div>
          </dl>
        </Card>
      </section>

      <StudentProfileForms
        initial={{
          firstName: student.firstName,
          lastName: student.lastName,
          phone: student.phone ?? "",
          gender: student.gender ?? "",
          dateOfBirth: dob,
          address: student.address ?? "",
          guardianName: student.guardianName ?? "",
          guardianPhone: student.guardianPhone ?? "",
        }}
      />
    </div>
  );
}
