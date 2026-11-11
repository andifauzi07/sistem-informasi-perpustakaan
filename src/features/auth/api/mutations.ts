import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { toAuthEmail } from '../login-id'
import { authKeys } from './keys'
import type { LoginFormData, ChangePasswordFormData } from '../schemas'

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberCode, password }: LoginFormData) => {
      const emailDomain = import.meta.env.VITE_AUTH_EMAIL_DOMAIN || 'anggota.sip.local'
      const email = toAuthEmail(memberCode, emailDomain)

      const res = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (res.error) {
        const msg = res.error.message.toLowerCase()
        if (msg.includes('banned') || msg.includes('disabled')) {
          throw new Error('MEMBER_INACTIVE')
        }
        // Pesan galat generik tanpa membocorkan keberadaan nomor induk (FR-AUTH-01)
        throw new Error('Nomor induk atau password salah')
      }

      // Periksa status keaktifan profil (FR-AUTH-06)
      const profileRes = await supabase
        .from('profiles')
        .select('*')
        .eq('id', res.data.user.id)
        .single()

      if (profileRes.error) {
        await supabase.auth.signOut()
        throw profileRes.error
      }

      if (!profileRes.data.is_active) {
        await supabase.auth.signOut()
        throw new Error('MEMBER_INACTIVE')
      }

      return {
        session: res.data.session,
        user: res.data.user,
        profile: profileRes.data,
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.session(), data.session)
      queryClient.setQueryData(authKeys.profile(data.user.id), data.profile)
      void queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.session(), null)
      queryClient.clear()
    },
  })
}

export function useChangePasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ newPassword }: Pick<ChangePasswordFormData, 'newPassword'>) => {
      const authRes = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (authRes.error) throw authRes.error

      const rpcRes = await supabase.rpc('complete_password_change')
      unwrap(rpcRes)

      return authRes.data
    },
    onSuccess: async () => {
      // Perbarui cache langsung agar guard beforeLoad membaca must_change_password = false
      queryClient.setQueriesData(
        { queryKey: authKeys.all },
        (old: unknown) => (old && typeof old === 'object' ? { ...old, must_change_password: false } : old)
      )
      await queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}
