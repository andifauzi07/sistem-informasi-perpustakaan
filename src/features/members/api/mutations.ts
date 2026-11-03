import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { memberKeys } from './keys'
import type { CreateMemberFormData, UpdateMemberFormData } from '../schemas'

async function invokeAdminMembers<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const res = await supabase.functions.invoke<T>('admin-members', {
    body,
  })

  if (res.error) {
    // Ekstrak pesan kesalahan dari response body Edge Function jika ada
    const err = res.error as unknown
    if (err && typeof err === 'object' && 'context' in err) {
      const ctx = (err as { context?: unknown }).context
      if (ctx instanceof Response) {
        try {
          const errJson = (await ctx.json()) as { code?: string; message?: string }
          if (errJson?.code || errJson?.message) {
            const customErr = new Error(errJson.code || errJson.message)
            if (errJson.code) {
              ;(customErr as unknown as { code: string }).code = errJson.code
            }
            throw customErr
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Edge Function returned a non-2xx status code') {
            throw e
          }
        }
      }
    }
    throw res.error
  }

  return res.data as T
}

export function useCreateMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateMemberFormData) => {
      return invokeAdminMembers<{ user_id: string; temp_password: string }>({
        action: 'create',
        member_code: payload.memberCode,
        full_name: payload.fullName,
        role: payload.role,
        class_name: payload.className || null,
        major_id: payload.majorId || null,
        subject: payload.subject || null,
        position: payload.position || null,
        phone: payload.phone || null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
    },
  })
}

export function useUpdateMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMemberFormData }) => {
      const res = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          class_name: data.className || null,
          major_id: data.majorId ? Number(data.majorId) : null,
          subject: data.subject || null,
          position: data.position || null,
          phone: data.phone || null,
        })
        .eq('id', id)
      return unwrap(res)
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) })
    },
  })
}

export function useSetActiveMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      return invokeAdminMembers({
        action: 'set_active',
        user_id: userId,
        active,
      })
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.userId) })
    },
  })
}

export function useResetPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      return invokeAdminMembers<{ temp_password: string }>({
        action: 'reset_password',
        user_id: userId,
      })
    },
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.detail(userId) })
    },
  })
}

export interface ImportRowPayload {
  member_code: string
  full_name: string
  role: 'student' | 'teacher' | 'librarian'
  class_name?: string
  major_id?: number
  subject?: string
  phone?: string
}

export interface ImportResultItem {
  row: string
  status: 'dibuat' | 'diperbarui' | 'gagal'
  message?: string
  temp_password?: string
}

export function useImportMembersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rows: ImportRowPayload[]) => {
      return invokeAdminMembers<{ results: ImportResultItem[] }>({
        action: 'import',
        rows,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
    },
  })
}
