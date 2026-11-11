import { describe, it, expect } from 'vitest'
import { getReportColumns, formatReportCellValue } from './utils'
import type { ReportType } from './schemas'
import type { ReportRow } from './api/queries'

describe('features/reports/utils', () => {
  describe('getReportColumns', () => {
    const reportTypes: ReportType[] = [
      'loans',
      'returns',
      'overdue',
      'fines',
      'inventory',
      'member_activity',
      'popular_books',
    ]

    it.each(reportTypes)('menyediakan konfigurasi kolom yang valid untuk tipe %s', (type) => {
      const cols = getReportColumns(type)
      expect(cols.length).toBeGreaterThan(0)
      expect(cols[0].key).toBe(type === 'popular_books' ? 'index' : 'index')
      for (const col of cols) {
        expect(col.header).toBeTruthy()
        expect(col.key).toBeTruthy()
      }
    })
  })

  describe('formatReportCellValue', () => {
    const dummyRow = {} as ReportRow

    it('memformat kolom index berbasis 1', () => {
      expect(formatReportCellValue('loans', 'index', undefined, dummyRow, 0)).toBe('1')
      expect(formatReportCellValue('loans', 'index', undefined, dummyRow, 4)).toBe('5')
    })

    it('memformat nilai kosong, null, atau undefined menjadi strip (-)', () => {
      expect(formatReportCellValue('loans', 'title', null, dummyRow, 0)).toBe('-')
      expect(formatReportCellValue('loans', 'title', undefined, dummyRow, 0)).toBe('-')
      expect(formatReportCellValue('loans', 'title', '', dummyRow, 0)).toBe('-')
    })

    it('memformat nilai tanggal sesuai format lokal', () => {
      const formatted = formatReportCellValue('loans', 'loaned_at', '2026-11-08T08:00:00Z', dummyRow, 0)
      expect(formatted).not.toBe('-')
      expect(typeof formatted).toBe('string')
    })

    it('memformat nilai rupiah untuk nominal keuangan', () => {
      expect(formatReportCellValue('fines', 'amount', 5000, dummyRow, 0)).toContain('5.000')
      expect(formatReportCellValue('fines', 'amount', 0, dummyRow, 0)).toContain('0')
      expect(formatReportCellValue('overdue', 'estimated_fine', 2000, dummyRow, 0)).toContain('2.000')
    })

    it('memformat label enum status peminjaman dan denda', () => {
      expect(formatReportCellValue('loans', 'status', 'active', dummyRow, 0)).toBe('Aktif')
      expect(formatReportCellValue('loans', 'status', 'returned', dummyRow, 0)).toBe('Kembali')
      expect(formatReportCellValue('loans', 'status', 'lost', dummyRow, 0)).toBe('Hilang')

      expect(formatReportCellValue('fines', 'status', 'unpaid', dummyRow, 0)).toBe('Belum Lunas')
      expect(formatReportCellValue('fines', 'status', 'paid', dummyRow, 0)).toBe('Lunas')
      expect(formatReportCellValue('fines', 'status', 'waived', dummyRow, 0)).toBe('Dibebaskan')
    })

    it('memformat label jenis denda dan peran anggota', () => {
      expect(formatReportCellValue('fines', 'type', 'late', dummyRow, 0)).toBe('Keterlambatan')
      expect(formatReportCellValue('fines', 'type', 'damage', dummyRow, 0)).toBe('Kerusakan')
      expect(formatReportCellValue('fines', 'type', 'loss', dummyRow, 0)).toBe('Kehilangan')

      expect(formatReportCellValue('member_activity', 'role', 'student', dummyRow, 0)).toBe('Siswa')
      expect(formatReportCellValue('member_activity', 'role', 'teacher', dummyRow, 0)).toBe('Guru')
      expect(formatReportCellValue('member_activity', 'role', 'librarian', dummyRow, 0)).toBe('Pustakawan')
    })
  })
})
