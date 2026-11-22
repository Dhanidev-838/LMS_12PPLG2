# Classify

Classify adalah Learning Management System (LMS) untuk mendukung aktivitas sekolah: pengelolaan kelas, akun siswa dan guru, materi, tugas, asesmen, pengumpulan jawaban, serta pemantauan performa akademik.

A modern classroom and academic management app built with Next.js.

## Fitur Utama

- Autentikasi dan role-based access untuk Admin, Super Admin, Kepsek, Kurikulum, Guru, dan Siswa.
- Dashboard berbeda sesuai kebutuhan setiap role.
- Kelas, pengumuman, materi, tugas, asesmen, soal, dan jawaban; submission super admin terpisah dari hasil yang dapat dilihat guru.
- Penilaian, detail submission read-only untuk role pengawas, dan ekspor nilai.
- Grafik performa akademik sekolah, kelas, dan mata pelajaran.

## Arsitektur

Frontend dan API berada dalam satu repository dan satu aplikasi Next.js:

```text
app/                 Halaman frontend dan route UI
app/api/             API Route Handlers backend
components/          Komponen UI yang dapat dipakai ulang
lib/                 Auth, database, RBAC, format, dan helper
prisma/              Schema, migration, dan seed database
public/              Asset frontend
```

Untuk kondisi project sekarang, satu repository lebih sederhana karena frontend dan API berbagi session, RBAC, Prisma Client, tipe data, dan komponen. Pisahkan menjadi repository frontend/backend hanya jika API akan dipakai client lain, memiliki siklus deployment berbeda, atau dikerjakan tim terpisah.

## Prasyarat

- Node.js 20 atau lebih baru
- npm
- MySQL atau MariaDB

## Instalasi

```bash
git clone <URL_REPOSITORY>
cd classify
npm install
copy .env.example .env
```

Pada PowerShell, perintah `copy` di atas dapat digunakan. Isi nilai database dan secret di `.env` sebelum menjalankan aplikasi.

## Environment Variables

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=Classify
JWT_SECRET=ganti-dengan-secret-random
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

Untuk email OTP, gunakan alamat Gmail dan App Password khusus Google (aktifkan Verifikasi 2 Langkah terlebih dahulu). Simpan `GMAIL_USER` dan `GMAIL_APP_PASSWORD` sebagai environment variables di Vercel dan `.env` lokal. Jangan pernah commit `.env`, `account.txt`, password, App Password, API key, atau file upload pengguna.

## Database

Prisma CLI memakai `DATABASE_URL` sebagai target migrasi. Aplikasi runtime memakai variabel `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME`; pastikan keduanya menunjuk ke database environment yang sama.

Untuk database development lokal, arahkan `DATABASE_URL` ke database lokal sebelum membuat migrasi:

```bash
npx prisma migrate dev
npx prisma generate
```

`npx prisma migrate deploy` hanya menerapkan file migrasi yang sudah ada ke database di `DATABASE_URL`. Gunakan untuk staging/production setelah memeriksa target koneksi; jangan gunakan `migrate dev` pada database production.

Seed mempertahankan akun default ADMIN, KEPSEK, dan KURIKULUM yang sudah ada, serta membuat akun Super Admin dari kredensial yang kamu tentukan sendiri. Isi kredensial Super Admin di `.env` (jangan commit nilainya), dan pastikan `DB_HOST`/`DB_NAME` menunjuk ke database yang memang ingin diisi:

```env
SUPER_ADMIN_EMAIL=email-yang-kamu-pakai@example.com
SUPER_ADMIN_PASSWORD=password-kuat-minimal-12-karakter
SUPER_ADMIN_NAME=Nama Super Admin
```

Jalankan seed secara terpisah setelah migrasi:

```bash
npx prisma db seed
```

Seed tidak mengubah akun Super Admin yang sudah ada saat dijalankan ulang. Akun ADMIN, KEPSEK, dan KURIKULUM tetap memakai data seed yang sudah ada sebelumnya.

## Menjalankan Aplikasi

Mode development:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) dengan browser Anda.

Validasi dan production build:

```bash
npm run lint
npm run build
npm start
```

Project ini menggunakan `next/font` untuk otomatis optimize dan load Geist.

## Push ke GitHub

Project ini cukup memakai satu repository:

```bash
git init
git add .
git status
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repository>.git
git push -u origin main
```

Sebelum `git add .`, pastikan `account.txt`, `.env`, dan upload lokal tidak muncul pada `git status`.

Checklist sebelum push:

- Pastikan secret dan password hanya tersimpan di `.env` lokal.
- Jalankan `git status` dan tinjau daftar file yang akan di-commit.
- Jalankan `npm run lint` sebelum membuat commit.

## Dokumentasi Penting

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma ORM](https://www.prisma.io/docs)
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate)
- [GitHub Documentation](https://docs.github.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub repository](https://github.com/vercel/next.js)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

For deployment details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Lisensi

Belum ditentukan.
