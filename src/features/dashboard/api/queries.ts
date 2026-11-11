import { queryOptions } from '@tanstack/react-query'
import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { supabase, unwrap } from '@/lib/supabase'
import { dashboardKeys } from './keys'

export interface LibrarianDashboardMetrics {
  pending_requests: number
  ready_pickups: number
  active_loans: number
  overdue_loans: number
  pending_returns: number
  unpaid_fines_total: number
  unpaid_fines_count: number
}

export interface MemberDashboardMetrics {
  active_loans_count: number
  max_active_loans: number
  overdue_loans_count: number
  pending_requests_count: number
  ready_pickups: Array<{
    id: number
    title: string
    pickup_deadline: string | null
  }>
  unpaid_fines_total: number
}

export function librarianDashboardQueryOptions() {
  return queryOptions({
    queryKey: dashboardKeys.librarian(),
    queryFn: async (): Promise<LibrarianDashboardMetrics> => {
      const res = await supabase.rpc('get_librarian_dashboard')
      const raw = unwrap(res) as unknown as LibrarianDashboardMetrics
      return {
        pending_requests: Number(raw?.pending_requests ?? 0),
        ready_pickups: Number(raw?.ready_pickups ?? 0),
        active_loans: Number(raw?.active_loans ?? 0),
        overdue_loans: Number(raw?.overdue_loans ?? 0),
        pending_returns: Number(raw?.pending_returns ?? 0),
        unpaid_fines_total: Number(raw?.unpaid_fines_total ?? 0),
        unpaid_fines_count: Number(raw?.unpaid_fines_count ?? 0),
      }
    },
    refetchInterval: 30_000,
  })
}

export function memberDashboardQueryOptions(memberId: string, role: 'student' | 'teacher' = 'student') {
  return queryOptions({
    queryKey: dashboardKeys.member(memberId, role),
    queryFn: async (): Promise<MemberDashboardMetrics> => {
      const todayWita = format(new TZDate(new Date(), 'Asia/Makassar'), 'yyyy-MM-dd')

      const [loansRes, requestsRes, finesRes, policyRes] = await Promise.all([
        supabase
          .from('loans')
          .select('id, due_date')
          .eq('member_id', memberId)
          .eq('status', 'active'),
        supabase
          .from('loan_requests')
          .select('id, status, pickup_deadline, book:books(title)')
          .eq('member_id', memberId)
          .in('status', ['pending', 'approved']),
        supabase
          .from('fines')
          .select('amount')
          .eq('member_id', memberId)
          .eq('status', 'unpaid'),
        supabase
          .from('loan_policies')
          .select('max_active_loans')
          .eq('role', role)
          .maybeSingle(),
      ])

      const loans = unwrap(loansRes) ?? []
      const requests = unwrap(requestsRes) ?? []
      const fines = unwrap(finesRes) ?? []
      const policy = policyRes.data

      const active_loans_count = loans.length
      const overdue_loans_count = loans.filter((l) => l.due_date < todayWita).length

      const pending_requests_count = requests.filter((r) => r.status === 'pending').length
      const ready_pickups = requests
        .filter((r) => r.status === 'approved')
        .map((r) => {
          const bookObj = r.book as { title?: string } | null
          return {
            id: r.id,
            title: bookObj?.title ?? 'Buku',
            pickup_deadline: r.pickup_deadline,
          }
        })

      const unpaid_fines_total = fines.reduce((acc, curr) => acc + (curr.amount ?? 0), 0)
      const max_active_loans = policy?.max_active_loans ?? (role === 'teacher' ? 5 : 3)

      return {
        active_loans_count,
        max_active_loans,
        overdue_loans_count,
        pending_requests_count,
        ready_pickups,
        unpaid_fines_total,
      }
    },
    staleTime: 30_000,
  })
}
