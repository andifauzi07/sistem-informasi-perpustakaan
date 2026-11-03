// Katalog kode galat dan pemetaan pesan UI (PRD §12.4)

export const ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: 'Sesi berakhir. Silakan login kembali.',
  FORBIDDEN: 'Anda tidak memiliki akses untuk tindakan ini.',
  VALIDATION_ERROR: 'Data tidak valid. Periksa kembali isian Anda.',
  NOT_FOUND: 'Data tidak ditemukan.',
  MEMBER_INACTIVE: 'Akun dinonaktifkan, hubungi pustakawan.',
  MEMBER_NOT_FOUND: 'Anggota dengan nomor induk tersebut tidak ditemukan.',
  MEMBER_CODE_TAKEN: 'Nomor induk sudah terdaftar.',
  LOAN_LIMIT_REACHED: 'Batas peminjaman tercapai.',
  DUPLICATE_TITLE: 'Judul ini sudah Anda ajukan atau sedang Anda pinjam.',
  NO_AVAILABLE_COPY: 'Stok buku sedang habis.',
  REQUEST_INVALID_STATE: 'Status pengajuan sudah berubah. Muat ulang halaman.',
  COPY_NOT_FOUND: 'Kode eksemplar tidak ditemukan.',
  COPY_NOT_AVAILABLE: 'Eksemplar ini tidak dapat dipinjam saat ini.',
  COPY_NOT_ON_LOAN: 'Eksemplar ini tidak sedang dipinjam.',
  CODE_TAKEN: 'Kode eksemplar sudah dipakai.',
  LOAN_INVALID_STATE: 'Status peminjaman sudah berubah. Muat ulang halaman.',
  FINE_INVALID_STATE: 'Status denda sudah berubah. Muat ulang halaman.',
  INVALID_STATUS_TRANSITION: 'Perubahan status eksemplar tidak diizinkan.',
  BOOK_HAS_HISTORY: 'Buku memiliki riwayat transaksi sehingga tidak dapat dihapus. Tarik eksemplarnya.',
}

export function toUserMessage(err: unknown): string {
  if (!err) return 'Terjadi kesalahan sistem yang tidak diketahui.'

  if (typeof err === 'string') {
    return ERROR_MESSAGES[err] ?? err
  }

  if (typeof err === 'object') {
    const errorObj = err as Record<string, unknown>
    const message = typeof errorObj.message === 'string' ? errorObj.message : ''
    const code = typeof errorObj.code === 'string' ? errorObj.code : ''

    if (ERROR_MESSAGES[message]) {
      return ERROR_MESSAGES[message]
    }
    if (ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code]
    }

    // Postgres standard error codes
    if (code === '23505') {
      return 'Data sudah ada.'
    }
    if (code === '23503') {
      return 'Data masih dipakai.'
    }

    // Galat jaringan
    if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
      return 'Koneksi bermasalah. Coba lagi.'
    }

    if (message) {
      return message
    }
  }

  return 'Terjadi kesalahan. Silakan coba beberapa saat lagi.'
}
