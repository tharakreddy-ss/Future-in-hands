"use client";
import { useEffect, useState } from "react";
import { ResourceForm } from "@/components/management/resource-form";
export function StudentForm({ classId }: { classId?: string }) {
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => { if (!classId) fetch("/api/classes").then((r) => r.json()).then((v) => setClasses(Array.isArray(v) ? v : [])).catch(() => {}); }, [classId]);
  return <ResourceForm title="Add student" endpoint="/api/students" fields={[{ name: "name", label: "Full name" }, { name: "email", label: "Email", type: "email" }, { name: "password", label: "Initial password", type: "password" }, { name: "phone", label: "Phone", optional: true }, { name: "classId", label: "Class", value: classId, options: classId ? [{ value: classId, label: "Current classroom" }] : classes.map((c) => ({ value: c.id, label: c.name })) }]} />;
}
