import { queryOptions } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { authKeys } from './keys'

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data.session
    },
    staleTime: 30_000,
  })
}

export function profileQueryOptions(userId?: string) {
  return queryOptions({
    queryKey: authKeys.profile(userId),
    queryFn: async () => {
      if (!userId) return null
      const res = await supabase.from('profiles').select('*').eq('id', userId).single()
      return unwrap(res)
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  })
}
