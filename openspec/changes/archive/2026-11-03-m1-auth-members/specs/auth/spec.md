## ADDED Requirements

### Requirement: Autentikasi Login dengan Nomor Induk (FR-AUTH-01)
Sistem SHALL menyediakan antarmuka login yang menerima nomor induk (NIS/NIP) dan password. Sistem SHALL menormalkan nomor induk menjadi `login_id` lalu melakukan autentikasi ke Supabase Auth dengan email sintetis `${login_id}@${VITE_AUTH_EMAIL_DOMAIN}`. Pesan galat autentikasi gagal SHALL selalu ditampilkan secara generik "Nomor induk atau password salah" tanpa membocorkan keberadaan nomor induk di sistem.

#### Scenario: Login siswa valid berhasil (TC-AUTH-01)
- **WHEN** siswa memasukkan nomor induk valid dan password yang benar
- **THEN** autentikasi berhasil, sesi disimpan, dan pengguna diarahkan ke `/beranda`

#### Scenario: Login gagal karena password salah (TC-AUTH-02)
- **WHEN** pengguna memasukkan nomor induk terdaftar dengan password salah
- **THEN** sistem menolak login dan menampilkan pesan galat generik "Nomor induk atau password salah"

#### Scenario: Login dengan nomor induk bertanda baca atau spasi (TC-AUTH-03)
- **WHEN** pengguna memasukkan nomor induk `21.10.0456` atau `2110 0456` dengan password yang benar
- **THEN** sistem menormalkan nomor induk menjadi `21100456` dan login berhasil

#### Scenario: Login gagal karena nomor induk tidak terdaftar
- **WHEN** pengguna memasukkan nomor induk yang tidak ada di sistem
- **THEN** sistem menolak login dan menampilkan pesan galat generik "Nomor induk atau password salah"

---

### Requirement: Logout Pengguna dan Pembersihan Sesi (FR-AUTH-02)
Sistem SHALL menyediakan aksi logout pada menu navigasi akun di seluruh halaman. Saat logout dipanggil, sistem SHALL menghapus sesi lokal Supabase dan mengarahkan pengguna kembali ke halaman login. Riwayat browser tidak boleh memungkinkan pengguna kembali ke halaman terproteksi.

#### Scenario: Logout berhasil dan sesi dibersihkan (TC-AUTH-07)
- **WHEN** pengguna menekan tombol "Logout" dari menu akun
- **THEN** sesi lokal dihapus, pengguna diarahkan ke `/login`, dan penekanan tombol kembali (*back*) di peramban tidak menampilkan data pengguna yang terproteksi

---

### Requirement: Kewajiban Ganti Password Pertama Kali (FR-AUTH-03, BR-21)
Sistem SHALL memeriksa bendera `profiles.must_change_password`. Jika bernilai `true` (pada akun baru atau setelah reset password), sistem SHALL mengalihkan pengguna ke `/ganti-password` dan memblokir akses ke rute aplikasi lainnya sampai password baru berhasil disimpan. Password baru minimal 8 karakter (BR-21). Setelah pembaruan password di Supabase Auth berhasil, sistem SHALL memanggil RPC `complete_password_change()` untuk mengubah `must_change_password = false`.

#### Scenario: Pengguna dengan must_change_password diarahkan ke halaman ganti password (TC-AUTH-04)
- **WHEN** pengguna dengan `must_change_password = true` berhasil login atau mengakses rute `/beranda`
- **THEN** router mengalihkan pengguna ke `/ganti-password` dan menolak navigasi ke rute lain

#### Scenario: Ganti password sukses membuka akses aplikasi
- **WHEN** pengguna mengisi password baru minimal 8 karakter dan konfirmasi yang cocok di `/ganti-password`
- **THEN** sistem memperbarui kredensial, memanggil RPC `complete_password_change()`, dan mengarahkan pengguna ke `/beranda`

#### Scenario: Ganti password ditolak karena kurang dari 8 karakter
- **WHEN** pengguna memasukkan password baru kurang dari 8 karakter
- **THEN** form menampilkan galat validasi klien dan pengiriman ditolak

---

### Requirement: Halaman Profil dan Ganti Password Mandiri (FR-AUTH-04)
Sistem SHALL menyediakan halaman `/profil` yang menampilkan identitas diri pengguna (nama, nomor induk, peran, kelas/jurusan untuk siswa, mapel untuk guru, jabatan untuk pustakawan) secara *read-only*. Halaman profil juga SHALL menyediakan form ganti password mandiri yang mewajibkan password minimal 8 karakter dan konfirmasi kecocokan.

#### Scenario: Pengguna melihat profil diri sendiri
- **WHEN** pengguna membuka halaman `/profil`
- **THEN** sistem memuat dan menampilkan data diri pengguna sesuai kolom `profiles`

#### Scenario: Pengguna memperbarui password mandiri dari profil
- **WHEN** pengguna memasukkan password baru minimal 8 karakter yang valid pada form di `/profil`
- **THEN** password berhasil diperbarui dan sistem menampilkan notifikasi sukses

---

### Requirement: Otorisasi Berbasis Peran dan Pembatasan Rute (FR-AUTH-05)
Sistem SHALL menerapkan pembatasan rute pada layout `_app` dan `_app/pustakawan`. Rute `/pustakawan/*` hanya SHALL dapat diakses oleh pengguna dengan peran `librarian` aktif. Pengguna dengan peran `student` atau `teacher` yang mencoba mengakses rute `/pustakawan/*` SHALL dialihkan ke `/beranda` dengan notifikasi "Tidak memiliki akses" (`FORBIDDEN`).

#### Scenario: Siswa dialihkan saat mencoba mengakses rute pustakawan (TC-AUTH-06)
- **WHEN** pengguna dengan peran `student` membuka URL `/pustakawan/anggota` atau rute pustakawan lainnya
- **THEN** sistem mengalihkan pengguna ke `/beranda` dan menampilkan notifikasi "Tidak memiliki akses" (`FORBIDDEN`)

#### Scenario: Pustakawan dapat mengakses rute pustakawan
- **WHEN** pengguna dengan peran `librarian` membuka rute `/pustakawan/anggota`
- **THEN** halaman dimuat dan ditampilkan dengan benar

---

### Requirement: Penolakan Login untuk Akun Nonaktif (FR-AUTH-06, BR-16)
Sistem SHALL menolak proses login bagi akun yang memiliki `profiles.is_active = false` atau akun yang terkena *ban* di Auth. Sistem SHALL menampilkan pesan eksplisit "Akun dinonaktifkan, hubungi pustakawan".

#### Scenario: Akun nonaktif gagal login (TC-AUTH-05)
- **WHEN** pengguna dengan akun berstatus nonaktif mencoba login dengan kredensial yang cocok
- **THEN** sistem menolak login dan menampilkan pesan "Akun dinonaktifkan, hubungi pustakawan" (`MEMBER_INACTIVE`)
