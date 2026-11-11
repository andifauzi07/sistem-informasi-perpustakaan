## MODIFIED Requirements

### Requirement: Autentikasi Login dengan Nomor Induk (FR-AUTH-01)
Sistem SHALL menyediakan antarmuka login yang menerima nomor induk (NIS/NIP) dan password. Sistem SHALL menormalkan nomor induk menjadi `login_id` lalu melakukan autentikasi ke Supabase Auth dengan email sintetis `${login_id}@${VITE_AUTH_EMAIL_DOMAIN}`. Sistem SHALL segera memperbarui cache sesi dan profil pengguna pada TanStack Query secara langsung serta menginvalidasi router, sehingga pengguna langsung dialihkan ke `/beranda` (atau `/ganti-password` jika wajib ganti password) tanpa tertahan di halaman `/login`. Pesan galat autentikasi gagal SHALL selalu ditampilkan secara generik "Nomor induk atau password salah" tanpa membocorkan keberadaan nomor induk di sistem.

#### Scenario: Login siswa valid berhasil (TC-AUTH-01)
- **WHEN** siswa memasukkan nomor induk valid dan password yang benar
- **THEN** autentikasi berhasil, sesi dan profil langsung terisi di cache, dan pengguna dialihkan ke `/beranda` tanpa tertahan di `/login`

#### Scenario: Login gagal karena password salah (TC-AUTH-02)
- **WHEN** pengguna memasukkan nomor induk terdaftar dengan password salah
- **THEN** sistem menolak login dan menampilkan pesan galat generik "Nomor induk atau password salah"

#### Scenario: Login dengan nomor induk bertanda baca atau spasi (TC-AUTH-03)
- **WHEN** pengguna memasukkan nomor induk `21.10.0456` atau `2110 0456` dengan password yang benar
- **THEN** sistem menormalkan nomor induk menjadi `21100456` dan login berhasil

#### Scenario: Login gagal karena nomor induk tidak terdaftar
- **WHEN** pengguna memasukkan nomor induk yang tidak ada di sistem
- **THEN** sistem menolak login dan menampilkan pesan galat generik "Nomor induk atau password salah"

## ADDED Requirements

### Requirement: Pencegahan Akses Halaman Login oleh Pengguna Terotentikasi (FR-AUTH-01, FR-AUTH-03)
Sistem SHALL menerapkan guest guard via hook `beforeLoad` pada rute `/login`. Jika pengguna sudah memiliki sesi Supabase aktif dan profil berstatus aktif (`is_active = true`), sistem SHALL melarang penampilan formulir login dan langsung mengalihkan pengguna ke rute tujuan sesuai status akun.

#### Scenario: Pengguna dengan sesi aktif membuka rute login dialihkan ke beranda
- **WHEN** pengguna yang sudah terotentikasi membuka rute `/login`
- **THEN** sistem mengalihkan navigasi ke `/beranda`

#### Scenario: Pengguna yang belum mengganti password membuka rute login dialihkan ke ganti password
- **WHEN** pengguna dengan `must_change_password = true` membuka rute `/login`
- **THEN** sistem mengalihkan navigasi ke `/ganti-password`

#### Scenario: Pengguna belum login membuka rute login
- **WHEN** pengguna tanpa sesi aktif membuka rute `/login`
- **THEN** sistem mengizinkan akses dan menampilkan formulir login
