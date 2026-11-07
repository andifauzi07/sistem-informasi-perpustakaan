-- Migration: 20261107120000_seed_default_categories.sql
-- Data referensi kategori buku standar DDC (Dewey Decimal Classification).
-- Ditaruh di migrasi (bukan hanya seed.sql) agar `supabase migration up` / `db push`
-- selalu menyediakan kategori awal, sehingga form Tambah Buku tidak gagal FK books_category_id_fkey.

insert into public.categories (name, ddc_code) values
  ('Karya Umum & Komputer', '000'),
  ('Filsafat & Psikologi', '100'),
  ('Agama', '200'),
  ('Ilmu Sosial', '300'),
  ('Bahasa', '400'),
  ('Sains & Matematika', '500'),
  ('Teknologi & Rekayasa', '600'),
  ('Kesenian & Olahraga', '700'),
  ('Kesusastraan', '800'),
  ('Sejarah & Geografi', '900')
on conflict (name) do nothing;
