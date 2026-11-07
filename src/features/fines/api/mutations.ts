import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { fineKeys } from './keys'
import { circulationKeys } from '@/features/circulation/api/keys'
import type { WaiveFineFormData } from '../schemas'

function invalidateFineQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: fineKeys.all })
  void queryClient.invalidateQueries({ queryKey: circulationKeys.all })
  void queryClient.invalidateQueries({ queryKey: circulationKeys.loanRequests() })
  void queryClient.invalidateQueries({ queryKey: circulationKeys.loans() })
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}

// 1. Pustakawan mencatat pembayaran denda tunai lunas penuh (FR-FIN-03, TC-FIN-01)
export function usePayFineMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (fineId: number) => {
      const res = await supabase.rpc('pay_fine', { p_fine_id: fineId })
      return unwrap(res)
    },
    onSuccess: () => {
      invalidateFineQueries(queryClient)
    },
  })
}

// 2. Pustakawan membebaskan denda dengan alasan wajib (FR-FIN-04, TC-FIN-02)
export function useWaiveFineMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: WaiveFineFormData) => {
      const res = await supabase.rpc('waive_fine', {
        p_fine_id: data.fineId,
        p_reason: data.reason.trim(),
      })
      return unwrap(res)
    },
    onSuccess: () => {
      invalidateFineQueries(queryClient)
    },
  })
}
