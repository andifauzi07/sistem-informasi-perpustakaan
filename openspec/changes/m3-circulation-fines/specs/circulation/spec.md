## ADDED Requirements

### Requirement: Pengajuan Peminjaman Mandiri (FR-CIR-01, BR-01, BR-02, BR-03, BR-04)
Anggota aktif (siswa atau guru) SHALL dapat mengajukan pinjaman buku mandiri melalui RPC `request_loan(p_book_id)`. Pengajuan divalidasi terhadap stok eksemplar tersedia, kuota pinjaman aktif, dan duplikasi judul terbuka.

#### Scenario: Sukses mengajukan pinjam (TC-CIR-01)
- **WHEN** anggota aktif dengan kuota pinjam tersisa mengajukan pinjaman untuk buku yang memiliki minimal satu eksemplar `available`
- **THEN** sistem membuat rekaman `loan_requests` dengan status `pending`

#### Scenario: Gagal mengajukan saat stok habis (TC-CIR-02)
- **WHEN** anggota mengajukan pinjaman untuk buku yang memiliki 0 eksemplar `available`
- **THEN** sistem menolak pengajuan dengan galat `NO_AVAILABLE_COPY`

#### Scenario: Gagal mengajukan saat kuota pinjam terlampaui (TC-CIR-03)
- **WHEN** anggota yang telah mencapai batas `max_active_loans` mencoba mengajukan pinjaman
- **THEN** sistem menolak pengajuan dengan galat `LOAN_LIMIT_REACHED`

#### Scenario: Gagal mengajukan judul yang sama dua kali (TC-CIR-04)
- **WHEN** anggota mencoba mengajukan buku yang judulnya sedang diajukan atau sedang aktif dipinjam
- **THEN** sistem menolak pengajuan dengan galat `DUPLICATE_TITLE`

---

### Requirement: Persetujuan dan Penolakan Pengajuan (FR-CIR-06, FR-CIR-07, FR-CIR-08, BR-05)
Pustakawan SHALL dapat menyetujui pengajuan melalui RPC `approve_loan_request` (mengalokasikan 1 eksemplar menjadi `reserved` dan menetapkan `pickup_deadline` 23:59:59 WITA pada H+`pickup_days`) atau menolak pengajuan melalui RPC `reject_loan_request` dengan alasan wajib.

#### Scenario: Sukses menyetujui pengajuan (TC-CIR-05)
- **WHEN** pustakawan menyetujui pengajuan berstatus `pending`
- **THEN** status pengajuan menjadi `approved`, eksemplar yang dialokasikan menjadi `reserved`, dan batas ambil tercatat

#### Scenario: Gagal menolak tanpa alasan (TC-CIR-06)
- **WHEN** pustakawan mencoba menolak pengajuan dengan alasan kosong
- **THEN** sistem menolak pemanggilan dengan galat `VALIDATION_ERROR`

---

### Requirement: Pembatalan dan Kedaluwarsa Pengajuan (FR-CIR-03, FR-CIR-13, BR-06)
Anggota SHALL dapat membatalkan pengajuan miliknya yang berstatus `pending` atau `approved` melalui RPC `cancel_loan_request`. Pengajuan `approved` yang melewati batas ambil otomatis diubah menjadi `expired` oleh fungsi sistem `expire_overdue_pickups()`, dan eksemplar yang dialokasikan dilepas kembali menjadi `available`.

#### Scenario: Pembatalan pengajuan oleh anggota (TC-CIR-11)
- **WHEN** anggota membatalkan pengajuan berstatus `approved`
- **THEN** status pengajuan berubah menjadi `cancelled` dan eksemplar yang teralokasi kembali menjadi `available`

#### Scenario: Kedaluwarsa pengajuan otomatis (TC-CIR-10)
- **WHEN** job sistem mendeteksi pengajuan `approved` yang telah melewati `pickup_deadline`
- **THEN** status pengajuan berubah menjadi `expired` dan eksemplar kembali menjadi `available`

---

### Requirement: Meja Layanan Sirkulasi Mode Pinjam / Checkout (FR-CIR-09, FR-CIR-15, BR-07, BR-08)
Pustakawan SHALL dapat memproses peminjaman buku di meja sirkulasi melalui RPC `checkout_copy` baik untuk pengajuan yang telah disetujui maupun peminjaman langsung (walk-in), dengan validasi status anggota dan eksemplar, serta dukungan pemindaian scanner USB atau kamera.

#### Scenario: Checkout dari pengajuan yang disetujui (TC-CIR-07)
- **WHEN** pustakawan memindai nomor induk anggota dan kode eksemplar yang teralokasi pada pengajuan `approved`
- **THEN** status pengajuan menjadi `fulfilled`, rekaman `loans` baru berstatus `active` dibuat, `due_date` dihitung sesuai kebijakan peran, dan `daily_fine_snapshot` disalin

#### Scenario: Checkout walk-in langsung (TC-CIR-08)
- **WHEN** pustakawan memproses peminjaman langsung tanpa pengajuan sebelumnya untuk eksemplar `available`
- **THEN** pinjaman aktif baru berhasil dibuat dengan jatuh tempo yang sesuai

#### Scenario: Pemindaian cepat scanner USB (TC-CIR-17)
- **WHEN** scanner barcode USB mengirimkan kode eksemplar diikuti karakter Enter pada komponen input yang terfokus
- **THEN** sistem langsung memproses data tanpa memerlukan klik tombol konfirmasi manual

---

### Requirement: Meja Layanan Sirkulasi Mode Kembali / Check-in (FR-CIR-04, FR-CIR-10, FR-CIR-11, BR-09, BR-10, BR-11)
Pustakawan SHALL dapat memproses pengembalian buku melalui RPC `checkin_copy`. Pengembalian tepat waktu mengubah status pinjaman menjadi `returned` dan eksemplar menjadi `available`. Keterlambatan kalender WITA otomatis menerbitkan tagihan denda keterlambatan.

#### Scenario: Check-in tepat waktu tanpa denda (TC-CIR-13)
- **WHEN** pustakawan melakukan check-in eksemplar sebelum atau tepat pada `due_date` dengan kondisi baik
- **THEN** status pinjaman menjadi `returned`, eksemplar menjadi `available`, dan tidak ada denda yang dibuat

#### Scenario: Check-in terlambat dengan denda otomatis (TC-CIR-14)
- **WHEN** pustakawan melakukan check-in eksemplar yang terlambat 3 hari kalender
- **THEN** sistem mencatat pinjaman selesai dan otomatis membuat rekaman denda senilai 3 × `daily_fine_snapshot`

#### Scenario: Check-in kondisi rusak (TC-CIR-15)
- **WHEN** pustakawan melakukan check-in dengan memilih kondisi rusak dan mengisi nominal ganti rugi
- **THEN** status eksemplar menjadi `damaged` dan rekaman denda kerusakan berhasil diterbitkan

---

### Requirement: Penandaan Buku Hilang (FR-CIR-14)
Pustakawan SHALL dapat menandai pinjaman aktif sebagai hilang melalui RPC `mark_loan_lost`, yang mengubah eksemplar menjadi `lost` dan menerbitkan denda kehilangan.

#### Scenario: Tandai pinjaman hilang (TC-CIR-16)
- **WHEN** pustakawan menandai pinjaman aktif sebagai hilang
- **THEN** status pinjaman berubah menjadi `lost`, eksemplar menjadi `lost`, dan tagihan denda kehilangan diterbitkan
