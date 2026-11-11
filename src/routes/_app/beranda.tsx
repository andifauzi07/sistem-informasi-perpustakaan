import { createFileRoute } from '@tanstack/react-router'
import { MemberDashboard } from '@/features/dashboard/components/MemberDashboard'
import { LibrarianDashboard } from '@/features/dashboard/components/LibrarianDashboard'

export const Route = createFileRoute('/_app/beranda')({
  component: BerandaPage,
})

function BerandaPage() {
  const { profile } = Route.useRouteContext()
  const isLibrarian = profile.role === 'librarian'

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6">
      {isLibrarian ? (
        <LibrarianDashboard profile={profile} />
      ) : (
        <MemberDashboard profile={profile} />
      )}
    </div>
  )
}
