// Label enum untuk antarmuka pengguna (PRD Lampiran A & CLAUDE.md §5)
import type { Database } from '@/types/database.types'

export type AppRole = Database['public']['Enums']['app_role']

export const ROLE_LABELS: Record<AppRole, string> = {
  student: 'Siswa',
  teacher: 'Guru',
  librarian: 'Pustakawan',
}

export const STATUS_LABELS = {
  active: 'Aktif',
  inactive: 'Nonaktif',
} as const
