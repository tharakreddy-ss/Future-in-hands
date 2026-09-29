"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/skeleton";
import { StaffAvatar } from "@/components/staff/staff-avatar";
import { StaffAccountBadge, StaffCategoryBadge, StaffStatusBadge } from "@/components/staff/staff-badges";
import { STAFF_CATEGORY_OPTIONS, readApiError, type StaffListItem } from "@/components/staff/types";

export function StaffDirectory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [staff, setStaff] = useState<StaffListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtered, setFiltered] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    try {
      const response = await fetch(`/api/staff${params.size ? `?${params}` : ""}`);
      if (!response.ok) throw new Error(await readApiError(response, "Could not load staff."));
      const data = (await response.json()) as StaffListItem[];
      if (id !== requestId.current) return;
      setStaff(data);
      setFiltered(params.size > 0);
      setError("");
    } catch (reason) {
      if (id !== requestId.current) return;
      setError(reason instanceof Error ? reason.message : "Could not load staff.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [query, category, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Users"
        title="Staff"
        subtitle="Teaching faculty and all other institution staff. Staff numbers identify each person uniquely."
        actions={
          <Link
            href="/admin/staff/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.28)] hover:brightness-110"
          >
            <UserPlus className="h-4 w-4" />
            Add Staff
          </Link>
        }
      />

      <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
        <label className="relative">
          <span className="sr-only">Search staff</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, staff number or designation"
            className="pl-10"
            maxLength={100}
          />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="input-select" aria-label="Filter by category">
          <option value="">All categories</option>
          {STAFF_CATEGORY_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="input-select" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {error ? (
        <div role="alert" className="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-white">Could not load staff</p>
          <p className="mt-1 text-sm text-rose-200">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 text-sm text-violet-300 hover:text-violet-200">
            Try again
          </button>
        </div>
      ) : loading && staff.length === 0 ? (
        <TableSkeleton />
      ) : staff.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/12 bg-[#11182A]/70 px-8 py-16 text-center">
          <p className="text-lg font-semibold text-white">{filtered ? "No staff match your filters" : "No staff yet"}</p>
          <p className="mt-2 text-sm text-slate-400">
            {filtered ? "Try a different search, category or status." : "Add teaching faculty and other staff to build your directory."}
          </p>
          {filtered ? null : (
            <Link href="/admin/staff/new" className="mt-4 inline-block text-sm text-violet-300 hover:text-violet-200">
              Add the first staff member →
            </Link>
          )}
        </div>
      ) : (
        <div className={loading ? "opacity-60 transition" : "transition"}>
          <p className="mb-2 text-xs text-slate-500">
            {staff.length} {staff.length === 1 ? "staff member" : "staff members"}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#11182A]">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/[0.08] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Staff member</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Login</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {staff.map((row) => (
                  <tr key={row.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <StaffAvatar name={row.fullName} photoUrl={row.photoUrl} size="sm" />
                        <div className="min-w-0">
                          <Link href={`/admin/staff/${row.id}`} className="block truncate font-medium text-white hover:text-violet-200">
                            {row.fullName}
                          </Link>
                          <p className="font-mono text-xs text-slate-400">{row.staffNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{row.designation}</p>
                      <p className="text-xs text-slate-500">{row.department ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StaffCategoryBadge category={row.category} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      <p className="truncate">{row.email ?? "—"}</p>
                      <p>{row.phone ?? ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StaffStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StaffAccountBadge linked={row.hasPlatformAccount} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-3 text-sm">
                        <Link href={`/admin/staff/${row.id}`} className="text-violet-300 hover:text-violet-200">
                          View
                        </Link>
                        <Link href={`/admin/staff/${row.id}/edit`} className="text-slate-300 hover:text-white">
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading staff" className="space-y-2 rounded-2xl border border-white/[0.08] bg-[#11182A] p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-2">
          <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-white/8" />
        </div>
      ))}
    </div>
  );
}
