import { describe, expect, it } from 'vitest'
import {
  rejectRequestSchema,
  checkinFormSchema,
  markLoanLostSchema,
  librarianLoanFilterSchema,
} from './schemas'

describe('Circulation Schemas (FR-CIR)', () => {
  it('menolak alasan penolakan pengajuan yang kosong (TC-CIR-06)', () => {
    const invalid = rejectRequestSchema.safeParse({
      requestId: 1,
      reason: '   ',
    })
    expect(invalid.success).toBe(false)

    const valid = rejectRequestSchema.safeParse({
      requestId: 1,
      reason: 'Stok buku sedang diperbaiki',
    })
    expect(valid.success).toBe(true)
  })

  it('memvalidasi form check-in kondisi baik dan rusak (TC-CIR-13 & TC-CIR-15)', () => {
    const goodResult = checkinFormSchema.safeParse({
      copyCode: 'B000001',
      condition: 'good',
    })
    expect(goodResult.success).toBe(true)

    const damagedResult = checkinFormSchema.safeParse({
      copyCode: 'B000001',
      condition: 'damaged',
      damageFine: 25000,
      notes: 'Halaman robek',
    })
    expect(damagedResult.success).toBe(true)
  })

  it('memvalidasi form tandai buku hilang (TC-CIR-16)', () => {
    const invalid = markLoanLostSchema.safeParse({
      loanId: 10,
      amount: 0,
    })
    expect(invalid.success).toBe(false)

    const valid = markLoanLostSchema.safeParse({
      loanId: 10,
      amount: 85000,
      notes: 'Hilang oleh peminjam',
    })
    expect(valid.success).toBe(true)
  })

  it('memberikan nilai default aman pada filter pinjaman pustakawan', () => {
    const parsed = librarianLoanFilterSchema.parse({})
    expect(parsed.status).toBe('active')
    expect(parsed.overdueOnly).toBe(false)
    expect(parsed.page).toBe(1)
  })
})
