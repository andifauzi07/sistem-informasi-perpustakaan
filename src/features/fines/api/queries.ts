import { queryOptions } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { fineKeys } from './keys'
import type { LibrarianFineFilter } from '../schemas'

const PAGE_SIZE = 20

// Daftar Denda Anggota beserta Total Belum Lunas (FR-FIN-05, TC-FIN-04)
export function memberFinesQueryOptions(memberId: string) {
  return queryOptions({
    queryKey: fineKeys.member(memberId),
    queryFn: async () => {
      const res = await supabase
        .from('fines')
        .select(
          `
          *,
          loan:loans!fines_loan_id_fkey (
            id,
            loaned_at,
            due_date,
            returned_at,
            copy:book_copies!loans_copy_id_fkey (
              id,
              code,
              book:books!book_copies_book_id_fkey (id, title, authors)
            )
          )
        `
        )
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      const fines = unwrap(res) || []
      const unpaidTotal = fines
        .filter((f) => f.status === 'unpaid')
        .reduce((acc, f) => acc + f.amount, 0)

      return {
        fines,
        unpaidTotal,
      }
    },
    staleTime: 30_000,
  })
}

// Daftar Denda Pustakawan dengan Filter Status, Jenis, Periode & Kelas (FR-FIN-06, TC-FIN-05)
export function librarianFinesQueryOptions(filters: LibrarianFineFilter) {
  return queryOptions({
    queryKey: fineKeys.librarianList(filters),
    queryFn: async () => {
      let query = supabase
        .from('fines')
        .select(
          `
          *,
          member:profiles!fines_member_id_fkey (
            id,
            member_code,
            full_name,
            role,
            class_name
          ),
          receiver:profiles!fines_received_by_fkey (full_name),
          waiver:profiles!fines_waived_by_fkey (full_name),
          loan:loans!fines_loan_id_fkey (
            id,
            due_date,
            returned_at,
            copy:book_copies!loans_copy_id_fkey (
              id,
              code,
              book:books!book_copies_book_id_fkey (id, title)
            )
          )
        `
        )
        .order('created_at', { ascending: false })

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }

      if (filters.from) {
        query = query.gte('created_at', `${filters.from}T00:00:00+08:00`)
      }

      if (filters.to) {
        query = query.lte('created_at', `${filters.to}T23:59:59+08:00`)
      }

      const res = await query
      const allRows = unwrap(res) || []

      const q = filters.q.trim().toLowerCase()
      const cls = filters.className.trim().toLowerCase()

      const filtered = allRows.filter((row) => {
        if (cls) {
          const memberClass = (row.member?.class_name || '').toLowerCase()
          if (!memberClass.includes(cls)) return false
        }
        if (q) {
          const name = (row.member?.full_name || '').toLowerCase()
          const code = (row.member?.member_code || '').toLowerCase()
          const title = (row.loan?.copy?.book?.title || '').toLowerCase()
          const copyCode = (row.loan?.copy?.code || '').toLowerCase()
          return (
            name.includes(q) ||
            code.includes(q) ||
            title.includes(q) ||
            copyCode.includes(q)
          )
        }
        return true
      })

      const unpaidTotal = filtered
        .filter((f) => f.status === 'unpaid')
        .reduce((acc, f) => acc + f.amount, 0)
      const paidTotal = filtered
        .filter((f) => f.status === 'paid')
        .reduce((acc, f) => acc + f.amount, 0)
      const waivedTotal = filtered
        .filter((f) => f.status === 'waived')
        .reduce((acc, f) => acc + f.amount, 0)

      const count = filtered.length
      const page = Math.max(1, filters.page)
      const fromIdx = (page - 1) * PAGE_SIZE
      const paginated = filtered.slice(fromIdx, fromIdx + PAGE_SIZE)

      return {
        data: paginated,
        count,
        page,
        totalPages: Math.ceil(count / PAGE_SIZE),
        summary: {
          unpaidTotal,
          paidTotal,
          waivedTotal,
          grandTotal: unpaidTotal + paidTotal + waivedTotal,
        },
      }
    },
    staleTime: 30_000,
  })
}
