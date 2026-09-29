import type { StaffProfile } from "@/services/staff.service";

export type { StaffProfile };

export type StaffCategory = StaffProfile["category"];
export type StaffStatus = StaffProfile["status"];

export type StaffListItem = {
  id: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  category: StaffCategory;
  designation: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  status: StaffStatus;
  hasPhoto: boolean;
  photoUrl: string | null;
  hasPlatformAccount: boolean;
};

export const STAFF_CATEGORY_LABELS: Record<StaffCategory, string> = {
  TEACHING: "Teaching Faculty",
  NON_TEACHING: "Non-Teaching Staff",
  LIBRARY: "Library",
  SECURITY: "Security",
  MANAGEMENT: "Management",
  OTHER: "Other",
};

export const STAFF_CATEGORY_OPTIONS = Object.entries(STAFF_CATEGORY_LABELS) as Array<[StaffCategory, string]>;

export async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}
