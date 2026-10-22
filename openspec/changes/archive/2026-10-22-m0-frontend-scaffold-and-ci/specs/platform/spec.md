## ADDED Requirements

### Requirement: Error boundary per rute
Setiap rute SHALL dibungkus *error boundary*. Galat render atau galat loader ditampilkan sebagai pesan galat berbahasa Indonesia dengan tombol "Coba lagi", dan galat itu tidak menjatuhkan seluruh aplikasi (NFR-RE-02).

#### Scenario: Galat di satu rute tidak membuat layar kosong
- **WHEN** komponen atau loader sebuah rute melempar galat
- **THEN** area rute menampilkan pesan galat dan tombol "Coba lagi", dan bagian aplikasi di luar rute itu tetap tampil

#### Scenario: Coba lagi memuat ulang rute
- **WHEN** pengguna menekan "Coba lagi" setelah penyebab galat hilang
- **THEN** rute dimuat ulang dan kontennya tampil normal

### Requirement: Banner koneksi terputus
Aplikasi SHALL menampilkan banner berteks "Koneksi terputus" selama browser offline, berdasarkan status `onlineManager` TanStack Query. Banner hilang saat koneksi pulih (NFR-RE-02, R-04).

#### Scenario: Browser offline
- **WHEN** koneksi jaringan browser terputus
- **THEN** banner "Koneksi terputus" muncul dengan teks, bukan hanya warna, dan diumumkan ke pembaca layar

#### Scenario: Koneksi pulih
- **WHEN** koneksi kembali online
- **THEN** banner hilang tanpa perlu memuat ulang halaman

### Requirement: Nilai bawaan cache server-state
QueryClient SHALL memakai `staleTime` 30 detik, `retry` 1 untuk query, dan `retry` 0 untuk mutation. Tidak ada *polling* bawaan (NFR-PE-04, CLAUDE.md §8).

#### Scenario: Mutasi gagal tidak dikirim ulang
- **WHEN** sebuah mutation gagal karena galat jaringan atau server
- **THEN** mutation tidak dicoba ulang otomatis, sehingga aksi tidak terkirim ganda (NFR-RE-02)

#### Scenario: Query gagal dicoba ulang sekali
- **WHEN** sebuah query gagal
- **THEN** query dicoba ulang tepat satu kali sebelum galatnya ditampilkan

### Requirement: Anggaran JS awal
JS awal (gzip) untuk rute anggota SHALL ≤ 250 KB. Library berat (PDF, barcode, scanner, Excel) tidak boleh masuk ke bundle awal (NFR-PE-03).

#### Scenario: Build produksi dalam anggaran
- **WHEN** `npm run build` dijalankan
- **THEN** total JS gzip yang dimuat oleh `index.html` untuk rute `/` ≤ 250 KB, dan hasil ukurnya dicatat

### Requirement: Dukungan browser lintas platform
Aplikasi SHALL dapat dimuat tanpa galat console di Chromium, Firefox, WebKit, Pixel 7, dan iPhone 14, serta tanpa *scroll* horizontal pada lebar 360 px (NFR-PO-01).

#### Scenario: Tes asap lintas browser
- **WHEN** `npm run test:e2e` dijalankan terhadap dev server lokal
- **THEN** halaman `/` termuat di kelima proyek Playwright tanpa galat console

#### Scenario: Lebar 360 px tanpa scroll horizontal
- **WHEN** halaman `/` dibuka pada viewport selebar 360 px
- **THEN** lebar dokumen tidak melebihi lebar viewport

### Requirement: Gerbang kualitas CI
Setiap *pull request* dan *push* ke `main` SHALL menjalankan `typecheck`, `lint`, `test`, `build`, dan `supabase test db`. Kegagalan salah satu langkah menandai CI gagal (PRD §17.3, NFR-MA-01).

#### Scenario: Semua langkah lulus
- **WHEN** CI berjalan pada commit yang memenuhi semua pemeriksaan
- **THEN** workflow `ci.yml` selesai dengan status sukses

#### Scenario: Pelanggaran tipe atau lint menggagalkan CI
- **WHEN** commit berisi galat TypeScript `strict` atau pelanggaran ESLint
- **THEN** workflow `ci.yml` gagal pada langkah yang bersangkutan, dan langkah sesudahnya tidak dianggap lulus

#### Scenario: CI tidak memakai rahasia produksi
- **WHEN** workflow `ci.yml` diperiksa
- **THEN** workflow hanya memakai Supabase lokal (`supabase start`), tanpa secret key, tanpa `supabase link`, dan tanpa perintah ke `sip-prod`
