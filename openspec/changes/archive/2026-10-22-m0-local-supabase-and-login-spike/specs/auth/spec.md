## ADDED Requirements

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
