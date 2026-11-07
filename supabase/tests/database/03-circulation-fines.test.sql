begin;
select plan(42);

-- 1. Struktur Tabel & View (Assertions 1..4)
select has_table('public', 'loan_requests', 'Tabel loan_requests harus ada');
select has_table('public', 'loans', 'Tabel loans harus ada');
select has_table('public', 'fines', 'Tabel fines harus ada');
select has_view('public', 'v_loans', 'View v_loans harus ada');

-- 2. Fungsi Helper & RPC (Assertions 5..15)
select has_function('public', 'request_loan', 'RPC request_loan() harus ada');
select has_function('public', 'cancel_loan_request', 'RPC cancel_loan_request() harus ada');
select has_function('public', 'request_return', 'RPC request_return() harus ada');
select has_function('public', 'approve_loan_request', 'RPC approve_loan_request() harus ada');
select has_function('public', 'reject_loan_request', 'RPC reject_loan_request() harus ada');
select has_function('public', 'checkout_copy', 'RPC checkout_copy() harus ada');
select has_function('public', 'checkin_copy', 'RPC checkin_copy() harus ada');
select has_function('public', 'mark_loan_lost', 'RPC mark_loan_lost() harus ada');
select has_function('public', 'pay_fine', 'RPC pay_fine() harus ada');
select has_function('public', 'waive_fine', 'RPC waive_fine() harus ada');
select has_function('private', 'expire_overdue_pickups', 'Fungsi private.expire_overdue_pickups() harus ada');

-- 3. Siapkan Data Uji (Pengguna, Kategori, Buku, Eksemplar)
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'siswa_m3_a@anggota.sip.local',
    'secret',
    now(),
    '{"role": "student"}'::jsonb,
    '{"member_code": "M3.SISWA.01", "full_name": "Siswa Uji M3 A", "class_name": "XI TKJ 1"}'::jsonb,
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'siswa_m3_b@anggota.sip.local',
    'secret',
    now(),
    '{"role": "student"}'::jsonb,
    '{"member_code": "M3.SISWA.02", "full_name": "Siswa Uji M3 B", "class_name": "XI TKJ 2"}'::jsonb,
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'pustakawan_m3@anggota.sip.local',
    'secret',
    now(),
    '{"role": "librarian"}'::jsonb,
    '{"member_code": "M3.PUS.01", "full_name": "Pustakawan Uji M3", "position": "Kepala Perpustakaan"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

insert into public.categories (id, name, ddc_code)
overriding system value
values (200, 'Kategori Sirkulasi M3', '005')
on conflict (id) do nothing;

insert into public.books (id, title, authors, category_id, language)
overriding system value
values
  (201, 'Buku Algoritma M3', 'Penulis A', 200, 'Indonesia'),
  (202, 'Buku Stok Kosong M3', 'Penulis B', 200, 'Indonesia'),
  (203, 'Buku Basis Data M3', 'Penulis C', 200, 'Indonesia'),
  (204, 'Buku Jaringan M3', 'Penulis D', 200, 'Indonesia')
on conflict (id) do nothing;

insert into public.book_copies (id, book_id, code, status, price)
overriding system value
values
  (2011, 201, 'C201-1', 'available', 80000),
  (2012, 201, 'C201-2', 'available', 80000),
  (2031, 203, 'C203-1', 'available', 90000),
  (2041, 204, 'C204-1', 'available', 75000)
on conflict (id) do nothing;

-- 4. Pengujian RLS Penolakan Mutasi Langsung oleh Siswa (Assertions 16..18)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select throws_ok(
  $$ insert into public.loan_requests (member_id, book_id) values ('11111111-1111-1111-1111-111111111111', 201) $$,
  '42501',
  null,
  'RLS: Siswa dilarang INSERT langsung ke tabel loan_requests'
);

select throws_ok(
  $$ insert into public.loans (copy_id, member_id, due_date, daily_fine_snapshot, checked_out_by) values (2011, '11111111-1111-1111-1111-111111111111', current_date + 7, 500, '33333333-3333-3333-3333-333333333333') $$,
  '42501',
  null,
  'RLS: Siswa dilarang INSERT langsung ke tabel loans'
);

select throws_ok(
  $$ insert into public.fines (loan_id, member_id, type, amount) values (1, '11111111-1111-1111-1111-111111111111', 'damage', 10000) $$,
  '42501',
  null,
  'RLS: Siswa dilarang INSERT langsung ke tabel fines'
);

-- 5. Pengajuan Pinjam oleh Siswa A (Assertions 19..22)
select lives_ok(
  $$ select public.request_loan(201) $$,
  'TC-CIR-01: Siswa A berhasil mengajukan peminjaman untuk buku yang memiliki stok available'
);

select throws_ok(
  $$ select public.request_loan(201) $$,
  'P0001',
  'DUPLICATE_TITLE',
  'TC-CIR-04: Menolak pengajuan kedua untuk judul yang sama (DUPLICATE_TITLE)'
);

select throws_ok(
  $$ select public.request_loan(202) $$,
  'P0001',
  'NO_AVAILABLE_COPY',
  'TC-CIR-02: Menolak pengajuan saat stok buku 0 (NO_AVAILABLE_COPY)'
);

select throws_ok(
  $$ select public.approve_loan_request((select id from public.loan_requests where book_id = 201 and member_id = '11111111-1111-1111-1111-111111111111' limit 1)) $$,
  'P0001',
  'FORBIDDEN',
  'TC-SEC-02: Siswa dilarang memanggil RPC approve_loan_request milik pustakawan'
);

-- 6. Persetujuan Pustakawan & Pembatalan Anggota (Assertions 23..26)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "33333333-3333-3333-3333-333333333333"}';

select lives_ok(
  $$ select public.approve_loan_request((select id from public.loan_requests where book_id = 201 and status = 'pending' limit 1), 2011) $$,
  'TC-CIR-05: Pustakawan berhasil menyetujui pengajuan dan mengalokasikan eksemplar'
);

select results_eq(
  $$ select status::text from public.book_copies where id = 2011 $$,
  $$ values ('reserved') $$,
  'TC-CIR-05: Status eksemplar yang dialokasikan berubah menjadi reserved'
);

-- Siswa A membatalkan pengajuan approved (TC-CIR-11)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select lives_ok(
  $$ select public.cancel_loan_request((select id from public.loan_requests where book_id = 201 and status = 'approved' limit 1)) $$,
  'TC-CIR-11: Siswa A berhasil membatalkan pengajuan yang sudah disetujui'
);

select results_eq(
  $$ select status::text from public.book_copies where id = 2011 $$,
  $$ values ('available') $$,
  'TC-CIR-11: Eksemplar yang dialokasikan kembali menjadi available setelah dibatalkan'
);

-- 7. Penolakan Pengajuan & Kedaluwarsa Otomatis (Assertions 27..29)
-- Siswa A mengajukan lagi untuk buku 201
select public.request_loan(201);

set local role authenticated;
set local "request.jwt.claims" to '{"sub": "33333333-3333-3333-3333-333333333333"}';

select throws_ok(
  $$ select public.reject_loan_request((select id from public.loan_requests where book_id = 201 and status = 'pending' limit 1), '   ') $$,
  'P0001',
  'VALIDATION_ERROR',
  'TC-CIR-06: Menolak pengajuan tanpa alasan gagal dengan VALIDATION_ERROR'
);

select lives_ok(
  $$ select public.reject_loan_request((select id from public.loan_requests where book_id = 201 and status = 'pending' limit 1), 'Buku sedang diperbaiki jilidnya') $$,
  'TC-CIR-06: Pustakawan berhasil menolak pengajuan dengan alasan tertulis'
);

-- Uji kedaluwarsa otomatis (TC-CIR-10)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';
select public.request_loan(201);

set local role authenticated;
set local "request.jwt.claims" to '{"sub": "33333333-3333-3333-3333-333333333333"}';
select public.approve_loan_request((select id from public.loan_requests where book_id = 201 and status = 'pending' limit 1), 2011);

reset role;
update public.loan_requests
set pickup_deadline = now() - interval '2 hours'
where book_id = 201 and status = 'approved';

select private.expire_overdue_pickups();

set local role authenticated;
set local "request.jwt.claims" to '{"sub": "33333333-3333-3333-3333-333333333333"}';

select results_eq(
  $$ select status::text from public.book_copies where id = 2011 $$,
  $$ values ('available') $$,
  'TC-CIR-10: Fungsi expire_overdue_pickups() mengembalikan eksemplar menjadi available'
);

-- 8. Checkout dari Pengajuan, Isolasi RLS, Request Return, dan Check-in Tepat Waktu (Assertions 30..34)
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';
select public.request_loan(201);

set local role authenticated;
set local "request.jwt.claims" to '{"sub": "33333333-3333-3333-3333-333333333333"}';
select public.approve_loan_request((select id from public.loan_requests where book_id = 201 and status = 'pending' limit 1), 2011);

select lives_ok(
  $$ select public.checkout_copy('11111111-1111-1111-1111-111111111111', 'C201-1') $$,
  'TC-CIR-07: Pustakawan berhasil melakukan checkout dari pengajuan approved'
);

select results_eq(
  $$ select status::text from public.book_copies where id = 2011 $$,
  $$ values ('on_loan') $$,
  'TC-CIR-07: Status eksemplar menjadi on_loan setelah checkout'
);

-- TC-SEC-01: Siswa B tidak dapat melihat pinjaman Siswa A
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select results_eq(
  $$ select count(*)::integer from public.loans where member_id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values (0) $$,
  'TC-SEC-01: Siswa B tidak dapat membaca data pinjaman milik Siswa A'
);

-- TC-CIR-12: Siswa A mengajukan pengembalian
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select lives_ok(
  $$ select public.request_return((select id from public.loans where copy_id = 2011 and status = 'active' limit 1)) $$,
  'TC-CIR-12: Siswa A berhasil menandai pengajuan pengembalian (request_return)'
);

-- TC-CIR-13: Check-in tepat waktu tanpa denda
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "33333333-3333-3333-3333-333333333333"}';

select lives_ok(
  $$ select public.checkin_copy('C201-1', 'good') $$,
  'TC-CIR-13: Check-in tepat waktu kondisi baik berhasil tanpa kendala'
);

-- 9. Check-in Terlambat 3 Hari, Non-Pemblokiran Denda, Rusak, Hilang & Penyelesaian Denda (Assertions 35..42)
select public.checkout_copy('11111111-1111-1111-1111-111111111111', 'C201-2');

reset role;
update public.loans
set due_date = private.today_wita() - 3
where copy_id = 2012 and status = 'active';

set local role authenticated;
set local "request.jwt.claims" to '{"sub": "33333333-3333-3333-3333-333333333333"}';

select public.checkin_copy('C201-2', 'good');

select results_eq(
  $$ select amount from public.fines where member_id = '11111111-1111-1111-1111-111111111111' and type = 'late' limit 1 $$,
  $$ values (1500) $$,
  'TC-CIR-14: Check-in terlambat 3 hari otomatis menerbitkan denda 3 x Rp500 = Rp1.500'
);

-- TC-FIN-03 & TC-CIR-08: Anggota berdenda belum lunas tetap bisa meminjam (walk-in)
select lives_ok(
  $$ select public.checkout_copy('11111111-1111-1111-1111-111111111111', 'C203-1') $$,
  'TC-FIN-03 & TC-CIR-08: Anggota berdenda tetap diizinkan checkout walk-in (denda tidak memblokir)'
);

-- TC-CIR-15: Check-in kondisi rusak dengan nominal denda kerusakan
select lives_ok(
  $$ select public.checkin_copy('C203-1', 'damaged', 25000, 'Sampul robek') $$,
  'TC-CIR-15: Check-in kondisi rusak berhasil menerbitkan denda kerusakan'
);

-- TC-CIR-16: Tandai pinjaman hilang
select public.checkout_copy('11111111-1111-1111-1111-111111111111', 'C204-1');

select lives_ok(
  $$ select public.mark_loan_lost((select id from public.loans where copy_id = 2041 and status = 'active' limit 1), 75000, 'Hilang oleh peminjam') $$,
  'TC-CIR-16: Pustakawan berhasil menandai buku hilang dan menerbitkan denda kehilangan'
);

-- TC-FIN-01: Bayar denda tunai lunas
select lives_ok(
  $$ select public.pay_fine((select id from public.fines where member_id = '11111111-1111-1111-1111-111111111111' and type = 'late' limit 1)) $$,
  'TC-FIN-01: Pustakawan berhasil mencatat pelunasan denda tunai'
);

select throws_ok(
  $$ select public.pay_fine((select id from public.fines where member_id = '11111111-1111-1111-1111-111111111111' and type = 'late' limit 1)) $$,
  'P0001',
  'FINE_INVALID_STATE',
  'Menolak pembayaran ulang untuk denda yang sudah berstatus paid (FINE_INVALID_STATE)'
);

-- TC-FIN-02: Bebaskan denda dengan alasan wajib
select throws_ok(
  $$ select public.waive_fine((select id from public.fines where member_id = '11111111-1111-1111-1111-111111111111' and type = 'damage' limit 1), '') $$,
  'P0001',
  'VALIDATION_ERROR',
  'TC-FIN-02: Menolak pembebasan denda tanpa alasan tertulis (VALIDATION_ERROR)'
);

select lives_ok(
  $$ select public.waive_fine((select id from public.fines where member_id = '11111111-1111-1111-1111-111111111111' and type = 'damage' limit 1), 'Dispensasi kepala sekolah') $$,
  'TC-FIN-02: Pustakawan berhasil membebaskan denda dengan alasan tertulis'
);

select * from finish();
rollback;
