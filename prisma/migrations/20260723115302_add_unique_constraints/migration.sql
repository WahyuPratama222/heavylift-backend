/*
  Warnings:

  - A unique constraint covering the columns `[day]` on the table `gym_schedules` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `package_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `packages` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "gym_schedules_day_key" ON "gym_schedules"("day");

-- CreateIndex
CREATE UNIQUE INDEX "package_categories_name_key" ON "package_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "packages_name_key" ON "packages"("name");
