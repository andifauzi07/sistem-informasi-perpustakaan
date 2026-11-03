SIP SMKN 1 Selayar

Aturan wajib untuk Ai Agents saat mengembangkan aplikasi ini. Spesifikasi lengkap ada di docs/PRD.md. Sebelum mengerjakan sebuah fitur, baca bagian PRD yang relevan:

Bagian PRD	Isi
§8	Kebutuhan fungsional (FR)
§9	Aturan bisnis (BR)
§11	Model data
§12	RPC dan Edge Function
§13	Keamanan
§14	Kebutuhan non-fungsional (NFR)
§15	UI dan rute
§16	Pengujian
Berkomunikasilah dengan pengguna dalam Bahasa Indonesia.

1. Konteks proyek
Produk: Sistem Informasi Perpustakaan berbasis web untuk SMKN 1 Selayar. Produk ini adalah keluaran penelitian skripsi R&D (model Waterfall) yang diuji dengan ISO/IEC 25010 pada empat karakteristik: Functional Suitability, Usability, Performance Efficiency, dan Portability.

Aktor: Siswa, Guru, dan Pustakawan. Pustakawan merangkap admin; tidak ada peran lain.

Masalah yang diselesaikan:

Masalah	Solusi di sistem
Pencatatan di buku besar	Basis data terpusat
Tidak ada katalog daring	Katalog dengan ketersediaan real-time
Antrean saat jam sibuk	Pengajuan pinjam online + verifikasi pustakawan
Laporan manual yang lambat	Laporan otomatis + ekspor
Internet terbatas di wilayah kepulauan	Aplikasi ringan
PRD v1.0 adalah baseline requirement. Jangan menambah atau mengurangi cakupan tanpa persetujuan pengguna. Setiap perubahan perilaku dicatat di PRD Lampiran D (Changelog).

Fitur yang sengaja tidak dibuat di v1 (PRD §5.2): berita perpustakaan, notifikasi/pengingat, daftar tunggu saat stok habis, perpanjangan pinjaman, katalog publik tanpa login, PWA/offline, pembayaran online, dan peran tambahan.

2. Tech stack (terkunci)
Jangan mengganti, menambah framework, atau mengganti library utama tanpa persetujuan.

Lapisan	Teknologi
Bahasa	TypeScript ≥ 6, strict
Build	Vite 8 + @vitejs/plugin-react
UI	React 19, Tailwind CSS v4 (@tailwindcss/vite), shadcn/ui, lucide-react, sonner
Routing	TanStack Router v1, file-based, autoCodeSplitting: true; plugin tanstackRouter() dipasang sebelum react()
Server state	TanStack Query v5 + @supabase/supabase-js v2
Form	React Hook Form + Zod v4 (zodResolver)
Tabel	TanStack Table v8
Tanggal	date-fns + @date-fns/tz (zona Asia/Makassar)
Barcode/QR, PDF, Excel	bwip-js, barcode-detector (polyfill zxing-wasm), @react-pdf/renderer, read-excel-file, write-excel-file — wajib lazy-load
Backend	Supabase: PostgreSQL + RLS, Auth, Storage, RPC PL/pgSQL, Edge Functions (Deno + @supabase/server), pg_cron, pg_trgm
Tes	Vitest 4 + Testing Library, Playwright, pgTAP (supabase test db)
Hosting	Vercel (SPA statis) + Supabase Cloud region Singapore
Runtime: Node.js 24 LTS (minimal 22.12), npm. Supabase lokal membutuhkan Docker.

Catatan konfigurasi:

Alias @/ didefinisikan lewat paths di tsconfig (tanpa baseUrl, yang dideprekasi di TS 6) dan resolve.tsconfigPaths: true di Vite.
Versi pasti dikunci di package.json. Selalu cek berkas itu, jangan berasumsi.
3. Perintah
npm run dev                 # Vite dev server
npm run build               # tsc -b && vite build
npm run typecheck           # tsc -b
npm run lint                # eslint .
npm run test                # vitest run
npm run test:e2e            # playwright test (chromium, firefox, webkit, Pixel 7, iPhone 14)

npx supabase start          # stack Supabase lokal (Docker)
npx supabase migration new <nama_snake_case>
npx supabase db reset       # terapkan ulang migrasi + seed — HANYA LOKAL
npm run db:types            # supabase gen types typescript --local > src/types/database.types.ts
npm run db:test             # supabase test db (pgTAP)
npx supabase functions serve admin-members --env-file supabase/functions/.env

Siklus wajib setelah mengubah SQL: db reset → db:types → typecheck → db:test.

Sebelum menyatakan pekerjaan selesai: typecheck + lint + test + build harus lulus.

4. Struktur proyek
docs/PRD.md                        # sumber kebenaran requirement
docs/testing/black-box.md          # katalog TC-* (bahan BAB IV)
docs/testing/performance.md        # hasil Lighthouse
supabase/config.toml
supabase/migrations/               # SQL berurutan; JANGAN ubah yang sudah ter-commit
supabase/seed.sql                  # data fiktif untuk lokal
supabase/tests/database/*.test.sql # pgTAP
supabase/functions/admin-members/  # Edge Function (Deno)
scripts/bootstrap-librarian.ts     # dijalankan manual oleh pengembang
src/routes/                        # TanStack Router; routeTree.gen.ts dibuat otomatis
src/features/<domain>/
  api/                             # keys.ts, queries.ts (queryOptions), mutations.ts
  components/
  schemas.ts                       # skema Zod
  utils.ts
src/components/ui/                 # shadcn/ui (via CLI)
src/components/                    # komponen bersama (layout, DataTable, CodeInput, CameraScanner, …)
src/lib/                           # supabase.ts, query-client.ts, errors.ts, format.ts, labels.ts
src/types/database.types.ts        # hasil generate — JANGAN edit
e2e/                               # Playwright; nama tes diawali ID TC

Domain fitur di src/features/: auth, members, cards, catalog, collection, circulation, fines, materials, dashboard, reports, settings, activity-log.

5. Bahasa & penamaan
Hal	Bahasa / gaya
Tabel, kolom, enum	Inggris, snake_case
Fungsi SQL	Inggris
Variabel/fungsi TS	Inggris, camelCase
Komponen	Inggris, PascalCase
Nama berkas	kebab-case
Teks UI, pesan galat, label	Bahasa Indonesia
Path URL	Bahasa Indonesia (/katalog, /pustakawan/sirkulasi)
Komentar kode	Bahasa Indonesia, singkat, hanya untuk menjelaskan mengapa
Padanan istilah UI dan nama teknis wajib mengikuti PRD Lampiran A. Contoh:

Istilah UI	Nama teknis
Eksemplar	copy
Pengajuan	loan request
Peminjaman	loan
Denda	fine
Bahan ajar	teaching material
Nomor induk	member_code
Label enum untuk UI hanya didefinisikan di src/lib/labels.ts, bukan string yang tersebar di komponen.

6. Database & Supabase
Semua perubahan skema dilakukan lewat migrasi baru. Jangan mengedit migrasi lama dan jangan mengubah skema dari Dashboard.
RLS aktif pada setiap tabel public, dengan kebijakan per operasi dan tes pgTAP. Defaultnya menolak. Jangan pernah memakai using (true) atau with check (true) untuk INSERT/UPDATE/DELETE. Matriks lengkapnya ada di PRD §13.3.
Di kebijakan, tulis (select auth.uid()) dan (select private.is_librarian()) dalam bentuk select agar ter-cache. Schema private tidak diekspos ke API.
Transisi status hanya lewat RPC (PRD §12.2). Ini berlaku untuk loan_requests, loans, fines, dan kolom book_copies.status. Klien tidak pernah melakukan INSERT/UPDATE langsung ke tabel-tabel itu.
Semua fungsi memakai set search_path = '' dan nama berkualifikasi (public.loans, extensions.similarity).
Fungsi yang menulis memakai SECURITY DEFINER, memeriksa auth.uid() dan peran di baris pertama, lalu menjalankan revoke execute … from public, anon dan grant execute … to authenticated.
Fungsi baca (pencarian, beranda, laporan) memakai SECURITY INVOKER.
View wajib memakai with (security_invoker = true).
Alokasi atau perubahan eksemplar memakai select … for update (skip locked saat memilih eksemplar tersedia) agar tidak terjadi double booking.
Galat bisnis ditulis sebagai raise exception 'KODE' using errcode = 'P0001', detail = '…'.
Kode hanya boleh dari PRD §12.4.
Kode baru wajib ditambahkan ke PRD §12.4 dan src/lib/errors.ts.
Waktu dan uang:
simpan waktu sebagai timestamptz (UTC);
tanggal bisnis memakai private.today_wita() (zona Asia/Makassar), dan due_date bertipe date;
uang disimpan sebagai integer rupiah.
Ekstensi berada di schema extensions (indeks trigram memakai extensions.gin_trgm_ops). pg_cron hanya untuk private.expire_overdue_pickups().
Bucket Storage (covers, materials, library-assets) dan kebijakannya dibuat lewat migrasi, lengkap dengan file_size_limit dan allowed_mime_types.
seed.sql dan data uji hanya fiktif. Jangan pernah memasukkan data siswa asli ke repo.
Setelah migrasi, regenerate tipe dan gunakan Tables<'books'>, Database['public']['Functions']… di TS.
7. Autentikasi, akun & kunci
Login memakai nomor induk (NIS/NIP) + password, dengan langkah berikut:

Klien menormalkan input dengan urutan yang sama seperti SQL: loginId = input.replace(/[^A-Za-z0-9]/g, '').toLowerCase().
Klien memanggil signInWithPassword({ email: \
l
o
g
i
n
I
d
@
loginId@{VITE_AUTH_EMAIL_DOMAIN}`, password })`.
Normalisasi login_id harus identik di tiga tempat: src/features/auth/login-id.ts, Edge Function, dan kolom generated profiles.login_id.

Registrasi publik mati. Akun dibuat, diimpor, di-reset, dan dinonaktifkan hanya lewat Edge Function admin-members, dengan alur:

bungkus handler dengan withSupabase({ auth: 'user' });
pastikan pemanggil adalah pustakawan aktif;
validasi payload dengan Zod;
jalankan aksi dengan ctx.supabaseAdmin;
tulis log aktivitas.
Saat membuat akun, selalu pakai email_confirm: true.

profiles.must_change_password = true → router memaksa pengguna ke /ganti-password. Setelah auth.updateUser berhasil, panggil RPC complete_password_change().

Tidak ada alur email apa pun (konfirmasi maupun lupa password).

Kunci & environment:

Kunci	Lokasi
VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (sb_publishable_…), VITE_AUTH_EMAIL_DOMAIN	Frontend
Secret key (sb_secret_…)	Hanya Edge Function (SUPABASE_SECRET_KEYS) dan skrip lokal (SUPABASE_SECRET_KEY di .env.local)
Variabel berprefix VITE_ masuk ke bundle publik — jangan pernah menaruh rahasia di sana.
Jangan memakai kunci legacy anon/service_role (dideprekasi akhir 2026).
.env* tidak di-commit; pelihara .env.example.
8. Pola frontend
Komponen tidak memanggil supabase langsung. Semua akses data lewat src/features/<domain>/api/:

query key factory (bookKeys.all, .lists(), .list(filters), .detail(id));
queryOptions(...);
hook mutation.
Helper unwrap() di src/lib/supabase.ts melempar error Supabase. UI menampilkannya lewat toast.error(toUserMessage(err)) dari src/lib/errors.ts.

Rute:

loader memanggil queryClient.ensureQueryData(...) untuk data utama;
komponen memakai opsi query yang sama (useSuspenseQuery/useQuery);
context router berisi { queryClient, auth }.
Guard:

layout src/routes/_app.tsx: beforeLoad mensyaratkan sesi + profil aktif dan menangani must_change_password;
src/routes/_app/pustakawan/route.tsx: beforeLoad mensyaratkan peran librarian.
Guard UI hanya untuk navigasi; otorisasi sebenarnya ada di RLS/RPC.

Pencarian, filter, dan halaman disimpan di URL search params lewat validateSearch (skema Zod dengan .catch()/.default()).

Default QueryClient: staleTime: 30_000, query retry: 1, mutation retry: 0. Data referensi (kategori, jurusan, kebijakan) memakai staleTime: 5 * 60_000.

Antrean pustakawan (pengajuan, pengembalian) memakai refetchInterval: 30_000.
Supabase Realtime tidak dipakai.
Invalidasi wajib setelah mutasi sirkulasi atau denda: catalog, books, copies, loan-requests, loans, fines, dashboard. Tombol aksi dinonaktifkan saat mutasi pending.

Form memakai React Hook Form + zodResolver. Skema di features/<domain>/schemas.ts harus konsisten dengan constraint DB (PRD §11.4).

Library berat (PDF, bwip-js, barcode-detector, Excel) hanya dimuat lewat await import(...) di halaman/aksi pustakawan. Jangan meng-import-nya di modul yang dipakai rute anggota.

Scanner:

CodeInput selalu autofocus dan memproses saat Enter (scanner USB keyboard wedge);
CameraScanner (lazy) memakai barcode-detector dengan format qr_code + code_128;
berkas .wasm disajikan dari aset aplikasi sendiri, bukan dari CDN pihak ketiga;
kamera hanya berfungsi di HTTPS/localhost.
Tampilkan banner offline lewat onlineManager TanStack Query.

9. UI/UX
Komponen shadcn/ui ditambahkan lewat CLI ke src/components/ui. Kustomisasi dilakukan lewat token tema Tailwind v4 di src/index.css, bukan mengedit komponen satu per satu.
Mobile-first untuk rute anggota: wajib rapi di lebar 360 px dan tanpa scroll horizontal. Tabel di HP ditampilkan sebagai kartu.
Setiap layar data memiliki state loading (skeleton), kosong, dan galat (dengan tombol coba lagi).
Aksesibilitas:
setiap input punya label;
kontras memenuhi AA;
fokus terlihat;
target sentuh ≥ 44 px;
status tidak hanya dibedakan dengan warna (selalu ada teks).
Aksi irreversible (tolak, tandai hilang, bebaskan denda, nonaktifkan akun, hapus) memakai dialog konfirmasi.
Format hanya lewat src/lib/format.ts (formatRupiah, formatDate, formatDateTime; locale id-ID, zona Asia/Makassar). Jangan memformat tanggal atau uang secara manual.
Anggaran performa (NFR-PE):
JS awal rute login/katalog ≤ 250 KB gzip;
sampul WebP ≤ 60 KB dengan loading="lazy" + width/height;
daftar dipaginasi 20 baris.
Mockup proposal disesuaikan sesuai PRD §15.4: field login "NIS / NIP" (bukan Email), dan kartu aksi dashboard mockup menjadi beranda pustakawan.
10. Aturan bisnis yang tidak boleh dilanggar
Ringkasan; detail lengkap ada di PRD §9.

Batas pinjam: pinjaman active + pengajuan pending/approved ≤ max_active_loans per peran (BR-02).
Satu judul per anggota: maksimal satu pengajuan terbuka atau pinjaman aktif untuk judul yang sama (BR-03).
Tanpa daftar tunggu: stok 0 → pengajuan ditolak dengan NO_AVAILABLE_COPY (BR-04).
Persetujuan mengalokasikan tepat 1 eksemplar dan menetapkan batas ambil (23:59:59 WITA). Bila lewat batas, status menjadi expired lewat job per jam (BR-05, BR-06).
Checkout: due_date = hari ini (WITA) + loan_days, dan daily_fine_snapshot disalin dari kebijakan (tidak berlaku surut). Bila anggota punya pengajuan approved untuk judul yang sama, pengajuan itu otomatis menjadi fulfilled (BR-07, BR-08).
Pengembalian sah hanya lewat check-in oleh pustakawan. "Ajukan Pengembalian" oleh anggota hanya penanda (BR-09).
Denda telat = hari kalender terlambat × daily_fine_snapshot.
Denda tidak memblokir peminjaman, tetapi wajib tampil sebagai peringatan (BR-10 s.d. BR-12).
Pembayaran tunai lunas penuh.
Pembebasan denda wajib disertai alasan (BR-13).
Nomor induk dan peran tidak dapat diubah setelah akun dibuat (BR-15).
Frontend boleh menghitung estimasi untuk tampilan, tetapi nilai yang disimpan selalu dihitung di DB.
11. Pengujian (bukti untuk BAB IV & ISO 25010)
pgTAP: setiap kebijakan RLS dan setiap RPC sirkulasi/denda diuji untuk skenario sukses dan setiap kode galatnya. Wajib ada uji bahwa anggota A tidak dapat membaca data anggota B dan tidak dapat memanggil RPC pustakawan.
Vitest: util murni (normalisasi login_id, format, pemetaan galat, skema Zod).
Playwright: alur kritis sesuai katalog TC (PRD §16.2).
Nama tes diawali ID TC, mis. test('TC-CIR-07 checkout dari pengajuan', …).
Proyek: chromium, firefox, webkit, Pixel 7, iPhone 14 (bukti Portability).
Setiap FR yang selesai wajib memiliki ≥ 1 TC di docs/testing/black-box.md, dengan kolom: ID, FR, prasyarat, langkah, data uji, hasil diharapkan, hasil aktual, status.
Performa: Lighthouse (DevTools, mobile & desktop) untuk halaman login, beranda, katalog, detail buku, dan sirkulasi. Ambil median 3 kali pengukuran dan catat di docs/testing/performance.md.
12. Alur kerja
Sebelum mulai: baca FR/BR terkait. Bila PRD ambigu atau bertentangan dengan permintaan, tanyakan — jangan menebak.
Urutan milestone (PRD §18): M0 setup + spike login email sintetis → M1 Auth & anggota → M2 Koleksi & katalog → M3 Sirkulasi & denda → M4 Bahan ajar, kartu, beranda, laporan → M5 Pengujian.
Buat perubahan kecil dan mudah di-review. Selesaikan backend (migrasi + RLS + RPC + pgTAP) sebelum UI untuk fitur yang sama.
Commit mengikuti Conventional Commits (feat(sirkulasi): …, fix(rls): …, test(denda): …, docs(prd): …). Kerjakan di branch fitur, lalu PR ke main (main = produksi, auto-deploy Vercel).
Dependency baru hanya boleh ditambahkan setelah menjelaskan alasan dan dampaknya pada ukuran bundle. Utamakan library yang sudah ada di stack.
13. Definition of Done
[ ] Memenuhi kriteria penerimaan FR terkait (PRD §8) dan BR yang relevan
[ ] Migrasi + RLS + pgTAP lulus; tipe DB di-regenerate
[ ] typecheck, lint, test, dan build lulus
[ ] TC black-box ditambah/diperbarui; E2E untuk alur kritis
[ ] State loading/kosong/galat ada; dicek di lebar 360 px dan desktop
[ ] Tidak ada rahasia di klien dan tidak ada error di console
[ ] PRD Lampiran D diperbarui bila perilaku berubah
14. Larangan
Jangan menonaktifkan RLS, membuat kebijakan permisif, atau memakai secret key di frontend.
Jangan menjalankan perintah apa pun ke project produksi tanpa instruksi eksplisit dari pengguna. Ini termasuk supabase db push, supabase db reset --linked, supabase functions deploy, dan supabase secrets set.
Jangan mengedit src/routeTree.gen.ts, src/types/database.types.ts, atau migrasi yang sudah di-commit.
Jangan memakai any, @ts-ignore, atau menonaktifkan aturan lint. Bila benar-benar perlu, gunakan @ts-expect-error dengan alasan tertulis.
Jangan membangun fitur di luar cakupan PRD v1 tanpa persetujuan.
Jangan menyimpan data pribadi melebihi PRD §13.6 (prinsip minimisasi, UU PDP).
Jangan menyimpan password sementara di DB, log, atau berkas. Password sementara hanya ditampilkan sekali.