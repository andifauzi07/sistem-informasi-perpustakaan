import path from 'node:path'
import { expect, test } from '@playwright/test'

// Katalog Kasus Uji Manajemen Anggota Pustakawan (PRD §16.2 & FR-MBR-01 s.d. FR-MBR-06)

test.describe('Manajemen Anggota Pustakawan (M1)', () => {
  test.beforeEach(async ({ page }) => {
    // Login sebagai Pustakawan
    await page.goto('/login')
    await page.getByLabel('NIS / NIP').fill('PUSTAKAWAN01')
    await page.locator('input#password').fill('Perpus123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/beranda/)
    await page.goto('/pustakawan/anggota')
    await expect(page).toHaveURL(/\/pustakawan\/anggota/)
    await expect(page.getByRole('heading', { name: 'Manajemen Anggota Perpustakaan' })).toBeVisible()
  })

  test('TC-MBR-01 tambah siswa → akun dan password sementara', async ({ page }) => {
    const uniqueCode = `2110${Date.now().toString().slice(-4)}`
    await page.getByRole('button', { name: 'Tambah Anggota' }).click()

    await expect(page.getByText('Tambah Anggota Baru')).toBeVisible()

    // Isi formulir penambahan siswa
    await page.locator('input#create-memberCode').fill(uniqueCode)
    await page.locator('input#create-fullName').fill('Siswa Baru E2E')
    await page.locator('input#create-className').fill('X TKJ 1')
    await page.locator('input#create-phone').fill('081234567890')

    await page.getByRole('button', { name: 'Simpan & Buat Akun' }).click()

    // Dialog password sementara 10 karakter tampil
    await expect(page.getByText('Akun Berhasil Dibuat!')).toBeVisible({ timeout: 15000 })
    const tempPasswordEl = page.locator('div[role="dialog"] span.font-mono.text-xl')
    await expect(tempPasswordEl).toBeVisible()
    const tempPassword = (await tempPasswordEl.textContent())?.trim() ?? ''
    expect(tempPassword.length).toBe(10)

    // Klik Selesai
    await page.getByRole('button', { name: 'Selesai' }).click()

    // Pastikan siswa baru terdaftar di tabel
    await expect(page.locator('tbody').getByText(uniqueCode)).toBeVisible()
  })

  test('TC-MBR-02 nomor induk duplikat → MEMBER_CODE_TAKEN', async ({ page }) => {
    await page.getByRole('button', { name: 'Tambah Anggota' }).click()

    // Gunakan nomor induk SISWA01 yang sudah ada di database
    await page.locator('input#create-memberCode').fill('SISWA01')
    await page.locator('input#create-fullName').fill('Siswa Duplikat')
    await page.locator('input#create-className').fill('X TKJ 1')

    await page.getByRole('button', { name: 'Simpan & Buat Akun' }).click()

    // Memverifikasi pesan galat penolakan kode duplikat
    await expect(page.getByText(/sudah terdaftar/i)).toBeVisible()
    await page.getByRole('button', { name: 'Batal' }).click()
  })

  test('TC-MBR-03 impor baris valid → dibuat', async ({ page }) => {
    await page.getByRole('button', { name: 'Impor Excel' }).click()
    await expect(page.getByText('Impor Anggota Massal')).toBeVisible()

    // Unggah file fixture valid langsung ke input type=file
    const fixturePath = path.resolve('e2e/fixtures/valid-members.xlsx')
    await page.locator('input[type="file"]').setInputFiles(fixturePath)

    // Verifikasi pratinjau tabel baris valid muncul
    const dialog = page.locator('div[role="dialog"]')
    await expect(dialog.getByText('Budi Santoso')).toBeVisible()
    await expect(dialog.getByText('Siti Rahma')).toBeVisible()
    await expect(dialog.getByText('Dra. Fatimah')).toBeVisible()

    // Klik proses impor
    await dialog.getByRole('button', { name: /Mulai Impor/i }).click()

    // Verifikasi hasil impor berhasil
    await expect(dialog.getByText('Akun Dibuat')).toBeVisible()
    await dialog.getByRole('button', { name: 'Tutup' }).click()
  })

  test('TC-MBR-04 impor dengan baris invalid → ditandai, sisanya diproses', async ({ page }) => {
    await page.getByRole('button', { name: 'Impor Excel' }).click()

    const fixturePath = path.resolve('e2e/fixtures/mixed-members.xlsx')
    await page.locator('input[type="file"]').setInputFiles(fixturePath)

    // Baris tidak valid ditandai
    await expect(page.getByText('Hendra Valid')).toBeVisible()
    await expect(page.getByText('Invalid Pendek')).toBeVisible()
    await expect(page.getByText(/Nomor induk harus antara 3–30 karakter/i)).toBeVisible()

    // Tombol proses hanya mengimpor 1 baris yang valid
    const processBtn = page.getByRole('button', { name: /Mulai Impor \(1 baris\)/i })
    await expect(processBtn).toBeVisible()
    await page.getByRole('button', { name: 'Batal' }).click()
  })

  test('TC-MBR-05 impor nomor induk yang sudah ada → diperbarui (BR-15)', async ({ page }) => {
    await page.getByRole('button', { name: 'Impor Excel' }).click()

    const fixturePath = path.resolve('e2e/fixtures/existing-members.xlsx')
    await page.locator('input[type="file"]').setInputFiles(fixturePath)

    await expect(page.getByText('Ahmad Siswa Terupdate')).toBeVisible()
    await page.getByRole('button', { name: /Mulai Impor/i }).click()

    // Verifikasi status diperbarui
    await expect(page.getByText('diperbarui').first()).toBeVisible()
    await page.getByRole('button', { name: 'Tutup' }).click()
  })

  test('TC-MBR-06 reset password → password sementara & wajib ganti', async ({ page }) => {
    // Cari anggota SISWA01
    await page.getByPlaceholder('Cari nama atau nomor induk...').fill('SISWA01')
    const row = page.locator('tbody tr').filter({ hasText: 'SISWA01' }).first()
    await expect(row).toBeVisible()

    // Buka menu opsi baris SISWA01
    await row.getByRole('button', { name: 'Menu Opsi Anggota' }).click()
    await page.getByRole('menuitem', { name: /Reset Password/i }).click()

    // Konfirmasi reset
    await expect(page.getByText('Konfirmasi Reset Password')).toBeVisible()
    await page.getByRole('button', { name: 'Ya, Reset Password' }).click()

    // Password sementara baru tampil
    await expect(page.getByRole('heading', { name: 'Password Berhasil Direset!' })).toBeVisible()
    const tempPasswordEl = page.locator('div[role="dialog"] span.font-mono.text-xl')
    await expect(tempPasswordEl).toBeVisible()
    const newTempPassword = (await tempPasswordEl.textContent())?.trim() ?? ''
    expect(newTempPassword.length).toBe(10)

    await page.getByRole('button', { name: 'Selesai' }).click()

    // Logout pustakawan
    await page.getByRole('button', { name: 'Keluar / Logout' }).click()
    await expect(page).toHaveURL(/\/login/)

    // Login dengan password sementara baru
    await page.getByLabel('NIS / NIP').fill('SISWA01')
    await page.locator('input#password').fill(newTempPassword)
    await page.getByRole('button', { name: 'Masuk' }).click()

    // Wajib dialihkan ke /ganti-password
    await expect(page).toHaveURL(/\/ganti-password/)
    await expect(page.getByText('Wajib Ganti Password')).toBeVisible()
  })

  test('TC-MBR-07 nonaktifkan → tidak bisa login, lalu aktifkan kembali', async ({ page }) => {
    // Cari anggota SISWABARU01
    await page.getByPlaceholder('Cari nama atau nomor induk...').fill('SISWABARU01')
    const row = page.locator('tbody tr').filter({ hasText: 'SISWABARU01' }).first()
    await expect(row).toBeVisible()

    // Buka menu opsi baris anggota
    await row.getByRole('button', { name: 'Menu Opsi Anggota' }).click()
    await page.getByRole('menuitem', { name: /Nonaktifkan/i }).click()

    // Dialog konfirmasi penonaktifan
    await expect(page.getByText('Nonaktifkan Akun Anggota?')).toBeVisible()
    await page.getByRole('button', { name: 'Ya, Nonaktifkan' }).click()

    // Verifikasi toast & badge nonaktif
    await expect(page.getByText(/telah dinonaktifkan/i)).toBeVisible()

    // Logout pustakawan
    await page.getByRole('button', { name: 'Keluar / Logout' }).click()
    await expect(page).toHaveURL(/\/login/)

    // Coba login sebagai akun yang baru dinonaktifkan
    await page.getByLabel('NIS / NIP').fill('SISWABARU01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    // Ditolak login
    await expect(page.getByText(/Akun dinonaktifkan/i)).toBeVisible()

    // Login kembali sebagai pustakawan untuk mengaktifkan kembali
    await page.getByLabel('NIS / NIP').fill('PUSTAKAWAN01')
    await page.locator('input#password').fill('Perpus123!')
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expect(page).toHaveURL(/\/beranda/)

    await page.goto('/pustakawan/anggota')
    await expect(page).toHaveURL(/\/pustakawan\/anggota/)
    await page.getByPlaceholder('Cari nama atau nomor induk...').fill('SISWABARU01')

    const disabledRow = page.locator('tbody tr').filter({ hasText: 'SISWABARU01' }).first()
    await expect(disabledRow).toBeVisible()
    await disabledRow.getByRole('button', { name: 'Menu Opsi Anggota' }).click()
    await page.getByRole('menuitem', { name: /Aktifkan/i }).click()

    await expect(page.getByText('Aktifkan Kembali Akun Anggota?')).toBeVisible()
    await page.getByRole('button', { name: 'Ya, Aktifkan Kembali' }).click()

    await expect(page.getByText(/berhasil diaktifkan kembali/i)).toBeVisible()
  })
})
