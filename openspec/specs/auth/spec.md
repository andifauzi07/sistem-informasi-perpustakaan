# auth Specification

## Purpose
Menyediakan mekanisme autentikasi dan otorisasi terpusat berbasis nomor induk (NIS/NIP) dengan email sintetis Supabase Auth, manajemen sesi, pemaksaan ganti password akun baru, profil mandiri, serta pembatasan akses berbasis peran (siswa, guru, pustakawan).

## Requirements

### Requirement: Normalisasi nomor induk menjadi login_id
Sistem SHALL menormalkan nomor induk dengan cara membuang semua karakter selain `A-Z`, `a-z`, `0-9`, lalu mengubahnya ke huruf kecil. Urutannya harus sama dengan kolom generated `profiles.login_id` (PRD §11.4). Normalisasi ini menjadi satu-satunya sumber di `src/features/auth/login-id.ts` untuk klien dan skrip (FR-AUTH-01, ADR-03).

#### Scenario: Nomor induk bertanda baca dan berspasi merujuk login_id yang sama (TC-AUTH-03)
- **WHEN** fungsi normalisasi menerima `21.10.0456` dan `2110 0456`
- **THEN** keduanya menghasilkan `21100456`

#### Scenario: Huruf dikecilkan
- **WHEN** fungsi normalisasi menerima `ABC-12`
- **THEN** hasilnya `abc12`

#### Scenario: Nomor induk sudah bersih tidak berubah
- **WHEN** fungsi normalisasi menerima `0071234567`
- **THEN** hasilnya `0071234567`

### Requirement: Email sintetis dari login_id
Sistem SHALL membentuk email login sebagai `<login_id>@<AUTH_EMAIL_DOMAIN>`. Domain diambil dari variabel lingkungan, bukan ditulis tetap di kode (ADR-03, PRD §12.3, §13.2).

#### Scenario: Email terbentuk dari domain lingkungan
- **WHEN** `AUTH_EMAIL_DOMAIN` bernilai `anggota.contoh-sekolah.sch.id` dan nomor induk `21.10.0456`
- **THEN** email yang dipakai adalah `21100456@anggota.contoh-sekolah.sch.id`

### Requirement: Konfigurasi Auth lokal setara dengan cloud
Supabase lokal SHALL menolak pendaftaran publik dan password yang kurang dari 8 karakter, sama dengan project cloud (PRD §13.1, §17.1).

#### Scenario: Pendaftaran publik ditolak
- **WHEN** klien memanggil `auth.signUp` ke Supabase lokal
- **THEN** permintaan ditolak dan tidak ada user baru di `auth.users`

#### Scenario: Password pendek ditolak
- **WHEN** akun dibuat via Admin API dengan password 7 karakter
- **THEN** pembuatan akun ditolak

### Requirement: Rahasia terpisah dari bundle dan repo
Secret key (`sb_secret_…`) MUST hanya dibaca lewat variabel tanpa prefix `VITE_`. Semua berkas `.env*` kecuali `.env.example` MUST tidak dilacak git. `.env.example` MUST mendaftar setiap variabel tanpa nilai rahasia (PRD §13.2).

#### Scenario: Berkas env tidak ikut di-commit
- **WHEN** `.env.local` dan `.env.sip-dev.local` ada di root proyek
- **THEN** `git status` tidak menampilkannya, sedangkan `.env.example` tetap terlacak

#### Scenario: Secret key tidak berprefix VITE_
- **WHEN** `.env.example` diperiksa
- **THEN** secret key hanya muncul sebagai `SUPABASE_SECRET_KEY`, tanpa variabel `VITE_*` yang memuat rahasia

### Requirement: Domain email sintetis terverifikasi sebelum dipakai
Setiap kandidat `AUTH_EMAIL_DOMAIN` SHALL lolos spike di project `sip-dev` sebelum dipakai untuk akun asli. Hasil spike SHALL dicatat di `docs/spike/r-03-email-sintetis.md` (ADR-03, R-03, PRD §17.1).

#### Scenario: Domain kandidat diterima dan login berhasil
- **WHEN** akun dibuat via Admin API dengan `email_confirm: true` dari nomor induk `21.10.0456`, lalu login dengan `2110 0456` dan password yang sama
- **THEN** login berhasil dan sesi terbentuk

#### Scenario: Domain contoh terlarang dicatat sebagai kontrol
- **WHEN** spike dijalankan dengan domain `example.com`
- **THEN** hasilnya (diterima atau ditolak beserta pesan galatnya) dicatat di laporan sebagai pembanding

#### Scenario: Akun nonaktif tidak dapat login (dasar TC-AUTH-05)
- **WHEN** akun uji di-ban dengan `ban_duration` lalu login dengan password benar
- **THEN** login ditolak, dan kode galat yang dikembalikan Auth dicatat di laporan sebagai bahan pemetaan pesan FR-AUTH-06

#### Scenario: Akun uji dibersihkan
- **WHEN** spike selesai, baik lulus maupun gagal
- **THEN** tidak ada akun uji spike yang tersisa di `auth.users` project tujuan

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

### Requirement: Logout Pengguna dan Pembersihan Sesi (FR-AUTH-02)
Sistem SHALL menyediakan aksi logout pada menu navigasi akun di seluruh halaman. Saat logout dipanggil, sistem SHALL menghapus sesi lokal Supabase dan mengarahkan pengguna kembali ke halaman login. Riwayat browser tidak boleh memungkinkan pengguna kembali ke halaman terproteksi.

#### Scenario: Logout berhasil dan sesi dibersihkan (TC-AUTH-07)
- **WHEN** pengguna menekan tombol "Logout" dari menu akun
- **THEN** sesi lokal dihapus, pengguna diarahkan ke `/login`, dan penekanan tombol kembali (*back*) di peramban tidak menampilkan data pengguna yang terproteksi

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

### Requirement: Halaman Profil dan Ganti Password Mandiri (FR-AUTH-04)
Sistem SHALL menyediakan halaman `/profil` yang menampilkan identitas diri pengguna (nama, nomor induk, peran, kelas/jurusan untuk siswa, mapel untuk guru, jabatan untuk pustakawan) secara *read-only*. Halaman profil juga SHALL menyediakan form ganti password mandiri yang mewajibkan password minimal 8 karakter dan konfirmasi kecocokan.

#### Scenario: Pengguna melihat profil diri sendiri
- **WHEN** pengguna membuka halaman `/profil`
- **THEN** sistem memuat dan menampilkan data diri pengguna sesuai kolom `profiles`

#### Scenario: Pengguna memperbarui password mandiri dari profil
- **WHEN** pengguna memasukkan password baru minimal 8 karakter yang valid pada form di `/profil`
- **THEN** password berhasil diperbarui dan sistem menampilkan notifikasi sukses

### Requirement: Otorisasi Berbasis Peran dan Pembatasan Rute (FR-AUTH-05)
Sistem SHALL menerapkan pembatasan rute pada layout `_app` dan `_app/pustakawan`. Rute `/pustakawan/*` hanya SHALL dapat diakses oleh pengguna dengan peran `librarian` aktif. Pengguna dengan peran `student` atau `teacher` yang mencoba mengakses rute `/pustakawan/*` SHALL dialihkan ke `/beranda` dengan notifikasi "Tidak memiliki akses" (`FORBIDDEN`).

#### Scenario: Siswa dialihkan saat mencoba mengakses rute pustakawan (TC-AUTH-06)
- **WHEN** pengguna dengan peran `student` membuka URL `/pustakawan/anggota` atau rute pustakawan lainnya
- **THEN** sistem mengalihkan pengguna ke `/beranda` dan menampilkan notifikasi "Tidak memiliki akses" (`FORBIDDEN`)

#### Scenario: Pustakawan dapat mengakses rute pustakawan
- **WHEN** pengguna dengan peran `librarian` membuka rute `/pustakawan/anggota`
- **THEN** halaman dimuat dan ditampilkan dengan benar

### Requirement: Penolakan Login untuk Akun Nonaktif (FR-AUTH-06, BR-16)
Sistem SHALL menolak proses login bagi akun yang memiliki `profiles.is_active = false` atau akun yang terkena *ban* di Auth. Sistem SHALL menampilkan pesan eksplisit "Akun dinonaktifkan, hubungi pustakawan".

#### Scenario: Akun nonaktif gagal login (TC-AUTH-05)
- **WHEN** pengguna dengan akun berstatus nonaktif mencoba login dengan kredensial yang cocok
- **THEN** sistem menolak login dan menampilkan pesan "Akun dinonaktifkan, hubungi pustakawan" (`MEMBER_INACTIVE`)
