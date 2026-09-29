"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/skeleton";
import { StaffForm } from "@/components/staff/staff-form";
import { StaffLoadState, useStaffProfile } from "@/components/staff/staff-profile-view";

export function StaffEdit({ staffId }: { staffId: string }) {
  const { profile, loading, error, notFound, reload } = useStaffProfile(staffId);

  return (
    <div className="space-y-6">
      <Link href={`/admin/staff/${staffId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>
      <PageHeader
        eyebrow="Staff"
        title={profile ? `Edit ${profile.fullName}` : "Edit staff member"}
        subtitle={profile ? `Staff number ${profile.staffNumber}. Status is changed from the profile page.` : undefined}
      />
      {profile ? (
        <StaffForm profile={profile} />
      ) : (
        <StaffLoadState loading={loading} error={error} notFound={notFound} onRetry={() => void reload()} />
      )}
    </div>
  );
}
