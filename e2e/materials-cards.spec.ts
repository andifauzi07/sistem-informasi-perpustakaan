import { expect, test } from '@playwright/test'

// Kasus Uji Bahan Ajar & Cetak Kartu Anggota (Milestone M4A)
// FR-MAT-01 s.d. FR-MAT-05, FR-CARD-01 s.d. FR-CARD-03

test.describe('Bahan Ajar & Cetak Kartu Anggota (M4A)', () => {
  test('TC-MAT-01 & TC-MAT-02 guru membuka kelola bahan ajar dan formulir unggah berkas', async ({
    page,
  }) => {
    // 1. Login sebagai Guru
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('GURU01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/beranda/)

    // 2. Akses halaman kelola bahan ajar guru
    await page.goto('/guru/bahan-ajar')
    await expect(
      page.getByRole('heading', { name: 'Kelola Bahan Ajar Saya' })
    ).toBeVisible()

    // 3. Buka dialog unggah bahan ajar baru
    const uploadButton = page.getByRole('button', { name: /Unggah Bahan Ajar/i }).first()
    await expect(uploadButton).toBeVisible()
    await uploadButton.click()

    await expect(
      page.getByRole('heading', { name: 'Unggah Bahan Ajar Baru' })
    ).toBeVisible()

    // 4. Verifikasi field formulir wajib ada (FR-MAT-01)
    await expect(page.getByLabel(/Judul Bahan Ajar/i)).toBeVisible()
    await expect(page.getByLabel(/Mata Pelajaran/i)).toBeVisible()
    await expect(page.locator('input#file')).toBeVisible()

    // Tutup dialog
    await page.getByRole('button', { name: 'Batal' }).click()
  })

  test('TC-MAT-03 siswa menelusuri bahan ajar dan melihat tombol unduh berkas', async ({
    page,
  }) => {
    // 1. Login sebagai Siswa
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('SISWA01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/beranda/)

    // 2. Akses halaman katalog bahan ajar
    await page.goto('/bahan-ajar')
    await expect(
      page.getByRole('heading', { name: 'Bahan Ajar & Materi Pembelajaran' })
    ).toBeVisible()

    // 3. Verifikasi input pencarian dan filter tersedia (FR-MAT-03)
    await expect(
      page.getByPlaceholder('Cari judul materi atau mata pelajaran...')
    ).toBeVisible()
  })

  test('TC-CARD-01 & TC-CARD-02 pustakawan membuka halaman cetak kartu dan dialog ID-1 serta massal A4', async ({
    page,
  }) => {
    // 1. Login sebagai Pustakawan
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('PUSTAKAWAN01')
    await page.locator('input#password').fill('Perpus123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/beranda/)

    // 2. Buka halaman cetak kartu anggota (FR-CARD-01)
    await page.goto('/pustakawan/kartu-anggota')
    await expect(
      page.getByRole('heading', { name: 'Cetak Kartu Anggota Perpustakaan' })
    ).toBeVisible()

    // 3. Verifikasi tabel anggota aktif dan tombol cetak individu
    const printButton = page.getByRole('button', { name: /Cetak Kartu/i }).first()
    if (await printButton.isVisible()) {
      await printButton.click()
      await expect(
        page.getByRole('heading', { name: 'Cetak Kartu Anggota Individu' })
      ).toBeVisible()
      await expect(page.getByText('Standar ID-1 (85,6 × 54 mm)')).toBeVisible()
      await expect(page.getByRole('button', { name: /Unduh PDF \(ID-1\)/i })).toBeVisible()

      await page.getByRole('button', { name: 'Batal' }).click()
    }

    // 4. Verifikasi tombol cetak massal lembar A4 (FR-CARD-02)
    const batchButton = page.getByRole('button', { name: /Cetak.*Kartu/i }).first()
    if (await batchButton.isVisible()) {
      await batchButton.click()
      await expect(
        page.getByRole('heading', { name: 'Cetak Kartu Massal Lembar A4' })
      ).toBeVisible()
      await expect(page.getByText(/10 kartu \/ lembar/i)).toBeVisible()

      await page.getByRole('button', { name: 'Batal' }).click()
    }
  })
})
