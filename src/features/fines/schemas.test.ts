import { describe, expect, it } from 'vitest'
import { waiveFineSchema, librarianFineFilterSchema } from './schemas'

describe('Fines Schemas (FR-FIN)', () => {
  it('menolak pembebasan denda tanpa alasan tertulis (TC-FIN-02)', () => {
    const invalid = waiveFineSchema.safeParse({
      fineId: 5,
      reason: '  ',
    })
    expect(invalid.success).toBe(false)

    const valid = waiveFineSchema.safeParse({
      fineId: 5,
      reason: 'Dispensasi musibah banjir',
    })
    expect(valid.success).toBe(true)
  })

  it('memvalidasi filter daftar denda pustakawan (TC-FIN-05)', () => {
    const parsed = librarianFineFilterSchema.parse({
      status: 'unpaid',
      className: 'XI TKJ 1',
    })
    expect(parsed.status).toBe('unpaid')
    expect(parsed.className).toBe('XI TKJ 1')
    expect(parsed.page).toBe(1)
  })
})
