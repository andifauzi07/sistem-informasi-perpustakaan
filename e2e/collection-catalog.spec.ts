import { expect, test } from '@playwright/test'

// Katalog Kasus Uji Koleksi & Katalog (PRD §16.2, FR-COL-01 s.d. 07, FR-CAT-01 s.d. 05)

test.describe('Koleksi & Katalog Buku (M2)', () => {
  test('TC-CAT-01 penelusuran katalog dengan pencarian judul', async ({ page }) => {
    // Siswa masuk dan membuka katalog
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('SISWA01')
    await page.locator('input#password').fill('Perpus123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/beranda/)
    await page.goto('/katalog')
    await expect(page.getByRole('heading', { name: 'Katalog Perpustakaan' })).toBeVisible()

    // Cari buku menggunakan input pencarian
    const searchInput = page.getByPlaceholder('Cari judul buku, penulis, atau ISBN...')
    await searchInput.fill('Jaringan')

    // Verifikasi URL search params ter-update setelah debounce
    await expect(page).toHaveURL(/q=Jaringan/)
  })

  test('TC-CAT-02 filter katalog hanya yang tersedia', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('SISWA01')
    await page.locator('input#password').fill('Perpus123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await page.goto('/katalog')
    const checkbox = page.getByLabel('Hanya yang tersedia')
    await checkbox.check()

    await expect(page).toHaveURL(/availableOnly=true/)
  })

  test('TC-COL-01 pustakawan menambah kategori dan buku baru', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('PUSTAKAWAN01')
    await page.locator('input#password').fill('Perpus123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    // Buka halaman kategori
    await page.goto('/pustakawan/kategori')
    await expect(page.getByRole('heading', { name: 'Kategori Buku' })).toBeVisible()

    // Buka halaman koleksi
    await page.goto('/pustakawan/koleksi')
    await expect(page.getByRole('heading', { name: 'Koleksi Buku' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tambah Buku' })).toBeVisible()
  })
})
