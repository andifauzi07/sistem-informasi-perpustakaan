import { queryOptions } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { memberKeys } from './keys'
import type { MembersFilter } from '../schemas'

const PAGE_SIZE = 20

export function membersListQueryOptions(filters: MembersFilter) {
  return queryOptions({
    queryKey: memberKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*, majors(id, name, code)', { count: 'exact' })

      if (filters.q.trim()) {
        const keyword = filters.q.trim()
        query = query.or(`full_name.ilike.%${keyword}%,member_code.ilike.%${keyword}%`)
      }

      if (filters.role !== 'all') {
        query = query.eq('role', filters.role)
      }

      if (filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active')
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

export function memberDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: memberKeys.detail(id),
    queryFn: async () => {
      const res = await supabase
        .from('profiles')
        .select('*, majors(id, name, code)')
        .eq('id', id)
        .single()
      return unwrap(res)
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}

export function majorsQueryOptions() {
  return queryOptions({
    queryKey: memberKeys.majors(),
    queryFn: async () => {
      const res = await supabase
        .from('majors')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      return unwrap(res) || []
    },
    staleTime: 5 * 60_000,
  })
}
