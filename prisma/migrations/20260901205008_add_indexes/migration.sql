-- CreateIndex
CREATE INDEX "announcements_package_id_idx" ON "announcements"("package_id");

-- CreateIndex
CREATE INDEX "attendances_member_id_idx" ON "attendances"("member_id");

-- CreateIndex
CREATE INDEX "equipment_photos_equipment_id_idx" ON "equipment_photos"("equipment_id");

-- CreateIndex
CREATE INDEX "member_packages_member_id_idx" ON "member_packages"("member_id");

-- CreateIndex
CREATE INDEX "member_packages_status_idx" ON "member_packages"("status");

-- CreateIndex
CREATE INDEX "payments_member_package_id_idx" ON "payments"("member_package_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");
