// Label enum untuk antarmuka pengguna (PRD Lampiran A & CLAUDE.md §5)
import type { Database } from '@/types/database.types'

export type AppRole = Database['public']['Enums']['app_role']
export type CopyStatus = Database['public']['Enums']['copy_status']
export type CopySource = Database['public']['Enums']['copy_source']
export type LoanRequestStatus = Database['public']['Enums']['loan_request_status']
export type LoanStatus = Database['public']['Enums']['loan_status']
export type FineType = Database['public']['Enums']['fine_type']
export type FineStatus = Database['public']['Enums']['fine_status']

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

export const LOAN_REQUEST_STATUS_LABELS: Record<LoanRequestStatus, string> = {
  pending: 'Menunggu Verifikasi',
  approved: 'Siap Diambil',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
  fulfilled: 'Dipinjam',
}

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  active: 'Dipinjam',
  returned: 'Dikembalikan',
  lost: 'Hilang',
}

export const FINE_TYPE_LABELS: Record<FineType, string> = {
  late: 'Keterlambatan',
  damage: 'Kerusakan Buku',
  loss: 'Kehilangan Buku',
}

export const FINE_STATUS_LABELS: Record<FineStatus, string> = {
  unpaid: 'Belum Lunas',
  paid: 'Lunas',
  waived: 'Dibebaskan',
}

export const RETURN_CONDITION_LABELS = {
  good: 'Baik',
  damaged: 'Rusak',
} as const
