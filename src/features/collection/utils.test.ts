import { describe, it, expect } from 'vitest'
import { formatCopyCode, normalizeIsbn } from './utils'

describe('collection utils', () => {
  describe('formatCopyCode', () => {
    it('memformat angka urut ke standar kode B diikuti 6 digit', () => {
      expect(formatCopyCode(1)).toBe('B000001')
      expect(formatCopyCode(42)).toBe('B000042')
      expect(formatCopyCode(999999)).toBe('B999999')
    })

    it('menangani input non-positif dengan fallback ke B000001', () => {
      expect(formatCopyCode(0)).toBe('B000001')
      expect(formatCopyCode(-5)).toBe('B000001')
    })
  })

  describe('normalizeIsbn', () => {
    it('menghilangkan tanda hubung dan spasi', () => {
      expect(normalizeIsbn('978-602-03-8888-1')).toBe('9786020388881')
      expect(normalizeIsbn('978 602 03 8888 1')).toBe('9786020388881')
    })

    it('mempertahankan karakter X pada ISBN 10', () => {
      expect(normalizeIsbn('0-306-40615-X')).toBe('030640615X')
      expect(normalizeIsbn('0-306-40615-x')).toBe('030640615X')
    })
  })
})
