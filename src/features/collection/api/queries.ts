import { queryOptions } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { collectionKeys } from './keys'
import type { CollectionFilter } from '../schemas'

const PAGE_SIZE = 20

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: string }).code
  const msg = ((error as { message?: string }).message || '').toLowerCase()
  return (
    code === 'PGRST205' ||
    code === 'PGRST202' ||
    code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  )
}

function unwrapOrEmpty<T>(res: { data: T[] | null; error: Error | null }): T[] {
  if (res.error) {
    if (isMissingTableError(res.error)) return []
    throw res.error
  }
  return res.data || []
}

// Daftar Kategori (Data referensi staleTime: 5 menit)
export function categoriesListQueryOptions() {
  return queryOptions({
    queryKey: collectionKeys.categories(),
    queryFn: async () => {
      const res = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })
      return unwrapOrEmpty(res)
    },
    staleTime: 5 * 60_000,
  })
}

// Daftar Buku Pustakawan
export function booksListQueryOptions(filters: CollectionFilter) {
  return queryOptions({
    queryKey: collectionKeys.books(filters),
    queryFn: async () => {
      let query = supabase
        .from('books')
        .select('*, categories(id, name)', { count: 'exact' })

      if (filters.q.trim()) {
        const keyword = filters.q.trim()
        query = query.or(
          `title.ilike.%${keyword}%,authors.ilike.%${keyword}%,isbn.ilike.%${keyword}%`
        )
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      const page = Math.max(1, filters.page)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      query = query.order('created_at', { ascending: false }).range(from, to)

      const res = await query
      const rows = unwrapOrEmpty(res)
      const count = res.error ? 0 : (res.count ?? 0)
      const totalPages = Math.ceil(count / PAGE_SIZE)

      const bookIds = rows.map((b) => b.id)
      const availabilityMap = new Map<
        number,
        {
          book_id: number | null
          total_copies: number | null
          available_copies: number | null
          on_loan_copies: number | null
          reserved_copies: number | null
        }
      >()

      if (bookIds.length > 0) {
        const availRes = await supabase
          .from('v_book_availability')
          .select('*')
          .in('book_id', bookIds)
        for (const v of availRes.data || []) {
          if (v.book_id !== null) {
            availabilityMap.set(v.book_id, v)
          }
        }
      }

      const data = rows.map((b) => ({
        ...b,
        v_book_availability: availabilityMap.get(b.id) ?? {
          book_id: b.id,
          total_copies: 0,
          available_copies: 0,
          on_loan_copies: 0,
          reserved_copies: 0,
        },
      }))

      return {
        data,
        count,
        page,
        totalPages,
      }
    },
    staleTime: 30_000,
  })
}

// Rincian Buku
export function bookDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: collectionKeys.bookDetail(id),
    queryFn: async () => {
      const [bookRes, availRes] = await Promise.all([
        supabase
          .from('books')
          .select('*, categories(*)')
          .eq('id', id)
          .single(),
        supabase
          .from('v_book_availability')
          .select('*')
          .eq('book_id', id)
          .maybeSingle(),
      ])
      const book = unwrap(bookRes)
      return {
        ...book,
        v_book_availability: availRes.data ?? {
          book_id: id,
          total_copies: 0,
          available_copies: 0,
          on_loan_copies: 0,
          reserved_copies: 0,
        },
      }
    },
    staleTime: 30_000,
  })
}

// Daftar Eksemplar Fisik Buku
export function bookCopiesQueryOptions(bookId: number) {
  return queryOptions({
    queryKey: collectionKeys.bookCopies(bookId),
    queryFn: async () => {
      const res = await supabase
        .from('book_copies')
        .select('*')
        .eq('book_id', bookId)
        .order('code', { ascending: true })
      return unwrapOrEmpty(res)
    },
    staleTime: 30_000,
  })
}
