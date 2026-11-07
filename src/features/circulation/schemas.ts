import { z } from 'zod'

export const loanRequestStatusEnum = z.enum([
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'expired',
  'fulfilled',
])

export const loanStatusEnum = z.enum([
  'active',
  'returned',
  'lost',
])

export const returnConditionEnum = z.enum(['good', 'damaged'])

// Penolakan Pengajuan oleh Pustakawan (FR-CIR-08, TC-CIR-06)
export const rejectRequestSchema = z.object({
  requestId: z.number().int().positive(),
  reason: z
    .string()
    .trim()
    .min(3, 'Alasan penolakan wajib diisi (minimal 3 karakter)')
    .max(500, 'Alasan penolakan maksimal 500 karakter'),
})

export type RejectRequestFormData = z.infer<typeof rejectRequestSchema>

// Persetujuan Pengajuan oleh Pustakawan (FR-CIR-07, TC-CIR-05)
export const approveRequestSchema = z.object({
  requestId: z.number().int().positive(),
  copyId: z.number().int().positive().optional().nullable(),
})

export type ApproveRequestFormData = z.infer<typeof approveRequestSchema>

// Checkout Meja Sirkulasi Mode Pinjam (FR-CIR-09)
export const checkoutFormSchema = z.object({
  memberId: z.string().uuid('Anggota belum dipilih'),
  copyCode: z
    .string()
    .trim()
    .min(1, 'Kode eksemplar wajib diisi')
    .max(30, 'Kode eksemplar maksimal 30 karakter'),
})

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>

// Check-in Meja Sirkulasi Mode Kembali (FR-CIR-10)
export const checkinFormSchema = z
  .object({
    copyCode: z
      .string()
      .trim()
      .min(1, 'Kode eksemplar wajib diisi')
      .max(30, 'Kode eksemplar maksimal 30 karakter'),
    condition: returnConditionEnum,
    damageFine: z
      .number()
      .int()
      .positive('Nominal denda kerusakan harus lebih dari Rp0')
      .optional(),
    notes: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional(),
  })

export type CheckinFormData = z.infer<typeof checkinFormSchema>

// Tandai Pinjaman Hilang (FR-CIR-14, TC-CIR-16)
export const markLoanLostSchema = z.object({
  loanId: z.number().int().positive(),
  amount: z
    .number()
    .int()
    .positive('Nominal ganti rugi buku hilang harus lebih dari Rp0'),
  notes: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional(),
})

export type MarkLoanLostFormData = z.infer<typeof markLoanLostSchema>

// Filter URL Riwayat Peminjaman Anggota (FR-CIR-05)
export const memberHistoryFilterSchema = z.object({
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  status: z.enum(['all', 'returned', 'lost']).catch('all').default('all'),
  page: z.coerce.number().int().positive().catch(1).default(1),
})

export type MemberHistoryFilter = z.infer<typeof memberHistoryFilterSchema>

// Filter URL Antrean Pengajuan Pustakawan (FR-CIR-06)
export const librarianRequestFilterSchema = z.object({
  q: z.string().catch('').default(''),
  status: z
    .enum(['pending', 'approved', 'rejected', 'all'])
    .catch('pending')
    .default('pending'),
  page: z.coerce.number().int().positive().catch(1).default(1),
})

export type LibrarianRequestFilter = z.infer<typeof librarianRequestFilterSchema>

// Filter URL Daftar Pinjaman Aktif Pustakawan (FR-CIR-12)
export const librarianLoanFilterSchema = z.object({
  q: z.string().catch('').default(''),
  overdueOnly: z.coerce.boolean().catch(false).default(false),
  returnRequestedOnly: z.coerce.boolean().catch(false).default(false),
  role: z.enum(['all', 'student', 'teacher']).catch('all').default('all'),
  className: z.string().catch('').default(''),
  status: z.enum(['active', 'returned', 'lost', 'all']).catch('active').default('active'),
  page: z.coerce.number().int().positive().catch(1).default(1),
})

export type LibrarianLoanFilter = z.infer<typeof librarianLoanFilterSchema>
