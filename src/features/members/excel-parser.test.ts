import { describe, it, expect } from 'vitest'
import { parseMemberRows, parseRole, cellToString } from './excel-parser'

describe('excel-parser', () => {
  const mockMajors = [
    { id: 'm-tkj', code: 'TKJ' },
    { id: 'm-rpl', code: 'RPL' },
  ]

  it('mengonversi nilai sel ke string bersih', () => {
    expect(cellToString(null)).toBe('')
    expect(cellToString(undefined)).toBe('')
    expect(cellToString('  test  ')).toBe('test')
    expect(cellToString(12345)).toBe('12345')
  })

  it('memvalidasi dan memetakan peran siswa, guru, pustakawan', () => {
    expect(parseRole('siswa')).toBe('student')
    expect(parseRole('student')).toBe('student')
    expect(parseRole('guru')).toBe('teacher')
    expect(parseRole('teacher')).toBe('teacher')
    expect(parseRole('pustakawan')).toBe('librarian')
    expect(parseRole('librarian')).toBe('librarian')
    expect(parseRole('admin')).toBe(null)
  })

  it('mem-parsing baris siswa yang valid', () => {
    const rawRows = [
      ['211001', 'Budi Santoso', 'siswa', 'X TKJ 1', 'TKJ', '', '081234567890'],
    ]
    const results = parseMemberRows(rawRows, mockMajors)

    expect(results).toHaveLength(1)
    expect(results[0].isValid).toBe(true)
    expect(results[0].memberCode).toBe('211001')
    expect(results[0].fullName).toBe('Budi Santoso')
    expect(results[0].role).toBe('student')
    expect(results[0].className).toBe('X TKJ 1')
    expect(results[0].majorId).toBe('m-tkj')
  })

  it('menolak peran yang tidak valid', () => {
    const rawRows = [
      ['211002', 'Ani Wijaya', 'kepala_sekolah', '', '', '', ''],
    ]
    const results = parseMemberRows(rawRows, mockMajors)
    expect(results[0].isValid).toBe(false)
    expect(results[0].errorReason).toContain('Peran')
  })

  it('menolak nomor induk di luar batas 3–30 karakter', () => {
    const rawRows = [
      ['12', 'Short Code', 'guru', '', '', 'Matematika', ''],
    ]
    const results = parseMemberRows(rawRows, mockMajors)
    expect(results[0].isValid).toBe(false)
    expect(results[0].errorReason).toContain('3–30 karakter')
  })

  it('mendeteksi nomor induk duplikat dalam berkas yang sama', () => {
    const rawRows = [
      ['211001', 'Budi Santoso', 'siswa', 'X TKJ 1', 'TKJ', '', ''],
      ['211001', 'Budi Kloning', 'siswa', 'X TKJ 1', 'TKJ', '', ''],
    ]
    const results = parseMemberRows(rawRows, mockMajors)
    expect(results[0].isValid).toBe(true)
    expect(results[1].isValid).toBe(false)
    expect(results[1].errorReason).toContain('duplikat')
  })

  it('mewajibkan kelas untuk siswa', () => {
    const rawRows = [
      ['211003', 'Siswa Tanpa Kelas', 'siswa', '', 'TKJ', '', ''],
    ]
    const results = parseMemberRows(rawRows, mockMajors)
    expect(results[0].isValid).toBe(false)
    expect(results[0].errorReason).toContain('Kelas wajib diisi')
  })

  it('menolak kode jurusan yang tidak terdaftar di sistem', () => {
    const rawRows = [
      ['211004', 'Siswa Jurusan Asing', 'siswa', 'X TITL 1', 'TITL', '', ''],
    ]
    const results = parseMemberRows(rawRows, mockMajors)
    expect(results[0].isValid).toBe(false)
    expect(results[0].errorReason).toContain('tidak dikenal di sistem')
  })
})
