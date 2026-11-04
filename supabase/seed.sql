-- Seed data fiktif untuk pengembangan lokal (PRD §13.6: dilarang memakai data riil siswa)

-- 1. Referensi Jurusan (Majors)
insert into public.majors (code, name, is_active) values
  ('TKJ', 'Teknik Komputer dan Jaringan', true),
  ('RPL', 'Rekayasa Perangkat Lunak', true),
  ('AKL', 'Akuntansi dan Keuangan Lembaga', true),
  ('MPLB', 'Manajemen Perkantoran dan Layanan Bisnis', true),
  ('TBSM', 'Teknik dan Bisnis Sepeda Motor', true),
  ('TB', 'Tata Busana', true)
on conflict (code) do nothing;

-- 2. Kategori Buku (Categories)
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

-- 3. Buku & Eksemplar Percontohan
insert into public.books (
  id, title, authors, publisher, publication_year, isbn, category_id, synopsis, call_number, language
) overriding system value values
  (
    1,
    'Jaringan Komputer Berbasis Mikrotik',
    'Iwan Sofana',
    'Informatika Bandung',
    2022,
    '9786026232236',
    (select id from public.categories where ddc_code = '000' limit 1),
    'Buku teks praktikum konfigurasi jaringan routing dan switching Mikrotik RouterOS untuk SMK TKJ.',
    '004.65 SOF j',
    'Indonesia'
  ),
  (
    2,
    'Dasar-Dasar Rekayasa Perangkat Lunak',
    'Rossa A. S., M. Shalahuddin',
    'Informatika',
    2021,
    '9786028758871',
    (select id from public.categories where ddc_code = '000' limit 1),
    'Konsep analisa kebutuhan, pemodelan UML, basis data, dan siklus hidup pengembangan perangkat lunak.',
    '005.1 ROS d',
    'Indonesia'
  ),
  (
    3,
    'Pemeliharaan Mesin Sepeda Motor',
    'Z. Furqon, Drs. Joko Pramono',
    'Andi Offset',
    2020,
    '9789792968569',
    (select id from public.categories where ddc_code = '600' limit 1),
    'Materi esensial perawatan berkala sistem bahan bakar, pelumasan, dan pendingin sepeda motor.',
    '629.287 FUR p',
    'Indonesia'
  )
on conflict (id) do nothing;

-- 4. Eksemplar Buku Percontohan
insert into public.book_copies (book_id, code, status, source, acquired_at, price) values
  (1, 'B000001', 'available', 'government', '2023-01-15', 85000),
  (1, 'B000002', 'available', 'government', '2023-01-15', 85000),
  (1, 'B000003', 'available', 'government', '2023-01-15', 85000),
  (2, 'B000004', 'available', 'purchase', '2023-02-10', 95000),
  (2, 'B000005', 'available', 'purchase', '2023-02-10', 95000),
  (3, 'B000006', 'available', 'donation', '2023-03-01', 75000)
on conflict (code) do nothing;
