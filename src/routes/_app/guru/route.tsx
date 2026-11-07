import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/guru')({
  beforeLoad: ({ context }) => {
    // Akses kelola bahan ajar guru hanya untuk peran teacher (FR-MAT-01, TC-MAT-04)
    if (context.profile.role !== 'teacher') {
      toast.error('Halaman ini khusus untuk peran guru.')
      throw redirect({ to: '/beranda' })
    }
  },
  component: Outlet,
})
