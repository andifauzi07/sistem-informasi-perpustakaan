import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) {
  throw new Error('VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY wajib diisi (lihat .env.example)')
}

export const supabase = createClient<Database>(url, key)

// Ubah respons { data, error } Supabase menjadi nilai atau lemparan, agar TanStack Query menangkap galatnya.
export function unwrap<T>({ data, error }: { data: T; error: Error | null }): T {
  if (error) throw error
  return data
}
