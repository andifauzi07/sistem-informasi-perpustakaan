// Pemformatan tanggal dan mata uang (CLAUDE.md §9 & PRD §18)
import { format } from 'date-fns'
import { TZDate } from '@date-fns/tz'

const TIMEZONE_WITA = 'Asia/Makassar'

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date | number): string {
  const parsed = new TZDate(new Date(date), TIMEZONE_WITA)
  return format(parsed, 'dd/MM/yyyy')
}

export function formatDateTime(date: string | Date | number): string {
  const parsed = new TZDate(new Date(date), TIMEZONE_WITA)
  return format(parsed, 'dd/MM/yyyy HH:mm')
}
