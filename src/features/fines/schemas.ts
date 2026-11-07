import { z } from 'zod'

export const fineTypeEnum = z.enum(['late', 'damage', 'loss'])
export const fineStatusEnum = z.enum(['unpaid', 'paid', 'waived'])

// Pembebasan Denda oleh Pustakawan (FR-FIN-04, TC-FIN-02)
export const waiveFineSchema = z.object({
  fineId: z.number().int().positive(),
  reason: z
    .string()
    .trim()
    .min(3, 'Alasan pembebasan denda wajib diisi (minimal 3 karakter)')
    .max(500, 'Alasan pembebasan denda maksimal 500 karakter'),
})

export type WaiveFineFormData = z.infer<typeof waiveFineSchema>

// Filter URL Daftar Denda Pustakawan (FR-FIN-06, TC-FIN-05)
export const librarianFineFilterSchema = z.object({
  q: z.string().catch('').default(''),
  status: z.enum(['all', 'unpaid', 'paid', 'waived']).catch('all').default('all'),
  type: z.enum(['all', 'late', 'damage', 'loss']).catch('all').default('all'),
  className: z.string().catch('').default(''),
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  page: z.coerce.number().int().positive().catch(1).default(1),
})

export type LibrarianFineFilter = z.infer<typeof librarianFineFilterSchema>
