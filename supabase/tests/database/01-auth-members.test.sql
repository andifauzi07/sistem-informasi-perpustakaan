begin;
select plan(16);

-- 1. Struktur Tabel
select has_table('public', 'majors', 'Tabel majors harus ada');
select has_table('public', 'profiles', 'Tabel profiles harus ada');
select has_table('public', 'activity_logs', 'Tabel activity_logs harus ada');
select has_table('public', 'loan_policies', 'Tabel loan_policies harus ada');

-- 2. Fungsi Helper & RPC
select has_function('private', 'is_librarian', 'Helper private.is_librarian() harus ada');
select has_function('private', 'today_wita', 'Helper private.today_wita() harus ada');
select has_function('private', 'current_app_role', 'Helper private.current_app_role() harus ada');
select has_function('public', 'complete_password_change', 'RPC complete_password_change() harus ada');

-- 3. Siapkan Pengguna Uji di auth.users
-- Pengguna 1: Siswa A
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'nis001@anggota.sip.local',
  'secret',
  now(),
  '{"role": "student"}'::jsonb,
  '{"member_code": "NIS.001", "full_name": "Siswa Satu", "class_name": "X TKJ 1"}'::jsonb,
  now(),
  now()
);

-- Pengguna 2: Siswa B
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'nis002@anggota.sip.local',
  'secret',
  now(),
  '{"role": "student"}'::jsonb,
  '{"member_code": "NIS 002", "full_name": "Siswa Dua", "class_name": "X TKJ 2"}'::jsonb,
  now(),
  now()
);

-- Pengguna 3: Pustakawan
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'pus001@anggota.sip.local',
  'secret',
  now(),
  '{"role": "librarian"}'::jsonb,
  '{"member_code": "PUS001", "full_name": "Pustakawan Utama", "position": "Kepala Perpustakaan"}'::jsonb,
  now(),
  now()
);

-- Verifikasi trigger handle_new_user membuat profil dan normalisasi login_id
select results_eq(
  $$ select login_id from public.profiles where id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('nis001') $$,
  'Trigger handle_new_user menormalkan login_id dari NIS.001 menjadi nis001'
);

-- 4. Pengujian RLS: Siswa A (1111...)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Siswa A hanya melihat profil dirinya sendiri, tidak melihat Siswa B
select results_eq(
  $$ select count(*)::integer from public.profiles $$,
  $$ values (1) $$,
  'RLS: Siswa hanya dapat membaca profil dirinya sendiri'
);

-- Siswa A tidak dapat membaca activity_logs
select is_empty(
  $$ select * from public.activity_logs $$,
  'RLS: Siswa tidak dapat membaca activity_logs'
);

-- Siswa A tidak dapat mengubah nama atau kelas
select throws_ok(
  $$ update public.profiles set full_name = 'Nama Palsu' where id = '11111111-1111-1111-1111-111111111111' $$,
  'P0001',
  'FORBIDDEN',
  'Siswa dilarang mengubah data profil selain nomor telepon'
);

-- Siswa A dapat mengubah nomor telepon dirinya sendiri
update public.profiles set phone = '081234567890' where id = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$ select phone from public.profiles where id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('081234567890') $$,
  'Siswa berhasil memperbarui kontak telepon sendiri'
);

-- Siswa A mengeksekusi RPC complete_password_change()
select lives_ok(
  $$ select public.complete_password_change() $$,
  'Siswa dapat memanggil RPC complete_password_change()'
);

-- Verifikasi must_change_password bernilai false
select results_eq(
  $$ select must_change_password from public.profiles where id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values (false) $$,
  'must_change_password berubah menjadi false setelah RPC'
);

-- 5. Pengujian RLS: Pustakawan (3333...)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "33333333-3333-3333-3333-333333333333"}';

-- Pustakawan dapat melihat semua profil (termasuk profil anggota lain)
select results_eq(
  $$ select count(*)::integer from public.profiles where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333') $$,
  $$ values (3) $$,
  'RLS: Pustakawan dapat membaca seluruh profil'
);

select * from finish();
rollback;
