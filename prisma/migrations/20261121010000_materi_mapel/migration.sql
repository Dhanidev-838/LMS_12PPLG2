ALTER TABLE `Materi` ADD COLUMN `mapelId` VARCHAR(191) NULL;

CREATE INDEX `Materi_mapelId_idx` ON `Materi`(`mapelId`);

ALTER TABLE `Materi` ADD CONSTRAINT `Materi_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `Mapel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
