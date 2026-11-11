import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { settingsKeys } from './keys'
import type { LibraryProfileFormValues, LoanPolicyFormValues, MajorFormValues } from '../schemas'

export function useUpdateLibraryProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: LibraryProfileFormValues) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const res = await supabase
        .from('library_settings')
        .update({
          school_name: values.school_name,
          library_name: values.library_name,
          address: values.address,
          logo_path: values.logo_path ?? null,
          updated_by: user?.id ?? null,
        })
        .eq('id', 1)
        .select()
        .single()

      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.profile() })
    },
  })
}

export function useUploadLibraryLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
      const filePath = `logo-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('library-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        unwrap({ error: uploadError, data: null })
      }

      const { data: publicUrlData } = supabase.storage
        .from('library-assets')
        .getPublicUrl(filePath)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const res = await supabase
        .from('library_settings')
        .update({
          logo_path: publicUrlData.publicUrl,
          updated_by: user?.id ?? null,
        })
        .eq('id', 1)
        .select()
        .single()

      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.profile() })
    },
  })
}

export function useUpdateLoanPolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: LoanPolicyFormValues) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const res = await supabase
        .from('loan_policies')
        .update({
          max_active_loans: values.max_active_loans,
          loan_days: values.loan_days,
          daily_fine: values.daily_fine,
          pickup_days: values.pickup_days,
          updated_by: user?.id ?? null,
        })
        .eq('role', values.role)
        .select()
        .single()

      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.policies() })
    },
  })
}

export function useCreateMajor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: MajorFormValues) => {
      const res = await supabase
        .from('majors')
        .insert({
          code: values.code,
          name: values.name,
          is_active: values.is_active,
        })
        .select()
        .single()

      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.majors() })
    },
  })
}

export function useUpdateMajor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Partial<MajorFormValues> }) => {
      const res = await supabase
        .from('majors')
        .update(values)
        .eq('id', id)
        .select()
        .single()

      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.majors() })
    },
  })
}
