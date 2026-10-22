import { describe, expect, it } from 'vitest'
import { toAuthEmail, toLoginId } from './login-id'

describe('toLoginId (TC-AUTH-03)', () => {
  it.each([
    ['21.10.0456', '21100456'],
    ['2110 0456', '21100456'],
    ['ABC-12', 'abc12'],
    ['0071234567', '0071234567'],
  ])('%s → %s', (input, expected) => {
    expect(toLoginId(input)).toBe(expected)
  })
})

describe('toAuthEmail', () => {
  it('membentuk email dari domain lingkungan', () => {
    expect(toAuthEmail('21.10.0456', 'anggota.contoh-sekolah.sch.id')).toBe('21100456@anggota.contoh-sekolah.sch.id')
  })
})
