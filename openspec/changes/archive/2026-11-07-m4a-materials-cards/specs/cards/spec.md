## ADDED Requirements

### Requirement: Cetak Kartu Anggota Individu Format ID-1 (FR-CARD-01, FR-CARD-03, BR-20)
Pustakawan SHALL dapat mencetak kartu anggota individu dalam format dokumen PDF berukuran standar ID-1 (85,6 × 54 mm). Kartu memuat logo dan nama sekolah, judul kartu, nama lengkap, nomor induk, peran, kelas/jurusan, dan kode QR berisi nomor induk yang dapat dipindai oleh scanner barcode atau kamera di meja sirkulasi.

#### Scenario: Cetak kartu individu dan pindai QR (TC-CARD-01)
- **WHEN** pustakawan memilih seorang anggota dan mengklik cetak kartu
- **THEN** sistem menghasilkan PDF kartu ukuran ID-1 dengan kode QR valid yang dapat dipindai oleh scanner sirkulasi

---

### Requirement: Cetak Kartu Massal Lembar A4 (FR-CARD-02)
Pustakawan SHALL dapat mencetak kartu anggota secara massal berdasarkan filter kelas atau rombel pada lembar kertas A4 dengan tata letak 10 kartu per halaman lengkap dengan garis panduan potong.

#### Scenario: Cetak kartu satu kelas 10 kartu per halaman (TC-CARD-02)
- **WHEN** pustakawan memilih filter kelas tertentu dan menjalankan cetak massal
- **THEN** sistem menghasilkan PDF lembar A4 dengan tata letak rapi 10 kartu per halaman dan garis potong
