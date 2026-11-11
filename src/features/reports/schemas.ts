import { z } from 'zod'

export const REPORT_TYPES = [
  'loans',
  'returns',
  'overdue',
  'fines',
  'inventory',
  'member_activity',
  'popular_books',
] as const

export type ReportType = (typeof REPORT_TYPES)[number]

export const REPORT_LABELS: Record<ReportType, string> = {
  loans: 'Laporan Peminjaman',
  returns: 'Laporan Pengembalian',
  overdue: 'Laporan Keterlambatan',
  fines: 'Laporan Rekapitulasi Denda',
  inventory: 'Laporan Inventaris Eksemplar',
  member_activity: 'Laporan Aktivitas Anggota',
  popular_books: 'Buku Paling Sering Dipinjam (Top 10)',
}

export const reportFilterSchema = z.object({
  type: z.enum(REPORT_TYPES).catch('loans'),
  from: z.string().catch(''),
  to: z.string().catch(''),
})

export type ReportFilter = z.infer<typeof reportFilterSchema>
