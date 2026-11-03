// Utilitas pembuatan password sementara (PRD §12.3, FR-MBR-02)

export const AMBIGUOUS_CHARS = ['0', 'O', '1', 'l', 'I']
export const TEMP_PASSWORD_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/**
 * Menghasilkan password sementara sepanjang `length` (default 10 karakter)
 * tanpa menyertakan karakter ambigu (0, O, 1, l, I).
 */
export function generateTempPassword(length = 10): string {
  const chars = TEMP_PASSWORD_CHARS
  const randomBytes = new Uint8Array(length)
  crypto.getRandomValues(randomBytes)
  return Array.from(randomBytes, (b) => chars[b % chars.length]).join('')
}

/**
 * Memeriksa apakah sebuah password memenuhi kriteria password sementara (tanpa karakter ambigu).
 */
export function hasAmbiguousChars(pwd: string): boolean {
  return AMBIGUOUS_CHARS.some((ch) => pwd.includes(ch))
}
