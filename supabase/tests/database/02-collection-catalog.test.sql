begin;
select plan(20);

-- 1. Struktur Tabel & View
select has_table('public', 'categories', 'Tabel categories harus ada');
select has_table('public', 'books', 'Tabel books harus ada');
select has_table('public', 'book_copies', 'Tabel book_copies harus ada');
select has_view('public', 'v_book_availability', 'View v_book_availability harus ada');

-- 2. Fungsi Helper & RPC
select has_function('public', 'add_book_copies', 'RPC add_book_copies() harus ada');
select has_function('public', 'set_copy_status', 'RPC set_copy_status() harus ada');
select has_function('public', 'delete_book', 'RPC delete_book() harus ada');
select has_function('public', 'search_catalog', 'RPC search_catalog() harus ada');

-- 3. Siapkan Pengguna Uji di auth.users (jika belum ada)
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'siswa@anggota.sip.local',
  'secret',
  now(),
  '{"role": "student"}'::jsonb,
  '{"member_code": "NIS.991", "full_name": "Siswa Uji M2", "class_name": "X TKJ 1"}'::jsonb,
  now(),
  now()
) on conflict (id) do nothing;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'pustakawan@anggota.sip.local',
  'secret',
  now(),
  '{"role": "librarian"}'::jsonb,
  '{"member_code": "PUS.991", "full_name": "Pustakawan Uji M2", "position": "Pustakawan"}'::jsonb,
  now(),
  now()
) on conflict (id) do nothing;

-- 4. Pengujian Akses Siswa (RLS Menolak Mutasi Langsung)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select throws_ok(
  $$ insert into public.categories (name) values ('Kategori Terlarang') $$,
  '42501',
  null,
  'RLS: Siswa dilarang menambah kategori'
);

select throws_ok(
  $$ insert into public.books (title, authors, category_id) values ('Buku Terlarang', 'Anonim', 1) $$,
  '42501',
  null,
  'RLS: Siswa dilarang menambah buku'
);

-- 5. Pengujian Akses Pustakawan
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "33333333-3333-3333-3333-333333333333"}';

-- 5.1 CRUD Kategori
insert into public.categories (id, name, ddc_code)
overriding system value
values (100, 'Teknik Komputer', '004');

select results_eq(
  $$ select name from public.categories where id = 100 $$,
  $$ values ('Teknik Komputer') $$,
  'Pustakawan berhasil membuat kategori buku'
);

-- 5.2 CRUD Buku & Validasi ISBN Duplikat (TC-COL-02)
insert into public.books (id, title, authors, publisher, publication_year, isbn, category_id, synopsis)
overriding system value
values (100, 'Pemrograman Python Modern', 'Guido van Rossum', 'Informatika', 2024, '978602000001', 100, 'Panduan Python lengkap');

select results_eq(
  $$ select title from public.books where id = 100 $$,
  $$ values ('Pemrograman Python Modern') $$,
  'Pustakawan berhasil menyimpan buku baru'
);

select throws_ok(
  $$ insert into public.books (title, authors, isbn, category_id) values ('Python Duplikat', 'Penulis B', '978602000001', 100) $$,
  '23505',
  null,
  'TC-COL-02: Menolak ISBN duplikat dengan unique constraint violation'
);

-- 5.3 RPC add_book_copies (TC-COL-03 & TC-COL-04)
-- Otomatis 2 eksemplar (TC-COL-03)
select lives_ok(
  $$ select * from public.add_book_copies(100, 2) $$,
  'TC-COL-03: Berhasil menambah 2 eksemplar otomatis'
);

-- Eksemplar manual dengan kode yang sudah ada (TC-COL-04)
select throws_ok(
  $$ select * from public.add_book_copies(100, 1, array['B000001']) $$,
  'P0001',
  'CODE_TAKEN',
  'TC-COL-04: Melempar CODE_TAKEN bila kode eksemplar sudah digunakan'
);

-- 5.4 RPC set_copy_status (TC-COL-06 & Transisi Ilegal)
select lives_ok(
  $$ select public.set_copy_status((select id from public.book_copies where code = 'B000001'), 'damaged', 'Halaman sobek') $$,
  'TC-COL-06: Berhasil mengubah status eksemplar available menjadi damaged'
);

select throws_ok(
  $$ select public.set_copy_status((select id from public.book_copies where code = 'B000001'), 'on_loan') $$,
  'P0001',
  'INVALID_STATUS_TRANSITION',
  'Melempar INVALID_STATUS_TRANSITION pada transisi manual ilegal'
);

-- 5.5 View Ketersediaan v_book_availability
select results_eq(
  $$ select total_copies, available_copies from public.v_book_availability where book_id = 100 $$,
  $$ values (2, 1) $$,
  'View v_book_availability menghitung eksemplar available dan total dengan tepat'
);

-- 5.6 RPC search_catalog (TC-CAT-01 & TC-CAT-02)
select results_eq(
  $$ select count(*)::integer from public.search_catalog('python', null, false) $$,
  $$ values (1) $$,
  'TC-CAT-01: Pencarian parsial case-insensitive menemukan judul buku'
);

select results_eq(
  $$ select count(*)::integer from public.search_catalog('python', null, true) $$,
  $$ values (1) $$,
  'TC-CAT-02: Filter available_only menampilkan buku yang memiliki eksemplar tersedia'
);

-- 5.7 RPC delete_book & Proteksi Riwayat Transaksi (TC-COL-07)
-- Buat mock tabel loans sementara untuk menguji BR-17
create table public.loans (
  id bigint generated always as identity primary key,
  copy_id bigint references public.book_copies(id)
);

insert into public.loans (copy_id)
values ((select id from public.book_copies where code = 'B000001'));

select throws_ok(
  $$ select public.delete_book(100) $$,
  'P0001',
  'BOOK_HAS_HISTORY',
  'TC-COL-07: Melempar BOOK_HAS_HISTORY bila buku memiliki riwayat peminjaman'
);

-- Hapus mock loans dan verifikasi penghapusan buku berhasil
drop table public.loans;

select lives_ok(
  $$ select public.delete_book(100) $$,
  'Berhasil menghapus buku yang tidak memiliki riwayat peminjaman'
);

select is_empty(
  $$ select * from public.books where id = 100 $$,
  'Data buku dan eksemplarnya terhapus'
);

select * from finish();
rollback;
