-- CreateEnum
CREATE TYPE "PointActivity" AS ENUM ('DAILY_ACTIVITY', 'PRACTICE_COMPLETED', 'EXAM_SUBMITTED', 'LIVE_EXAM_COMPLETED', 'PERFORMANCE_BONUS', 'STREAK_MILESTONE', 'PROFILE_COMPLETED');

-- CreateTable
CREATE TABLE "student_point_events" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "activity" "PointActivity" NOT NULL,
    "points" INTEGER NOT NULL,
    "event_key" TEXT NOT NULL,
    "source_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_point_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_gamification" (
    "student_id" TEXT NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMP(3),
    "streak_started_at" TIMESTAMP(3),
    "last_points_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_gamification_pkey" PRIMARY KEY ("student_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_point_events_event_key_key" ON "student_point_events"("event_key");

-- CreateIndex
CREATE INDEX "student_point_events_student_id_occurred_at_idx" ON "student_point_events"("student_id", "occurred_at");

-- CreateIndex
CREATE INDEX "student_point_events_student_id_activity_occurred_at_idx" ON "student_point_events"("student_id", "activity", "occurred_at");

-- AddForeignKey
ALTER TABLE "student_point_events" ADD CONSTRAINT "student_point_events_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_point_events" ADD CONSTRAINT "student_point_events_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_gamification" ADD CONSTRAINT "student_gamification_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
