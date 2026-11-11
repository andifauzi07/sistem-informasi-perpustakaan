import { queryOptions } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { activityLogKeys } from './keys'
import type { ActivityLogFilter } from '../schemas'
import type { Tables } from '@/types/database.types'

const PAGE_SIZE = 20

export interface ActivityLogItem extends Tables<'activity_logs'> {
  actor?: {
    id: string
    full_name: string
    member_code: string
  } | null
}

export function activityLogsQueryOptions(filter: ActivityLogFilter) {
  return queryOptions({
    queryKey: activityLogKeys.list(filter),
    queryFn: async (): Promise<{ data: ActivityLogItem[]; count: number }> => {
      const page = Math.max(1, filter.page)
      const offset = (page - 1) * PAGE_SIZE

      let query = supabase
        .from('activity_logs')
        .select(
          `
          id,
          actor_id,
          action,
          entity_type,
          entity_id,
          details,
          created_at,
          actor:profiles!activity_logs_actor_id_fkey(
            id,
            full_name,
            member_code
          )
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (filter.action && filter.action !== 'all') {
        query = query.eq('action', filter.action)
      }

      if (filter.officerId) {
        query = query.eq('actor_id', filter.officerId)
      }

      if (filter.from) {
        query = query.gte('created_at', `${filter.from}T00:00:00+08:00`)
      }

      if (filter.to) {
        query = query.lte('created_at', `${filter.to}T23:59:59+08:00`)
      }

      const res = await query
      const data = unwrap(res)
      return {
        data: (data ?? []) as unknown as ActivityLogItem[],
        count: res.count ?? 0,
      }
    },
    staleTime: 10_000,
  })
}

export function officersListQueryOptions() {
  return queryOptions({
    queryKey: activityLogKeys.officers(),
    queryFn: async () => {
      const res = await supabase
        .from('profiles')
        .select('id, full_name, member_code')
        .eq('role', 'librarian')
        .order('full_name', { ascending: true })

      return unwrap(res) ?? []
    },
    staleTime: 5 * 60_000,
  })
}
