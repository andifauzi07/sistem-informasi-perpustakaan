import { QueryClient } from '@tanstack/react-query'

// NFR-PE-04; mutation tanpa retry agar aksi tidak terkirim ganda (NFR-RE-02).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
    mutations: { retry: 0 },
  },
})
