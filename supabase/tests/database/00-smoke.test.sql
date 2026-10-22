-- Tes asap: membuktikan `supabase test db` berjalan sebelum ada migrasi.
-- Hapus saat tes RLS pertama (M1) ditulis.
begin;
select plan(2);
select has_schema('public');
select has_extension('pgtap');
select * from finish();
rollback;
