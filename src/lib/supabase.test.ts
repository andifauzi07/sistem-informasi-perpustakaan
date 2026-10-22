import { describe, expect, it } from 'vitest'
import { unwrap } from './supabase'

describe('unwrap', () => {
  it('mengembalikan data bila tanpa galat', () => {
    expect(unwrap({ data: [1, 2], error: null })).toEqual([1, 2])
  })

  it('melempar galat Supabase apa adanya', () => {
    const error = new Error('NO_AVAILABLE_COPY')
    expect(() => unwrap({ data: null, error })).toThrow(error)
  })
})
