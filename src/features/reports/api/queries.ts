import { queryOptions } from '@tanstack/react-query'
import { TZDate } from '@date-fns/tz'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { supabase, unwrap } from '@/lib/supabase'
import { reportKeys } from './keys'
import type { ReportFilter } from '../schemas'
import type { Database } from '@/types/database.types'

export type LoanReportRow = Database['public']['Functions']['report_loans']['Returns'][number]
export type ReturnReportRow = Database['public']['Functions']['report_returns']['Returns'][number]
export type OverdueReportRow = Database['public']['Functions']['report_overdue']['Returns'][number]
export type FineReportRow = Database['public']['Functions']['report_fines']['Returns'][number]
export type InventoryReportRow = Database['public']['Functions']['report_inventory']['Returns'][number]
export type MemberActivityReportRow = Database['public']['Functions']['report_member_activity']['Returns'][number]
export type PopularBookReportRow = Database['public']['Functions']['report_popular_books']['Returns'][number]

export type ReportRow =
  | LoanReportRow
  | ReturnReportRow
  | OverdueReportRow
  | FineReportRow
  | InventoryReportRow
  | MemberActivityReportRow
  | PopularBookReportRow

export function getDefaultReportPeriod() {
  const now = new TZDate(new Date(), 'Asia/Makassar')
  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

export function reportDataQueryOptions(filter: ReportFilter) {
  const defaultPeriod = getDefaultReportPeriod()
  const from = filter.from || defaultPeriod.from
  const to = filter.to || defaultPeriod.to

  return queryOptions({
    queryKey: reportKeys.data({ ...filter, from, to }),
    queryFn: async (): Promise<ReportRow[]> => {
      switch (filter.type) {
        case 'loans': {
          const res = await supabase.rpc('report_loans', {
            p_from: from,
            p_to: to,
          })
          return unwrap(res) ?? []
        }
        case 'returns': {
          const res = await supabase.rpc('report_returns', {
            p_from: from,
            p_to: to,
          })
          return unwrap(res) ?? []
        }
        case 'overdue': {
          const res = await supabase.rpc('report_overdue', {
            p_as_of: to,
          })
          return unwrap(res) ?? []
        }
        case 'fines': {
          const res = await supabase.rpc('report_fines', {
            p_from: from,
            p_to: to,
          })
          return unwrap(res) ?? []
        }
        case 'inventory': {
          const res = await supabase.rpc('report_inventory')
          return unwrap(res) ?? []
        }
        case 'member_activity': {
          const res = await supabase.rpc('report_member_activity', {
            p_from: from,
            p_to: to,
          })
          return unwrap(res) ?? []
        }
        case 'popular_books': {
          const res = await supabase.rpc('report_popular_books', {
            p_from: from,
            p_to: to,
            p_limit: 10,
          })
          return unwrap(res) ?? []
        }
        default:
          return []
      }
    },
    staleTime: 30_000,
  })
}
