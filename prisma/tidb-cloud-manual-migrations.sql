-- Manual SQL for the three schema migrations not yet applied to TiDB Cloud.
-- Assumes the base schema and SUPER_ADMIN role migration are already applied.
-- Run once against the intended database. These DDL statements are not atomic.

-- 20261121000000_login_aktivitas
CREATE TABLE `LoginAktivitas` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tanggal` DATE NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `LoginAktivitas_userId_tanggal_key`(`userId`, `tanggal`),
  INDEX `LoginAktivitas_tanggal_idx`(`tanggal`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `LoginAktivitas`
  ADD CONSTRAINT `LoginAktivitas_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 20261121010000_materi_mapel
ALTER TABLE `Materi` ADD COLUMN `mapelId` VARCHAR(191) NULL;

CREATE INDEX `Materi_mapelId_idx` ON `Materi`(`mapelId`);

ALTER TABLE `Materi`
  ADD CONSTRAINT `Materi_mapelId_fkey`
  FOREIGN KEY (`mapelId`) REFERENCES `Mapel`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 20261121140000_add_deadline_windows
ALTER TABLE `Tugas`
  ADD COLUMN `publishedAt` DATETIME(3) NULL,
  ADD COLUMN `deadlineAt` DATETIME(3) NULL,
  ADD COLUMN `deadlineDurationMinutes` INTEGER NULL;

ALTER TABLE `Asesmen`
  ADD COLUMN `publishedAt` DATETIME(3) NULL,
  ADD COLUMN `deadlineAt` DATETIME(3) NULL,
  ADD COLUMN `deadlineDurationMinutes` INTEGER NULL;
