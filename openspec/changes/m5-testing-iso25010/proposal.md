## Why

Sistem Informasi Perpustakaan SMKN 1 Selayar merupakan luaran penelitian skripsi R&D yang harus dibuktikan kualitasnya secara ilmiah melalui pengujian standar internasional **ISO/IEC 25010** (PRD §16). Change ini merealisasikan **Milestone M5** sebagai pondasi otomasi dan penyusunan instrumen pengujian bagi reviewer manusia untuk memverifikasi empat karakteristik: Functional Suitability, Usability, Performance Efficiency, dan Portability sebelum rilis produksi.

## What Changes

- **Otomasi Pengujian Portability (Playwright E2E)**:
  - Konfigurasi Playwright untuk eksekusi otomatis lintas 5 target peramban dan perangkat: `chromium`, `firefox`, `webkit`, `Pixel 7`, dan `iPhone 14` (NFR-PO-01).
  - Skrip pengujian alur kritis (login, penelusuran katalog, pengajuan, meja sirkulasi pinjam/kembali, dan denda).
- **Otomasi Pengujian Performance Efficiency (Lighthouse)**:
  - Skrip otomatisasi audit performa Lighthouse DevTools (median 3 kali pengukuran) pada 5 halaman kunci: Login, Beranda, Katalog, Detail Buku, dan Sirkulasi.
  - Template pencatatan bukti performa di `docs/testing/performance.md`.
- **Instrumen Pengujian Functional Suitability (Katalog Black-Box)**:
  - Finalisasi matriks kasus uji di `docs/testing/black-box.md` mencakup seluruh ID `TC-*` (Auth, Members, Cards, Catalog, Collection, Circulation, Fines, Materials, Dashboard, Reports, Settings, Activity-Log) dengan langkah, data uji, dan kriteria penerimaan yang siap dieksekusi oleh reviewer manusia.
- **Verifikasi Integritas Database (pgTAP)**:
  - Suite pengujian pgTAP lengkap di `supabase/tests/database/` yang memvalidasi seluruh fungsi RPC, isolasi RLS antar-peran, dan penanganan kode galat P0001.

## Cakupan PRD & Milestone

- **Milestone**: M5 — Pengujian & Validasi ISO/IEC 25010 (PRD §18).
- **Kebutuhan PRD Terkait**: PRD §14 (NFR-FS, NFR-US, NFR-PE, NFR-PO, NFR-SE, NFR-RE) dan PRD §16 (Pengujian).
- **Karakteristik ISO/IEC 25010**:
  1. *Functional Suitability*: 100% skenario TC-* terpetakan dan terverifikasi.
  2. *Usability*: Aksesibilitas keyboard, kontras AA, target sentuh ≥ 44 px, bebas deadlock.
  3. *Performance Efficiency*: Waktu muat, respon RPC ≤ 500 ms, ukuran bundle JS awal ≤ 250 KB gzip.
  4. *Portability*: Kompatibilitas tampilan dan fungsi tanpa error di 5 target browser/device.
- **Di Luar Cakupan (Out of Scope)**:
  - Deploy produksi fisik ke domain sekolah dan kuesioner pengguna akhir USE siswa (masuk di M6/UAT).
- **Dampak Dokumen Skripsi**: Menghasilkan seluruh data tabel pengujian, metrik pengujian, dan tangkapan layar untuk penyusunan BAB IV Skripsi.

## Capabilities

### New Capabilities
*(Tidak ada capability fungsional baru; seluruh modul bisnis telah selesai di M1–M4).*

### Modified Capabilities
- `platform`: Memperluas spesifikasi non-fungsional untuk mencakup ketentuan pengujian menyeluruh ISO/IEC 25010 (skrip Playwright lintas peramban, benchmark Lighthouse, dan instrumen matriks black-box).

## Impact

- Penambahan konfigurasi dan skrip pengujian di `playwright.config.ts` dan `e2e/`.
- Penambahan skrip pembantu audit Lighthouse di `package.json` atau skrip lokal.
- Pembaruan berkas dokumentasi pengujian skripsi di `docs/testing/black-box.md` dan `docs/testing/performance.md`.
