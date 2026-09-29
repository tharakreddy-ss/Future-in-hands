import type { z } from "zod";
import { Prisma, type StaffCategory, type StaffStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { fullName, httpError } from "@/lib/utils";
import type { staffCreateSchema, staffUpdateSchema } from "@/lib/validators";

export type StaffCreateInput = z.output<typeof staffCreateSchema>;
export type StaffUpdateInput = z.output<typeof staffUpdateSchema>;
export type StaffListFilters = { q?: string; category?: StaffCategory; status?: StaffStatus };

const CUID = /^[a-z0-9]{20,40}$/i;
const NOT_FOUND = "Staff member not found";
const DUPLICATE_NUMBER = "A staff member with this staff number already exists.";

const profileSelect = {
  id: true,
  staffNumber: true,
  firstName: true,
  lastName: true,
  photoKey: true,
  category: true,
  designation: true,
  department: true,
  qualification: true,
  email: true,
  phone: true,
  dateOfBirth: true,
  gender: true,
  joiningDate: true,
  address: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  emergencyContactRelation: true,
  status: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { isActive: true } },
} satisfies Prisma.StaffSelect;

type StaffProfileRow = Prisma.StaffGetPayload<{ select: typeof profileSelect }>;

function photoUrl(row: { id: string; photoKey: string | null; updatedAt: Date }) {
  return row.photoKey ? `/api/staff/${row.id}/photo?v=${row.updatedAt.getTime()}` : null;
}

function presentStaffProfile(row: StaffProfileRow) {
  return {
    id: row.id,
    staffNumber: row.staffNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: fullName(row.firstName, row.lastName),
    category: row.category,
    designation: row.designation,
    department: row.department,
    qualification: row.qualification,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.dateOfBirth?.toISOString() ?? null,
    gender: row.gender,
    joiningDate: row.joiningDate?.toISOString() ?? null,
    address: row.address,
    emergencyContact: {
      name: row.emergencyContactName,
      phone: row.emergencyContactPhone,
      relation: row.emergencyContactRelation,
    },
    status: row.status,
    photoKey: row.photoKey,
    photoUrl: photoUrl(row),
    hasPlatformAccount: row.userId !== null,
    platformAccountActive: row.user ? row.user.isActive : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type StaffProfile = ReturnType<typeof presentStaffProfile>;

function isDuplicateStaffNumber(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = (error.meta?.target ?? []) as string[] | string;
  return String(target).includes("staff_number") || String(target).includes("staffNumber");
}

async function assertStaffNumberFree(institutionId: string, staffNumber: string, exceptId?: string) {
  const clash = await db.staff.findFirst({
    where: { institutionId, staffNumber, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw httpError(DUPLICATE_NUMBER, 409);
}

async function findProfile(id: string, institutionId: string) {
  if (!CUID.test(id)) return null;
  return db.staff.findFirst({ where: { id, institutionId }, select: profileSelect });
}

export const staffService = {
  async list(institutionId: string, filters: StaffListFilters = {}) {
    const tokens = filters.q?.split(/\s+/).filter(Boolean) ?? [];
    const rows = await db.staff.findMany({
      where: {
        institutionId,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(tokens.length
          ? {
              AND: tokens.map((token) => ({
                OR: [
                  { firstName: { contains: token, mode: "insensitive" as const } },
                  { lastName: { contains: token, mode: "insensitive" as const } },
                  { staffNumber: { contains: token, mode: "insensitive" as const } },
                  { designation: { contains: token, mode: "insensitive" as const } },
                ],
              })),
            }
          : {}),
      },
      select: {
        id: true,
        staffNumber: true,
        firstName: true,
        lastName: true,
        category: true,
        designation: true,
        department: true,
        email: true,
        phone: true,
        status: true,
        photoKey: true,
        userId: true,
        updatedAt: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { staffNumber: "asc" }],
    });
    return rows.map((row) => ({
      id: row.id,
      staffNumber: row.staffNumber,
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: fullName(row.firstName, row.lastName),
      category: row.category,
      designation: row.designation,
      department: row.department,
      email: row.email,
      phone: row.phone,
      status: row.status,
      hasPhoto: row.photoKey !== null,
      photoUrl: photoUrl(row),
      hasPlatformAccount: row.userId !== null,
    }));
  },

  /** Returns null when the ID is malformed, missing, or belongs to another institution. */
  async get(id: string, institutionId: string) {
    const row = await findProfile(id, institutionId);
    return row ? presentStaffProfile(row) : null;
  },

  async create(institutionId: string, input: StaffCreateInput) {
    await assertStaffNumberFree(institutionId, input.staffNumber);
    try {
      const created = await db.staff.create({
        data: {
          institutionId,
          staffNumber: input.staffNumber,
          firstName: input.firstName,
          lastName: input.lastName,
          category: input.category,
          designation: input.designation,
          department: input.department ?? null,
          qualification: input.qualification ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          dateOfBirth: input.dateOfBirth ?? null,
          gender: input.gender ?? null,
          joiningDate: input.joiningDate ?? null,
          address: input.address ?? null,
          emergencyContactName: input.emergencyContactName ?? null,
          emergencyContactPhone: input.emergencyContactPhone ?? null,
          emergencyContactRelation: input.emergencyContactRelation ?? null,
        },
        select: profileSelect,
      });
      return presentStaffProfile(created);
    } catch (error) {
      if (isDuplicateStaffNumber(error)) throw httpError(DUPLICATE_NUMBER, 409);
      throw error;
    }
  },

  async update(id: string, institutionId: string, input: StaffUpdateInput) {
    const existing = await findProfile(id, institutionId);
    if (!existing) throw httpError(NOT_FOUND, 404);
    if (input.staffNumber && input.staffNumber !== existing.staffNumber) {
      await assertStaffNumberFree(institutionId, input.staffNumber, id);
    }
    const data: Prisma.StaffUpdateManyMutationInput = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) (data as Record<string, unknown>)[key] = value;
    }
    try {
      const result = await db.staff.updateMany({ where: { id, institutionId }, data });
      if (result.count === 0) throw httpError(NOT_FOUND, 404);
    } catch (error) {
      if (isDuplicateStaffNumber(error)) throw httpError(DUPLICATE_NUMBER, 409);
      throw error;
    }
    const updated = await findProfile(id, institutionId);
    if (!updated) throw httpError(NOT_FOUND, 404);
    return presentStaffProfile(updated);
  },

  async getPhotoKey(id: string, institutionId: string) {
    if (!CUID.test(id)) return null;
    const row = await db.staff.findFirst({ where: { id, institutionId }, select: { photoKey: true } });
    return row?.photoKey ?? null;
  },

  /** Stores a server-generated key and returns the key it replaced, if any. */
  async setPhoto(id: string, institutionId: string, photoKey: string) {
    if (!CUID.test(id)) throw httpError(NOT_FOUND, 404);
    const existing = await db.staff.findFirst({ where: { id, institutionId }, select: { photoKey: true } });
    if (!existing) throw httpError(NOT_FOUND, 404);
    const result = await db.staff.updateMany({ where: { id, institutionId }, data: { photoKey } });
    if (result.count === 0) throw httpError(NOT_FOUND, 404);
    return existing.photoKey;
  },

  /**
   * Deactivating also disables the linked login account in the same transaction.
   * Activating leaves the linked account's isActive untouched.
   */
  async setStatus(id: string, institutionId: string, status: StaffStatus) {
    if (!CUID.test(id)) throw httpError(NOT_FOUND, 404);
    await db.$transaction(async (tx) => {
      const staff = await tx.staff.findFirst({ where: { id, institutionId }, select: { id: true, userId: true } });
      if (!staff) throw httpError(NOT_FOUND, 404);
      await tx.staff.updateMany({ where: { id, institutionId }, data: { status } });
      if (status === "INACTIVE" && staff.userId) {
        await tx.user.updateMany({ where: { id: staff.userId, institutionId }, data: { isActive: false } });
      }
    });
    const updated = await findProfile(id, institutionId);
    if (!updated) throw httpError(NOT_FOUND, 404);
    return presentStaffProfile(updated);
  },
};
