-- pgTAP Tests: 05-reports-dashboard-settings.test.sql
-- Menguji isolasi akses, RLS, RPC dasbor & laporan, serta trigger log audit (M4B)

begin;
select plan(24);

-- 1. Struktur Tabel & Objek (Assertions 1..10)
select has_table('public', 'library_settings', 'Tabel library_settings harus ada');
select has_function('public', 'get_librarian_dashboard', 'RPC get_librarian_dashboard() harus ada');
select has_function('public', 'report_loans', ARRAY['date', 'date'], 'RPC report_loans() harus ada');
select has_function('public', 'report_returns', ARRAY['date', 'date'], 'RPC report_returns() harus ada');
select has_function('public', 'report_overdue', ARRAY['date'], 'RPC report_overdue() harus ada');
select has_function('public', 'report_fines', ARRAY['date', 'date'], 'RPC report_fines() harus ada');
select has_function('public', 'report_inventory', 'RPC report_inventory() harus ada');
select has_function('public', 'report_member_activity', ARRAY['date', 'date'], 'RPC report_member_activity() harus ada');
select has_function('public', 'report_popular_books', ARRAY['date', 'date', 'integer'], 'RPC report_popular_books() harus ada');
select results_eq(
  $$ select id, public, file_size_limit from storage.buckets where id = 'library-assets' $$,
  $$ values ('library-assets'::text, true, 2097152::bigint) $$,
  'Bucket library-assets harus publik dengan batas 2 MB'
);

-- 2. Siapkan Pengguna Uji (Siswa M4B & Pustakawan M4B)
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '88888888-8888-4888-8888-888888888888',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'siswa_m4b@anggota.sip.local',
    'secret',
    now(),
    '{"role": "student"}'::jsonb,
    '{"member_code": "M4B.SISWA.01", "full_name": "Siswa Uji M4B", "class_name": "X RPL 1"}'::jsonb,
    now(),
    now()
  ),
  (
    '99999999-9999-4999-9999-999999999999',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'pustakawan_m4b@anggota.sip.local',
    'secret',
    now(),
    '{"role": "librarian"}'::jsonb,
    '{"member_code": "M4B.PUS.01", "full_name": "Pustakawan Uji M4B", "position": "Pustakawan Utama"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

-- 3. Isolasi Akses: Siswa Ditolak Mengakses Dasbor & Laporan (Assertions 11..18)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "88888888-8888-4888-8888-888888888888", "role": "authenticated"}';

select throws_matching(
  $$ select public.get_librarian_dashboard() $$,
  'FORBIDDEN',
  'Siswa tidak boleh mengakses get_librarian_dashboard (FORBIDDEN)'
);

select throws_matching(
  $$ select * from public.report_loans('2026-01-01'::date, '2026-12-31'::date) $$,
  'FORBIDDEN',
  'Siswa tidak boleh mengakses report_loans (FORBIDDEN)'
);

select throws_matching(
  $$ select * from public.report_returns('2026-01-01'::date, '2026-12-31'::date) $$,
  'FORBIDDEN',
  'Siswa tidak boleh mengakses report_returns (FORBIDDEN)'
);

select throws_matching(
  $$ select * from public.report_overdue() $$,
  'FORBIDDEN',
  'Siswa tidak boleh mengakses report_overdue (FORBIDDEN)'
);

select throws_matching(
  $$ select * from public.report_fines('2026-01-01'::date, '2026-12-31'::date) $$,
  'FORBIDDEN',
  'Siswa tidak boleh mengakses report_fines (FORBIDDEN)'
);

select throws_matching(
  $$ select * from public.report_inventory() $$,
  'FORBIDDEN',
  'Siswa tidak boleh mengakses report_inventory (FORBIDDEN)'
);

select throws_matching(
  $$ select * from public.report_member_activity('2026-01-01'::date, '2026-12-31'::date) $$,
  'FORBIDDEN',
  'Siswa tidak boleh mengakses report_member_activity (FORBIDDEN)'
);

select throws_matching(
  $$ select * from public.report_popular_books('2026-01-01'::date, '2026-12-31'::date, 5) $$,
  'FORBIDDEN',
  'Siswa tidak boleh mengakses report_popular_books (FORBIDDEN)'
);

-- Siswa tidak boleh mengupdate library_settings (Assertion 19)
update public.library_settings set school_name = 'SMKN Ilegal' where id = 1;

select results_eq(
  $$ select school_name from public.library_settings where id = 1 $$,
  $$ values ('SMKN 1 Selayar') $$,
  'Siswa tidak boleh mengubah library_settings (RLS policy)'
);

-- 4. Pustakawan Memiliki Akses Penuh ke Dasbor, Laporan & Pengaturan (Assertions 20..24)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "99999999-9999-4999-9999-999999999999", "role": "authenticated"}';

select lives_ok(
  $$ select public.get_librarian_dashboard() $$,
  'Pustakawan dapat mengakses get_librarian_dashboard()'
);

select lives_ok(
  $$ select * from public.report_inventory() $$,
  'Pustakawan dapat mengakses report_inventory()'
);

select lives_ok(
  $$ select * from public.report_overdue() $$,
  'Pustakawan dapat mengakses report_overdue()'
);

select lives_ok(
  $$ update public.library_settings set address = 'Jl. Pahlawan No. 2, Benteng' where id = 1 $$,
  'Pustakawan dapat memperbarui profil perpustakaan library_settings'
);

-- Pembaruan loan_policies memicu trigger log audit (Assertion 24)
update public.loan_policies set daily_fine = 1500 where role = 'student';

select results_eq(
  $$
  select count(*)::integer
  from public.activity_logs
  where action = 'policy.updated'
    and entity_id = 'student'
  $$,
  $$ values (1::integer) $$,
  'Pembaruan loan_policies harus tercatat di activity_logs via trigger'
);

select * from finish();
rollback;
