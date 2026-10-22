# Pengujian Performance Efficiency

Hasil Lighthouse (NFR-PE-01) ditambahkan di sini mulai M5.

## Anggaran JS awal (NFR-PE-03)

Batas: JS awal (gzip) untuk rute login dan katalog ≤ 250 KB. Angka diambil dari keluaran `npm run build` (kolom gzip Vite). JS awal adalah *entry chunk* di `index.html` ditambah *chunk* rute yang dibuka.

| Tanggal | Milestone | Rute | Entry (gzip) | Chunk rute (gzip) | Total | Status |
|---|---|---|---|---|---|---|
| 2026-10-22 | M0 | `/` (rute sementara) | 157,54 KB | 0,17 KB | **157,71 KB** | Lulus |

Catatan M0:
- Isi *entry* adalah React 19, TanStack Router + Query, dan `@supabase/supabase-js`. Angka ini menjadi baseline.
- Rute katalog belum ada. Ukur ulang di M2.
- Tersisa ±92 KB untuk kode fitur rute anggota. Library berat wajib di-*lazy-load* (CLAUDE.md §8).
- CSS: 3,43 KB gzip. Font memakai font sistem, tanpa unduhan font web.
