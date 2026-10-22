## Why

Repo sudah memiliki Supabase lokal dan spike login (R-03), tetapi belum ada frontend maupun tooling. Akibatnya, perintah Definition of Done (`typecheck`, `lint`, `test`, `build`) belum dapat dijalankan, dan tes Vitest untuk `login-id.ts` masih tertunda. Semua fitur M1–M4 membutuhkan kerangka aplikasi dan gerbang CI ini terlebih dahulu.

Milestone: **M0** (sebagian). Cakupannya scaffold frontend dan CI. Vercel dan `sip-prod` dikerjakan di change terpisah.

## What Changes

- Scaffold SPA sesuai stack CLAUDE.md §2: Vite 8, React 19, TypeScript 6 `strict`, Tailwind v4, inisialisasi shadcn/ui, TanStack Router (file-based, `autoCodeSplitting`), TanStack Query, dan `@supabase/supabase-js`.
- Shell aplikasi:
  - `src/lib/supabase.ts` (klien + `unwrap()`);
  - `src/lib/query-client.ts` dengan nilai bawaan NFR-PE-04;
  - context router `{ queryClient, auth }`;
  - rute root dengan *error boundary* dan banner "Koneksi terputus" (NFR-RE-02);
  - satu halaman sementara di `/`.
- Tooling:
  - `tsconfig` tanpa `baseUrl`, dengan alias `@/` dan dukungan skrip `.ts` Node (design D2 change spike);
  - ESLint flat config;
  - Vitest 4 + Testing Library, termasuk tes `login-id.ts` (TC-AUTH-03);
  - Playwright dengan 5 proyek (NFR-PO-01) dan satu tes asap;
  - pgTAP tes asap agar `supabase test db` berjalan;
  - skrip npm sesuai CLAUDE.md §3.
- `.github/workflows/ci.yml` (PRD §17.3): `npm ci` → `typecheck` → `lint` → `test` → `build` → `supabase start` + `supabase test db`.
- **Perubahan baseline PRD (rencana, bukan perilaku)**, disetujui pengguna pada 22 Okt 2026:
  - teks M0 di §18 diubah menjadi "desain skema final (§11)";
  - migrasi dibangun per milestone M1–M4;
  - baris baru ditambahkan di Lampiran D.
- Capability `platform` ditambahkan ke daftar capability di `openspec/config.yaml`.

## Di luar cakupan

- Vercel (`vercel.json`, env Preview/Production, header §13.7), `e2e.yml` (butuh URL preview), dan `backup.yml` (menyasar `sip-prod`).
- Migrasi SQL, RLS, dan guard rute `_app`/`pustakawan`, karena membutuhkan `profiles` (M1).
- Halaman login, `src/lib/errors.ts`, `format.ts`, `labels.ts`, dan komponen shadcn selain yang dibutuhkan shell. Semuanya ditambahkan saat dipakai.
- Remote GitHub dibuat manual oleh pengguna. Tanpa remote, CI hanya diverifikasi secara lokal.

## Capabilities

### New Capabilities
- `platform`: perilaku lintas modul yang tidak dimiliki satu fitur, yaitu *error boundary* dan banner offline (NFR-RE-02), nilai bawaan QueryClient (NFR-PE-04), anggaran JS awal (NFR-PE-03), dukungan browser (NFR-PO-01), dan gerbang CI (PRD §17.3).

### Modified Capabilities
_(tidak ada; requirement `auth` tidak berubah, change ini hanya menambah bukti Vitest untuk TC-AUTH-03)_

## Impact

- Berkas baru:
  - `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `vitest`/`playwright` config, `components.json`;
  - `src/` (main, router, routes, lib, `index.css`), `e2e/`, `supabase/tests/database/`, `.github/workflows/ci.yml`.
- Berkas diubah: `package.json`/lockfile, `.gitignore` (dist, laporan tes), `docs/PRD.md` (§18 + Lampiran D), `openspec/config.yaml`.
- Dependency runtime: React, TanStack Router/Query, Tailwind, dan utilitas shadcn (`clsx`, `tailwind-merge`, `class-variance-authority`), semuanya sesuai stack. Ukurannya diukur terhadap NFR-PE-03 saat build.
- Dokumen skripsi: tidak ada dampak baru di Lampiran C. Narasi Waterfall BAB III cukup merujuk §18 yang diperbarui.
