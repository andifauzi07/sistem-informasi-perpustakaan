// Label enum untuk antarmuka pengguna (PRD Lampiran A & CLAUDE.md §5)
import type { Database } from '@/types/database.types'

export type AppRole = Database['public']['Enums']['app_role']
export type CopyStatus = Database['public']['Enums']['copy_status']
export type CopySource = Database['public']['Enums']['copy_source']

export const ROLE_LABELS: Record<AppRole, string> = {
  student: 'Siswa',
  teacher: 'Guru',
  librarian: 'Pustakawan',
}

export const STATUS_LABELS = {
  active: 'Aktif',
  inactive: 'Nonaktif',
} as const

export const COPY_STATUS_LABELS: Record<CopyStatus, string> = {
  available: 'Tersedia',
  reserved: 'Dipesan',
  on_loan: 'Dipinjam',
  damaged: 'Rusak',
  lost: 'Hilang',
  withdrawn: 'Ditarik',
}

export const COPY_SOURCE_LABELS: Record<CopySource, string> = {
  purchase: 'Pembelian',
  donation: 'Sumbangan / Hibah',
  government: 'BOS / Pemerintah',
  other: 'Lainnya',
}
