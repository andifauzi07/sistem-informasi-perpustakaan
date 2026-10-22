## Context

Proyek masih greenfield: belum ada repo git, `package.json`, `src/`, atau `supabase/`. Kondisi mesin pengembang:

- Docker 28 terpasang, tetapi daemon belum aktif.
- Supabase CLI belum terpasang.
- Node 24.14 terpasang di `C:\Program Files\nodejs`, tetapi tertutup oleh `D:\Git\usr\bin\node` (v22) di PATH.

Lingkungan mengikuti PRD §7.3 (lokal → `sip-dev` + Vercel Preview → `sip-prod` + Vercel Production). Domain email sintetis belum ada (PRD §20.4).

## Goals / Non-Goals

**Goals:**
- Supabase lokal bisa berjalan dengan aturan Auth yang setara dengan cloud.
- Pemisahan env lokal dan `sip-dev` yang jelas, tanpa rahasia yang ter-commit.
- Bukti tertulis apakah email sintetis diterima Supabase Auth cloud (R-03), beserta kode galat akun di-ban.

**Non-Goals:**
- Scaffold frontend, test runner, CI, dan Vercel (change M0 berikutnya).
- Skema DB dan `bootstrap-librarian.ts` (M1).
- Memilih domain final.

## Decisions

**D1. Berkas env hanya untuk eksekusi lokal.**
- `.env.local` dipakai untuk Supabase lokal. Isinya variabel frontend `VITE_*` (untuk change berikutnya) ditambah `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, dan `AUTH_EMAIL_DOMAIN` untuk skrip (PRD §17.5).
- `.env.sip-dev.local` memiliki struktur yang sama, tetapi berisi nilai `sip-dev`.
- Env Preview/Production diisi di dashboard Vercel (PRD §17.2).
- *Alternatif ditolak:* mode Vite `.env.staging`. Frontend belum ada, dan Vercel sudah menyuntikkan env per lingkungan, sehingga berkas mode hanya menduplikasi.

**D2. Skrip dijalankan dengan Node 24 secara langsung: `node --env-file=<berkas> scripts/x.ts`.**
- Node 24 sudah mendukung *type stripping* dan `--env-file` bawaan.
- *Alternatif ditolak:* `tsx` dan `dotenv`, yang menambah dependency untuk fitur yang sudah ada di platform.
- Konsekuensi: skrip hanya boleh memakai sintaks TS yang bisa dihapus (tanpa `enum`/`namespace`), dan import lokal memakai ekstensi `.ts`. Change scaffold berikutnya perlu mengaktifkan `allowImportingTsExtensions`/`erasableSyntaxOnly` di tsconfig.

**D3. Spike dipisah dari bootstrap.**
- Skrip `scripts/spike-auth-domain.ts` menerima daftar domain sebagai argumen (`node:util` `parseArgs`).
- Untuk setiap domain, skrip menjalankan:
  1. `admin.createUser` dari nomor induk `21.10.0456`;
  2. `signInWithPassword` dengan input `2110 0456` memakai publishable key;
  3. `admin.updateUserById(ban_duration)`, lalu login ulang untuk mencatat `error.code`;
  4. `admin.deleteUser` di blok `finally`.
- Password uji memakai `crypto.randomUUID()`. Generator password sementara §12.3 adalah urusan M1.
- *Alternatif ditolak:* menjadikan spike sebagai `bootstrap-librarian.ts`. Bootstrap membutuhkan trigger `handle_new_user`; tanpa trigger itu, akun pustakawan akan terbentuk tanpa profil.

**D4. Spike dijalankan dua kali: lokal dulu (memastikan skrip benar), lalu `sip-dev` (bukti R-03).** GoTrue lokal belum tentu menerapkan validasi yang sama dengan versi hosted, jadi hasil lokal bukan bukti.

**D5. Supabase CLI dipasang sebagai devDependency dengan versi pasti.** Tidak dipasang global, supaya versi CLI terkunci per proyek dan CI berikutnya memakai versi yang sama.

**D6. `config.toml` yang diubah dari default `supabase init`:** `[auth] enable_signup = false` dan `minimum_password_length = 8`. Nilai lain dibiarkan default. `[auth.email] enable_signup` **harus tetap `true`**: di GoTrue kunci itu menyalakan provider email, sehingga `false` mematikan login password (`422 email_provider_disabled`), bukan hanya pendaftaran (temuan saat apply, 2026-10-22).

## Ponytail

| Kode baru | (1) Perlu? | (2) Pustaka standar | (3) Native platform | (4) Dependency terpasang | (5) Satu baris? | (6) Kode minimum |
|---|---|---|---|---|---|---|
| `.gitignore` | Ya, mencegah `.env` ter-commit | — | Git | — | Beberapa baris pola | Pola `.env*`, `!.env.example`, `node_modules`, `supabase/.temp` |
| `package.json` | Ya, untuk mengunci versi CLI & supabase-js | — | npm `engines` | — | — | `engines`, `type: module`, 2 dependency, tanpa skrip npm baru |
| `supabase/config.toml` | Ya (§13.1) | — | Hasil `supabase init` | Supabase CLI | — | Ubah 2 kunci (D6) |
| `.env.example` | Ya (CLAUDE.md §7) | — | — | — | — | Daftar nama variabel |
| `login-id.ts` | Ya (FR-AUTH-01), lokasi wajib CLAUDE.md §7 | `String.replace` + `toLowerCase` | — | — | **Ya**: satu fungsi satu baris | — |
| `spike-auth-domain.ts` | Ya (§17.1 wajib); dipertahankan untuk menguji ulang domain final sebelum M6 | `parseArgs`, `crypto.randomUUID`, `--env-file` | Admin API Supabase | `@supabase/supabase-js` | Tidak | ±50 baris, satu loop per domain, `finally` untuk pembersihan |
| `docs/spike/r-03-email-sintetis.md` | Ya, bukti keputusan ADR-03 | — | — | — | — | Tabel hasil per domain + kode galat ban + versi CLI/tanggal |

Tidak ada helper, abstraksi, atau dependency di luar daftar ini. Uji Vitest untuk `login-id.ts` ditunda ke change scaffold (Vitest belum ada). Sementara itu, skrip spike memverifikasinya secara nyata (`21.10.0456` → login `2110 0456`).

## Risks / Trade-offs

- [Node 22 di PATH menjalankan skrip, sehingga type stripping atau `--env-file` berperilaku lain] → tugas prasyarat: pastikan `node --version` = v24 sebelum mulai; `engines` memberi peringatan saat `npm install`.
- [Docker daemon mati] → tugas prasyarat: nyalakan Docker Desktop. Bila tetap tidak bisa, PRD §7.3 mengizinkan memakai `sip-dev` saja.
- [Nama kunci di keluaran `supabase status` berbeda antarversi CLI] → ambil publishable/secret key dari keluaran versi terpasang dan catat versinya di laporan.
- [Spike menyentuh `sip-dev`] → hanya membuat dan menghapus akun uji; aman karena PRD §7.3 mengizinkan aksi destruktif di `sip-dev`. Tidak ada perintah ke `sip-prod`.
- [Rate limit login cloud 30/5 menit] → spike hanya melakukan ±2 login per domain.
- [Normalisasi di `login-id.ts` belum dibandingkan dengan kolom SQL] → perbandingan dengan fixture bersama (Vitest + pgTAP) masuk ke change yang membuat `profiles`.

## Open Questions

- Domain kandidat yang diuji: domain bawaan Vercel `<proyek>.vercel.app` membutuhkan nama proyek Vercel, dan subdomain sekolah membutuhkan nama domain resmi sekolah. Daftar final ditentukan pengguna saat menjalankan spike.
- Bila hosted GoTrue ternyata memeriksa DNS/MX, sekolah perlu menambah record DNS. Ini berarti asumsi "cukup izin penamaan" gugur dan perlu dibahas ulang.
- Bila semua kandidat ditolak, ADR-03 ditinjau ulang sebagai Perubahan baseline PRD.
