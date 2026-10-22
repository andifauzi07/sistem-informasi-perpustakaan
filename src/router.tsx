import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import { RouteError } from '@/components/route-error'

export const router = createRouter({
  routeTree,
  context: { queryClient, auth: supabase.auth },
  defaultErrorComponent: RouteError,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
