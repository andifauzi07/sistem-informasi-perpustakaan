import { describe, it, expect } from 'vitest'
import { catalogFilterSchema } from './schemas'

describe('catalog schemas', () => {
  describe('catalogFilterSchema', () => {
    it('memberikan nilai default pada search params kosong', () => {
      const res = catalogFilterSchema.parse({})
      expect(res.q).toBe('')
      expect(res.category).toBeUndefined()
      expect(res.availableOnly).toBe(false)
      expect(res.sort).toBe('relevance')
      expect(res.page).toBe(1)
    })

    it('memproses string query, filter ketersediaan, dan pengurutan', () => {
      const res = catalogFilterSchema.parse({
        q: 'jaringan',
        category: '2',
        availableOnly: 'true',
        sort: 'newest',
        page: '3',
      })
      expect(res.q).toBe('jaringan')
      expect(res.category).toBe(2)
      expect(res.availableOnly).toBe(true)
      expect(res.sort).toBe('newest')
      expect(res.page).toBe(3)
    })

    it('menangani input sort yang tidak valid dengan fallback ke relevance', () => {
      const res = catalogFilterSchema.parse({
        sort: 'invalid_sort_type',
      })
      expect(res.sort).toBe('relevance')
    })
  })
})
