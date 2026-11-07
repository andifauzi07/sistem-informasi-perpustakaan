import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

const TIMEZONE_WITA = 'Asia/Makassar'

/**
 * Mengembalikan tanggal hari ini dalam format YYYY-MM-DD sesuai zona waktu WITA (Asia/Makassar).
 */
export function getTodayWitaString(referenceDate: Date = new Date()): string {
  const witaDate = new TZDate(referenceDate, TIMEZONE_WITA)
  return format(witaDate, 'yyyy-MM-dd')
}

/**
 * Menghitung selisih hari kalender antara tanggal jatuh tempo (YYYY-MM-DD) dan tanggal acuan WITA.
 * Mengembalikan nilai positif jika masih ada sisa hari, 0 jika jatuh tempo hari ini,
 * dan negatif jika sudah melewati jatuh tempo.
 */
export function calculateRemainingDays(
  dueDateStr: string,
  referenceDateStr: string = getTodayWitaString()
): number {
  const [dueY, dueM, dueD] = dueDateStr.slice(0, 10).split('-').map(Number)
  const [refY, refM, refD] = referenceDateStr.slice(0, 10).split('-').map(Number)

  if (!dueY || !dueM || !dueD || !refY || !refM || !refD) {
    return 0
  }

  const dueUtc = Date.UTC(dueY, dueM - 1, dueD)
  const refUtc = Date.UTC(refY, refM - 1, refD)
  const diffMs = dueUtc - refUtc
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Menghitung jumlah hari terlambat berdasarkan aturan bisnis BR-10:
 * max(0, tanggal WITA saat ini - due_date).
 */
export function calculateDaysLate(
  dueDateStr: string,
  referenceDateStr: string = getTodayWitaString()
): number {
  const remaining = calculateRemainingDays(dueDateStr, referenceDateStr)
  return Math.max(0, -remaining)
}

/**
 * Menghitung estimasi denda keterlambatan berdasarkan aturan bisnis BR-11:
 * hari terlambat x daily_fine_snapshot.
 */
export function calculateLateFine(
  dueDateStr: string,
  dailyFineSnapshot: number,
  referenceDateStr: string = getTodayWitaString()
): number {
  if (dailyFineSnapshot <= 0) return 0
  const daysLate = calculateDaysLate(dueDateStr, referenceDateStr)
  return daysLate * dailyFineSnapshot
}
