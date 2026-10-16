-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'coordinator', 'viewer');

-- CreateEnum
CREATE TYPE "NoveltyCategory" AS ENUM ('absence', 'permit', 'suspension', 'vacation', 'license', 'accident', 'termination');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('scheduled', 'executed', 'novedad', 'rest');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "id_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'coordinator',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_configs" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "crosses_midnight" BOOLEAN NOT NULL DEFAULT false,
    "active_days" TEXT NOT NULL DEFAULT '1111111',
    "is_worked_rest" BOOLEAN NOT NULL DEFAULT false,
    "color_hex" TEXT NOT NULL DEFAULT '#4A90D9',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guards" (
    "id" TEXT NOT NULL,
    "id_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "hire_date" TIMESTAMP(3),
    "termination_date" TIMESTAMP(3),
    "is_supervisor" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novelty_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "NoveltyCategory" NOT NULL,
    "affects_payroll" BOOLEAN NOT NULL DEFAULT false,
    "is_termination" BOOLEAN NOT NULL DEFAULT false,
    "support_required" BOOLEAN NOT NULL DEFAULT false,
    "color_hex" TEXT NOT NULL DEFAULT '#E53E3E',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "novelty_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novelties" (
    "id" TEXT NOT NULL,
    "guard_id" TEXT NOT NULL,
    "novelty_type_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "date_start" TIMESTAMP(3) NOT NULL,
    "date_end" TIMESTAMP(3),
    "support_submitted" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "registered_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "novelties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "guard_id" TEXT NOT NULL,
    "shift_config_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'scheduled',
    "created_by_id" TEXT NOT NULL,
    "modified_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rests" (
    "id" TEXT NOT NULL,
    "guard_id" TEXT NOT NULL,
    "date_start" DATE NOT NULL,
    "date_end" DATE NOT NULL,
    "is_sunday" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_number_key" ON "users"("id_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");

-- CreateIndex
CREATE UNIQUE INDEX "clients_nit_key" ON "clients"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "posts_code_key" ON "posts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "shift_configs_code_key" ON "shift_configs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "guards_id_number_key" ON "guards"("id_number");

-- CreateIndex
CREATE UNIQUE INDEX "novelty_types_code_key" ON "novelty_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "novelties_schedule_id_key" ON "novelties"("schedule_id");

-- CreateIndex
CREATE INDEX "schedules_date_idx" ON "schedules"("date");

-- CreateIndex
CREATE INDEX "schedules_guard_id_date_idx" ON "schedules"("guard_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_guard_id_date_shift_config_id_key" ON "schedules"("guard_id", "date", "shift_config_id");

-- CreateIndex
CREATE INDEX "rests_guard_id_date_start_date_end_idx" ON "rests"("guard_id", "date_start", "date_end");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_configs" ADD CONSTRAINT "shift_configs_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novelties" ADD CONSTRAINT "novelties_guard_id_fkey" FOREIGN KEY ("guard_id") REFERENCES "guards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novelties" ADD CONSTRAINT "novelties_novelty_type_id_fkey" FOREIGN KEY ("novelty_type_id") REFERENCES "novelty_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novelties" ADD CONSTRAINT "novelties_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novelties" ADD CONSTRAINT "novelties_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novelties" ADD CONSTRAINT "novelties_registered_by_id_fkey" FOREIGN KEY ("registered_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_guard_id_fkey" FOREIGN KEY ("guard_id") REFERENCES "guards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_shift_config_id_fkey" FOREIGN KEY ("shift_config_id") REFERENCES "shift_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_modified_by_id_fkey" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rests" ADD CONSTRAINT "rests_guard_id_fkey" FOREIGN KEY ("guard_id") REFERENCES "guards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rests" ADD CONSTRAINT "rests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
