# members Specification

## Purpose
Menyediakan pengelolaan data anggota perpustakaan (siswa, guru, pustakawan) bagi pustakawan, meliputi penambahan akun tunggal dengan password sementara acak 10 karakter sekali pakai, impor massal dari berkas Excel dengan validasi batch, pembaruan profil dengan penguncian nomor induk dan peran (BR-15), penonaktifan/pengaktifan akun, reset password, dan tampilan detail anggota.

## Requirements

### Requirement: Tampilan Daftar Anggota Perpustakaan (FR-MBR-01)
Sistem SHALL menyediakan halaman daftar anggota pada rute `/pustakawan/anggota` yang dapat diakses oleh pustakawan aktif. Halaman ini SHALL mendukung pencarian berbasis nama atau nomor induk, filter berdasarkan peran (`student`, `teacher`, `librarian`), kelas, jurusan (dari referensi `majors`), dan status aktif. Data ditampilkan dalam tabel dengan paginasi tepat 20 baris per halaman.

#### Scenario: Pustakawan melihat daftar anggota dengan paginasi 20 baris
- **WHEN** pustakawan membuka halaman `/pustakawan/anggota`
- **THEN** sistem menampilkan data anggota dipaginasi 20 baris per halaman lengkap dengan kontrol navigasi halaman

#### Scenario: Pustakawan mencari dan memfilter anggota
- **WHEN** pustakawan memasukkan kata kunci pencarian atau memilih filter kelas/jurusan/status
- **THEN** daftar anggota diperbarui sesuai kriteria filter yang dipilih melalui URL query parameter

#### Scenario: Akses ditolak untuk pengguna non-pustakawan
- **WHEN** pengguna tanpa peran `librarian` mencoba membaca daftar anggota
- **THEN** sistem menolak permintaan dengan galat `FORBIDDEN`

### Requirement: Penambahan Anggota Tunggal (FR-MBR-02, BR-15, BR-21)
Sistem SHALL menyediakan formulir dialog tambah anggota tunggal bagi pustakawan. Formulir menerima field wajib: nomor induk (`member_code`), nama lengkap (`full_name`), dan peran (`role`). Untuk siswa, `class_name` wajib diisi dan `major_id` opsional. Untuk guru, `subject` opsional. Nomor telepon (`phone`) opsional untuk semua peran. Sistem memanggil Edge Function `admin-members` dengan aksi `create`. Sistem SHALL menghasilkan password sementara acak 10 karakter tanpa karakter ambigu (`0`, `O`, `1`, `l`, `I`) yang hanya ditampilkan satu kali dalam dialog konfirmasi.

#### Scenario: Tambah siswa berhasil dan menghasilkan password sementara (TC-MBR-01)
- **WHEN** pustakawan mengirim data siswa baru yang valid
- **THEN** akun dibuat di Supabase Auth dengan `email_confirm: true`, baris profil terbentuk di database dengan `must_change_password = true`, dan dialog menampilkan password sementara 10 karakter sekali pakai

#### Scenario: Penambahan gagal karena nomor induk sudah terdaftar (TC-MBR-02)
- **WHEN** pustakawan menambahkan anggota dengan nomor induk yang sudah terdaftar
- **THEN** Edge Function menolak permintaan dengan kode galat `MEMBER_CODE_TAKEN` dan pesan "Nomor induk sudah terdaftar"

#### Scenario: Penambahan gagal karena data tidak valid
- **WHEN** pustakawan mengirim formulir siswa tanpa mengisi kelas atau nama kurang dari 2 karakter
- **THEN** sistem menolak penyimpanan dengan kode galat `VALIDATION_ERROR`

### Requirement: Pengubahan Data Anggota (FR-MBR-03, BR-15)
Sistem SHALL memungkinkan pustakawan memperbarui data anggota (nama lengkap, kelas, jurusan, mata pelajaran, nomor telepon). Sesuai BR-15, nomor induk (`member_code`) dan peran (`role`) SHALL dikunci (*read-only*) dan tidak dapat diubah setelah akun dibuat.

#### Scenario: Pustakawan berhasil memperbarui data anggota
- **WHEN** pustakawan mengubah nama atau kelas anggota dan menyimpannya
- **THEN** data di `profiles` diperbarui, log aktivitas tercatat, dan dialog sukses ditampilkan

#### Scenario: Upaya pengubahan nomor induk atau peran ditolak (BR-15)
- **WHEN** permintaan pembaruan anggota mencoba mengubah nilai `member_code` atau `role`
- **THEN** sistem menolak perubahan tersebut dan mempertahankan nilai semula

### Requirement: Nonaktifkan dan Aktifkan Anggota (FR-MBR-04, BR-16)
Sistem SHALL menyediakan aksi untuk menonaktifkan atau mengaktifkan kembali akun anggota. Saat dinonaktifkan, Edge Function `admin-members` dengan aksi `set_active` SHALL menyetel `profiles.is_active = false` dan memberikan durasi *ban* pada Supabase Auth (`ban_duration: '876000h'`). Riwayat transaksi dan data anggota tetap tersimpan (tidak dihapus fisik).

#### Scenario: Nonaktifkan anggota berhasil (TC-MBR-07)
- **WHEN** pustakawan memilih aksi "Nonaktifkan" pada anggota aktif dan mengonfirmasi dialog
- **THEN** status anggota menjadi nonaktif, sesi login yang bersangkutan diblokir, dan anggota tidak dapat login maupun melakukan peminjaman

#### Scenario: Mengaktifkan kembali anggota nonaktif
- **WHEN** pustakawan memilih aksi "Aktifkan" pada anggota nonaktif
- **THEN** status `profiles.is_active` kembali bernilai `true`, larangan ban di Auth dicabut (`ban_duration: 'none'`), dan anggota dapat login kembali

### Requirement: Reset Password Anggota oleh Pustakawan (FR-MBR-05, BR-21)
Sistem SHALL menyediakan fitur reset password anggota bagi pustakawan. Edge Function `admin-members` dengan aksi `reset_password` SHALL menghasilkan password sementara acak 10 karakter baru, memperbarui password akun di Supabase Auth, serta mengeset `profiles.must_change_password = true`. Password sementara baru hanya ditampilkan satu kali kepada pustakawan.

#### Scenario: Pustakawan mereset password anggota (TC-MBR-06)
- **WHEN** pustakawan melakukan reset password untuk suatu anggota
- **THEN** sistem menghasilkan password sementara baru, mengeset `must_change_password = true`, menampilkan password sementara sekali pakai di dialog konfirmasi, dan mewajibkan anggota mengganti password saat login berikutnya

#### Scenario: Reset password gagal karena akun tidak ditemukan
- **WHEN** aksi reset password dipanggil untuk ID pengguna yang tidak ada
- **THEN** sistem mengembalikan galat `MEMBER_NOT_FOUND`

### Requirement: Impor Anggota Massal dari Format Excel (FR-MBR-06, BR-15)
Sistem SHALL menyediakan fitur impor anggota dari berkas Excel (`.xlsx`) menggunakan pustaka `read-excel-file` yang dimuat secara dinamis (*lazy load*). Sistem menyediakan template resmi Excel yang dapat diunduh. Pengiriman data ke Edge Function `admin-members` (aksi `import`) dilakukan dalam *batch* maksimal 50 baris per panggilan. Proses impor melakukan *upsert* berdasarkan `member_code`: jika belum ada, akun baru dibuat; jika sudah ada, data profil diperbarui. Baris yang perannya berbeda dari akun yang sudah ada dinyatakan gagal (BR-15). Kegagalan satu baris tidak menggagalkan baris lainnya dalam *batch*.

#### Scenario: Impor berkas valid berhasil diproses penuh (TC-MBR-03)
- **WHEN** pustakawan mengunggah berkas Excel berisi 30 baris data anggota baru yang valid
- **THEN** seluruh 30 akun berhasil dibuat lengkap dengan profil dan password sementara, dan ringkasan keberhasilan ditampilkan

#### Scenario: Impor dengan sebagian baris tidak valid (TC-MBR-04)
- **WHEN** berkas Excel memuat beberapa baris dengan format data yang salah atau peran yang tidak valid
- **THEN** baris yang tidak valid ditandai gagal dengan pesan error spesifik, sedangkan baris yang valid tetap berhasil diproses

#### Scenario: Impor memperbarui data nomor induk yang sudah terdaftar (TC-MBR-05)
- **WHEN** berkas Excel memuat baris dengan nomor induk yang sudah terdaftar dengan peran yang sama
- **THEN** profil anggota diperbarui tanpa membuat akun baru, dan akun yang sudah ada tidak di-reset password-nya

### Requirement: Tampilan Detail Anggota (FR-MBR-07)
Sistem SHALL menyediakan halaman atau panel detail anggota yang menampilkan informasi profil lengkap, identitas kontak, serta ringkasan status akun.

#### Scenario: Pustakawan membuka detail anggota
- **WHEN** pustakawan memilih anggota dari tabel daftar anggota
- **THEN** sistem menampilkan informasi detail profil anggota yang bersangkutan

#### Scenario: Detail anggota tidak ditemukan
- **WHEN** pustakawan mencoba membuka detail anggota dengan ID yang tidak valid
- **THEN** sistem menampilkan pesan galat `MEMBER_NOT_FOUND`

### Requirement: Pengelolaan Akun Pustakawan Tambahan (FR-MBR-08)
Sistem SHALL memungkinkan pustakawan untuk mengelola akun pustakawan lain (menambah pustakawan baru dengan field `position`/jabatan, mereset password, dan menonaktifkan akun).

#### Scenario: Menambah akun pustakawan baru
- **WHEN** pustakawan mengisi formulir penambahan akun dengan peran `librarian` dan mengisi kolom jabatan
- **THEN** akun pustakawan baru berhasil dibuat dengan izin akses rute pustakawan
