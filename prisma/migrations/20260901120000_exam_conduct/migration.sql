-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EXAM_SCHEDULED', 'EXAM_RESCHEDULED', 'EXAM_REMINDER_1D', 'EXAM_REMINDER_1H', 'EXAM_REMINDER_15M', 'EXAM_LIVE', 'RESULT_AVAILABLE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP');

-- AlterTable
ALTER TABLE "tests" ADD COLUMN "exam_status" "ExamStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "tests" ADD COLUMN "exam_date" TIMESTAMP(3);
ALTER TABLE "tests" ADD COLUMN "start_at" TIMESTAMP(3);
ALTER TABLE "tests" ADD COLUMN "end_at" TIMESTAMP(3);
ALTER TABLE "tests" ADD COLUMN "variation_count" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "paper_variations" (
    "id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "question_ids_json" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "paper_variations_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "test_assignments" ADD COLUMN "paper_variation_id" TEXT;
ALTER TABLE "test_assignments" ADD COLUMN "question_order_json" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "test_assignments" ADD COLUMN "option_order_json" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "student_test_attempts" ADD COLUMN "assignment_id" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "test_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tests_start_at_end_at_idx" ON "tests"("start_at", "end_at");

-- CreateIndex
CREATE UNIQUE INDEX "paper_variations_test_id_label_key" ON "paper_variations"("test_id", "label");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_student_id_test_id_type_key" ON "notifications"("student_id", "test_id", "type");

-- CreateIndex
CREATE INDEX "notifications_student_id_read_at_idx" ON "notifications"("student_id", "read_at");

-- AddForeignKey
ALTER TABLE "paper_variations" ADD CONSTRAINT "paper_variations_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_assignments" ADD CONSTRAINT "test_assignments_paper_variation_id_fkey" FOREIGN KEY ("paper_variation_id") REFERENCES "paper_variations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_test_attempts" ADD CONSTRAINT "student_test_attempts_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "test_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
