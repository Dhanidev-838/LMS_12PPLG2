CREATE TABLE `LoginAktivitas` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tanggal` DATE NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `LoginAktivitas_userId_tanggal_key`(`userId`, `tanggal`),
  INDEX `LoginAktivitas_tanggal_idx`(`tanggal`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `LoginAktivitas` ADD CONSTRAINT `LoginAktivitas_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
