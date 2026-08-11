-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'KEPSEK', 'KURIKULUM', 'GURU', 'SISWA') NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NULL,
    `nis` VARCHAR(191) NULL,
    `fotoProfil` VARCHAR(191) NULL,
    `deskripsi` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_nik_key`(`nik`),
    UNIQUE INDEX `User_nis_key`(`nis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jurusan` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Jurusan_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KelasReferensi` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `jenjang` VARCHAR(191) NOT NULL,
    `tingkat` INTEGER NULL,
    `jurusanId` VARCHAR(191) NULL,

    UNIQUE INDEX `KelasReferensi_label_key`(`label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kelas` (
    `id` VARCHAR(191) NOT NULL,
    `kelasReferensiId` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NULL,
    `jurusanId` VARCHAR(191) NOT NULL,
    `walasId` VARCHAR(191) NULL,
    `deskripsi` VARCHAR(191) NULL,
    `inviteToken` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Kelas_inviteToken_key`(`inviteToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KelasSiswa` (
    `id` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,
    `siswaId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `KelasSiswa_kelasId_siswaId_key`(`kelasId`, `siswaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mapel` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Mapel_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuruJurusan` (
    `id` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `jurusanId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `GuruJurusan_guruId_jurusanId_key`(`guruId`, `jurusanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KelasGuruMapel` (
    `id` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `mapelId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `KelasGuruMapel_kelasId_guruId_mapelId_key`(`kelasId`, `guruId`, `mapelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pengumuman` (
    `id` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `isi` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lampiran` (
    `id` VARCHAR(191) NOT NULL,
    `pengumumanId` VARCHAR(191) NOT NULL,
    `tipe` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NULL,
    `thumbnail` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Materi` (
    `id` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `tipe` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MateriKelas` (
    `id` VARCHAR(191) NOT NULL,
    `materiId` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MateriKelas_materiId_kelasId_key`(`materiId`, `kelasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Asesmen` (
    `id` VARCHAR(191) NOT NULL,
    `guruId` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `tipe` ENUM('KUIS', 'UJIAN', 'TUGAS') NOT NULL,
    `mapelId` VARCHAR(191) NULL,
    `durasiMenit` INTEGER NULL,
    `deskripsi` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NULL,
    `linkUrl` VARCHAR(191) NULL,
    `status` ENUM('PROSES', 'SELESAI') NOT NULL DEFAULT 'PROSES',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AsesmenKelas` (
    `id` VARCHAR(191) NOT NULL,
    `asesmenId` VARCHAR(191) NOT NULL,
    `kelasId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `AsesmenKelas_asesmenId_kelasId_key`(`asesmenId`, `kelasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Soal` (
    `id` VARCHAR(191) NOT NULL,
    `asesmenId` VARCHAR(191) NOT NULL,
    `urutan` INTEGER NOT NULL,
    `tipe` ENUM('PILIHAN_GANDA', 'CHECKBOX', 'ESSAY') NOT NULL,
    `pertanyaan` VARCHAR(191) NOT NULL,
    `gambar` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OpsiJawaban` (
    `id` VARCHAR(191) NOT NULL,
    `soalId` VARCHAR(191) NOT NULL,
    `teks` VARCHAR(191) NOT NULL,
    `isBenar` BOOLEAN NOT NULL DEFAULT false,
    `urutan` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Submission` (
    `id` VARCHAR(191) NOT NULL,
    `asesmenId` VARCHAR(191) NOT NULL,
    `siswaId` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NULL,
    `linkUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'BELUM',
    `submittedAt` DATETIME(3) NULL,
    `nilaiAkhir` DOUBLE NULL,

    UNIQUE INDEX `Submission_asesmenId_siswaId_key`(`asesmenId`, `siswaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JawabanSiswa` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `soalId` VARCHAR(191) NOT NULL,
    `jawabanEssay` VARCHAR(191) NULL,
    `nilaiSoal` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JawabanOpsi` (
    `id` VARCHAR(191) NOT NULL,
    `jawabanSiswaId` VARCHAR(191) NOT NULL,
    `opsiJawabanId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `KelasReferensi` ADD CONSTRAINT `KelasReferensi_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `Jurusan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Kelas` ADD CONSTRAINT `Kelas_kelasReferensiId_fkey` FOREIGN KEY (`kelasReferensiId`) REFERENCES `KelasReferensi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Kelas` ADD CONSTRAINT `Kelas_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `Jurusan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Kelas` ADD CONSTRAINT `Kelas_walasId_fkey` FOREIGN KEY (`walasId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KelasSiswa` ADD CONSTRAINT `KelasSiswa_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `Kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KelasSiswa` ADD CONSTRAINT `KelasSiswa_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuruJurusan` ADD CONSTRAINT `GuruJurusan_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuruJurusan` ADD CONSTRAINT `GuruJurusan_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `Jurusan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KelasGuruMapel` ADD CONSTRAINT `KelasGuruMapel_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `Kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KelasGuruMapel` ADD CONSTRAINT `KelasGuruMapel_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KelasGuruMapel` ADD CONSTRAINT `KelasGuruMapel_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `Mapel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pengumuman` ADD CONSTRAINT `Pengumuman_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `Kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pengumuman` ADD CONSTRAINT `Pengumuman_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pengumuman` ADD CONSTRAINT `Pengumuman_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Pengumuman`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lampiran` ADD CONSTRAINT `Lampiran_pengumumanId_fkey` FOREIGN KEY (`pengumumanId`) REFERENCES `Pengumuman`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Materi` ADD CONSTRAINT `Materi_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MateriKelas` ADD CONSTRAINT `MateriKelas_materiId_fkey` FOREIGN KEY (`materiId`) REFERENCES `Materi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MateriKelas` ADD CONSTRAINT `MateriKelas_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `Kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asesmen` ADD CONSTRAINT `Asesmen_guruId_fkey` FOREIGN KEY (`guruId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asesmen` ADD CONSTRAINT `Asesmen_mapelId_fkey` FOREIGN KEY (`mapelId`) REFERENCES `Mapel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AsesmenKelas` ADD CONSTRAINT `AsesmenKelas_asesmenId_fkey` FOREIGN KEY (`asesmenId`) REFERENCES `Asesmen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AsesmenKelas` ADD CONSTRAINT `AsesmenKelas_kelasId_fkey` FOREIGN KEY (`kelasId`) REFERENCES `Kelas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Soal` ADD CONSTRAINT `Soal_asesmenId_fkey` FOREIGN KEY (`asesmenId`) REFERENCES `Asesmen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OpsiJawaban` ADD CONSTRAINT `OpsiJawaban_soalId_fkey` FOREIGN KEY (`soalId`) REFERENCES `Soal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_asesmenId_fkey` FOREIGN KEY (`asesmenId`) REFERENCES `Asesmen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_siswaId_fkey` FOREIGN KEY (`siswaId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JawabanSiswa` ADD CONSTRAINT `JawabanSiswa_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JawabanSiswa` ADD CONSTRAINT `JawabanSiswa_soalId_fkey` FOREIGN KEY (`soalId`) REFERENCES `Soal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JawabanOpsi` ADD CONSTRAINT `JawabanOpsi_jawabanSiswaId_fkey` FOREIGN KEY (`jawabanSiswaId`) REFERENCES `JawabanSiswa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JawabanOpsi` ADD CONSTRAINT `JawabanOpsi_opsiJawabanId_fkey` FOREIGN KEY (`opsiJawabanId`) REFERENCES `OpsiJawaban`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
