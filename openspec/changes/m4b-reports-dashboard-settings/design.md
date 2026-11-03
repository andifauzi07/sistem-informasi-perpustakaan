## Context

Milestone M4B melengkapi aspek manajerial, analitik, dan akuntabilitas aplikasi SIP SMKN 1 Selayar: dasbor personal dan KPI pustakawan (`dashboard`), pelaporan periodik dan ekspor PDF/Excel (`reports`), profil sekolah dan matriks kebijakan pinjaman (`settings`), serta audit trail jejak aktivitas sistem (`activity-log`).

## Goals / Non-Goals

**Goals:**
- Menyajikan dasbor dengan angka metrik akurat yang dihitung dari tabel sirkulasi dan denda.
- Menyediakan 7 jenis laporan dengan pratinjau tabel interaktif dan filter rentang tanggal WITA.
- Menyediakan ekspor dokumen PDF A4 resmi ber-kop sekolah dan lembar kerja spreadsheet Excel `.xlsx` yang identik dengan pratinjau.
- Menyediakan form pengaturan kebijakan pinjam `loan_policies` dan profil sekolah beserta logo.
- Menyediakan halaman pemantau log audit aktivitas bagi pustakawan.

**Non-Goals:**
- Sistem visualisasi grafik atau analitik prediktif kompleks (Won't v1, PRD §5.2). Cukup tabel dan kartu metrik KPI.
- Notifikasi pengingat via email/SMS/WhatsApp (Won't v1, PRD §5.2).

## Decisions

### 1. Agregasi Laporan di PostgreSQL via RPC (NFR-PE-01)
- **Keputusan**: Seluruh perhitungan akumulasi laporan (rekap denda, Top 10 buku, keterlambatan) dilakukan di tingkat basis data melalui fungsi SQL agregat atau view PostgreSQL, bukan memuat ribuan baris mentah ke memori peramban.
- **Alasan**: Efisiensi performa tinggi, bandwidth hemat di jaringan sekolah kepulauan, dan jaminan konsistensi nominal rupiah.

### 2. Isolasi Library Ekspor Excel & PDF (NFR-PE-03)
- **Keputusan**: `write-excel-file` dan `@react-pdf/renderer` hanya dimuat secara dinamis saat pustakawan mengklik tombol ekspor di `/pustakawan/laporan`.
- **Alasan**: Mencegah beban ukuran JavaScript awal pada rute umum.

## Perubahan Basis Data & Keamanan

1. **Migrasi Baru**:
   - `library_settings`: `id`, `school_name`, `library_name`, `address`, `logo_url`, `updated_at`.
   - RPCs laporan: `get_circulation_report`, `get_overdue_report`, `get_fines_summary_report`, `get_inventory_report`, `get_top_borrowed_books`.
   - Bucket Storage `library-assets`: publik untuk logo perpustakaan.
2. **Kebijakan RLS**:
   - `library_settings`: Akses baca publik; hak ubah hanya untuk pustakawan.
   - `activity_logs`: Hak baca hanya untuk pustakawan; insert hanya melalui trigger / RPC internal.

## Ponytail

Penerapan tangga keputusan Ponytail untuk komponen baru:

1. **Pustaka Ekspor Excel**:
   - *Perlu ada?* Ya (FR-RPT-09).
   - *Pustaka apa yang paling ramping?* `write-excel-file` (sudah ada di tech stack CLAUDE.md §2). Hindari library besar seperti `xlsx` (SheetJS) yang berukuran megabyte.
   - *Jawaban Ponytail*: Gunakan skema objek `write-excel-file` yang ringkas langsung di sisi klien dengan dynamic import.

2. **Dasbor Metrik KPI**:
   - *Perlu ada?* Ya (FR-DSH-01, FR-DSH-02).
   - *Perlu database cache seperti Redis?* Tidak (YAGNI). PostgREST query dengan indeks Postgres sudah menyelesaikan kueri dalam < 50 ms.
   - *Jawaban Ponytail*: Kueri langsung ke Supabase dengan TanStack Query (`staleTime: 30_000`).

## Risks / Trade-offs

- **[Risk]** Rentang tanggal laporan yang luas menghasilkan baris data masif → **Mitigasi**: Paginasi pratinjau tabel di peramban dan batas aman rentang tanggal default pada bulan kalender berjalan.
