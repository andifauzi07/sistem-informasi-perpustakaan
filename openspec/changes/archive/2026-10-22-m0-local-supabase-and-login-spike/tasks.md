## 1. Prasyarat mesin (dilakukan pengembang)

- [x] 1.1 Pastikan `node --version` menghasilkan v24 di Git Bash dan PowerShell (singkirkan `D:\Git\usr\bin\node` dari PATH); prasyarat ADR-03 spike
- [x] 1.2 Nyalakan Docker Desktop dan pastikan `docker info` berhasil; prasyarat PRD §7.3
- [x] 1.3 Buat project Supabase `sip-dev` (region Singapore), lalu atur Auth sesuai PRD §17.1 (signup mati, password minimal 8); prasyarat R-03

## 2. Fondasi repo

- [x] 2.1 `git init` dan buat `.gitignore` (`.env*`, `!.env.example`, `node_modules`, `supabase/.temp`); verifikasi skenario "Berkas env tidak ikut di-commit" (PRD §13.2)
- [x] 2.2 Buat `package.json` (`type: module`, `engines.node >=24`) dan pasang `supabase` (dev) serta `@supabase/supabase-js` dengan versi pasti; ADR-08
- [x] 2.3 Buat `.env.example` berisi `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_AUTH_EMAIL_DOMAIN`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `AUTH_EMAIL_DOMAIN` tanpa nilai; verifikasi skenario "Secret key tidak berprefix VITE_" (PRD §13.2)

## 3. Supabase lokal

- [x] 3.1 Jalankan `npx supabase init`, lalu ubah `supabase/config.toml` sesuai design D6 (PRD §13.1)
- [x] 3.2 Jalankan `npx supabase start`, lalu isi `.env.local` dari keluaran `npx supabase status`
- [x] 3.3 Verifikasi skenario "Pendaftaran publik ditolak" dan "Password pendek ditolak" terhadap Supabase lokal (PRD §13.1)

## 4. Normalisasi & spike

- [x] 4.1 Buat `src/features/auth/login-id.ts` (normalisasi satu baris + pembentuk email dari `AUTH_EMAIL_DOMAIN`); FR-AUTH-01, TC-AUTH-03
- [x] 4.2 Buat `scripts/spike-auth-domain.ts` sesuai design D3 (buat → login format lain → ban → login → hapus di `finally`); FR-AUTH-01, FR-AUTH-06
- [x] 4.3 Jalankan spike ke Supabase lokal (`node --env-file=.env.local …`) sampai skrip bekerja benar; TC-AUTH-03
- [x] 4.4 Isi `.env.sip-dev.local`, lalu jalankan spike ke `sip-dev` dengan domain kandidat pilihan pengguna dan `example.com` sebagai kontrol; R-03, TC-AUTH-05
- [x] 4.5 Pastikan tidak ada akun uji tersisa di `auth.users` lokal maupun `sip-dev`; skenario "Akun uji dibersihkan"

## 5. Laporan

- [x] 5.1 Tulis `docs/spike/r-03-email-sintetis.md`: tanggal, versi CLI, hasil per domain (lokal & `sip-dev`), dan kode galat login akun di-ban (bahan FR-AUTH-06)
- [x] 5.2 Bila semua kandidat ditolak di `sip-dev`, hentikan dan bahas peninjauan ulang ADR-03 dengan pengguna (Perubahan baseline PRD)

## 6. Penutup

- [x] 6.1 Jalankan /ponytail-review pada diff change ini dan terapkan temuan yang tidak melanggar PRD/CLAUDE.md
- [x] 6.2 Penuhi Definition of Done CLAUDE.md §13 — catatan: `typecheck`/`lint`/`test`/`build` N/A sampai change scaffold M0 (perintahnya belum ada); butir DoD lain yang berlaku terpenuhi
