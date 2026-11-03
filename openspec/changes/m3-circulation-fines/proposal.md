## Why

Perpustakaan SMKN 1 Selayar membutuhkan digitalisasi alur sirkulasi peminjaman, pengembalian, dan penagihan denda untuk menghilangkan antrean fisik di meja sirkulasi serta memastikan akurasi pelacakan eksemplar buku yang dipinjam. Change ini merealisasikan **Milestone M3** (PRD §18) sebagai inti bisnis operasional perpustakaan, memanfaatkan data koleksi yang telah disediakan pada M2.

## What Changes

- **Basis Data Sirkulasi & Denda**:
  - Migrasi tabel `loan_requests`, `loans`, dan `fines`.
  - Fungsi RPC `SECURITY DEFINER` dengan penguncian baris (`for update skip locked`) untuk mencegah *double booking* eksemplar saat persetujuan pengajuan.
  - Snapshot kebijakan denda harian (`daily_fine_snapshot`) saat *checkout* sehingga perubahan aturan tidak berlaku surut (BR-07).
  - Kebijakan RLS ketat: anggota hanya dapat membaca pengajuan, pinjaman, dan dendanya sendiri; seluruh perubahan status hanya lewat RPC.
  - Job berkala `private.expire_overdue_pickups()` untuk membatalkan pengajuan yang melewati batas ambil (BR-06).
- **Antarmuka Sirkulasi Siswa & Guru (`/pinjaman`, `/riwayat`, `/denda`)**:
  - Tombol aksi "Ajukan Pinjam" di halaman detail buku yang memicu RPC `request_loan`.
  - Halaman "Pinjaman Saya" menampilkan pengajuan pending/approved beserta batas ambil, serta pinjaman aktif dengan sisa hari atau hari terlambat dan estimasi denda.
  - Fitur "Ajukan Pengembalian" sebagai penanda (*flagging*) bagi pustakawan.
  - Halaman "Denda Saya" menampilkan rincian denda keterlambatan/kerusakan dan total belum lunas.
- **Antarmuka Meja Layanan Pustakawan (`/pustakawan/pengajuan`, `/pustakawan/sirkulasi`, `/pustakawan/denda`)**:
  - Layar antrean persetujuan/penolakan pengajuan dengan ringkasan histori anggota.
  - Meja Sirkulasi: Mode *Pinjam* dan Mode *Kembali* yang mendukung pemindaian cepat via USB Scanner (`CodeInput`) dan kamera (`CameraScanner` lazy).
  - Penandaan buku hilang (`mark_loan_lost`) yang otomatis menghentikan denda keterlambatan dan menerbitkan denda kehilangan.
  - Pengelolaan denda: pencatatan pembayaran tunai lunas penuh dan pembebasan denda dengan alasan tertulis.

## Cakupan PRD & Milestone

- **Milestone**: M3 — Sirkulasi Lengkap & Denda (PRD §18).
- **Kebutuhan Fungsional (FR)**: `FR-CIR-01` s.d. `FR-CIR-15`, `FR-FIN-01` s.d. `FR-FIN-08`.
- **Aturan Bisnis (BR)**: `BR-01` s.d. `BR-14`, `BR-18` (zona waktu WITA `Asia/Makassar`).
- **Kebutuhan Non-Fungsional (NFR)**: `NFR-PE-01` (respon RPC sirkulasi ≤ 500 ms), `NFR-US-03` (alur meja sirkulasi ringkas), `NFR-SE-02`.
- **Di Luar Cakupan (Out of Scope)**:
  - Pembayaran denda secara online / gateway pembayaran (Won't v1, PRD §5.2).
  - Perpanjangan pinjaman mandiri (Won't v1, PRD §5.2).
  - Cetak kartu anggota fisik dan ekspor laporan periodik PDF/Excel (masuk di M4).
- **Dampak Dokumen Skripsi**: Menggantikan formulir peminjaman kertas dan buku denda pada SOP manual perpustakaan sebelumnya (BAB III).

## Capabilities

### New Capabilities
- `circulation`: Siklus hidup pengajuan pinjam, persetujuan/penolakan, *checkout*, *check-in*, pembatalan, pelacakan hari terlambat WITA, dan kedaluwarsa alokasi.
- `fines`: Pembuatan denda keterlambatan otomatis, denda kehilangan/kerusakan manual, pencatatan pelunasan tunai, dan pembebasan denda berdasar alasan.

### Modified Capabilities
*(Tidak ada modifikasi pada requirement modul sebelumnya).*

## Impact

- Penambahan skema tabel sirkulasi dan RPC transactional di `supabase/migrations/`.
- Penambahan domain fitur di `src/features/circulation/` dan `src/features/fines/`.
- Penambahan rute transaksi di `src/routes/_app/pinjaman.tsx`, `riwayat.tsx`, `denda.tsx`, dan `src/routes/_app/pustakawan/sirkulasi.tsx`.
