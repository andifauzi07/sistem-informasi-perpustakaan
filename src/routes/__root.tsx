import { useSyncExternalStore } from 'react'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { onlineManager, type QueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'

export type RouterContext = { queryClient: QueryClient; auth: SupabaseClient['auth'] }

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <OfflineBanner />
      <Outlet />
    </>
  )
}

const subscribeOnline = onlineManager.subscribe.bind(onlineManager)

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribeOnline, () => onlineManager.isOnline())
  return (
    <div role="status" aria-live="polite">
      {!online && <p className="bg-foreground px-4 py-2 text-center text-sm text-background">Koneksi terputus</p>}
    </div>
  )
}
