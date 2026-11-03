import { describe, it, expect } from 'vitest'
import { toUserMessage } from './errors'

describe('errors util', () => {
  it('memetakan kode galat bisnis dari PRD §12.4', () => {
    expect(toUserMessage('AUTH_REQUIRED')).toBe('Sesi berakhir. Silakan login kembali.')
    expect(toUserMessage('FORBIDDEN')).toBe('Anda tidak memiliki akses untuk tindakan ini.')
    expect(toUserMessage('MEMBER_INACTIVE')).toBe('Akun dinonaktifkan, hubungi pustakawan.')
    expect(toUserMessage('MEMBER_CODE_TAKEN')).toBe('Nomor induk sudah terdaftar.')
  })

  it('memetakan kode Postgres unik dan foreign key', () => {
    expect(toUserMessage({ code: '23505' })).toBe('Data sudah ada.')
    expect(toUserMessage({ code: '23503' })).toBe('Data masih dipakai.')
  })

  it('memetakan galat jaringan menjadi pesan koneksi ramah', () => {
    expect(toUserMessage(new Error('Failed to fetch'))).toBe('Koneksi bermasalah. Coba lagi.')
  })

  it('mengembalikan pesan bawaan untuk galat generik', () => {
    expect(toUserMessage(new Error('Custom error'))).toBe('Custom error')
    expect(toUserMessage(null)).toBe('Terjadi kesalahan sistem yang tidak diketahui.')
  })
})
