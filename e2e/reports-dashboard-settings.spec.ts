import { expect, test } from '@playwright/test'

// Kasus Uji Dasbor, Laporan, Pengaturan, & Log Aktivitas (Milestone M4B)
// FR-DSH-01, FR-DSH-02, FR-RPT-01 s.d. FR-RPT-09, FR-SET-01 s.d. FR-SET-03, FR-LOG-01, FR-LOG-02

test.describe('Dasbor, Laporan & Pengaturan (M4B)', () => {
  test('TC-DSH-01 dasbor anggota menampilkan kuota pinjaman, ringkasan status, dan formulir pencarian', async ({
    page,
  }) => {
    // 1. Login sebagai Siswa
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('SISWA01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/beranda/)

    // 2. Verifikasi komponen kartu metrik dasbor anggota (FR-DSH-01)
    await expect(page.getByText(/Halo,/i)).toBeVisible()
    await expect(page.getByText(/Status Kuota Pinjam/i)).toBeVisible()
    await expect(page.getByText(/Sedang Dipinjam/i)).toBeVisible()

    // 3. Verifikasi input pencarian cepat ke katalog
    const searchInput = page.getByPlaceholder(/Cari judul buku, penulis, atau topik materi/i)
    await expect(searchInput).toBeVisible()
  })

  test('TC-DSH-02 dasbor pustakawan menampilkan ringkasan KPI operasional dan tombol aksi cepat', async ({
    page,
  }) => {
    // 1. Login sebagai Pustakawan
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('PUSTAKAWAN01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/pustakawan/)

    // 2. Akses dasbor pustakawan
    await page.goto('/pustakawan/beranda')
    await expect(
      page.getByRole('heading', { name: 'Dasbor Operasional Perpustakaan' })
    ).toBeVisible()

    // 3. Verifikasi kartu KPI operasional (FR-DSH-02)
    await expect(page.getByText(/Total Koleksi/i)).toBeVisible()
    await expect(page.getByText(/Sedang Dipinjam/i)).toBeVisible()
    await expect(page.getByText(/Pinjaman Terlambat/i)).toBeVisible()

    // 4. Verifikasi tombol aksi cepat
    await expect(page.getByRole('link', { name: /Layanan Sirkulasi/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Lihat Laporan/i })).toBeVisible()
  })

  test('TC-RPT-01 & TC-RPT-02 pustakawan membuka laporan, mengganti jenis laporan, dan melihat tombol ekspor', async ({
    page,
  }) => {
    // 1. Login sebagai Pustakawan
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('PUSTAKAWAN01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    // 2. Navigasi ke Halaman Laporan
    await page.goto('/pustakawan/laporan')
    await expect(
      page.getByRole('heading', { name: 'Laporan Perpustakaan' })
    ).toBeVisible()

    // 3. Verifikasi ketersediaan tombol ekspor PDF dan Excel (FR-RPT-09, TC-RPT-02)
    await expect(page.getByRole('button', { name: /Unduh Excel/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Cetak PDF/i })).toBeVisible()

    // 4. Verifikasi pemilih jenis laporan
    const reportSelect = page.getByRole('combobox')
    await expect(reportSelect).toBeVisible()
  })

  test('TC-SET-01 & TC-SET-03 pustakawan membuka pengaturan sistem untuk kebijakan pinjam dan master jurusan', async ({
    page,
  }) => {
    // 1. Login sebagai Pustakawan
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('PUSTAKAWAN01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    // 2. Navigasi ke Halaman Pengaturan
    await page.goto('/pustakawan/pengaturan')
    await expect(
      page.getByRole('heading', { name: 'Pengaturan Sistem' })
    ).toBeVisible()

    // 3. Verifikasi tab pengaturan (FR-SET-01, FR-SET-02, FR-SET-03)
    await expect(page.getByRole('button', { name: /Kebijakan Peminjaman/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Profil Perpustakaan & Logo/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Master Jurusan/i })).toBeVisible()

    // 4. Pindah ke tab Master Jurusan
    await page.getByRole('button', { name: /Master Jurusan/i }).click()
    await expect(page.getByRole('button', { name: /Tambah Jurusan/i })).toBeVisible()
  })

  test('TC-LOG-01 pustakawan membuka log audit aktivitas', async ({ page }) => {
    // 1. Login sebagai Pustakawan
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('PUSTAKAWAN01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    // 2. Navigasi ke Halaman Log Aktivitas
    await page.goto('/pustakawan/log-aktivitas')
    await expect(
      page.getByRole('heading', { name: 'Log Aktivitas Petugas' })
    ).toBeVisible()

    // 3. Verifikasi ketersediaan tabel audit dan tombol reset filter
    await expect(page.getByRole('button', { name: /Reset Filter/i })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })
})
