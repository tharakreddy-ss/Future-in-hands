"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, KeyRound, Pencil, Power } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/dashboard/stat-card";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentImageReveal } from "@/components/students/student-image-reveal";
import { PerformanceChart } from "@/components/students/performance-chart";
import type { StudentProfile } from "@/components/students/types";
import { formatDate, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TABS = [
  "Overview",
  "Test History",
  "Subject Performance",
  "AI Insights",
  "Personal Information",
] as const;

function statusTone(status: string) {
  if (status === "Excellent") return "green" as const;
  if (status === "Good") return "teal" as const;
  if (status === "Average") return "amber" as const;
  return "red" as const;
}

export function StudentProfileView({
  profile,
  basePath,
}: {
  profile: StudentProfile;
  basePath: "/admin" | "/teacher";
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState(profile.status);
  const [confirming, setConfirming] = useState<"status" | "password" | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const isAdmin = basePath === "/admin";
  const active = status === "ACTIVE";

  const examHref = profile.classId ? `${basePath}/exams/new?classId=${profile.classId}&studentId=${profile.id}` : null;

  async function save() {
    setSaving(true);
    setSaveError("");
    setNotice("");
    try {
      const res = await fetch(`/api/students/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: form.phone.trim() || null }),
      });
      if (!res.ok) throw new Error(await readError(res, "Could not save the student's details."));
      setEditing(false);
      setNotice("Student details saved.");
      router.refresh();
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Could not save the student's details.");
    } finally {
      setSaving(false);
    }
  }

  function openConfirm(kind: "status" | "password") {
    setActionError("");
    setNotice("");
    setTemporaryPassword("");
    setConfirming(kind);
  }

  async function changeStatus() {
    setActionPending(true);
    setActionError("");
    try {
      const next = active ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`/api/students/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(await readError(res, "Could not change the student's status."));
      setStatus(next);
      setConfirming(null);
      setNotice(next === "INACTIVE" ? `${profile.name} is now inactive and can no longer sign in.` : `${profile.name} is now active.`);
      router.refresh();
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Could not change the student's status.");
    } finally {
      setActionPending(false);
    }
  }

  async function resetPassword() {
    setActionPending(true);
    setActionError("");
    try {
      const res = await fetch(`/api/students/${profile.id}/reset-password`, { method: "POST" });
      if (!res.ok) throw new Error(await readError(res, "Could not reset the password."));
      const data = (await res.json()) as { temporaryPassword: string };
      setTemporaryPassword(data.temporaryPassword);
      setConfirming(null);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Could not reset the password.");
    } finally {
      setActionPending(false);
    }
  }

  return (
    <div className="space-y-8 print:space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`${basePath}/students`} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Students
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {profile.photoUrl ? (
                <StudentImageReveal src={profile.photoUrl} alt={profile.name} variant="profile" />
              ) : (
                <div className="grid h-48 w-36 place-items-center bg-[#151D31]">
                  <StudentAvatar name={profile.name} size="lg" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">{profile.name}</h1>
              <p className="mt-1 text-sm text-slate-400">ID: {profile.studentIdentifier}</p>
              <p className="mt-1 text-sm text-slate-500">
                Class: {profile.className}{profile.section && profile.section !== "—" ? ` · Section ${profile.section}` : ""}
              </p>
              <p className="mt-1 text-sm text-slate-500">Roll No: {profile.rollNumber || "—"}</p>
              <div className="mt-2">
                <Badge tone={active ? "green" : "amber"}>{active ? "Active" : "Inactive"}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {examHref ? (
            <Link
              href={examHref}
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Create Exam
            </Link>
          ) : (
            <p className="text-sm text-slate-400">Enroll this student in a classroom before creating an exam.</p>
          )}
          <Button variant="secondary" onClick={() => { setTab("Personal Information"); setSaveError(""); setEditing(true); }}>
            <Pencil className="h-4 w-4" />
            Edit Student
          </Button>
          {isAdmin ? (
            <>
              <Button variant={active ? "outline" : "secondary"} onClick={() => openConfirm("status")} disabled={actionPending || confirming !== null}>
                <Power className="h-4 w-4" />
                {active ? "Deactivate" : "Activate"}
              </Button>
              <Button variant="outline" onClick={() => openConfirm("password")} disabled={actionPending || confirming !== null}>
                <KeyRound className="h-4 w-4" />
                Reset Password
              </Button>
            </>
          ) : null}
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            Download Student Report
          </Button>
        </div>
      </div>

      {notice ? (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200 print:hidden">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </p>
      ) : null}

      {confirming ? (
        <div role="alertdialog" aria-labelledby="student-confirm-title" className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 print:hidden">
          <p id="student-confirm-title" className="font-medium text-white">
            {confirming === "password"
              ? `Reset the password for ${profile.name}?`
              : active
                ? `Deactivate ${profile.name}?`
                : `Activate ${profile.name}?`}
          </p>
          <p className="mt-1 text-sm text-amber-100/90">
            {confirming === "password"
              ? "A new temporary password will be generated and shown once. The current password stops working and the student is signed out of every device."
              : active
                ? "The student will be signed out and will not be able to sign in until reactivated. Their record, results and history are kept."
                : "The student will be able to sign in again with their existing password."}
          </p>
          {actionError ? (
            <p role="alert" className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-2.5 text-sm text-rose-200">
              {actionError}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant={confirming === "status" && active ? "danger" : "primary"}
              disabled={actionPending}
              onClick={() => void (confirming === "password" ? resetPassword() : changeStatus())}
            >
              {actionPending
                ? "Working…"
                : confirming === "password"
                  ? "Yes, reset password"
                  : active
                    ? "Yes, deactivate"
                    : "Yes, activate"}
            </Button>
            <Button variant="ghost" disabled={actionPending} onClick={() => setConfirming(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {temporaryPassword ? (
        <div role="status" className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 print:hidden">
          <p className="font-medium text-white">Password reset for {profile.name}</p>
          <p className="mt-1 text-sm text-emerald-100/90">
            Share these sign-in details with the student securely. The temporary password is shown only now and cannot be viewed again.
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Student ID</dt>
              <dd className="mt-1 font-mono text-white">{profile.studentIdentifier}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Temporary password</dt>
              <dd className="mt-1 select-all font-mono text-white">{temporaryPassword}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void navigator.clipboard?.writeText(temporaryPassword)}>
              Copy password
            </Button>
            <Button variant="ghost" onClick={() => setTemporaryPassword("")}>
              Done
            </Button>
          </div>
        </div>
      ) : null}

      <nav className="flex flex-wrap gap-2 print:hidden">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm",
              tab === item
                ? "bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] text-white"
                : "border border-white/10 bg-white/5 text-slate-300",
            )}
          >
            {item}
          </button>
        ))}
      </nav>

      {tab === "Overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Class" value={profile.className} hint={profile.section} />
            <StatCard label="Tests Attempted" value={profile.metrics.attempted} />
            <StatCard label="Average Score" value={formatPercent(profile.metrics.averageScore)} />
            <StatCard label="Highest Score" value={formatPercent(profile.metrics.highestScore)} />
            <StatCard label="Lowest Score" value={formatPercent(profile.metrics.lowestScore)} />
            <StatCard
              label="Current Rank"
              value={profile.metrics.rank ? `${profile.metrics.rank.position} / ${profile.metrics.rank.of}` : "—"}
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
            <Card>
              <h2 className="text-lg font-semibold text-white">Performance Overview</h2>
              <div className="mt-4">
                <PerformanceChart series={profile.series} />
              </div>
            </Card>
            <InsightsCard profile={profile} />
          </div>
          <SubjectBars subjects={profile.subjects} />
          <HistoryTable history={profile.history} basePath={basePath} studentId={profile.id} />
        </div>
      ) : null}

      {tab === "Test History" ? (
        <HistoryTable history={profile.history} basePath={basePath} studentId={profile.id} />
      ) : null}

      {tab === "Subject Performance" ? <SubjectBars subjects={profile.subjects} /> : null}

      {tab === "AI Insights" ? <InsightsCard profile={profile} /> : null}

      {tab === "Personal Information" ? (
        <Card className="max-w-2xl space-y-4">
          {editing ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Student Name</label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Last Name</label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Email</label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Phone Number</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              {saveError ? (
                <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                  {saveError}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button onClick={() => void save()} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button variant="secondary" onClick={() => { setSaveError(""); setEditing(false); }} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Student Name" value={profile.name} />
              <Info label="Student ID" value={profile.studentIdentifier} />
              <Info label="Email" value={profile.email} />
              <Info label="Phone Number" value={profile.phone || "—"} />
              <Info label="Class" value={profile.className} />
              <Info label="Section" value={profile.section || "—"} />
              <Info label="Roll number" value={profile.rollNumber || "—"} />
              <Info label="Academic year" value={profile.academicYear || "—"} />
              {profile.classSubjects.length ? <Info label="Subjects" value={profile.classSubjects.join(", ")} /> : null}
              {profile.dateOfBirth ? <Info label="Date of birth" value={formatDate(profile.dateOfBirth)} /> : null}
              {profile.gender ? <Info label="Gender" value={profile.gender} /> : null}
              {profile.guardianName ? <Info label="Parent / guardian" value={profile.guardianName} /> : null}
              {profile.guardianPhone ? <Info label="Guardian phone" value={profile.guardianPhone} /> : null}
              {profile.address ? <Info label="Address" value={profile.address} /> : null}
              <Info label="Institution" value={profile.institution} />
              <Info label="Join Date" value={formatDate(profile.joinDate)} />
              <Info label="Status" value={active ? "Active" : "Inactive"} />
            </dl>
          )}
        </Card>
      ) : null}
    </div>
  );
}

async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-white">{value}</dd>
    </div>
  );
}

function InsightsCard({ profile }: { profile: StudentProfile }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">AI</p>
      <h2 className="mt-1 text-lg font-semibold text-white">AI Performance Insights</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{profile.insights.summary}</p>
      {profile.insights.strengths.length === 0 && profile.insights.weak.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No assessment results available yet.</p>
      ) : (
        <>
          {profile.insights.strengths.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Strengths</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.insights.strengths.map((item) => (
                  <Badge key={item} tone="green">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {profile.insights.weak.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Areas Needing Improvement</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.insights.weak.map((item) => (
                  <Badge key={item} tone="amber">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}

function SubjectBars({ subjects }: { subjects: StudentProfile["subjects"] }) {
  if (!subjects.length) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-white">Subject-wise Performance</h2>
        <p className="mt-3 text-sm text-slate-400">Subject analytics appear after submitted exams.</p>
      </Card>
    );
  }
  return (
    <Card>
      <h2 className="text-lg font-semibold text-white">Subject-wise Performance</h2>
      <ul className="mt-5 space-y-4">
        {subjects.map((subject) => (
          <li key={subject.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-white">{subject.name}</span>
              <span className="flex items-center gap-2">
                {formatPercent(subject.average)}
                <Badge tone={statusTone(subject.status)}>{subject.status}</Badge>
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/8">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF]"
                style={{ width: `${Math.min(100, subject.average)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function HistoryTable({
  history,
  basePath,
  studentId,
}: {
  history: StudentProfile["history"];
  basePath: "/admin" | "/teacher";
  studentId: string;
}) {
  if (!history.length) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-white">Test History</h2>
        <p className="mt-3 text-sm text-slate-400">No completed tests yet.</p>
      </Card>
    );
  }
  return (
    <Card className="overflow-x-auto">
      <h2 className="text-lg font-semibold text-white">Test History</h2>
      <table className="mt-4 w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2 font-medium">Exam Name</th>
            <th className="py-2 font-medium">Subject</th>
            <th className="py-2 font-medium">Exam Date</th>
            <th className="py-2 font-medium">Marks</th>
            <th className="py-2 font-medium">Percentage</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.id} className="border-t border-white/8">
              <td className="py-3 text-white">{row.examName}</td>
              <td className="py-3 text-slate-400">{row.subject}</td>
              <td className="py-3 text-slate-400">{formatDate(row.date)}</td>
              <td className="py-3">
                {row.score} / {row.total}
              </td>
              <td className="py-3">{formatPercent(row.percentage)}</td>
              <td className="py-3">
                <Badge tone="green">Completed</Badge>
              </td>
              <td className="py-3">
                <Link
                  href={`${basePath}/students/${studentId}/results/${row.id}`}
                  className="text-violet-300 hover:text-white"
                >
                  View Result
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
