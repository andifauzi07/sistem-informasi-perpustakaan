## Context

Milestone M4A mengimplementasikan dua kebutuhan penting dalam operasional perpustakaan SMKN 1 Selayar: distribusi materi pembelajaran digital oleh guru (`materials`) dan penyediaan kartu fisik identitas peminjam berstandar ID-1 dengan QR code (`cards`).

## Goals / Non-Goals

**Goals:**
- Menyediakan ruang penyimpanan berkas bahan ajar di Supabase Storage (bucket privat `materials`, ≤ 10 MB) dengan akses unduhan melalui signed URL aman berumur 60 detik.
- Menyediakan generator PDF kartu perpustakaan standar ID-1 (85,6 × 54 mm) memuat QR Code nomor induk untuk identifikasi kilat di meja sirkulasi.
- Menyediakan cetak massal 10 kartu per lembar A4 dengan garis potong pembantu.

**Non-Goals:**
- Fitur preview dokumen interaktif in-app (seperti viewer docx/pptx); aplikasi hanya menyediakan unduhan langsung berkas asli.
- Sistem notifikasi bahan ajar baru (Won't v1, PRD §5.2).

## Decisions

### 1. Keamanan Penyimpanan Bahan Ajar & Signed URL (FR-MAT-03)
- **Keputusan**: Bucket `materials` dibuat berstatus *private*. Unduhan berkas tidak menggunakan link publik permanen, melainkan *signed URL* jangka pendek (60 detik) yang dihasilkan melalui Supabase Storage API setelah verifikasi sesi aktif.
- **Alasan**: Mencegah akses unduhan dari pihak luar tanpa autentikasi (NFR-SE-01).

### 2. Standar Kartu ID-1 & Garis Potong (FR-CARD-01, FR-CARD-02)
- **Keputusan**: Menggunakan `@react-pdf/renderer` dengan ukuran dokumen kustom `[242.64, 153.07]` pt (setara 85,6 × 54 mm) untuk cetak tunggal, dan ukuran A4 standar dengan grid 2 kolom × 5 baris serta border dashed tipis untuk cetak massal.
- **Alasan**: Memastikan hasil cetak presisi pada kertas PVC kartu maupun kertas tebal yang digunting manual oleh pustakawan sekolah.

## Perubahan Basis Data & Keamanan

1. **Migrasi Baru**:
   - `teaching_materials`: `id`, `title`, `subject`, `description`, `target_grade`, `target_major_id`, `file_path`, `file_size`, `file_type`, `uploaded_by`, `is_hidden`, `hide_reason`, `downloads_count`, `created_at`, `updated_at`.
   - RPC `increment_material_downloads(p_material_id bigint)`.
2. **Storage Bucket**:
   - Bucket `materials`: private, file_size_limit 10 MB, allowed_mime_types (`application/pdf`, docx, pptx, xlsx).
   - RLS Storage: Guru dapat upload/hapus berkas miliknya; Pustakawan dapat mengelola semua berkas; Siswa hanya dapat meminta signed URL baca.

## Ponytail

Penerapan tangga keputusan Ponytail untuk komponen baru:

1. **Mekanisme Unduhan Aman**:
   - *Perlu ada?* Ya (FR-MAT-03).
   - *Fitur native platform?* Ya, Supabase Storage SDK menyediakan fungsi native `createSignedUrl(path, 60)`.
   - *Jawaban Ponytail*: Gunakan fungsi bawaan Supabase Storage tanpa membangun endpoint proxy streaming Deno/Edge Function tersendiri.

2. **Isi Kode QR Kartu**:
   - *Perlu ada?* Ya (FR-CARD-01).
   - *Cukup string sederhana?* Ya, isi QR murni berupa string `member_code` (NIS/NIP). Tidak perlu dibungkus struktur JSON atau enkripsi berlebih.
   - *Jawaban Ponytail*: String teks polos `member_code` langsung dibaca oleh scanner barcode keyboard wedge yang ada di meja sirkulasi.

## Risks / Trade-offs

- **[Risk]** Guru mengunggah berkas bahan ajar berukuran besar yang menghabiskan kuota Supabase Storage → **Mitigasi**: Batas keras `file_size_limit = 10485760` (10 MB) di tingkat Storage bucket policy dan validasi Zod peramban sebelum unggah.
