import { expect, test } from '@playwright/test'

// Katalog Kasus Uji Autentikasi (PRD §16.2 & FR-AUTH-01 s.d. FR-AUTH-06)

test.describe('Autentikasi (M1)', () => {
  test.beforeEach(async ({ page }) => {
    // Bersihkan sesi dan buka halaman login
    await page.goto('/login')
  })

  test('TC-AUTH-01 login siswa valid → beranda siswa', async ({ page }) => {
    await page.getByLabel('NIS / NIP').fill('SISWA01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/beranda/)
    await expect(page.getByRole('heading', { name: /Ahmad Siswa/i })).toBeVisible()
    await expect(page.getByRole('banner').getByText('Siswa', { exact: true })).toBeVisible()
  })

  test('TC-AUTH-02 password salah → pesan generik', async ({ page }) => {
    await page.getByLabel('NIS / NIP').fill('SISWA01')
    await page.locator('input#password').fill('PasswordSalah123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/login/)
    // Memverifikasi pesan toast generik (FR-AUTH-01)
    await expect(page.getByText('Nomor induk atau password salah')).toBeVisible()
  })

  test('TC-AUTH-03 nomor induk dengan spasi/titik → tetap berhasil', async ({ page }) => {
    // Normalisasi input (FR-AUTH-01): 'sis.wa 01' dinormalkan menjadi 'siswa01'
    await page.getByLabel('NIS / NIP').fill('sis.wa 01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/beranda/)
    await expect(page.getByRole('heading', { name: /Ahmad Siswa/i })).toBeVisible()
  })

  test('TC-AUTH-04 login pertama → dipaksa ganti password', async ({ page }) => {
    await page.getByLabel('NIS / NIP').fill('SISWABARU01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    // Harus langsung dialihkan ke /ganti-password
    await expect(page).toHaveURL(/\/ganti-password/)
    await expect(page.getByText('Wajib Ganti Password')).toBeVisible()

    // Memastikan tidak bisa kabur ke /beranda sebelum mengganti password
    await page.goto('/beranda')
    await expect(page).toHaveURL(/\/ganti-password/)

    // Lakukan ganti password
    await page.locator('input#newPassword').fill('PasswordBaru123!')
    await page.locator('input#confirmPassword').fill('PasswordBaru123!')
    await page.getByRole('button', { name: 'Simpan Password Baru' }).click()

    // Setelah berhasil dialihkan ke beranda
    await expect(page).toHaveURL(/\/beranda/)
    await expect(page.getByRole('heading', { name: /Siswa Baru/i })).toBeVisible()
  })

  test('TC-AUTH-05 akun nonaktif → ditolak', async ({ page }) => {
    await page.getByLabel('NIS / NIP').fill('NONAKTIF01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page).toHaveURL(/\/login/)
    // Memverifikasi pesan akun dinonaktifkan (FR-AUTH-06)
    await expect(page.getByText(/Akun dinonaktifkan/i)).toBeVisible()
  })

  test('TC-AUTH-06 siswa membuka /pustakawan/anggota → dialihkan', async ({ page }) => {
    // Login sebagai siswa
    await page.getByLabel('NIS / NIP').fill('SISWA01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expect(page).toHaveURL(/\/beranda/)

    // Coba akses rute khusus pustakawan
    await page.goto('/pustakawan/anggota')

    // Harus dialihkan kembali ke /beranda (FR-AUTH-05)
    await expect(page).toHaveURL(/\/beranda/)
    await expect(page.getByText(/tidak memiliki akses/i)).toBeVisible()
  })

  test('TC-AUTH-07 logout → kembali ke login; tombol back tidak membuka data', async ({ page }) => {
    // Login siswa
    await page.getByLabel('NIS / NIP').fill('SISWA01')
    await page.locator('input#password').fill('Password123!')
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expect(page).toHaveURL(/\/beranda/)

    // Klik tombol logout
    await page.getByRole('button', { name: 'Keluar / Logout' }).click()

    // Sesi dihapus dan kembali ke login
    await expect(page).toHaveURL(/\/login/)

    // Uji tombol back di browser
    await page.goBack()
    // Guard layout _app.tsx mendeteksi tidak ada sesi, memantulkan kembali ke /login
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible()
  })
})
