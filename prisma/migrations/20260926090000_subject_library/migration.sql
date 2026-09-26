-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "subject_id" TEXT;

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "grade_level" TEXT,
    "curriculum" TEXT,
    "academic_year" TEXT,
    "description" TEXT,
    "syllabus_file_key" TEXT,
    "syllabus_file_name" TEXT,
    "syllabus_pages_json" JSONB NOT NULL DEFAULT '[]',
    "material_file_key" TEXT,
    "material_file_name" TEXT,
    "material_pages_json" JSONB NOT NULL DEFAULT '[]',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_subjects" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,

    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_units" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "page_start" INTEGER,
    "page_end" INTEGER,
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_topics" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "page_start" INTEGER,
    "page_end" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subjects_institution_id_grade_level_idx" ON "subjects"("institution_id", "grade_level");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_institution_id_name_key" ON "subjects"("institution_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "class_subjects_class_id_subject_id_key" ON "class_subjects"("class_id", "subject_id");

-- CreateIndex
CREATE INDEX "subject_units_subject_id_order_idx" ON "subject_units"("subject_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "subject_units_subject_id_name_key" ON "subject_units"("subject_id", "name");

-- CreateIndex
CREATE INDEX "subject_topics_unit_id_order_idx" ON "subject_topics"("unit_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "subject_topics_unit_id_name_key" ON "subject_topics"("unit_id", "name");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_units" ADD CONSTRAINT "subject_units_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_topics" ADD CONSTRAINT "subject_topics_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "subject_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

