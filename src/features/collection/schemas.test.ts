import { describe, it, expect } from 'vitest'
import {
  categorySchema,
  bookFormSchema,
  addCopiesSchema,
  setCopyStatusSchema,
  collectionFilterSchema,
} from './schemas'
import { normalizeIsbn } from './utils'

describe('collection schemas', () => {
  describe('categorySchema', () => {
    it('menerima kategori yang valid', () => {
      const res = categorySchema.safeParse({
        name: 'Teknologi Informasi',
        ddcCode: '004',
      })
      expect(res.success).toBe(true)
    })

    it('menolak nama kategori kosong', () => {
      const res = categorySchema.safeParse({
        name: '   ',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0]?.message).toBe('Nama kategori wajib diisi')
      }
    })
  })

  describe('bookFormSchema', () => {
    it('menerima form buku lengkap dan menormalisasi ISBN', () => {
      const res = bookFormSchema.safeParse({
        title: 'Pemrograman Web Modern',
        authors: 'John Doe, Jane Smith',
        publisher: 'Gramedia',
        publicationYear: 2023,
        isbn: '978-602-03-8888-1',
        categoryId: 1,
        language: 'Indonesia',
        pages: 350,
      })
      expect(res.success).toBe(true)
      if (res.success && res.data.isbn) {
        expect(normalizeIsbn(res.data.isbn)).toBe('9786020388881')
      }
    })

    it('menolak judul buku kosong atau kategori non-positif', () => {
      const res = bookFormSchema.safeParse({
        title: '   ',
        authors: 'Penulis',
        categoryId: 0,
        language: 'Indonesia',
      })
      expect(res.success).toBe(false)
    })

    it('menolak tahun terbit di luar batas 1800-2100', () => {
      const res = bookFormSchema.safeParse({
        title: 'Buku Kuno',
        authors: 'Penulis',
        categoryId: 1,
        language: 'Indonesia',
        publicationYear: 1750,
      })
      expect(res.success).toBe(false)
    })
  })

  describe('addCopiesSchema', () => {
    it('menerima penambahan eksemplar otomatis', () => {
      const res = addCopiesSchema.safeParse({
        bookId: 5,
        mode: 'auto',
        quantity: 3,
        source: 'government',
      })
      expect(res.success).toBe(true)
    })

    it('menolak penambahan manual tanpa kode', () => {
      const res = addCopiesSchema.safeParse({
        bookId: 5,
        mode: 'manual',
        codes: '   ',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0]?.message).toContain('Kode eksemplar manual wajib diisi')
      }
    })
  })

  describe('setCopyStatusSchema', () => {
    it('menerima status eksemplar yang sah', () => {
      const res = setCopyStatusSchema.safeParse({
        copyId: 10,
        status: 'damaged',
        notes: 'Cover robek',
      })
      expect(res.success).toBe(true)
    })

    it('menolak status eksemplar yang tidak terdaftar', () => {
      const res = setCopyStatusSchema.safeParse({
        copyId: 10,
        status: 'unknown_status',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('collectionFilterSchema', () => {
    it('memberikan nilai default pada filter kosong', () => {
      const res = collectionFilterSchema.parse({})
      expect(res.q).toBe('')
      expect(res.page).toBe(1)
      expect(res.categoryId).toBeUndefined()
    })
  })
})
