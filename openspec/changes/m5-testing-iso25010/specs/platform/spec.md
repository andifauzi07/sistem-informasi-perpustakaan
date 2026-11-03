## ADDED Requirements

### Requirement: Otomasi Pengujian Portability Lintas Peramban (NFR-PO-01, PRD §16.3)
Sistem SHALL menyediakan skrip pengujian E2E otomatis Playwright yang mengeksekusi alur kritis aplikasi pada 5 target browser dan perangkat (`chromium`, `firefox`, `webkit`, `Pixel 7`, `iPhone 14`) tanpa galat konsol maupun kerusakan tata letak tampilan.

#### Scenario: Eksekusi tes E2E lintas 5 target
- **WHEN** perintah pengujian `npm run test:e2e` dijalankan
- **THEN** seluruh skenario uji kritis dieksekusi pada kelima target browser/device dan menghasilkan laporan kelulusan pengujian yang valid

---

### Requirement: Otomasi Pengukuran Performa Lighthouse (NFR-PE-01 s.d. NFR-PE-04, PRD §16.4)
Sistem SHALL menyediakan mekanisme pengukuran performa Lighthouse DevTools untuk 5 halaman kunci (Login, Beranda, Katalog, Detail Buku, Sirkulasi) dengan mengambil nilai median dari 3 kali pengukuran, serta memastikan ukuran awal JavaScript rute anggota tetap berada di bawah 250 KB gzip.

#### Scenario: Pengukuran performa median 3 kali
- **WHEN** audit Lighthouse dijalankan pada halaman kunci
- **THEN** nilai median dari 3 kali pengukuran tercatat rapi di `docs/testing/performance.md` dengan skor performa memenuhi standar

---

### Requirement: Kelengkapan Matriks Kasus Uji Black-Box (PRD §16.2, PRD §16.5)
Sistem SHALL menyediakan katalog pengujian black-box lengkap di `docs/testing/black-box.md` yang memetakan setiap kebutuhan fungsional (FR) ke dalam minimal satu ID kasus uji `TC-*` yang terstruktur (ID, FR terkait, prasyarat, langkah pengujian, data uji, hasil yang diharapkan, hasil aktual, dan status).

#### Scenario: Reviewer mengeksekusi pengujian black-box
- **WHEN** reviewer manusia membuka `docs/testing/black-box.md` untuk memvalidasi fungsionalitas
- **THEN** dokumen menyajikan seluruh skenario `TC-*` secara lengkap dan siap diisi hasil aktualnya untuk laporan skripsi
