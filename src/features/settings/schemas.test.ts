import { describe, it, expect } from 'vitest'
import {
  libraryProfileSchema,
  loanPolicySchema,
  majorFormSchema,
  validateLogoFile,
} from './schemas'

describe('features/settings/schemas', () => {
  describe('loanPolicySchema', () => {
    it('menerima kebijakan pinjam yang valid', () => {
      const valid = {
        role: 'student' as const,
        max_active_loans: 3,
        loan_days: 7,
        daily_fine: 1000,
        pickup_days: 2,
      }
      expect(loanPolicySchema.safeParse(valid).success).toBe(true)
    })

    it('menolak kuota pinjaman kurang dari 1', () => {
      const invalid = {
        role: 'student' as const,
        max_active_loans: 0,
        loan_days: 7,
        daily_fine: 1000,
        pickup_days: 2,
      }
      const res = loanPolicySchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })

    it('menolak denda harian bernilai negatif', () => {
      const invalid = {
        role: 'student' as const,
        max_active_loans: 3,
        loan_days: 7,
        daily_fine: -500,
        pickup_days: 2,
      }
      const res = loanPolicySchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })
  })

  describe('libraryProfileSchema', () => {
    it('menerima form profil perpustakaan lengkap', () => {
      const valid = {
        school_name: 'SMKN 1 Selayar',
        library_name: 'Perpustakaan SMKN 1 Selayar',
        address: 'Jl. Pahlawan No. 1, Benteng, Kepulauan Selayar',
        logo_path: null,
      }
      expect(libraryProfileSchema.safeParse(valid).success).toBe(true)
    })

    it('menolak jika nama sekolah atau nama perpustakaan kosong', () => {
      const invalid = {
        school_name: '',
        library_name: 'Perpus',
        address: 'Alamat lengkap',
      }
      expect(libraryProfileSchema.safeParse(invalid).success).toBe(false)
    })
  })

  describe('majorFormSchema', () => {
    it('menerima data jurusan yang valid', () => {
      const valid = {
        code: 'RPL',
        name: 'Rekayasa Perangkat Lunak',
        is_active: true,
      }
      const res = majorFormSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('menolak kode jurusan yang terlalu pendek', () => {
      expect(majorFormSchema.safeParse({ code: 'A', name: 'Jurusan', is_active: true }).success).toBe(false)
    })
  })

  describe('validateLogoFile', () => {
    it('menerima berkas gambar PNG/JPEG/WEBP yang ukurannya di bawah batas 2MB', () => {
      const file = { name: 'logo.png', size: 1000, type: 'image/png' }
      const res = validateLogoFile(file)
      expect(res.valid).toBe(true)
      expect(res.error).toBeUndefined()
    })

    it('menolak berkas dengan tipe MIME selain gambar yang didukung', () => {
      const file = { name: 'document.pdf', size: 1000, type: 'application/pdf' }
      const res = validateLogoFile(file)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('PNG, JPG, atau WebP')
    })

    it('menolak berkas yang melebihi ukuran batas maksimum (2MB)', () => {
      const bigFile = { name: 'logo.png', size: 3 * 1024 * 1024, type: 'image/png' }
      const res = validateLogoFile(bigFile)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('2 MB')
    })
  })
})
