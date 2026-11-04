import { queryOptions } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { collectionKeys } from './keys'
import type { CollectionFilter } from '../schemas'

const PAGE_SIZE = 20

// Daftar Kategori (Data referensi staleTime: 5 menit)
export function categoriesListQueryOptions() {
  return queryOptions({
    queryKey: collectionKeys.categories(),
    queryFn: async () => {
      const res = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })
      return unwrap(res) || []
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
        .select('*, categories(id, name), v_book_availability(*)', { count: 'exact' })

      if (filters.q.trim()) {
        const keyword = filters.q.trim()
        query = query.or(`title.ilike.%${keyword}%,authors.ilike.%${keyword}%,isbn.ilike.%${keyword}%`)
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      const page = Math.max(1, filters.page)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      query = query.order('created_at', { ascending: false }).range(from, to)

      const res = await query
      const data = unwrap(res)
      const count = res.count ?? 0
      const totalPages = Math.ceil(count / PAGE_SIZE)

      return {
        data: data || [],
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
      const res = await supabase
        .from('books')
        .select('*, categories(*), v_book_availability(*)')
        .eq('id', id)
        .single()
      return unwrap(res)
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
      return unwrap(res) || []
    },
    staleTime: 30_000,
  })
}
