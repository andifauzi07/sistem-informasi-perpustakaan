import { describe, it, expect } from 'vitest'
import { formatRupiah, formatDate, formatDateTime } from './format'

describe('format util', () => {
  it('formatRupiah memformat bilangan bulat rupiah tanpa desimal', () => {
    const formatted = formatRupiah(50000).replace(/\s+/g, ' ')
    expect(formatted).toContain('50.000')
    expect(formatted).toContain('Rp')
  })

  it('formatDate memformat tanggal sesuai zona Asia/Makassar (WITA)', () => {
    // 2026-11-03T00:00:00Z -> 2026-11-03 08:00 WITA
    const formatted = formatDate('2026-11-03T00:00:00Z')
    expect(formatted).toBe('03/11/2026')
  })

  it('formatDateTime memformat tanggal dan jam WITA', () => {
    const formatted = formatDateTime('2026-11-03T02:30:00Z')
    expect(formatted).toBe('03/11/2026 10:30')
  })
})
