# fines Specification

## Purpose
TBD - created by archiving change m3-circulation-fines. Update Purpose after archive.

## Requirements

### Requirement: Pencatatan Pembayaran Denda Tunai (FR-FIN-03, BR-13)
Pustakawan SHALL dapat mencatat pembayaran denda secara tunai lunas penuh melalui RPC `pay_fine(p_fine_id)`. Sistem menyimpan waktu pembayaran dan identitas pustakawan penerima.

#### Scenario: Sukses mencatat pembayaran tunai lunas (TC-FIN-01)
- **WHEN** pustakawan menerima uang tunai dan mengonfirmasi pembayaran denda berstatus `unpaid`
- **THEN** status denda berubah menjadi `paid`, waktu bayar `paid_at` tercatat, dan identitas pustakawan tersimpan

#### Scenario: Gagal membayar denda yang sudah diselesaikan
- **WHEN** pustakawan mencoba memanggil `pay_fine` pada denda yang sudah berstatus `paid` atau `waived`
- **THEN** sistem menolak transaksi dengan galat `FINE_ALREADY_SETTLED`

---

### Requirement: Pembebasan Denda (FR-FIN-04, BR-13)
Pustakawan SHALL dapat membebaskan denda melalui RPC `waive_fine(p_fine_id, p_reason)` dengan alasan tertulis wajib. Status `waived` bersifat final.

#### Scenario: Sukses membebaskan denda dengan alasan
- **WHEN** pustakawan membebaskan denda dengan menyertakan alasan tertulis "Buku terlambat karena bencana alam"
- **THEN** status denda berubah menjadi `waived` dan alasan pembebasan tersimpan

#### Scenario: Gagal membebaskan denda tanpa alasan (TC-FIN-02)
- **WHEN** pustakawan mencoba membebaskan denda dengan kolom alasan kosong
- **THEN** sistem menolak aksi dengan galat `VALIDATION_ERROR`

---

### Requirement: Penayangan Denda dan Status Non-Pemblokiran (FR-FIN-05, FR-FIN-06, FR-FIN-07, BR-12)
Sistem SHALL menampilkan daftar denda kepada anggota dan pustakawan beserta total belum lunas. Denda yang belum lunas tidak memblokir pengajuan pinjaman maupun checkout peminjaman, melainkan ditampilkan sebagai indikator peringatan.

#### Scenario: Anggota berdenda tetap dapat meminjam dengan peringatan (TC-FIN-03)
- **WHEN** anggota yang memiliki denda belum lunas mengajukan peminjaman atau diproses di meja sirkulasi
- **THEN** transaksi peminjaman tetap diizinkan dan sistem menampilkan kotak peringatan total denda yang belum dibayar

#### Scenario: Anggota melihat rincian denda (TC-FIN-04)
- **WHEN** anggota membuka halaman Denda Saya
- **THEN** sistem menampilkan daftar denda aktif dan riwayat denda beserta nominal total belum lunas
