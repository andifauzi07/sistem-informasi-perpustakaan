import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/pustakawan')({
  beforeLoad: ({ context }) => {
    // Pastikan pengguna memiliki peran librarian aktif (FR-AUTH-05, TC-AUTH-06)
    if (context.profile.role !== 'librarian') {
      toast.error('Anda tidak memiliki akses untuk tindakan ini.')
      throw redirect({ to: '/beranda' })
    }
  },
  component: Outlet,
})
