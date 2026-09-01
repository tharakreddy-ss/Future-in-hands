"use client";

import { useState } from "react";

const STAFF_DEMOS = [
  { label: "Super Admin", email: "superadmin@mocktestai.com", password: "SuperAdmin@123" },
  { label: "Institution Admin", email: "admin@demoacademy.com", password: "Admin@123" },
  { label: "Teacher", email: "teacher@demoacademy.com", password: "Teacher@123" },
];

export function DemoCredentials({
  onStaff,
  onStudent,
}: {
  onStaff: (email: string, password: string) => void;
  onStudent: (studentId: string, password: string) => void;
}) {
  const [open, setOpen] = useState(true);
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
      <button type="button" className="font-medium" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide" : "Show"} demo credentials
      </button>
      {open ? (
        <ul className="mt-3 space-y-3">
          {STAFF_DEMOS.map((item) => (
            <li key={item.email} className="flex items-center justify-between gap-2">
              <span>
                {item.label}
                <br />
                <code className="text-xs">{item.email}</code> / <code className="text-xs">{item.password}</code>
              </span>
              <button
                type="button"
                className="shrink-0 text-violet-300 underline"
                onClick={() => onStaff(item.email, item.password)}
              >
                Use
              </button>
            </li>
          ))}
          <li className="flex items-center justify-between gap-2">
            <span>
              Student
              <br />
              <code className="text-xs">STU001</code> / <code className="text-xs">Student@123</code>
            </span>
            <button type="button" className="shrink-0 text-violet-300 underline" onClick={() => onStudent("STU001", "Student@123")}>
              Use
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
