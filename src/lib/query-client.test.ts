import { describe, expect, it, vi } from 'vitest'
import { MutationObserver } from '@tanstack/react-query'
import { queryClient } from './query-client'

describe('queryClient', () => {
  it('query gagal dicoba ulang tepat satu kali', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('gagal'))
    await expect(queryClient.fetchQuery({ queryKey: ['uji-retry'], queryFn, retryDelay: 0 })).rejects.toThrow('gagal')
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('mutation gagal tidak dicoba ulang', async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error('gagal'))
    await expect(new MutationObserver(queryClient, { mutationFn }).mutate(undefined)).rejects.toThrow('gagal')
    expect(mutationFn).toHaveBeenCalledTimes(1)
  })

  it('staleTime bawaan 30 detik', () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(30_000)
  })
})
