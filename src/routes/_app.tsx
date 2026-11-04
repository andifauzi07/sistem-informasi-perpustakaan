import { createFileRoute, Outlet, redirect, Link, useNavigate } from '@tanstack/react-router'
import { sessionQueryOptions, profileQueryOptions } from '@/features/auth/api/queries'
import { useLogoutMutation } from '@/features/auth/api/mutations'
import { ROLE_LABELS } from '@/lib/labels'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, User, LogOut, Users, Home, Library, Tag } from 'lucide-react'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    // 1. Periksa sesi aktif
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions())
    if (!session?.user) {
      throw redirect({ to: '/login' })
    }

    // 2. Periksa profil pengguna
    const profile = await context.queryClient.ensureQueryData(profileQueryOptions(session.user.id))
    if (!profile || !profile.is_active) {
      throw redirect({ to: '/login' })
    }

    // 3. Paksa ganti password pertama kali (FR-AUTH-03)
    if (profile.must_change_password && location.pathname !== '/ganti-password') {
      throw redirect({ to: '/ganti-password' })
    }

    return { session, profile }
  },
  component: AppLayout,
})

function AppLayout() {
  const { profile } = Route.useRouteContext()
  const logoutMutation = useLogoutMutation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    void navigate({ to: '/login' })
  }

  const isLibrarian = profile.role === 'librarian'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar Atas */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/beranda" className="flex items-center gap-2 font-bold text-primary">
              <BookOpen className="size-6" />
              <span className="hidden sm:inline">SIP SMKN 1 Selayar</span>
            </Link>

            {!profile.must_change_password && (
              <nav className="flex items-center gap-2 text-sm font-medium">
                <Link
                  to="/beranda"
                  activeProps={{ className: 'text-primary font-semibold' }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
                >
                  <Home className="size-4" />
                  <span>Beranda</span>
                </Link>

                <Link
                  to="/katalog"
                  search={{ q: '', category: undefined, availableOnly: false, sort: 'relevance', page: 1 }}
                  activeProps={{ className: 'text-primary font-semibold' }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
                >
                  <BookOpen className="size-4" />
                  <span>Katalog</span>
                </Link>

                {isLibrarian && (
                  <>
                    <Link
                      to="/pustakawan/koleksi"
                      search={{ q: '', categoryId: undefined, page: 1 }}
                      activeProps={{ className: 'text-primary font-semibold' }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
                    >
                      <Library className="size-4" />
                      <span>Koleksi</span>
                    </Link>

                    <Link
                      to="/pustakawan/kategori"
                      activeProps={{ className: 'text-primary font-semibold' }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
                    >
                      <Tag className="size-4" />
                      <span>Kategori</span>
                    </Link>

                    <Link
                      to="/pustakawan/anggota"
                      search={{ q: '', role: 'all', status: 'all', page: 1 }}
                      activeProps={{ className: 'text-primary font-semibold' }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
                    >
                      <Users className="size-4" />
                      <span>Anggota</span>
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-medium leading-none">{profile.full_name}</span>
              <div className="mt-1 flex items-center gap-1">
                <Badge variant={isLibrarian ? 'default' : 'secondary'} className="text-xs">
                  {ROLE_LABELS[profile.role]}
                </Badge>
                {profile.class_name && (
                  <span className="text-xs text-muted-foreground">({profile.class_name})</span>
                )}
              </div>
            </div>

            {!profile.must_change_password && (
              <Link to="/profil">
                <Button variant="outline" size="icon" aria-label="Profil Saya">
                  <User className="size-4" />
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                void handleLogout()
              }}
              disabled={logoutMutation.isPending}
              aria-label="Keluar / Logout"
              title="Logout"
            >
              <LogOut className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      </header>

      {/* Konten Halaman */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
