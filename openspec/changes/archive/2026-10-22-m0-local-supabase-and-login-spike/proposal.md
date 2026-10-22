## Why

Login NIS/NIP bergantung pada email sintetis `<login_id>@<AUTH_EMAIL_DOMAIN>` (ADR-03). Belum diketahui apakah Supabase Auth cloud menerima domain kandidat (risiko R-03, dampak tinggi). PRD §17.1 mewajibkan spike sebelum fitur lain dibangun. Spike itu butuh fondasi minimum: repo, Supabase lokal, dan pemisahan env antara lokal dan `sip-dev`. Domain final belum ada (PRD §20.4), jadi spike menguji **aturan** penerimaan domain, bukan domain final.

Milestone: **M0** (sebagian), yaitu spike login email sintetis dan lingkungan lokal.

## What Changes

- Inisialisasi repo git beserta `.gitignore` yang mengecualikan semua `.env*` kecuali `.env.example`.
- `package.json` minimum: `engines.node >= 24`, Supabase CLI sebagai devDependency, `@supabase/supabase-js`.
- `supabase init` + `supabase/config.toml` yang meniru aturan Auth cloud: pendaftaran publik mati dan password minimal 8 (PRD §13.1).
- Pemisahan env:
  - `.env.local` mengarah ke Supabase lokal;
  - `.env.sip-dev.local` mengarah ke `sip-dev` (hanya untuk skrip);
  - `.env.example` berisi daftar variabel tanpa nilai.

  Env Vercel Preview/Production diatur di Vercel (PRD §17.2), tidak lewat berkas.
- Fungsi normalisasi `login_id` di `src/features/auth/login-id.ts` (FR-AUTH-01), dipakai oleh skrip spike.
- Skrip spike `scripts/spike-auth-domain.ts` untuk setiap domain kandidat:
  1. buat akun via Admin API (`email_confirm: true`);
  2. login dengan format nomor induk berbeda;
  3. nonaktifkan (ban) lalu login lagi untuk mencatat kode galat;
  4. hapus akun.
- Laporan hasil spike di `docs/spike/r-03-email-sintetis.md`, mencakup domain yang diterima/ditolak dan kode galat akun di-ban (bahan FR-AUTH-06).

## Di luar cakupan

- Scaffold frontend (Vite/React/TanStack), Vitest, pgTAP, ESLint, CI, dan konfigurasi Vercel: masuk change M0 berikutnya.
- Migrasi skema (`profiles`, trigger `handle_new_user`) dan RLS.
- `scripts/bootstrap-librarian.ts` (PRD §17.5): ditunda ke M1 karena bergantung pada trigger pembuat profil. Kalau dijalankan sekarang, akan terbentuk akun pustakawan tanpa profil.
- Edge Function `admin-members` dan `supabase/functions/.env`.
- Penetapan domain final: diputuskan bersama sekolah sebelum impor akun asli di M6.
- Perintah apa pun ke `sip-prod`.

## Capabilities

### New Capabilities
- `auth`: pemetaan nomor induk ke email sintetis, konfigurasi Auth yang setara antara lokal dan cloud, penanganan rahasia/env, dan verifikasi penerimaan domain (ADR-03, FR-AUTH-01, FR-AUTH-06, PRD §13.1, §13.2, §17.1).

### Modified Capabilities
_(tidak ada; `openspec/specs/` masih kosong)_

## Impact

- Berkas baru: `.gitignore`, `package.json`, `package-lock.json`, `.env.example`, `supabase/config.toml`, `src/features/auth/login-id.ts`, `scripts/spike-auth-domain.ts`, `docs/spike/r-03-email-sintetis.md`.
- Sistem:
  - Supabase lokal (Docker Desktop harus aktif);
  - project `sip-dev` dibuat manual oleh pengembang sesuai PRD §17.1. Spike menulis lalu menghapus akun uji di `sip-dev`.
- Prasyarat mesin: Node 24 harus menang di PATH. Saat ini `D:\Git\usr\bin\node` (v22) menutupi Node 24.
- Tidak ada perubahan baseline PRD. Tidak ada dampak pada dokumen skripsi (Lampiran C).
- Bila spike gagal untuk semua kandidat, ADR-03 perlu ditinjau ulang. Itu akan menjadi **Perubahan baseline PRD** yang membutuhkan persetujuan pengguna.
