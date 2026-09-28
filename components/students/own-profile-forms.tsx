"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ProfileFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
};

export function StudentProfileForms({ initial }: { initial: ProfileFormValues }) {
  const router = useRouter();
  const [profilePending, setProfilePending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [photoPending, setPhotoPending] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState("");

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profilePending) return;
    setProfilePending(true);
    setProfileError("");
    setProfileMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          phone: form.get("phone"),
          gender: form.get("gender"),
          dateOfBirth: form.get("dateOfBirth"),
          address: form.get("address"),
          guardianName: form.get("guardianName"),
          guardianPhone: form.get("guardianPhone"),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not update profile");
      setProfileMessage("Profile updated.");
      router.refresh();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setProfilePending(false);
    }
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordPending) return;
    setPasswordPending(true);
    setPasswordError("");
    setPasswordMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = {
      currentPassword: String(data.get("currentPassword") ?? ""),
      newPassword: String(data.get("newPassword") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
    };
    try {
      const res = await fetch("/api/student/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not change password");
      setPasswordMessage("Password changed.");
      form.reset();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setPasswordPending(false);
    }
  }

  async function savePhoto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (photoPending) return;
    setPhotoPending(true);
    setPhotoError("");
    setPhotoMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/student/profile/photo", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not update photo");
      setPhotoMessage("Photo updated.");
      event.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Could not update photo");
    } finally {
      setPhotoPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-white">Profile photo</h2>
        <p className="mt-1 text-sm text-slate-500">JPG, PNG, or WebP. Maximum 5 MB.</p>
        <form className="mt-4 space-y-3" onSubmit={(event) => void savePhoto(event)}>
          <Input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required />
          {photoError ? <p className="text-sm text-red-400">{photoError}</p> : null}
          {photoMessage ? <p className="text-sm text-emerald-300">{photoMessage}</p> : null}
          <Button type="submit" disabled={photoPending}>
            {photoPending ? "Uploading…" : "Upload photo"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white">Edit profile</h2>
        <p className="mt-1 text-sm text-slate-500">Student ID, email, class, and role cannot be changed here.</p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void saveProfile(event)}>
          <label className="space-y-1 text-sm text-slate-300">
            First name
            <Input name="firstName" required maxLength={80} defaultValue={initial.firstName} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            Last name
            <Input name="lastName" maxLength={80} defaultValue={initial.lastName} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            Phone
            <Input name="phone" inputMode="tel" maxLength={32} defaultValue={initial.phone} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            Gender
            <Input name="gender" maxLength={32} defaultValue={initial.gender} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            Date of birth
            <Input name="dateOfBirth" type="date" defaultValue={initial.dateOfBirth} />
          </label>
          <label className="space-y-1 text-sm text-slate-300 sm:col-span-2">
            Address
            <Input name="address" maxLength={500} defaultValue={initial.address} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            Guardian name
            <Input name="guardianName" maxLength={120} defaultValue={initial.guardianName} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            Guardian phone
            <Input name="guardianPhone" inputMode="tel" maxLength={32} defaultValue={initial.guardianPhone} />
          </label>
          <div className="sm:col-span-2 space-y-2">
            {profileError ? <p className="text-sm text-red-400">{profileError}</p> : null}
            {profileMessage ? <p className="text-sm text-emerald-300">{profileMessage}</p> : null}
            <Button type="submit" disabled={profilePending}>
              {profilePending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white">Change password</h2>
        <p className="mt-1 text-sm text-slate-500">Use at least 6 characters. You will keep your current session.</p>
        <form className="mt-4 grid gap-4 sm:max-w-md" onSubmit={(event) => void savePassword(event)} autoComplete="off">
          <label className="space-y-1 text-sm text-slate-300">
            Current password
            <Input name="currentPassword" type="password" required minLength={1} autoComplete="current-password" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            New password
            <Input name="newPassword" type="password" required minLength={6} maxLength={72} autoComplete="new-password" />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            Confirm new password
            <Input name="confirmPassword" type="password" required minLength={6} maxLength={72} autoComplete="new-password" />
          </label>
          {passwordError ? <p className="text-sm text-red-400">{passwordError}</p> : null}
          {passwordMessage ? <p className="text-sm text-emerald-300">{passwordMessage}</p> : null}
          <Button type="submit" disabled={passwordPending}>
            {passwordPending ? "Updating…" : "Change password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
