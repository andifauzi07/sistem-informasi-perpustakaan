## Context

Kondisi repo setelah change spike (sudah diarsipkan):
- `package.json` hanya berisi `supabase` CLI dan `@supabase/supabase-js`;
- ada `src/features/auth/login-id.ts`, `scripts/spike-auth-domain.ts` (dijalankan langsung oleh Node 24 dengan *type stripping*), dan `supabase/config.toml`;
- belum ada tsconfig, frontend, maupun remote GitHub.

Stack dan pola frontend sudah ditetapkan di CLAUDE.md §2, §8, §9 serta PRD §7.2. Dokumen ini hanya mencatat keputusan yang belum diatur di sana.

## Goals / Non-Goals

**Goals:**
- `npm run typecheck`, `lint`, `test`, `build`, `test:e2e`, dan `db:test` semuanya berjalan dan lulus.
- Shell aplikasi memenuhi NFR-RE-02 dan NFR-PE-04, dan JS awalnya terukur terhadap NFR-PE-03.
- `ci.yml` siap dipakai begitu remote GitHub ada.
- PRD §18 dan Lampiran D mencatat bahwa migrasi dicicil per milestone.

**Non-Goals:**
- Vercel, `e2e.yml`, `backup.yml`, halaman login, guard rute, dan migrasi (lihat proposal).

## Decisions

**D1. Versi mayor yang dipilih karena kompatibilitas, bukan versi terbaru.**
- Per 22 Okt 2026, npm `latest` sudah TypeScript 7.0 dan Vitest 5.
- Pilihan kita:
  - **TypeScript 6.0.x**: peer `typescript-eslint` 8.x adalah `<6.1.0`, dan CLAUDE.md mensyaratkan ≥ 6;
  - **Vitest 4.1.x**: stack terkunci di Vitest 4.
- Paket lain memakai versi terbaru pada mayor yang tercantum di CLAUDE.md §2 (Vite 8, React 19, Router v1, Query v5, Tailwind 4, Zod 4).
- Semua versi dipasang dengan `--save-exact` (ADR-08 change spike).
- *Alternatif ditolak:* TS 7 (native). ESLint bertipe belum mendukungnya, sehingga upgrade ini ditunda ke change tersendiri.

**D2. Dua proyek TypeScript lewat *project references*.**
- `tsconfig.json` hanya berisi `references`. Proyeknya:
  - `tsconfig.app.json`: `src/`, lib DOM;
  - `tsconfig.node.json`: `vite.config.ts`, `playwright.config.ts`, `e2e/`, `scripts/`, tipe Node.
- Kedua proyek memakai `strict`, `noEmit`, `erasableSyntaxOnly`, `allowImportingTsExtensions`, dan `verbatimModuleSyntax`, ditambah `paths` `@/*` tanpa `baseUrl`.
- Pengaturan ini menjaga skrip `.ts` tetap bisa dijalankan Node secara langsung (D2 change spike), dan `src/` tidak bisa memakai API Node.
- `npm run typecheck` = `tsc -b`.

**D3. Scaffold ditulis tangan, bukan dari template generator.** `create-vite`/`create-tsrouter-app` membawa contoh, demo, dan konfigurasi yang harus dihapus lagi. Berkas yang dibutuhkan sedikit, jadi ditulis langsung. Pengecualian: shadcn/ui wajib diinisialisasi dengan `npx shadcn init` (CLAUDE.md §9), yang menghasilkan `components.json`, token tema di `src/index.css`, dan `src/lib/utils.ts`. Tidak ada komponen shadcn yang ditambahkan di change ini.

**D4. `auth` di context router = `supabase.auth`.** CLAUDE.md §8 mewajibkan context `{ queryClient, auth }`. Karena `profiles` baru ada di M1, `auth` diisi langsung dengan klien `supabase.auth` tanpa wrapper. Guard M1 memanggil `context.auth.getSession()`. Tipe context ditulis di `__root.tsx` lewat `createRootRouteWithContext`.

**D5. Env frontend divalidasi saat modul dimuat.** `src/lib/supabase.ts` melempar galat berbahasa Indonesia bila `VITE_SUPABASE_URL` atau `VITE_SUPABASE_PUBLISHABLE_KEY` kosong. Tipe env dideklarasikan di `src/vite-env.d.ts`. CI menjalankan `build` tanpa env; itu aman karena pemeriksaan baru terjadi saat runtime di browser.

**D6. Error boundary per rute memakai `defaultErrorComponent` router.** Satu komponen `RouteError` dipasang sebagai bawaan router, sehingga berlaku untuk setiap rute. Tombol "Coba lagi" memanggil `reset()` lalu `router.invalidate()`. *Alternatif ditolak:* `react-error-boundary`, karena router sudah menyediakan fungsinya.

**D7. Banner offline langsung memakai `onlineManager`.** Komponen membaca status lewat `useSyncExternalStore(onlineManager.subscribe, () => onlineManager.isOnline())` dan merender `role="status"` berteks "Koneksi terputus" di `__root.tsx`. Tanpa hook atau provider tambahan.

**D8. Anggaran bundle diukur dari keluaran `vite build`.**
- Ukuran gzip *entry chunk* ditambah *chunk* yang di-*preload* `index.html` dijumlahkan, lalu dicatat di `docs/testing/performance.md` pada bagian "Anggaran JS awal".
- Belum ada pemeriksaan otomatis di CI, karena saat ini hanya ada satu rute sementara.
- `shortcut: pengukuran manual sekali per milestone; tambahkan cek otomatis di CI bila rute katalog mendekati 200 KB.`

**D9. Playwright menjalankan dev server sendiri.** `webServer: npm run dev`, `baseURL` `http://localhost:5173`, dan 5 proyek: `chromium`, `firefox`, `webkit`, `Pixel 7`, `iPhone 14`. Tes asap `e2e/smoke.spec.ts` memeriksa tiga hal: halaman `/` termuat, tidak ada event `console` bertipe `error`, dan `scrollWidth ≤ 360` pada viewport 360 px. Penamaan dengan prefix ID TC dimulai saat ada TC yang relevan. Tes asap ini belum memiliki ID TC.

**D10. CI hanya menyalakan Postgres.** `ci.yml` berjalan di `ubuntu-latest` dengan Node 24 dan `npm ci`, lalu menjalankan pemeriksaan sesuai §17.3. Untuk pgTAP, CI memakai `npx supabase db start` (bukan `supabase start` penuh) dilanjutkan `npx supabase test db`. `supabase test db` hanya butuh database, jadi CI lebih cepat dan tidak menarik image Auth/Storage/Studio. Tidak ada secret, `supabase link`, atau Playwright di CI (e2e menunggu URL preview Vercel).

**D11. Tes asap pgTAP.** `supabase/tests/database/00-smoke.test.sql` memeriksa `has_schema('public')` dan `has_extension('pgtap')`. Tujuannya membuktikan `db:test` bekerja sebelum migrasi M1 ada. Tes ini dihapus atau diganti saat tes RLS pertama ditulis.

**D12. Perubahan PRD.**
- §18 baris M0: "skema DB final + RLS" menjadi "desain skema final (§11) + RLS (§13.3); migrasi dibangun per milestone M1–M4".
- Lampiran D: tambah baris versi `1.0.1` tertanggal 22 Okt 2026.
- Isi §11 tidak berubah.

**D13. `platform` ditambahkan ke daftar capability di `openspec/config.yaml`**, sebagai pemilik NFR lintas modul. Nilai `context` lain tidak berubah.

## Ponytail

| Kode baru | (1) Perlu? | (2) Pustaka standar | (3) Native platform | (4) Dependency terpasang | (5) Satu baris? | (6) Kode minimum |
|---|---|---|---|---|---|---|
| `vite.config.ts` (+ blok `test`) | Ya | — | — | Vite, router-plugin, plugin-react, Tailwind, Vitest | — | Plugin `tanstackRouter()` sebelum `react()`; `resolve.tsconfigPaths: true`; `test` jsdom. Tanpa `vitest.config` terpisah |
| `tsconfig*.json` (3) | Ya (D2) | — | Project references TS | — | — | Opsi D2 saja |
| `eslint.config.js` | Ya (NFR-MA-01) | — | — | typescript-eslint, react-hooks, react-refresh, plugin query & router TanStack | — | Konfigurasi rekomendasi, tanpa aturan kustom |
| `src/main.tsx` + `src/router.tsx` | Ya | — | — | Router, Query | — | `createRouter` + `QueryClientProvider` + context D4 |
| `src/lib/supabase.ts` | Ya (CLAUDE.md §8) | — | — | supabase-js | `unwrap` satu fungsi pendek | Cek env D5 + `createClient` + `unwrap` |
| `src/lib/query-client.ts` | Ya (NFR-PE-04) | — | — | Query | — | Satu `new QueryClient` dengan nilai bawaan |
| `RouteError` | Ya (NFR-RE-02) | — | — | `defaultErrorComponent` router (D6) | — | Pesan + tombol "Coba lagi" |
| Banner offline | Ya (NFR-RE-02) | — | `navigator.onLine` via `onlineManager` | Query `onlineManager` (D7) | Hampir: satu `useSyncExternalStore` + satu elemen | Inline di `__root.tsx`, bukan berkas terpisah |
| `src/routes/index.tsx` | Ya, butuh satu rute untuk build/e2e | — | — | Router | — | Judul aplikasi saja, diganti di M1 |
| `login-id.test.ts` | Ya (TC-AUTH-03, ditunda dari spike) | — | — | Vitest | — | Skenario spec `auth` dalam `it.each` |
| `e2e/smoke.spec.ts` | Ya (NFR-PO-01) | — | — | Playwright | — | Satu tes (D9) |
| `00-smoke.test.sql` | Ya, agar `db:test` tidak kosong | — | pgTAP | Supabase CLI | — | `plan(2)` (D11) |
| `ci.yml` | Ya (§17.3) | — | GitHub Actions | `actions/checkout`, `actions/setup-node` | — | Satu job, langkah §17.3 (D10) |
| Pengukuran bundle | Ya (NFR-PE-03) | — | Keluaran `vite build` | — | — | Manual (D8), tanpa plugin analisis |

Tidak ada `errors.ts`, `format.ts`, `labels.ts`, komponen shadcn, atau `vercel.json`. Semuanya ditambahkan oleh change yang pertama kali memakainya.

## Risks / Trade-offs

- [Peer dependency antar versi terbaru tidak cocok, misalnya plugin TanStack dengan Vite 8 atau TS 6] → pasang lalu jalankan `typecheck` + `build` sedini mungkin. Bila gagal, turunkan ke patch atau minor yang cocok dan catat versinya. Mayor stack tidak diganti tanpa persetujuan.
- [`npx playwright install` mengunduh ±500 MB browser, termasuk WebKit di Windows] → dilakukan sekali di mesin lokal saja, karena CI tidak menjalankan e2e.
- [CI belum bisa dibuktikan berjalan karena belum ada remote] → langkah `ci.yml` dijalankan setara secara lokal. Bukti run GitHub Actions menyusul setelah remote dibuat pengguna.
- [Banner offline sulit diuji di jsdom] → diuji dengan Vitest memakai `onlineManager.setOnline(false)`, tanpa memalsukan `navigator`.
- [Ukuran bundle awal belum mewakili katalog] → angka M0 menjadi baseline. NFR-PE-03 diukur ulang saat rute katalog ada (M2).
