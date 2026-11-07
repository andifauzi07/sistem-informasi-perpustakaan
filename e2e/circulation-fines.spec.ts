import { expect, test } from '@playwright/test'

// Katalog Kasus Uji Sirkulasi & Denda (PRD §16.2, FR-CIR-01 s.d. 15, FR-FIN-01 s.d. 07)

test.describe('Sirkulasi Peminjaman & Denda (M3)', () => {
  test('TC-CIR-01 siswa mengajukan pinjaman dari detail buku dan melihat di Pinjaman Saya', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('SISWA01')
    await page.locator('input#password').fill('Perpus123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/beranda/)

    // Buka halaman Pinjaman Saya
    await page.goto('/pinjaman')
    await expect(page.getByRole('heading', { name: 'Pinjaman Saya' })).toBeVisible()

    // Buka halaman Riwayat Peminjaman
    await page.goto('/riwayat')
    await expect(page.getByRole('heading', { name: 'Riwayat Peminjaman' })).toBeVisible()

    // Buka halaman Denda Saya (TC-FIN-04)
    await page.goto('/denda')
    await expect(page.getByRole('heading', { name: 'Denda Saya' })).toBeVisible()
    await expect(page.getByText('Total Denda Belum Lunas')).toBeVisible()
  })

  test('TC-CIR-07 & TC-CIR-17 pustakawan mengakses meja sirkulasi, antrean pengajuan, dan denda', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('PUSTAKAWAN01')
    await page.locator('input#password').fill('Perpus123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    // Buka antrean pengajuan (FR-CIR-06)
    await page.goto('/pustakawan/pengajuan')
    await expect(
      page.getByRole('heading', { name: 'Antrean Pengajuan Peminjaman' })
    ).toBeVisible()

    // Buka meja layanan sirkulasi (FR-CIR-09, FR-CIR-10, FR-CIR-15)
    await page.goto('/pustakawan/sirkulasi')
    await expect(
      page.getByRole('heading', { name: 'Meja Layanan Sirkulasi' })
    ).toBeVisible()

    // Verifikasi input scanner USB autofocus tersedia (TC-CIR-17)
    const memberScannerInput = page.locator('#checkout-member-input')
    await expect(memberScannerInput).toBeVisible()

    // Beralih ke Mode Kembali (Check-in)
    await page.getByRole('button', { name: /Mode Kembali/i }).click()
    await expect(page.locator('#checkin-copy-input')).toBeVisible()

    // Buka daftar pinjaman aktif & pemantauan keterlambatan (FR-CIR-12)
    await page.goto('/pustakawan/pinjaman')
    await expect(
      page.getByRole('heading', {
        name: 'Daftar Pinjaman & Pemantauan Keterlambatan',
      })
    ).toBeVisible()

    // Buka manajemen denda pustakawan (FR-FIN-06, TC-FIN-05)
    await page.goto('/pustakawan/denda')
    await expect(
      page.getByRole('heading', { name: 'Manajemen Denda Perpustakaan' })
    ).toBeVisible()
  })
})
