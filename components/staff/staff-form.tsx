"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STAFF_CATEGORY_OPTIONS, readApiError, type StaffProfile } from "@/components/staff/types";

const FIELDS = [
  "firstName",
  "lastName",
  "staffNumber",
  "category",
  "designation",
  "department",
  "qualification",
  "email",
  "phone",
  "dateOfBirth",
  "gender",
  "joiningDate",
  "address",
  "emergencyContactName",
  "emergencyContactPhone",
  "emergencyContactRelation",
] as const;

type FieldName = (typeof FIELDS)[number];
type FormValues = Record<FieldName, string>;

const REQUIRED: Array<[FieldName, string]> = [
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["staffNumber", "Staff number"],
  ["category", "Staff category"],
  ["designation", "Designation"],
];

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_LIMIT = 5 * 1024 * 1024;

function initialValues(profile?: StaffProfile): FormValues {
  const date = (value: string | null | undefined) => (value ? value.slice(0, 10) : "");
  return {
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    staffNumber: profile?.staffNumber ?? "",
    category: profile?.category ?? "",
    designation: profile?.designation ?? "",
    department: profile?.department ?? "",
    qualification: profile?.qualification ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    dateOfBirth: date(profile?.dateOfBirth),
    gender: profile?.gender ?? "",
    joiningDate: date(profile?.joiningDate),
    address: profile?.address ?? "",
    emergencyContactName: profile?.emergencyContact.name ?? "",
    emergencyContactPhone: profile?.emergencyContact.phone ?? "",
    emergencyContactRelation: profile?.emergencyContact.relation ?? "",
  };
}

async function uploadPhoto(staffId: string, photo: File) {
  const body = new FormData();
  body.set("photo", photo);
  const response = await fetch(`/api/staff/${staffId}/photo`, { method: "POST", body });
  if (!response.ok) throw new Error(await readApiError(response, "The photo could not be uploaded."));
}

export function StaffForm({ profile }: { profile?: StaffProfile }) {
  const router = useRouter();
  const editing = Boolean(profile);
  const [values, setValues] = useState<FormValues>(() => initialValues(profile));
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<FieldName[]>([]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const set = (name: FieldName) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [name]: value }));
    if (missing.includes(name) && value.trim()) setMissing((current) => current.filter((item) => item !== name));
  };

  function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!selected) return;
    if (!PHOTO_TYPES.includes(selected.type)) return setError("Photo must be a JPG, PNG or WebP image.");
    if (selected.size > PHOTO_LIMIT) return setError("Photo must be 5 MB or smaller.");
    setError("");
    setPhoto(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const empty = REQUIRED.filter(([name]) => !values[name].trim());
    setMissing(empty.map(([name]) => name));
    if (empty.length) {
      setError(`Please fill in: ${empty.map(([, label]) => label).join(", ")}.`);
      return;
    }
    setPending(true);
    setError("");
    const payload = Object.fromEntries(FIELDS.map((name) => [name, values[name]]));
    try {
      const response = await fetch(editing ? `/api/staff/${profile!.id}` : "/api/staff", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, editing ? "Could not save changes." : "Could not add the staff member."));
      }
      const saved = (await response.json()) as StaffProfile;
      const params = new URLSearchParams({ [editing ? "updated" : "created"]: "1" });
      if (photo) {
        try {
          await uploadPhoto(saved.id, photo);
        } catch (reason) {
          params.set("photoError", reason instanceof Error ? reason.message : "The photo could not be uploaded.");
        }
      }
      router.push(`/admin/staff/${saved.id}?${params}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong.");
      setPending(false);
    }
  }

  const invalid = (name: FieldName) => (missing.includes(name) ? "border-rose-400/60" : "");
  const currentPhoto = preview || profile?.photoUrl || "";

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="space-y-6">
      <section className="grid gap-5 rounded-2xl border border-white/[0.08] bg-[#11182A] p-5 lg:grid-cols-[200px_1fr]">
        <label className="group flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0B1020] p-4 text-center hover:border-violet-400/45">
          <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-violet-500/12 text-violet-300">
            {currentPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview or tenant-scoped API route
              <img src={currentPhoto} alt="Staff photo preview" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-8 w-8" />
            )}
          </span>
          <span className="mt-3 text-sm font-medium text-white">{currentPhoto ? "Change photo" : "Professional photo"}</span>
          <span className="mt-1 text-xs text-slate-500">JPG, PNG or WebP · 5 MB · optional</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={choosePhoto} />
        </label>

        <div className="space-y-4">
          <h2 className="font-semibold text-white">Identity</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required>
              <Input value={values.firstName} onChange={set("firstName")} maxLength={80} className={invalid("firstName")} />
            </Field>
            <Field label="Last name" required>
              <Input value={values.lastName} onChange={set("lastName")} maxLength={80} className={invalid("lastName")} />
            </Field>
            <Field label="Staff number" required hint="Unique within your institution, e.g. EMP001">
              <Input value={values.staffNumber} onChange={set("staffNumber")} maxLength={40} className={`font-mono uppercase ${invalid("staffNumber")}`} />
            </Field>
            <Field label="Staff category" required>
              <select value={values.category} onChange={set("category")} className={`input-select ${invalid("category")}`}>
                <option value="" disabled>
                  Select a category
                </option>
                {STAFF_CATEGORY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Designation" required hint="e.g. Assistant Professor, Librarian">
              <Input value={values.designation} onChange={set("designation")} maxLength={120} className={invalid("designation")} />
            </Field>
            <Field label="Department">
              <Input value={values.department} onChange={set("department")} maxLength={120} />
            </Field>
          </div>
        </div>
      </section>

      <Section title="Professional">
        <Field label="Qualification">
          <Input value={values.qualification} onChange={set("qualification")} maxLength={200} placeholder="e.g. M.Sc., Ph.D." />
        </Field>
        <Field label="Joining date">
          <Input type="date" value={values.joiningDate} onChange={set("joiningDate")} />
        </Field>
      </Section>

      <Section title="Contact">
        <Field label="Email">
          <Input type="email" value={values.email} onChange={set("email")} maxLength={254} placeholder="name@institution.edu" />
        </Field>
        <Field label="Phone">
          <Input value={values.phone} onChange={set("phone")} inputMode="tel" maxLength={32} placeholder="+91…" />
        </Field>
        <Field label="Address" wide>
          <textarea value={values.address} onChange={set("address")} rows={3} maxLength={500} className="input-select" />
        </Field>
      </Section>

      <Section title="Personal">
        <Field label="Date of birth">
          <Input type="date" value={values.dateOfBirth} onChange={set("dateOfBirth")} max={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Gender">
          <select value={values.gender} onChange={set("gender")} className="input-select">
            <option value="">Select</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>
        </Field>
      </Section>

      <Section title="Emergency contact">
        <Field label="Name">
          <Input value={values.emergencyContactName} onChange={set("emergencyContactName")} maxLength={120} />
        </Field>
        <Field label="Relation">
          <Input value={values.emergencyContactRelation} onChange={set("emergencyContactRelation")} maxLength={60} placeholder="e.g. Spouse" />
        </Field>
        <Field label="Phone">
          <Input value={values.emergencyContactPhone} onChange={set("emergencyContactPhone")} inputMode="tel" maxLength={32} />
        </Field>
      </Section>

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href={editing ? `/admin/staff/${profile!.id}` : "/admin/staff"}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? (
            editing ? "Saving…" : "Adding staff…"
          ) : editing ? (
            <>
              <Save className="h-4 w-4" /> Save changes
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" /> Add staff member
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#11182A] p-5">
      <h2 className="mb-4 font-semibold text-white">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  wide,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`space-y-1.5 text-sm text-slate-300 ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <span>
        {label} {required ? <span className="text-rose-300">*</span> : <span className="text-xs text-slate-600">optional</span>}
      </span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
