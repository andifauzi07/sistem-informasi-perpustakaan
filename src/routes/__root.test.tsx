import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { onlineManager } from '@tanstack/react-query'
import { OfflineBanner } from './__root'

afterEach(() => {
  cleanup()
  onlineManager.setOnline(true)
})

describe('OfflineBanner', () => {
  it('muncul saat offline dan hilang saat koneksi pulih', () => {
    render(<OfflineBanner />)
    expect(screen.queryByText('Koneksi terputus')).toBeNull()

    act(() => onlineManager.setOnline(false))
    expect(screen.getByRole('status').textContent).toBe('Koneksi terputus')

    act(() => onlineManager.setOnline(true))
    expect(screen.queryByText('Koneksi terputus')).toBeNull()
  })
})
