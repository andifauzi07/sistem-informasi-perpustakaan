## 1. Basis Data, Storage & Keamanan Bahan Ajar

- [x] 1.1 Buat migrasi SQL tabel `teaching_materials`, RPC `increment_material_downloads`, dan bucket storage privat `materials` lengkap dengan RLS dan limit 10 MB (FR-MAT-01, FR-MAT-03, BR-19)
- [x] 1.2 Tulis tes pgTAP untuk memastikan siswa tidak dapat melakukan insert bahan ajar dan hanya guru/pustakawan yang dapat mengelola berkas (TC-MAT-04)
- [x] 1.3 Jalankan `supabase db reset`, perbarui tipe TypeScript (`npm run db:types`), dan verifikasi dengan `npm run db:test`

## 2. Lapisan API & Skema Zod Frontend

- [x] 2.1 Buat skema validasi Zod untuk metadata dan upload bahan ajar di `src/features/materials/schemas.ts`
- [x] 2.2 Buat query key factory, queryOptions, dan mutations bahan ajar di `src/features/materials/api/` (termasuk generator signed URL)
- [x] 2.3 Buat komponen generator kartu PDF dan QR Code di `src/features/cards/components/` dengan lazy loading `bwip-js` dan `@react-pdf/renderer`

## 3. Antarmuka Bahan Ajar Siswa & Guru

- [x] 3.1 Buat antarmuka penelusuran bahan ajar siswa di `src/routes/_app/bahan-ajar/index.tsx` dengan pencarian dan filter tingkat/jurusan (FR-MAT-03)
- [x] 3.2 Implementasikan tombol unduh dengan pemanggilan RPC `increment_material_downloads` dan unduhan via signed URL (FR-MAT-03, FR-MAT-05, TC-MAT-03)
- [x] 3.3 Buat halaman kelola bahan ajar guru di `src/routes/_app/guru/bahan-ajar/index.tsx` dengan formulir unggah berkas (FR-MAT-01, FR-MAT-02, TC-MAT-01, TC-MAT-02)
- [x] 3.4 Buat aksi pustakawan untuk menyembunyikan (*hide*) bahan ajar dengan dialog alasan wajib (FR-MAT-04, TC-MAT-05)

## 4. Antarmuka Cetak Kartu Anggota Pustakawan

- [x] 4.1 Buat halaman cetak kartu anggota di `src/routes/_app/pustakawan/kartu-anggota.tsx` dengan filter peran, kelas, dan jurusan
- [x] 4.2 Buat dialog cetak kartu individu ukuran ID-1 (85,6 × 54 mm) memuat logo sekolah, profil anggota, dan QR Code (FR-CARD-01, FR-CARD-03, BR-20, TC-CARD-01)
- [x] 4.3 Buat fitur cetak massal lembar A4 berisi 10 kartu per halaman dengan garis potong pembantu (FR-CARD-02, TC-CARD-02)

## 5. Pengujian & Penyiapan Bukti Reviewer

- [x] 5.1 Tulis tes unit Vitest untuk validasi berkas upload (ekstensi & ukuran) serta format kartu ID-1
- [x] 5.2 Tulis tes E2E Playwright untuk alur unggah materi oleh guru dan unduhan oleh siswa
- [x] 5.3 Catat entri kasus uji `TC-CARD-01`, `TC-CARD-02` dan `TC-MAT-01` s.d. `TC-MAT-05` di `docs/testing/black-box.md` agar siap diuji oleh reviewer manusia
- [x] 5.4 Jalankan /ponytail-review pada diff change ini dan terapkan temuan yang tidak melanggar PRD/CLAUDE.md
- [x] 5.5 Penuhi Definition of Done CLAUDE.md §13 (`typecheck` + `lint` + `test` + `build` lulus)
- [x] 5.6 Arsipkan change dengan perintah `openspec archive m4a-materials-cards` sebelum push ke remote branch GitHub
