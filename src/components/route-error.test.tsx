import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { RouteError } from './route-error'

describe('RouteError', () => {
  it('menampilkan galat di area rute lalu memuat ulang saat "Coba lagi"', async () => {
    let broken = true
    const rootRoute = createRootRoute({
      component: () => (
        <>
          <nav>Navigasi</nav>
          <Outlet />
        </>
      ),
    })
    const pageRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => {
        if (broken) throw new Error('rusak')
        return <p>Konten rute</p>
      },
    })
    const router = createRouter({
      routeTree: rootRoute.addChildren([pageRoute]),
      history: createMemoryHistory(),
      defaultErrorComponent: RouteError,
    })
    render(<RouterProvider router={router} />)

    await screen.findByRole('alert')
    expect(screen.getByText('Navigasi')).toBeTruthy()

    broken = false
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByText('Konten rute')).toBeTruthy()
  })
})
