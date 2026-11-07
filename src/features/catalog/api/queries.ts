import { queryOptions } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { catalogKeys } from './keys'
import type { CatalogFilter } from '../schemas'

const PAGE_SIZE = 20

// Penelusuran Katalog Buku (FR-CAT-01, FR-CAT-02, FR-CAT-03)
export function catalogSearchQueryOptions(filters: CatalogFilter) {
  return queryOptions({
    queryKey: catalogKeys.search(filters),
    queryFn: async () => {
      const page = Math.max(1, filters.page)
      const offset = (page - 1) * PAGE_SIZE

      const res = await supabase.rpc('search_catalog', {
        p_query: filters.q.trim() || null,
        p_category_id: filters.category || null,
        p_available_only: Boolean(filters.availableOnly),
        p_sort: filters.sort || 'relevance',
        p_limit: PAGE_SIZE,
        p_offset: offset,
      })

      const rows = unwrap(res) || []
      const count = rows.length > 0 ? Number(rows[0].total_count) : 0
      const totalPages = Math.ceil(count / PAGE_SIZE)

      return {
        data: rows,
        count,
        page,
        totalPages,
      }
    },
    staleTime: 30_000,
  })
}

// Rincian Buku Katalog Publik (FR-CAT-04, FR-CAT-05)
export function catalogDetailQueryOptions(bookId: number) {
  return queryOptions({
    queryKey: catalogKeys.detail(bookId),
    queryFn: async () => {
      const [bookRes, availRes] = await Promise.all([
        supabase
          .from('books')
          .select('*, categories(*), book_copies(*)')
          .eq('id', bookId)
          .single(),
        supabase
          .from('v_book_availability')
          .select('*')
          .eq('book_id', bookId)
          .maybeSingle(),
      ])

      const book = unwrap(bookRes)
      return {
        ...book,
        v_book_availability: availRes.data ?? {
          book_id: bookId,
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
