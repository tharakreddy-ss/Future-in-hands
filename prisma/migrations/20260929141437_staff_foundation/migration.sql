-- CreateEnum
CREATE TYPE "StaffCategory" AS ENUM ('TEACHING', 'NON_TEACHING', 'LIBRARY', 'SECURITY', 'MANAGEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "institutions" ADD COLUMN     "staff_id_prefix" TEXT NOT NULL DEFAULT 'EMP';

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "user_id" TEXT,
    "staff_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "photo_key" TEXT,
    "category" "StaffCategory" NOT NULL,
    "designation" TEXT NOT NULL,
    "department" TEXT,
    "qualification" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "joining_date" TIMESTAMP(3),
    "address" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "emergency_contact_relation" TEXT,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_id_key" ON "staff"("user_id");

-- CreateIndex
CREATE INDEX "staff_institution_id_category_idx" ON "staff"("institution_id", "category");

-- CreateIndex
CREATE INDEX "staff_institution_id_status_idx" ON "staff"("institution_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "staff_institution_id_staff_number_key" ON "staff"("institution_id", "staff_number");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
