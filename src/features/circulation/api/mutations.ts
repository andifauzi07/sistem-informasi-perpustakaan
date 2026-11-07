import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { circulationKeys } from './keys'
import { collectionKeys } from '@/features/collection/api/keys'
import type {
  ApproveRequestFormData,
  RejectRequestFormData,
  CheckoutFormData,
  CheckinFormData,
  MarkLoanLostFormData,
} from '../schemas'

export interface CheckinResultSummary {
  loan_id: number
  copy_id: number
  copy_code: string
  member_id: string
  condition: 'good' | 'damaged'
  days_late: number
  late_fine: number
  damage_fine: number
}

// Helper invalidasi serentak seluruh query sirkulasi, koleksi, katalog, denda, dan beranda (CLAUDE.md §8)
function invalidateAllCirculationData(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['catalog'] })
  void queryClient.invalidateQueries({ queryKey: ['books'] })
  void queryClient.invalidateQueries({ queryKey: ['copies'] })
  void queryClient.invalidateQueries({ queryKey: collectionKeys.all })
  void queryClient.invalidateQueries({ queryKey: circulationKeys.all })
  void queryClient.invalidateQueries({ queryKey: circulationKeys.loanRequests() })
  void queryClient.invalidateQueries({ queryKey: circulationKeys.loans() })
  void queryClient.invalidateQueries({ queryKey: ['fines'] })
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}

// 1. Anggota mengajukan pinjaman buku (FR-CIR-01)
export function useRequestLoanMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookId: number) => {
      const res = await supabase.rpc('request_loan', { p_book_id: bookId })
      return unwrap(res)
    },
    onSuccess: () => {
      invalidateAllCirculationData(queryClient)
    },
  })
}

// 2. Anggota membatalkan pengajuan pinjaman (FR-CIR-03)
export function useCancelLoanRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (requestId: number) => {
      const res = await supabase.rpc('cancel_loan_request', {
        p_request_id: requestId,
      })
      return unwrap(res)
    },
    onSuccess: () => {
      invalidateAllCirculationData(queryClient)
    },
  })
}

// 3. Anggota menandai ajukan pengembalian buku (FR-CIR-04)
export function useRequestReturnMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (loanId: number) => {
      const res = await supabase.rpc('request_return', { p_loan_id: loanId })
      return unwrap(res)
    },
    onSuccess: () => {
      invalidateAllCirculationData(queryClient)
    },
  })
}

// 4. Pustakawan menyetujui pengajuan (FR-CIR-07)
export function useApproveLoanRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: ApproveRequestFormData) => {
      const res = await supabase.rpc('approve_loan_request', {
        p_request_id: data.requestId,
        p_copy_id: data.copyId ?? undefined,
      })
      return unwrap(res)
    },
    onSuccess: () => {
      invalidateAllCirculationData(queryClient)
    },
  })
}

// 5. Pustakawan menolak pengajuan dengan alasan wajib (FR-CIR-08)
export function useRejectLoanRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: RejectRequestFormData) => {
      const res = await supabase.rpc('reject_loan_request', {
        p_request_id: data.requestId,
        p_reason: data.reason,
      })
      return unwrap(res)
    },
    onSuccess: () => {
      invalidateAllCirculationData(queryClient)
    },
  })
}

// 6. Pustakawan memproses checkout peminjaman di Meja Sirkulasi (FR-CIR-09)
export function useCheckoutCopyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const res = await supabase.rpc('checkout_copy', {
        p_member_id: data.memberId,
        p_copy_code: data.copyCode.trim(),
      })
      return unwrap(res)
    },
    onSuccess: () => {
      invalidateAllCirculationData(queryClient)
    },
  })
}

// 7. Pustakawan memproses check-in pengembalian di Meja Sirkulasi (FR-CIR-10)
export function useCheckinCopyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CheckinFormData) => {
      const res = await supabase.rpc('checkin_copy', {
        p_copy_code: data.copyCode.trim(),
        p_condition: data.condition,
        p_damage_fine: data.condition === 'damaged' ? data.damageFine ?? undefined : undefined,
        p_notes: data.notes?.trim() || undefined,
      })
      return unwrap(res) as unknown as CheckinResultSummary
    },
    onSuccess: () => {
      invalidateAllCirculationData(queryClient)
    },
  })
}

// 8. Pustakawan menandai pinjaman aktif sebagai hilang (FR-CIR-14)
export function useMarkLoanLostMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: MarkLoanLostFormData) => {
      const res = await supabase.rpc('mark_loan_lost', {
        p_loan_id: data.loanId,
        p_amount: data.amount,
        p_notes: data.notes?.trim() || undefined,
      })
      return unwrap(res)
    },
    onSuccess: () => {
      invalidateAllCirculationData(queryClient)
    },
  })
}
