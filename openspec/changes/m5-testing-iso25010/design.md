## Context

Change ini merupakan Milestone M5 (PRD §18) yang didedikasikan untuk standarisasi dan otomatisasi pengujian perangkat lunak berbasis ISO/IEC 25010. Sebagai produk penelitian skripsi Waterfall, data pengujian pada milestone ini menjadi bukti formal BAB IV. Peran change ini adalah membangun pondasi otomatisasi pengujian yang memudahkan reviewer manusia (penguji/peneliti) memverifikasi kualitas dan mengambil data hasil uji.

## Goals / Non-Goals

**Goals:**
- Mengonfigurasi suite pengujian E2E Playwright dengan 5 target peramban dan perangkat: `chromium`, `firefox`, `webkit`, `Pixel 7`, dan `iPhone 14` (Portability).
- Menyediakan suite tes pgTAP komprehensif untuk seluruh fungsi RPC dan kebijakan RLS (Security & Functional Correctness).
- Menyediakan skrip runner benchmark Lighthouse dan template pencatatan di `docs/testing/performance.md` (Performance Efficiency).
- Menyediakan dokumen katalog uji black-box lengkap di `docs/testing/black-box.md` (Functional Suitability) yang siap dieksekusi oleh reviewer manusia.

**Non-Goals:**
- Menghilangkan peran pengujian manual reviewer manusia. Pengujian fungsional di UI nyata dan UAT tetap berada di bawah kendali penguji manusia.
- Menambahkan fungsionalitas bisnis baru (cakupan fitur dibekukan pada PRD v1.0).

## Decisions

### 1. Konfigurasi Multi-Project Playwright (NFR-PO-01)
- **Keputusan**: Mengonfigurasi `playwright.config.ts` dengan 5 proyek terpisah: desktop chromium, desktop firefox, desktop webkit, emulasi Pixel 7 (Mobile Chrome), dan emulasi iPhone 14 (Mobile Safari).
- **Alasan**: Memenuhi bukti Portability ISO/IEC 25010 secara otomatis dengan satu perintah CLI.

### 2. Format Tabel Kasus Uji Black-Box Skripsi (§16.2)
- **Keputusan**: Seluruh kasus uji disusun dalam tabel Markdown seragam dengan kolom: ID, FR terkait, Prasyarat, Langkah Pengujian, Data Uji, Hasil yang Diharapkan, Hasil Aktual, dan Status (Lulus/Gagal).
- **Alasan**: Format ini dapat langsung disalin ke tabel lampiran dokumen skripsi BAB IV.

## Ponytail

Penerapan tangga keputusan Ponytail untuk suite pengujian:

1. **Framework Pengujian E2E**:
   - *Perlu ada?* Ya (NFR-PO-01).
   - *Pustaka apa yang sudah terpasang?* Playwright sudah terpasang di devDependencies (CLAUDE.md §2).
   - *Jawaban Ponytail*: Manfaatkan fixture bawaan Playwright (`page`, `devices`) tanpa menambah plugin assertion tambahan.

2. **Pengukuran Lighthouse**:
   - *Perlu ada?* Ya (NFR-PE).
   - *Cukup skrip CLI sederhana?* Ya, panggil Lighthouse CLI atau jalankan audit DevTools browser bawaan.
   - *Jawaban Ponytail*: Sediakan skrip pembantu di package.json atau petunjuk runner langsung yang mencatat median 3x ke `docs/testing/performance.md`.

## Risks / Trade-offs

- **[Risk]** Tes E2E Playwright flaky pada koneksi lambat atau CI → **Mitigasi**: Gunakan `webServer` lokal Vite di Playwright config dan pastikan data seed lokal konsisten sebelum tes dijalankan.
