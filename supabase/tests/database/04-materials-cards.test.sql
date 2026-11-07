begin;
select plan(23);

-- 1. Struktur Tabel & Objek (Assertions 1..5)
select has_table('public', 'teaching_materials', 'Tabel teaching_materials harus ada');
select has_type('public', 'material_status', 'Tipe enum material_status harus ada');
select has_function('public', 'increment_material_downloads', 'RPC increment_material_downloads() harus ada');
select has_function('public', 'set_material_visibility', 'RPC set_material_visibility() harus ada');
select results_eq(
  $$ select id, public, file_size_limit from storage.buckets where id = 'materials' $$,
  $$ values ('materials'::text, false, 10485760::bigint) $$,
  'Bucket materials harus privat dengan batas 10 MB'
);

-- 2. Siapkan Pengguna Uji di auth.users (Guru 1, Guru 2, Siswa, Pustakawan)
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'guru_m4_a@anggota.sip.local',
    'secret',
    now(),
    '{"role": "teacher"}'::jsonb,
    '{"member_code": "M4.GURU.01", "full_name": "Guru Uji M4 A", "subject": "Informatika"}'::jsonb,
    now(),
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'guru_m4_b@anggota.sip.local',
    'secret',
    now(),
    '{"role": "teacher"}'::jsonb,
    '{"member_code": "M4.GURU.02", "full_name": "Guru Uji M4 B", "subject": "Matematika"}'::jsonb,
    now(),
    now()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'siswa_m4@anggota.sip.local',
    'secret',
    now(),
    '{"role": "student"}'::jsonb,
    '{"member_code": "M4.SISWA.01", "full_name": "Siswa Uji M4", "class_name": "X TKJ 1"}'::jsonb,
    now(),
    now()
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'pustakawan_m4@anggota.sip.local',
    'secret',
    now(),
    '{"role": "librarian"}'::jsonb,
    '{"member_code": "M4.PUS.01", "full_name": "Pustakawan Uji M4", "position": "Pustakawan"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

-- 3. Uji RLS INSERT: Siswa tidak diizinkan mengunggah bahan ajar (TC-MAT-04) (Assertion 6)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "66666666-6666-6666-6666-666666666666", "role": "authenticated"}';

select throws_matching(
  $$
  insert into public.teaching_materials (
    teacher_id, title, subject, file_path, file_name, mime_type, file_size
  ) values (
    '66666666-6666-6666-6666-666666666666', 'Materi Ilegal Siswa', 'TIK',
    '66666666-6666-6666-6666-666666666666/ilegal.pdf', 'ilegal.pdf', 'application/pdf', 1024
  )
  $$,
  'violates row-level security policy',
  'Siswa tidak diizinkan insert bahan ajar (TC-MAT-04)'
);

-- 4. Uji RLS INSERT: Guru dapat mengunggah bahan ajar miliknya (TC-MAT-01) (Assertions 7..8)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';

select lives_ok(
  $$
  insert into public.teaching_materials (
    id, teacher_id, title, subject, description, grade_level, file_path, file_name, mime_type, file_size
  ) overriding system value values (
    401, '44444444-4444-4444-4444-444444444444', 'Modul Jaringan Dasar', 'Informatika', 'Materi routing', 10,
    '44444444-4444-4444-4444-444444444444/modul-jaringan.pdf', 'modul-jaringan.pdf', 'application/pdf', 5242880
  )
  $$,
  'Guru dapat insert bahan ajar miliknya (TC-MAT-01)'
);

-- Guru tidak dapat insert dengan teacher_id guru lain
select throws_matching(
  $$
  insert into public.teaching_materials (
    teacher_id, title, subject, file_path, file_name, mime_type, file_size
  ) values (
    '55555555-5555-5555-5555-555555555555', 'Materi Palsu', 'Informatika',
    '55555555-5555-5555-5555-555555555555/palsu.pdf', 'palsu.pdf', 'application/pdf', 1024
  )
  $$,
  'violates row-level security policy',
  'Guru tidak dapat insert atas nama guru lain'
);

-- 5. Uji RLS UPDATE: Guru pemilik dapat update metadata, guru lain tidak (Assertions 9..10)
select lives_ok(
  $$
  update public.teaching_materials
  set title = 'Modul Jaringan Dasar Revisi'
  where id = 401
  $$,
  'Guru pemilik dapat mengubah judul bahan ajar'
);

set local "request.jwt.claims" to '{"sub": "55555555-5555-5555-5555-555555555555", "role": "authenticated"}';
update public.teaching_materials
set title = 'Diretas Guru B'
where id = 401;

select results_eq(
  $$ select title from public.teaching_materials where id = 401 $$,
  $$ values ('Modul Jaringan Dasar Revisi') $$,
  'Guru lain tidak dapat mengubah bahan ajar bukan miliknya'
);

-- 6. Uji RLS SELECT Siswa (TC-MAT-03) (Assertions 11..12)
set local "request.jwt.claims" to '{"sub": "66666666-6666-6666-6666-666666666666", "role": "authenticated"}';
select results_eq(
  $$ select count(*)::integer from public.teaching_materials where id = 401 $$,
  $$ values (1) $$,
  'Siswa dapat melihat bahan ajar yang terbit'
);

-- 7. Uji RPC increment_material_downloads (Assertions 13..14)
select lives_ok(
  'select public.increment_material_downloads(401)',
  'Siswa dapat memanggil RPC increment_material_downloads untuk materi terbit'
);

reset role;
select results_eq(
  $$ select download_count from public.teaching_materials where id = 401 $$,
  $$ values (1) $$,
  'Counter unduhan bahan ajar bertambah menjadi 1 (FR-MAT-05)'
);

-- 8. Uji RPC set_material_visibility (FR-MAT-04, TC-MAT-05) (Assertions 15..20)
-- Siswa tidak boleh memanggil set_material_visibility
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "66666666-6666-6666-6666-666666666666", "role": "authenticated"}';
select throws_matching(
  'select public.set_material_visibility(401, false, ''Konten salah'')',
  'FORBIDDEN',
  'Siswa tidak berhak mengubah visibilitas bahan ajar'
);

-- Pustakawan hide tanpa alasan harus VALIDATION_ERROR
set local "request.jwt.claims" to '{"sub": "77777777-7777-7777-7777-777777777777", "role": "authenticated"}';
select throws_matching(
  'select public.set_material_visibility(401, false, '''')',
  'VALIDATION_ERROR',
  'Penyembunyian bahan ajar wajib disertai alasan'
);

-- Pustakawan menyembunyikan bahan ajar
select lives_ok(
  'select public.set_material_visibility(401, false, ''Materi perlu revisi kurikulum'')',
  'Pustakawan berhasil menyembunyikan bahan ajar (TC-MAT-05)'
);

-- Siswa tidak lagi dapat melihat bahan ajar yang disembunyikan
set local "request.jwt.claims" to '{"sub": "66666666-6666-6666-6666-666666666666", "role": "authenticated"}';
select results_eq(
  $$ select count(*)::integer from public.teaching_materials where id = 401 $$,
  $$ values (0) $$,
  'Bahan ajar tersembunyi tidak muncul di sisi siswa'
);

-- Siswa tidak dapat mengunduh bahan ajar tersembunyi
select throws_matching(
  'select public.increment_material_downloads(401)',
  'FORBIDDEN',
  'Siswa tidak dapat mengunduh bahan ajar yang disembunyikan'
);

-- Pustakawan menampilkan kembali bahan ajar
set local "request.jwt.claims" to '{"sub": "77777777-7777-7777-7777-777777777777", "role": "authenticated"}';
select lives_ok(
  'select public.set_material_visibility(401, true)',
  'Pustakawan berhasil menampilkan kembali bahan ajar'
);

-- 9. Uji RLS DELETE (Assertions 21..24)
-- Siswa tidak dapat menghapus bahan ajar
set local "request.jwt.claims" to '{"sub": "66666666-6666-6666-6666-666666666666", "role": "authenticated"}';
delete from public.teaching_materials where id = 401;
select results_eq(
  $$ select count(*)::integer from public.teaching_materials where id = 401 $$,
  $$ values (1) $$,
  'Siswa tidak dapat menghapus bahan ajar'
);

-- Guru lain tidak dapat menghapus
set local "request.jwt.claims" to '{"sub": "55555555-5555-5555-5555-555555555555", "role": "authenticated"}';
delete from public.teaching_materials where id = 401;
select results_eq(
  $$ select count(*)::integer from public.teaching_materials where id = 401 $$,
  $$ values (1) $$,
  'Guru lain tidak dapat menghapus bahan ajar'
);

-- Guru pemilik dapat menghapus
set local "request.jwt.claims" to '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';
delete from public.teaching_materials where id = 401;
select results_eq(
  $$ select count(*)::integer from public.teaching_materials where id = 401 $$,
  $$ values (0) $$,
  'Guru pemilik dapat menghapus bahan ajar miliknya'
);

-- Pustakawan dapat menghapus bahan ajar apapun
reset role;
insert into public.teaching_materials (
  id, teacher_id, title, subject, file_path, file_name, mime_type, file_size
) overriding system value values (
  402, '44444444-4444-4444-4444-444444444444', 'Materi Uji Hapus Pustakawan', 'Informatika',
  '44444444-4444-4444-4444-444444444444/materi-402.pdf', 'materi-402.pdf', 'application/pdf', 1024
);

set local role authenticated;
set local "request.jwt.claims" to '{"sub": "77777777-7777-7777-7777-777777777777", "role": "authenticated"}';
delete from public.teaching_materials where id = 402;
select results_eq(
  $$ select count(*)::integer from public.teaching_materials where id = 402 $$,
  $$ values (0) $$,
  'Pustakawan dapat menghapus bahan ajar'
);

select * from finish();
rollback;
