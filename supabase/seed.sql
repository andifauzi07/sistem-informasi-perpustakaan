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
