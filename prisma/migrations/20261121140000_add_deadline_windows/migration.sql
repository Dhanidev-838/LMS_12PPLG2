ALTER TABLE `Tugas`
  ADD COLUMN `publishedAt` DATETIME(3) NULL,
  ADD COLUMN `deadlineAt` DATETIME(3) NULL,
  ADD COLUMN `deadlineDurationMinutes` INTEGER NULL;

ALTER TABLE `Asesmen`
  ADD COLUMN `publishedAt` DATETIME(3) NULL,
  ADD COLUMN `deadlineAt` DATETIME(3) NULL,
  ADD COLUMN `deadlineDurationMinutes` INTEGER NULL;
