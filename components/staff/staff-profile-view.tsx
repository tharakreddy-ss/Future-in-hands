"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StaffAvatar } from "@/components/staff/staff-avatar";
import { StaffCategoryBadge, StaffStatusBadge } from "@/components/staff/staff-badges";
import { readApiError, type StaffProfile } from "@/components/staff/types";

type Notice = { created?: boolean; updated?: boolean; photoError?: string };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export function useStaffProfile(staffId: string) {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${encodeURIComponent(staffId)}`);
      if (response.status === 404) {
        setNotFound(true);
        return;
      }
      if (!response.ok) throw new Error(await readApiError(response, "Could not load this staff member."));
      setProfile((await response.json()) as StaffProfile);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load this staff member.");
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return { profile, setProfile, loading, error, notFound, reload: load };
}

export function StaffLoadState({ loading, error, notFound, onRetry }: { loading: boolean; error: string; notFound: boolean; onRetry: () => void }) {
  if (notFound) {
    return (
      <div className="rounded-3xl border border-dashed border-white/12 bg-[#11182A]/70 px-8 py-16 text-center">
        <p className="text-lg font-semibold text-white">Staff member not found</p>
        <p className="mt-2 text-sm text-slate-400">This record does not exist or is not part of your institution.</p>
        <Link href="/admin/staff" className="mt-4 inline-block text-sm text-violet-300 hover:text-violet-200">
          Back to Staff
        </Link>
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-white">Could not load this staff member</p>
        <p className="mt-1 text-sm text-rose-200">{error}</p>
        <button type="button" onClick={onRetry} className="mt-3 text-sm text-violet-300 hover:text-violet-200">
          Try again
        </button>
      </div>
    );
  }
  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading staff member" className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-36 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-36 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }
  return null;
}

export function StaffProfileView({ staffId, notice }: { staffId: string; notice: Notice }) {
  const { profile, setProfile, loading, error, notFound, reload } = useStaffProfile(staffId);
  const [confirming, setConfirming] = useState(false);
  const [statusPending, setStatusPending] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  async function changeStatus(status: "ACTIVE" | "INACTIVE") {
    setStatusPending(true);
    setStatusError("");
    try {
      const response = await fetch(`/api/staff/${encodeURIComponent(staffId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "Could not change the status."));
      const updated = (await response.json()) as StaffProfile;
      setProfile(updated);
      setConfirming(false);
      setStatusMessage(
        updated.status === "INACTIVE"
          ? `${updated.fullName} is now inactive.${updated.hasPlatformAccount ? " The linked login account has been deactivated." : ""}`
          : `${updated.fullName} is now active.${updated.hasPlatformAccount && updated.platformAccountActive === false ? " The linked login account is still deactivated." : ""}`,
      );
    } catch (reason) {
      setStatusError(reason instanceof Error ? reason.message : "Could not change the status.");
    } finally {
      setStatusPending(false);
    }
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <BackLink />
        <StaffLoadState loading={loading} error={error} notFound={notFound} onRetry={() => void reload()} />
      </div>
    );
  }

  const deactivating = profile.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <BackLink />

      {statusMessage ? (
        <Banner tone="success">{statusMessage}</Banner>
      ) : (
        <>
          {notice.created || notice.updated ? (
            <Banner tone="success">{notice.created ? "Staff member added." : "Changes saved."}</Banner>
          ) : null}
          {notice.photoError ? <Banner tone="error">Details were saved, but the photo was not: {notice.photoError}</Banner> : null}
        </>
      )}

      <Card className="hover:translate-y-0">
        <div className="flex flex-wrap items-start gap-5">
          <StaffAvatar name={profile.fullName} photoUrl={profile.photoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white">{profile.fullName}</h1>
              <StaffStatusBadge status={profile.status} />
            </div>
            <p className="mt-1 font-mono text-sm text-slate-300">{profile.staffNumber}</p>
            <p className="mt-2 text-sm text-slate-300">
              {profile.designation}
              {profile.department ? ` · ${profile.department}` : ""}
            </p>
            <div className="mt-3">
              <StaffCategoryBadge category={profile.category} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/staff/${profile.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:border-violet-400/40 hover:bg-white/10"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            <Button
              type="button"
              variant={deactivating ? "outline" : "secondary"}
              onClick={() => {
                setStatusError("");
                setStatusMessage("");
                setConfirming(true);
              }}
              disabled={statusPending || confirming}
            >
              <Power className="h-4 w-4" />
              {deactivating ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>

        {confirming ? (
          <div role="alertdialog" aria-labelledby="status-confirm-title" className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
            <p id="status-confirm-title" className="font-medium text-white">
              {deactivating ? `Deactivate ${profile.fullName}?` : `Activate ${profile.fullName}?`}
            </p>
            <p className="mt-1 text-sm text-amber-100/90">
              {deactivating
                ? profile.hasPlatformAccount
                  ? "The staff record will be marked inactive and the linked platform login account will also be deactivated, so this person will no longer be able to sign in."
                  : "The staff record will be marked inactive. This person has no platform login account."
                : profile.hasPlatformAccount
                  ? "The staff record will be marked active. The linked login account will NOT be reactivated automatically, so this person still cannot sign in until the account is re-enabled."
                  : "The staff record will be marked active."}
            </p>
            {statusError ? (
              <p role="alert" className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-2.5 text-sm text-rose-200">
                {statusError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={deactivating ? "danger" : "primary"}
                disabled={statusPending}
                onClick={() => void changeStatus(deactivating ? "INACTIVE" : "ACTIVE")}
              >
                {statusPending ? "Saving…" : deactivating ? "Yes, deactivate" : "Yes, activate"}
              </Button>
              <Button type="button" variant="ghost" disabled={statusPending} onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard
          title="Professional"
          rows={[
            ["Designation", profile.designation],
            ["Department", profile.department],
            ["Qualification", profile.qualification],
            ["Joining date", profile.joiningDate ? formatDate(profile.joiningDate) : null],
          ]}
        />
        <InfoCard
          title="Contact"
          rows={[
            ["Email", profile.email],
            ["Phone", profile.phone],
            ["Address", profile.address],
          ]}
        />
        <InfoCard
          title="Personal"
          rows={[
            ["Date of birth", profile.dateOfBirth ? formatDate(profile.dateOfBirth) : null],
            ["Gender", profile.gender],
          ]}
        />
        <InfoCard
          title="Emergency contact"
          rows={[
            ["Name", profile.emergencyContact.name],
            ["Relation", profile.emergencyContact.relation],
            ["Phone", profile.emergencyContact.phone],
          ]}
        />
        <InfoCard
          title="Platform access"
          rows={[
            ["Login account", profile.hasPlatformAccount ? "Linked" : "Not linked"],
            [
              "Account status",
              profile.hasPlatformAccount ? (profile.platformAccountActive ? "Active" : "Deactivated") : "—",
            ],
          ]}
          footnote={profile.hasPlatformAccount ? undefined : "This staff member does not have a platform login. Login creation is not available yet."}
        />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin/staff" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
      <ArrowLeft className="h-4 w-4" />
      Staff
    </Link>
  );
}

function Banner({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  return tone === "success" ? (
    <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      {children}
    </p>
  ) : (
    <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
      {children}
    </p>
  );
}

function InfoCard({ title, rows, footnote }: { title: string; rows: Array<[string, string | null]>; footnote?: string }) {
  return (
    <Card className="hover:translate-y-0">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      <dl className="mt-3 space-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[140px_1fr] gap-3 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="whitespace-pre-line break-words text-slate-200">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      {footnote ? <p className="mt-3 text-xs text-slate-500">{footnote}</p> : null}
    </Card>
  );
}
