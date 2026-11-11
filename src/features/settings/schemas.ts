import { z } from 'zod'

export const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
export const ALLOWED_LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export function validateLogoFile(file: { name: string; size: number; type: string }): {
  valid: boolean
  error?: string
} {
  if (file.size > MAX_LOGO_FILE_SIZE) {
    return { valid: false, error: 'Ukuran logo tidak boleh melebihi 2 MB' }
  }

  const hasValidMime = (ALLOWED_LOGO_MIME_TYPES as readonly string[]).includes(file.type)
  const lowerName = file.name.toLowerCase()
  const hasValidExt = ['.png', '.jpg', '.jpeg', '.webp'].some((ext) => lowerName.endsWith(ext))

  if (!hasValidMime && !hasValidExt) {
    return { valid: false, error: 'Format berkas logo harus berupa PNG, JPG, atau WebP' }
  }

  return { valid: true }
}

// Skema Pengaturan Profil Perpustakaan (FR-SET-02)
export const libraryProfileSchema = z.object({
  school_name: z
    .string()
    .trim()
    .min(3, 'Nama sekolah minimal 3 karakter')
    .max(200, 'Nama sekolah maksimal 200 karakter'),
  library_name: z
    .string()
    .trim()
    .min(3, 'Nama perpustakaan minimal 3 karakter')
    .max(200, 'Nama perpustakaan maksimal 200 karakter'),
  address: z
    .string()
    .trim()
    .min(5, 'Alamat perpustakaan minimal 5 karakter')
    .max(500, 'Alamat maksimal 500 karakter'),
  logo_path: z.string().nullable().optional(),
})

export type LibraryProfileFormValues = z.infer<typeof libraryProfileSchema>

// Skema Kebijakan Peminjaman (FR-SET-01, BR-07)
export const loanPolicySchema = z.object({
  role: z.enum(['student', 'teacher'] as const),
  max_active_loans: z
    .number()
    .int('Harus berupa angka bulat')
    .min(1, 'Maksimal pinjaman minimal 1')
    .max(20, 'Maksimal pinjaman maksimal 20'),
  loan_days: z
    .number()
    .int('Harus berupa angka bulat')
    .min(1, 'Lama pinjam minimal 1 hari')
    .max(90, 'Lama pinjam maksimal 90 hari'),
  daily_fine: z
    .number()
    .int('Harus berupa angka bulat')
    .min(0, 'Denda per hari minimal Rp 0')
    .max(100000, 'Denda per hari maksimal Rp 100.000'),
  pickup_days: z
    .number()
    .int('Harus berupa angka bulat')
    .min(1, 'Batas ambil minimal 1 hari')
    .max(14, 'Batas ambil maksimal 14 hari'),
})

export type LoanPolicyFormValues = z.infer<typeof loanPolicySchema>

// Skema Master Jurusan (FR-SET-03)
export const majorFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Kode jurusan minimal 2 karakter')
    .max(20, 'Kode jurusan maksimal 20 karakter'),
  name: z
    .string()
    .trim()
    .min(3, 'Nama jurusan minimal 3 karakter')
    .max(100, 'Nama jurusan maksimal 100 karakter'),
  is_active: z.boolean(),
})

export type MajorFormValues = z.infer<typeof majorFormSchema>
