## 1. Dependency & TypeScript

- [x] 1.1 Pasang dependency runtime dan dev dengan `--save-exact` sesuai design D1 (TS 6.0.x, Vitest 4.1.x, mayor lain mengikuti CLAUDE.md §2); NFR-MA-01
- [x] 1.2 Buat `tsconfig.json`, `tsconfig.app.json`, dan `tsconfig.node.json` sesuai D2, lalu pastikan `tsc -b` lulus untuk `login-id.ts` dan `scripts/spike-auth-domain.ts`; NFR-MA-01
- [x] 1.3 Tambah skrip npm sesuai CLAUDE.md §3 (`dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `db:types`, `db:test`) dan tambahkan `dist`, `test-results`, `playwright-report`, `coverage` ke `.gitignore`

## 2. Shell aplikasi

- [x] 2.1 Buat `index.html`, `vite.config.ts` (D3, urutan plugin CLAUDE.md §2), `src/main.tsx`, `src/router.tsx`, dan `src/vite-env.d.ts`; `npm run build` lulus; NFR-PE-03
- [x] 2.2 Jalankan `npx shadcn init` (token tema di `src/index.css`, `components.json`, `src/lib/utils.ts`) tanpa menambah komponen; D3
- [x] 2.3 Buat `src/lib/supabase.ts` (cek env D5 + `unwrap`) dan `src/lib/query-client.ts` (nilai bawaan NFR-PE-04), serta tes Vitest untuk `unwrap` dan nilai bawaan retry; skenario "Mutasi gagal tidak dikirim ulang", "Query gagal dicoba ulang sekali"
- [x] 2.4 Buat `src/routes/__root.tsx` (context D4, banner offline D7) dan `src/routes/index.tsx` (rute sementara), lalu pasang `RouteError` sebagai `defaultErrorComponent` (D6); NFR-RE-02
- [x] 2.5 Tes Vitest + Testing Library untuk banner offline (`onlineManager.setOnline`) dan `RouteError` (galat → "Coba lagi" → konten tampil); skenario NFR-RE-02

## 3. Tooling uji & lint

- [x] 3.1 Buat `eslint.config.js` (rekomendasi typescript-eslint bertipe, react-hooks, react-refresh, plugin TanStack Query & Router) dan pastikan `npm run lint` bersih; NFR-MA-01
- [x] 3.2 Pindahkan skenario spec `auth` "Normalisasi nomor induk" dan "Email sintetis" ke `src/features/auth/login-id.test.ts`; TC-AUTH-03
- [x] 3.3 Buat `playwright.config.ts` (D9, 5 proyek) dan `e2e/smoke.spec.ts`, jalankan `npx playwright install`, lalu pastikan `npm run test:e2e` lulus di kelima proyek; NFR-PO-01
- [x] 3.4 Buat `supabase/tests/database/00-smoke.test.sql` (D11) dan pastikan `npm run db:test` lulus; NFR-MA-01

## 4. CI & pengukuran

- [x] 4.1 Buat `.github/workflows/ci.yml` sesuai D10, lalu jalankan urutan langkahnya secara lokal (`npm ci` → `typecheck` → `lint` → `test` → `build` → `supabase db start` + `supabase test db`); skenario "Gerbang kualitas CI"
- [x] 4.2 Pastikan `ci.yml` tidak memakai secret, `supabase link`, atau `sip-prod`; skenario "CI tidak memakai rahasia produksi"
- [x] 4.3 Ukur JS awal gzip rute `/` dari keluaran `vite build` (D8), lalu catat di `docs/testing/performance.md` bagian "Anggaran JS awal"; NFR-PE-03

## 5. Dokumen

- [x] 5.1 Perbarui baris M0 di PRD §18 dan tambah baris `1.0.1` di Lampiran D sesuai D12 (Perubahan baseline PRD, rencana)
- [x] 5.2 Tambah `platform` ke daftar capability di `openspec/config.yaml` (D13)

## 6. Penutup

- [x] 6.1 Jalankan /ponytail-review pada diff change ini dan terapkan temuan yang tidak melanggar PRD/CLAUDE.md
- [x] 6.2 Penuhi Definition of Done CLAUDE.md §13 — catatan: tanpa FR selesai di change ini, jadi TC black-box N/A; migrasi N/A (pgTAP asap lulus)
