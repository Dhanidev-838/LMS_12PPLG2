"use client";

import Image from "next/image";
import Link from "next/link";

const BRAND = "#6B85F6";

const JURUSAN = ["TJKT", "PPLG", "PEMASARAN", "DKV", "MPLB"];

const ROLES = [
  {
    nama: "Guru",
    desk: "Bertugas mengelola proses pembelajaran dengan mengunggah materi, membuat tugas dan asesmen, serta memberikan penilaian kepada siswa.",
    icon: (
      <path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 8h7 M9 12h7 M9 16h4" />
    ),
  },
  {
    nama: "Siswa",
    desk: "Mengakses materi pembelajaran, mengerjakan tugas dan asesmen, serta melihat hasil belajar yang diberikan oleh guru.",
    icon: <path d="M12 3 2 8l10 5 8-4v6M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5" />,
  },
  {
    nama: "Kepsek",
    desk: "Memantau aktivitas pembelajaran dan mengakses laporan akademik sebagai bahan evaluasi serta pengambilan keputusan.",
    icon: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
  },
  {
    nama: "Kurikulum",
    desk: "Mengawasi pelaksanaan kegiatan pembelajaran, memonitor aktivitas guru, serta mengunduh laporan nilai untuk evaluasi kurikulum.",
    icon: <path d="M6 2h9l5 5v15H6V2Zm9 0v5h5M9 13h6M9 17h6" />,
  },
  {
    nama: "Admin",
    desk: "Mengelola data pengguna, kelas, jurusan, mata pelajaran, serta mengatur hak akses dan kebutuhan administrasi sistem.",
    icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0M17 8l2 2 3-3" />,
  },
];

const SYSTEM_FEATURES = [
  {
    judul: "Materi Pembelajaran",
    desk: "Guru mengunggah materi berupa PDF maupun tautan sehingga siswa dapat mengaksesnya kapan saja.",
    icon: <path d="M4 4h16v16H4z M8 8h8M8 12h8M8 16h5" />,
  },
  {
    judul: "Tugas & Asesmen",
    desk: "Guru membuat tugas, kuis, atau ujian online yang dapat dikerjakan dan dikumpulkan langsung oleh siswa.",
    icon: <path d="M9 3h6l1 3H8l1-3ZM6 6h12v15H6zM9 11h6M9 15h6" />,
  },
  {
    judul: "Penilaian",
    desk: "Nilai dikelola secara digital berdasarkan mata pelajaran, kelas, jurusan, hingga hasil belajar setiap siswa.",
    icon: <path d="M12 2l3 6 6.5.9-4.7 4.6L18 20l-6-3.4L6 20l1.2-6.5L2.5 8.9 9 8l3-6Z" />,
  },
  {
    judul: "Manajemen Akademik",
    desk: "Admin mengelola data siswa, guru, kelas, dan jurusan dalam satu sistem yang terintegrasi dan mudah dipantau.",
    icon: <path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M14 3v5h5" />,
  },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
    >
      {children}
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#111827]" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 flex-shrink-0">
  <Image
    src="/Logo1.png"
    alt="Logo Classify"
    fill
    sizes="32px"
    className="rounded-full object-contain"
  />
</div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Classify
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#374151] md:flex">
  <a href="#tentang" className="hover:opacity-70 transition-opacity">About Us</a>
  <a href="#role" className="hover:opacity-70 transition-opacity">Role</a>
  <a href="#system" className="hover:opacity-70 transition-opacity">System</a>
  <a href="#jurusan" className="hover:opacity-70 transition-opacity">Jurusan</a>
  <a href="#contact" className="hover:opacity-70 transition-opacity">Contact Us</a>
</nav>

          <Link
            href="/login"
            className="rounded-full px-6 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ background: BRAND }}
          >
            Login
          </Link>
        </div>
      </header>

      {/* HERO - ganti background di style bawah dengan foto gedung sekolah lu sendiri (taro di /public) */}
      <section
        className="relative flex min-h-[700px] items-center justify-center bg-cover bg-center text-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(17,24,39,0.35), rgba(17,24,39,0.55)), url('/hero-sekolah.jpg')",
          backgroundColor: "#1F2937",
        }}
      >
        <div className="px-6">
          <h1 className="text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ayo Belajar Lebih Cerdas Bersama Classify
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/90 md:text-base">
            &quot;Platform pembelajaran digital yang membantu guru dan siswa belajar,
            mengajar, dan berkembang dalam satu tempat.&quot;
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
            style={{ background: BRAND }}
          >
            Login
          </Link>
        </div>
      </section>

      {/* TENTANG CLASSIFY */}
      <section id="tentang" className="py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2">
          <div>
            <h2
              className="inline-block border-b-2 pb-1 text-2xl font-bold"
              style={{ borderColor: BRAND, fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Tentang Classify
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#4B5563]">
              Classify adalah platform Learning Management System (LMS) berbasis web
              yang dirancang untuk mendukung proses belajar mengajar secara digital,
              terstruktur, dan efisien. Classify menjadi media yang menghubungkan guru,
              siswa, serta pihak manajemen sekolah dalam satu sistem yang terintegrasi.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#4B5563]">
              Classify mempermudah guru dalam membagikan materi pembelajaran, memberikan
              tugas, menyelenggarakan asesmen atau ujian online, serta mengelola nilai
              siswa. Di sisi lain, siswa dapat mengakses materi kapan saja, mengerjakan
              asesmen, mengumpulkan tugas, dan memantau perkembangan pembelajaran melalui
              satu platform yang mudah digunakan.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#4B5563]">
              Selain mendukung kegiatan belajar mengajar, Classify juga menyediakan sistem
              manajemen akademik yang memungkinkan administrator mengelola data guru,
              siswa, kelas, jurusan, dan mata pelajaran. Pihak kurikulum serta kepala
              sekolah dapat memantau aktivitas pembelajaran dan memperoleh laporan
              akademik sebagai bahan evaluasi serta pengambilan keputusan.
            </p>
            <div className="mt-6 rounded-xl border border-black/5 bg-[#F9FAFB] p-4 text-center">
              <p className="text-sm font-bold">Fokus</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                Menyediakan platform pembelajaran digital yang memudahkan pengelolaan
                materi, tugas, asesmen, dan penilaian dalam satu sistem yang terintegrasi.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative h-64 w-64 overflow-hidden rounded-2xl border border-black/5 bg-[#F9FAFB] shadow-sm md:h-80 md:w-80">
  <Image
  src="/Logo1.png"
  alt="Logo Classify"
  fill
  sizes="(max-width: 768px) 256px, 320px"
  className="object-contain p-8"
/>
</div>
          </div>
        </div>
      </section>

      {/* JURUSAN */}
      <section id="jurusan" className="py-16" style={{ background: BRAND }}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Berbagai Jurusan yang ada di web kami
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {JURUSAN.map((j) => (
              <div
                key={j}
                className="flex h-28 items-center justify-center rounded-2xl bg-white text-center text-sm font-bold shadow-md transition-transform hover:-translate-y-1"
              >
                {j}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLE */}
      <section id="role" className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Berbagai Role yang ada di web kami
          </h2>
          <div className="mt-8 flex flex-col gap-4">
            {ROLES.map((r) => (
              <div
                key={r.nama}
                className="flex overflow-hidden rounded-2xl border border-black/5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="flex w-24 flex-shrink-0 items-center justify-center"
                  style={{ background: BRAND }}
                >
                  <Icon>{r.icon}</Icon>
                </div>
                <div className="p-5">
                  <p className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{r.nama}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">{r.desk}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SYSTEM */}
      <section id="system" className="py-16" style={{ background: BRAND }}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            System
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-white/90">
            Classify menghubungkan guru, siswa, administrator, kurikulum, dan kepala
            sekolah dalam satu sistem terintegrasi sehingga seluruh aktivitas
            pembelajaran dapat berjalan lebih efektif, transparan, dan mudah dipantau,
            serta kami menjamin keamanan data para pengguna.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SYSTEM_FEATURES.map((f) => (
              <div key={f.judul} className="rounded-2xl bg-white p-5 shadow-md">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: BRAND }}
                >
                  <Icon>{f.icon}</Icon>
                </div>
                <p className="mt-3 font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{f.judul}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{f.desk}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT US */}
      <section id="contact" className="py-16">
  <div className="mx-auto max-w-6xl px-6">
    <h2 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      Contact us
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="flex h-full flex-col justify-between space-y-4">
              <div className="flex items-center justify-between rounded-2xl p-5 text-white" style={{ background: BRAND }}>
                <div>
                  <p className="text-xs opacity-80">No Telp :</p>
                  <p className="text-sm font-semibold">+62-838-7127-4193</p>
                  <p className="mt-1 text-xs opacity-80">Everyday, 10:00 WIB - 20:00 WIB</p>
                </div>
                <svg viewBox="0 0 24 24" fill="white" className="h-9 w-9">
                  <path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5 14.4c-.2.6-1.2 1.1-1.7 1.2-.5.1-1 .1-1.6-.1a10.6 10.6 0 0 1-3.4-2.1 10.9 10.9 0 0 1-2.2-3.3c-.2-.5-.3-1.1-.1-1.6.1-.5.6-1.5 1.2-1.7.2-.1.5 0 .6.2l1 1.6c.1.2.1.4 0 .6l-.5.7c-.1.2-.1.4 0 .6.4.7 1 1.4 1.7 1.9.2.1.4.1.6 0l.7-.5c.2-.1.4-.1.6 0l1.6 1c.2.1.3.4.2.6Z" />
                </svg>
              </div>

              <div className="flex items-center justify-between rounded-2xl p-5 text-white" style={{ background: BRAND }}>
                <div>
                  <p className="text-xs opacity-80">Email :</p>
                  <p className="text-sm font-semibold">dhanitriadisaputra@gmail.com</p>
                  <p className="mt-1 text-xs opacity-80">Everyday, 10:00 WIB - 20:00 WIB</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="h-9 w-9">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>

              <div className="flex flex-1 flex-col rounded-2xl p-8 text-white" style={{ background: BRAND }}>
  <p className="text-sm font-semibold opacity-80">Description</p>
  <p className="mt-4 text-xl italic leading-loose md:text-2xl">
    &quot;Ilmu bukan sekadar tentang apa yang dipelajari, tetapi bagaimana
    pengetahuan dibagikan, dipahami, dan memberi manfaat bagi sesama.
    Classify hadir untuk menjadi jembatan yang menghubungkan proses belajar
    dengan masa depan yang lebih baik.&quot;
  </p>
  <div className="mt-auto pt-6">
    <div className="h-1.5 w-full rounded-full bg-white/30">
      <div className="h-1.5 w-4/5 rounded-full bg-white" />
    </div>
  </div>
</div>
            </div>

            {/* ganti foto di /public/foto-kontak.jpg dengan foto lu sendiri */}
            <div className="relative aspect-[3/4] w-full self-start overflow-hidden rounded-2xl border border-black/5 bg-[#F3F4F6]">
  <Image
    src="/foto-kontak.png"
    alt="Foto Kontak Classify"
    fill
    sizes="(max-width: 768px) 100vw, 50vw"
    className="object-cover"
  />
</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-white" style={{ background: BRAND }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold">Classify</p>
            <p className="mt-2 text-sm">Belajar Lebih Mudah, Mengajar Lebih Terarah.</p>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/80">
              Platform Learning Management System yang mendukung proses belajar mengajar
              secara modern, efektif, dan terintegrasi.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Quick Links</p>
            <ul className="mt-3 space-y-2 text-sm text-white/90">
              <li><a href="#tentang" className="hover:underline">About Us</a></li>
              <li><a href="#jurusan" className="hover:underline">Jurusan</a></li>
              <li><a href="#role" className="hover:underline">Role</a></li>
              <li><a href="#tentang" className="hover:underline">Contact Us</a></li>
              <li><Link href="/login" className="hover:underline">Login</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Social Media</p>
            <ul className="mt-3 space-y-2 text-sm text-white/90">
              <li>Instagram : @chronion999</li>
              <li>Github : Dhanidev-838</li>
              <li>LinkedIn : Dhani Triadi Saputra</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-white/20 pt-6 text-center text-xs text-white/80">
          © 2026 Classify. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
