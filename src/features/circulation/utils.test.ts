import { describe, expect, it } from 'vitest'
import {
  calculateRemainingDays,
  calculateDaysLate,
  calculateLateFine,
} from './utils'

describe('Circulation Utils (BR-10 & BR-11)', () => {
  it('menghitung sisa hari pinjaman dengan benar saat belum jatuh tempo', () => {
    expect(calculateRemainingDays('2026-11-10', '2026-11-06')).toBe(4)
    expect(calculateDaysLate('2026-11-10', '2026-11-06')).toBe(0)
    expect(calculateLateFine('2026-11-10', 500, '2026-11-06')).toBe(0)
  })

  it('menghitung 0 hari terlambat saat tepat pada tanggal jatuh tempo (TC-CIR-13)', () => {
    expect(calculateRemainingDays('2026-11-06', '2026-11-06')).toBe(0)
    expect(calculateDaysLate('2026-11-06', '2026-11-06')).toBe(0)
    expect(calculateLateFine('2026-11-06', 500, '2026-11-06')).toBe(0)
  })

  it('menghitung hari terlambat dan denda 3 x tarif snapshot saat lewat 3 hari (TC-CIR-14)', () => {
    expect(calculateRemainingDays('2026-11-03', '2026-11-06')).toBe(-3)
    expect(calculateDaysLate('2026-11-03', '2026-11-06')).toBe(3)
    expect(calculateLateFine('2026-11-03', 500, '2026-11-06')).toBe(1500)
  })

  it('mengembalikan denda 0 bila tarif snapshot bernilai 0', () => {
    expect(calculateLateFine('2026-11-01', 0, '2026-11-06')).toBe(0)
  })
})
