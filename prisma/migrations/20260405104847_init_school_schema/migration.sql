-- AlterTable
ALTER TABLE "session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "student" (
    "student_id" SERIAL NOT NULL,
    "student_code" VARCHAR(50),
    "code_citizen" VARCHAR(50),
    "prefix_name" VARCHAR(50),
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "gender" VARCHAR(50),
    "birthDate" DATE,
    "religion" VARCHAR(50),
    "ethnicity" VARCHAR(50),
    "nationality" VARCHAR(50),
    "guardian_first_name" VARCHAR(50),
    "guardian_last_name" VARCHAR(50),
    "guardian_relation" VARCHAR(50),
    "father_first_name" VARCHAR(50),
    "father_last_name" VARCHAR(50),
    "mother_first_name" VARCHAR(50),
    "mother_last_name" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "academic_year" (
    "id" SERIAL NOT NULL,
    "year" VARCHAR(4) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "academic_year_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "academic_year_id" INTEGER NOT NULL,
    "class_level" VARCHAR(50),
    "class_room" INTEGER,
    "student_number" INTEGER,
    "status" VARCHAR(50),
    "note" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_student_code_key" ON "student"("student_code");

-- CreateIndex
CREATE UNIQUE INDEX "student_code_citizen_key" ON "student"("code_citizen");

-- CreateIndex
CREATE UNIQUE INDEX "academic_year_year_key" ON "academic_year"("year");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_student_id_academic_year_id_key" ON "enrollment"("student_id", "academic_year_id");

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
