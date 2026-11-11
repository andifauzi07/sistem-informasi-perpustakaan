import { queryOptions } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { settingsKeys } from './keys'
import type { Tables } from '@/types/database.types'

export type LibrarySettings = Tables<'library_settings'>
export type LoanPolicy = Tables<'loan_policies'>
export type Major = Tables<'majors'>

export function librarySettingsQueryOptions() {
  return queryOptions({
    queryKey: settingsKeys.profile(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('library_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (error) unwrap({ error, data: null })
      return data
    },
    staleTime: 5 * 60_000,
  })
}

export function loanPoliciesQueryOptions() {
  return queryOptions({
    queryKey: settingsKeys.policies(),
    queryFn: async () => {
      const res = await supabase
        .from('loan_policies')
        .select('*')
        .order('role', { ascending: true })

      return unwrap(res)
    },
    staleTime: 5 * 60_000,
  })
}

export function majorsQueryOptions() {
  return queryOptions({
    queryKey: settingsKeys.majors(),
    queryFn: async () => {
      const res = await supabase
        .from('majors')
        .select('*')
        .order('code', { ascending: true })

      return unwrap(res)
    },
    staleTime: 5 * 60_000,
  })
}
