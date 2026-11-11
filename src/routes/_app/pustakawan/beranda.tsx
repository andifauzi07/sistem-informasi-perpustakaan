import { createFileRoute } from '@tanstack/react-router'
import { LibrarianDashboard } from '@/features/dashboard/components/LibrarianDashboard'

export const Route = createFileRoute('/_app/pustakawan/beranda')({
  component: PustakawanBerandaPage,
})

function PustakawanBerandaPage() {
  const { profile } = Route.useRouteContext()

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6">
      <LibrarianDashboard profile={profile} />
    </div>
  )
}
