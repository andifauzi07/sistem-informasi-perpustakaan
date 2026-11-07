## Context

Milestone M3 (PRD §18) mengimplementasikan mesin transaksi inti sirkulasi perpustakaan: pengajuan peminjaman daring oleh siswa/guru, persetujuan dan alokasi eksemplar fisik, meja sirkulasi *checkout* dan *check-in*, perhitungan denda keterlambatan/kerusakan, pelunasan tunai, serta pembebasan denda.

## Goals / Non-Goals

**Goals:**
- Mengelola siklus status lengkap `loan_requests` (`pending`, `approved`, `rejected`, `cancelled`, `fulfilled`, `expired`).
- Mengelola siklus status `loans` (`active`, `returned`, `lost`) dan status `fines` (`unpaid`, `paid`, `waived`).
- Menerapkan penguncian baris `SELECT ... FOR UPDATE SKIP LOCKED` pada saat persetujuan pengajuan dan alokasi eksemplar untuk mencegah *race condition* atau *double booking*.
- Menyimpan snapshot tarif denda (`daily_fine_snapshot`) saat peminjaman dibuat sehingga perubahan kebijakan tidak berlaku surut (BR-07).
- Mendukung pemindaian barcode fisik melalui USB scanner (*keyboard wedge*) dan kamera ponsel (*barcode-detector* polyfill zxing-wasm).

**Non-Goals:**
- Integrasi payment gateway daring (Won't v1, PRD §5.2). Denda diselesaikan tunai di perpustakaan.
- Perpanjangan masa pinjam mandiri (Won't v1, PRD §5.2).

## Decisions

### 1. Transisi Status Melalui PostgreSQL RPC Security Definer (ADR-04)
- **Keputusan**: Semua perubahan status sirkulasi dan denda WAJIB dilakukan melalui RPC PostgreSQL berstatus `SECURITY DEFINER` dengan skema `private` untuk helper keamanan. Tabel `loan_requests`, `loans`, dan `fines` tidak memiliki hak akses `INSERT`/`UPDATE` langsung bagi klien.
- **Alasan**: Menjamin integritas transaksi ACID, konsistensi status eksemplar, dan mencegah manipulasi nominal denda dari sisi peramban.

### 2. Tanggal Bisnis Zona WITA Asia/Makassar (BR-18)
- **Keputusan**: Waktu transaksi disimpan sebagai `timestamptz` (UTC), sedangkan perhitungan tanggal bisnis jatuh tempo, batas ambil (23:59:59 WITA), dan hari terlambat menggunakan fungsi basis data `private.today_wita()`.
- **Alasan**: Mencegah kesalahan penalti denda akibat perbedaan zona waktu lokal peramban atau server cloud.

### 3. Komponen Scanner Meja Sirkulasi (FR-CIR-15)
- **Keputusan**: Komponen `CodeInput` dirancang menangani USB keyboard wedge scanner secara otomatis melalui event `onKeyDown` (Enter) dengan `autoFocus`. Komponen `CameraScanner` hanya dimuat secara lazy saat pengguna mengklik ikon kamera.
- **Alasan**: Scanner USB fisik adalah jalur utama yang cepat di meja sirkulasi; pemuatan lazy kamera menjaga bundle awal tetap ringan.

## Perubahan Basis Data & Keamanan

1. **Migrasi Baru**:
   - `loan_requests`: `id`, `member_id`, `book_id`, `status`, `reserved_copy_id`, `pickup_deadline`, `notes`, `rejection_reason`, `created_at`, `updated_at`.
   - `loans`: `id`, `member_id`, `copy_id`, `status`, `borrowed_at`, `due_date`, `returned_at`, `daily_fine_snapshot`, `return_requested_at`, `created_at`.
   - `fines`: `id`, `loan_id`, `member_id`, `type`, `amount`, `status`, `reason`, `paid_at`, `received_by`, `waived_at`, `waived_by`, `created_at`.
   - View `v_loans` untuk pemantauan pustakawan.
   - RPCs: `request_loan`, `approve_loan_request`, `reject_loan_request`, `cancel_loan_request`, `checkout_loan`, `checkin_loan`, `mark_loan_lost`, `pay_fine`, `waive_fine`.
   - Fungsi terjadwal `private.expire_overdue_pickups()`.
2. **Kebijakan RLS**:
   - Siswa/Guru: Hanya dapat membaca data milik sendiri (`member_id = (select auth.uid())`).
   - Pustakawan: Membaca seluruh data pengajuan, pinjaman, dan denda.
   - Tidak ada policy `INSERT`/`UPDATE` publik.

## Ponytail

Penerapan tangga keputusan Ponytail untuk komponen baru:

1. **Perhitungan Hari Terlambat & Denda**:
   - *Perlu ada?* Ya (BR-10, BR-11).
   - *Fitur native platform?* Ya, fungsi PL/pgSQL di PostgreSQL menggunakan `GREATEST(0, (private.today_wita() - due_date))`. Tidak perlu cron job penghitung denda harian; nilai dihitung on-the-fly saat check-in atau ditampilkan di view.
   - *Jawaban Ponytail*: Hindari background job pembaruan nominal denda; hitung langsung di DB saat transaksi atau pembacaan query.

2. **Input Barcode USB**:
   - *Perlu ada?* Ya (FR-CIR-15).
   - *Cukup elemen native HTML?* Ya, tag `<input />` standar dengan penanganan `e.key === 'Enter'`. Tidak perlu library keyboard listener pihak ketiga.
   - *Jawaban Ponytail*: Buat komponen sederhana `CodeInput.tsx` ~30 baris.

3. **Status Pengembalian Menunggu Konfirmasi**:
   - *Perlu ada?* Ya (FR-CIR-04).
   - *Perlu tabel baru?* Tidak (YAGNI). Cukup satu kolom timestamp `return_requested_at` di tabel `loans`.
   - *Jawaban Ponytail*: Gunakan kolom nullable `return_requested_at` pada tabel `loans` tanpa membuat tabel permintaan pengembalian terpisah.

## Risks / Trade-offs

- **[Risk]** Pustakawan menyetujui pengajuan pada detik yang sama untuk eksemplar yang sama → **Mitigasi**: Klausul `FOR UPDATE SKIP LOCKED` pada query pemilihan eksemplar `available`.
- **[Risk]** Pengajuan disetujui tetapi siswa tidak mengambil buku → **Mitigasi**: Job per jam `expire_overdue_pickups()` yang mengembalikan eksemplar menjadi `available` setelah melewati 23:59:59 WITA batas ambil.
