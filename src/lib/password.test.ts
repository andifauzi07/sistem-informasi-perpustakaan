import { describe, it, expect } from 'vitest'
import { generateTempPassword, hasAmbiguousChars, TEMP_PASSWORD_CHARS } from './password'

describe('password utils', () => {
  it('menghasilkan password acak sepanjang 10 karakter', () => {
    const pwd = generateTempPassword()
    expect(pwd).toHaveLength(10)
  })

  it('menghasilkan panjang sesuai parameter', () => {
    expect(generateTempPassword(12)).toHaveLength(12)
    expect(generateTempPassword(8)).toHaveLength(8)
  })

  it('tidak mengandung karakter ambigu (0, O, 1, l, I)', () => {
    for (let i = 0; i < 50; i++) {
      const pwd = generateTempPassword(10)
      expect(hasAmbiguousChars(pwd)).toBe(false)
      for (const char of pwd) {
        expect(TEMP_PASSWORD_CHARS).toContain(char)
      }
    }
  })
})
