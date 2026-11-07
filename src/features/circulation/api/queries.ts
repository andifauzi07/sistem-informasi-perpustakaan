import { queryOptions } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { circulationKeys } from './keys'
import type {
  MemberHistoryFilter,
  LibrarianRequestFilter,
  LibrarianLoanFilter,
} from '../schemas'

const PAGE_SIZE = 20

export interface MemberLookupResult {
  id: string
  member_code: string
  full_name: string
  role: 'student' | 'teacher' | 'librarian'
  class_name: string | null
  is_active: boolean
  max_active_loans: number
  loan_days: number
  daily_fine: number
  active_loans_count: number
  open_requests_count: number
  overdue_loans_count: number
  unpaid_fines_total: number
  approved_requests: Array<{
    id: number
    book_id: number
    book_title: string
    reserved_copy_id: number | null
    reserved_copy_code: string | null
    pickup_deadline: string | null
  }>
}

export interface CopyLookupResult {
  copy_id: number
  copy_code: string
  copy_status: 'available' | 'reserved' | 'on_loan' | 'damaged' | 'lost' | 'withdrawn'
  price: number | null
  book_id: number
  book_title: string
  book_authors: string
  call_number: string | null
  active_loan: {
    id: number
    copy_id: number
    member_id: string
    member_code: string
    full_name: string
    class_name: string | null
    role: 'student' | 'teacher' | 'librarian'
    loaned_at: string
    due_date: string
    daily_fine_snapshot: number
    return_requested_at: string | null
    is_overdue: boolean
    days_overdue: number
    estimated_fine: number
  } | null
}

// Ringkasan kuota, pengajuan terbuka, dan pinjaman aktif anggota (untuk Detail Buku & Pinjaman Saya)
export function memberCirculationSummaryQueryOptions(memberId: string) {
  return queryOptions({
    queryKey: circulationKeys.memberCirculationSummary(memberId),
    queryFn: async () => {
      const [profileRes, requestsRes, activeLoansRes, unpaidFinesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, role, is_active')
          .eq('id', memberId)
          .single(),
        supabase
          .from('loan_requests')
          .select('id, book_id, status, requested_at, pickup_deadline, reject_reason, decided_at')
          .eq('member_id', memberId)
          .order('requested_at', { ascending: false }),
        supabase
          .from('v_loans')
          .select('*')
          .eq('member_id', memberId)
          .eq('status', 'active')
          .order('due_date', { ascending: true }),
        supabase
          .from('fines')
          .select('amount')
          .eq('member_id', memberId)
          .eq('status', 'unpaid'),
      ])

      const profile = unwrap(profileRes)
      const requests = unwrap(requestsRes) || []
      const activeLoans = unwrap(activeLoansRes) || []
      const unpaidFines = unwrap(unpaidFinesRes) || []

      let maxActiveLoans = 5
      if (profile && (profile.role === 'student' || profile.role === 'teacher')) {
        const policyRes = await supabase
          .from('loan_policies')
          .select('*')
          .eq('role', profile.role)
          .single()
        if (policyRes.data) {
          maxActiveLoans = policyRes.data.max_active_loans
        }
      }

      const openRequests = requests.filter(
        (r) => r.status === 'pending' || r.status === 'approved'
      )
      const totalUsedQuota = activeLoans.length + openRequests.length
      const unpaidFinesTotal = unpaidFines.reduce((acc, f) => acc + f.amount, 0)

      return {
        maxActiveLoans,
        totalUsedQuota,
        remainingQuota: Math.max(0, maxActiveLoans - totalUsedQuota),
        activeLoans,
        openRequests,
        allRequests: requests,
        unpaidFinesTotal,
      }
    },
    staleTime: 30_000,
  })
}

// Daftar Pengajuan Anggota (Pinjaman Saya — FR-CIR-02)
export function memberLoanRequestsQueryOptions(memberId: string) {
  return queryOptions({
    queryKey: circulationKeys.memberRequests(memberId),
    queryFn: async () => {
      const res = await supabase
        .from('loan_requests')
        .select(
          `
          *,
          books (id, title, authors, cover_path, call_number),
          book_copies!loan_requests_reserved_copy_id_fkey (id, code)
        `
        )
        .eq('member_id', memberId)
        .order('requested_at', { ascending: false })

      return unwrap(res) || []
    },
    staleTime: 30_000,
  })
}

// Daftar Pinjaman Aktif Anggota (Pinjaman Saya — FR-CIR-02)
export function memberActiveLoansQueryOptions(memberId: string) {
  return queryOptions({
    queryKey: circulationKeys.memberActiveLoans(memberId),
    queryFn: async () => {
      const res = await supabase
        .from('v_loans')
        .select('*')
        .eq('member_id', memberId)
        .eq('status', 'active')
        .order('due_date', { ascending: true })

      return unwrap(res) || []
    },
    staleTime: 30_000,
  })
}

// Riwayat Peminjaman Anggota (Selesai / Hilang — FR-CIR-05)
export function memberLoanHistoryQueryOptions(
  memberId: string,
  filters: MemberHistoryFilter
) {
  return queryOptions({
    queryKey: circulationKeys.memberHistory(memberId, filters),
    queryFn: async () => {
      let query = supabase
        .from('v_loans')
        .select('*', { count: 'exact' })
        .eq('member_id', memberId)

      if (filters.status === 'returned' || filters.status === 'lost') {
        query = query.eq('status', filters.status)
      } else {
        query = query.in('status', ['returned', 'lost'])
      }

      if (filters.from) {
        query = query.gte('loaned_at', `${filters.from}T00:00:00+08:00`)
      }
      if (filters.to) {
        query = query.lte('loaned_at', `${filters.to}T23:59:59+08:00`)
      }

      const page = Math.max(1, filters.page)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const res = await query
        .order('loaned_at', { ascending: false })
        .range(from, to)

      const data = unwrap(res) || []
      const count = res.count ?? 0
      const totalPages = Math.ceil(count / PAGE_SIZE)

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

// Antrean Verifikasi Pengajuan Pustakawan (FR-CIR-06 — refetchInterval: 30_000)
export function librarianRequestsQueryOptions(filters: LibrarianRequestFilter) {
  return queryOptions({
    queryKey: circulationKeys.librarianRequests(filters),
    queryFn: async () => {
      let query = supabase
        .from('loan_requests')
        .select(
          `
          *,
          member:profiles!loan_requests_member_id_fkey (id, member_code, full_name, role, class_name, is_active),
          book:books!loan_requests_book_id_fkey (
            id,
            title,
            authors,
            call_number,
            book_copies (id, code, status)
          ),
          reserved_copy:book_copies!loan_requests_reserved_copy_id_fkey (id, code)
        `,
          { count: 'exact' }
        )

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      const isPendingSort = filters.status === 'pending'
      query = query.order('requested_at', { ascending: isPendingSort })

      const page = Math.max(1, filters.page)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const res = await query.range(from, to)
      const rows = unwrap(res) || []
      const count = res.count ?? 0

      // Ambil ringkasan pinjaman aktif, terlambat, dan denda belum lunas untuk anggota terkait
      const memberIds = Array.from(new Set(rows.map((r) => r.member_id)))
      const bookIds = Array.from(new Set(rows.map((r) => r.book_id)))

      const memberStats: Record<
        string,
        { activeLoans: number; overdueLoans: number; unpaidFines: number }
      > = {}

      const availMap = new Map<
        number,
        { available_copies: number; total_copies: number }
      >()

      if (bookIds.length > 0) {
        const availRes = await supabase
          .from('v_book_availability')
          .select('book_id, available_copies, total_copies')
          .in('book_id', bookIds)
        for (const v of availRes.data || []) {
          if (v.book_id !== null) {
            availMap.set(v.book_id, {
              available_copies: v.available_copies ?? 0,
              total_copies: v.total_copies ?? 0,
            })
          }
        }
      }

      if (memberIds.length > 0) {
        const [loansRes, finesRes] = await Promise.all([
          supabase
            .from('v_loans')
            .select('member_id, is_overdue')
            .in('member_id', memberIds)
            .eq('status', 'active'),
          supabase
            .from('fines')
            .select('member_id, amount')
            .in('member_id', memberIds)
            .eq('status', 'unpaid'),
        ])

        for (const id of memberIds) {
          memberStats[id] = { activeLoans: 0, overdueLoans: 0, unpaidFines: 0 }
        }

        for (const l of loansRes.data || []) {
          if (l.member_id && memberStats[l.member_id]) {
            memberStats[l.member_id].activeLoans += 1
            if (l.is_overdue) {
              memberStats[l.member_id].overdueLoans += 1
            }
          }
        }

        for (const f of finesRes.data || []) {
          if (memberStats[f.member_id]) {
            memberStats[f.member_id].unpaidFines += f.amount
          }
        }
      }

      const keyword = filters.q.trim().toLowerCase()
      const filteredRows = keyword
        ? rows.filter((r) => {
            const memberName = r.member?.full_name?.toLowerCase() || ''
            const memberCode = r.member?.member_code?.toLowerCase() || ''
            const bookTitle = r.book?.title?.toLowerCase() || ''
            return (
              memberName.includes(keyword) ||
              memberCode.includes(keyword) ||
              bookTitle.includes(keyword)
            )
          })
        : rows

      return {
        data: filteredRows.map((r) => ({
          ...r,
          book: r.book
            ? {
                ...r.book,
                v_book_availability: availMap.get(r.book_id) ?? {
                  available_copies: 0,
                  total_copies: 0,
                },
              }
            : null,
          memberSummary: memberStats[r.member_id] || {
            activeLoans: 0,
            overdueLoans: 0,
            unpaidFines: 0,
          },
        })),
        count,
        page,
        totalPages: Math.ceil(count / PAGE_SIZE),
      }
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

// Daftar Pinjaman Pustakawan & Pengembalian Menunggu Konfirmasi (FR-CIR-11 & FR-CIR-12)
export function librarianLoansQueryOptions(filters: LibrarianLoanFilter) {
  return queryOptions({
    queryKey: circulationKeys.librarianLoans(filters),
    queryFn: async () => {
      let query = supabase.from('v_loans').select('*', { count: 'exact' })

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.overdueOnly) {
        query = query.eq('is_overdue', true)
      }

      if (filters.returnRequestedOnly) {
        query = query.not('return_requested_at', 'is', null)
      }

      if (filters.role !== 'all') {
        query = query.eq('role', filters.role)
      }

      if (filters.className.trim()) {
        query = query.ilike('class_name', `%${filters.className.trim()}%`)
      }

      if (filters.q.trim()) {
        const kw = filters.q.trim()
        query = query.or(
          `full_name.ilike.%${kw}%,member_code.ilike.%${kw}%,title.ilike.%${kw}%,copy_code.ilike.%${kw}%`
        )
      }

      const page = Math.max(1, filters.page)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const res = await query
        .order('due_date', { ascending: true })
        .range(from, to)

      const data = unwrap(res) || []
      const count = res.count ?? 0

      return {
        data,
        count,
        page,
        totalPages: Math.ceil(count / PAGE_SIZE),
      }
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

// Antrean Pengembalian Menunggu Konfirmasi (FR-CIR-11)
export function returnRequestedLoansQueryOptions() {
  return queryOptions({
    queryKey: circulationKeys.librarianReturnQueue(),
    queryFn: async () => {
      const res = await supabase
        .from('v_loans')
        .select('*')
        .eq('status', 'active')
        .not('return_requested_at', 'is', null)
        .order('return_requested_at', { ascending: true })

      return unwrap(res) || []
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

// Lookup Anggota via Nomor Induk di Meja Sirkulasi (FR-CIR-09)
export async function lookupMemberByCode(code: string): Promise<MemberLookupResult> {
  const res = await supabase.rpc('lookup_member', { p_code: code.trim() })
  return unwrap(res) as unknown as MemberLookupResult
}

// Lookup Eksemplar via Kode Barcode di Meja Sirkulasi (FR-CIR-09 & FR-CIR-10)
export async function lookupCopyByCode(code: string): Promise<CopyLookupResult> {
  const res = await supabase.rpc('lookup_copy', { p_code: code.trim() })
  return unwrap(res) as unknown as CopyLookupResult
}
