import { useState } from 'react'
import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { sessionQueryOptions, profileQueryOptions } from '@/features/auth/api/queries'
import { useLogoutMutation } from '@/features/auth/api/mutations'
import { ROLE_LABELS } from '@/lib/labels'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  User,
  LogOut,
  Users,
  Home,
  Library,
  Tag,
  ScanBarcode,
  ClipboardCheck,
  Receipt,
  History,
  BookmarkCheck,
  Menu,
  X,
  Clock,
  FileText,
  FolderOpen,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Settings,
} from 'lucide-react'

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
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    await router.invalidate()
    void navigate({ to: '/login' })
  }

  const isLibrarian = profile.role === 'librarian'
  const initials = profile.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const navLinkClass =
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white'
  const navActiveClass =
    'bg-blue-600 text-white font-semibold shadow-xs hover:bg-blue-600 hover:text-white'

  const renderSidebarNav = () => (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
      {/* Grup 1: Menu Utama */}
      <div className="space-y-0.5">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Menu Utama
        </p>
        <Link
          to="/beranda"
          onClick={closeMobileMenu}
          activeProps={{ className: navActiveClass }}
          className={navLinkClass}
        >
          <Home className="size-4 shrink-0" />
          <span>Beranda</span>
        </Link>

        <Link
          to="/katalog"
          search={{
            q: '',
            category: undefined,
            availableOnly: false,
            sort: 'relevance',
            page: 1,
          }}
          onClick={closeMobileMenu}
          activeProps={{ className: navActiveClass }}
          className={navLinkClass}
        >
          <BookOpen className="size-4 shrink-0" />
          <span>Katalog</span>
        </Link>

        <Link
          to="/bahan-ajar"
          search={{
            q: '',
            subject: '',
            majorId: undefined,
            gradeLevel: undefined,
            page: 1,
          }}
          onClick={closeMobileMenu}
          activeProps={{ className: navActiveClass }}
          className={navLinkClass}
        >
          <FileText className="size-4 shrink-0" />
          <span>Bahan Ajar</span>
        </Link>
      </div>

      {/* Grup 2: Sirkulasi Anggota (Siswa & Guru) */}
      {!isLibrarian && (
        <div className="space-y-0.5">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Sirkulasi Saya
          </p>
          <Link
            to="/pinjaman"
            onClick={closeMobileMenu}
            activeProps={{ className: navActiveClass }}
            className={navLinkClass}
          >
            <BookmarkCheck className="size-4 shrink-0" />
            <span>Pinjaman Saya</span>
          </Link>

          <Link
            to="/riwayat"
            search={{ status: 'all', page: 1 }}
            onClick={closeMobileMenu}
            activeProps={{ className: navActiveClass }}
            className={navLinkClass}
          >
            <History className="size-4 shrink-0" />
            <span>Riwayat</span>
          </Link>

          <Link
            to="/denda"
            onClick={closeMobileMenu}
            activeProps={{ className: navActiveClass }}
            className={navLinkClass}
          >
            <Receipt className="size-4 shrink-0" />
            <span>Denda Saya</span>
          </Link>

          {profile.role === 'teacher' && (
            <Link
              to="/guru/bahan-ajar"
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <FolderOpen className="size-4 shrink-0" />
              <span>Bahan Ajar Saya</span>
            </Link>
          )}
        </div>
      )}

      {/* Grup 2 & 3: Layanan Sirkulasi & Master Data (Pustakawan) */}
      {isLibrarian && (
        <>
          <div className="space-y-0.5">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Layanan Sirkulasi
            </p>
            <Link
              to="/pustakawan/sirkulasi"
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <ScanBarcode className="size-4 shrink-0" />
              <span className="flex-1">Sirkulasi</span>
              <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-200">
                Meja
              </span>
            </Link>

            <Link
              to="/pustakawan/pengajuan"
              search={{ q: '', status: 'pending', page: 1 }}
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <ClipboardCheck className="size-4 shrink-0" />
              <span>Pengajuan</span>
            </Link>

            <Link
              to="/pustakawan/pinjaman"
              search={{
                q: '',
                overdueOnly: false,
                returnRequestedOnly: false,
                role: 'all',
                className: '',
                status: 'active',
                page: 1,
              }}
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <BookmarkCheck className="size-4 shrink-0" />
              <span>Pinjaman</span>
            </Link>

            <Link
              to="/pustakawan/denda"
              search={{
                q: '',
                status: 'all',
                type: 'all',
                className: '',
                page: 1,
              }}
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <Receipt className="size-4 shrink-0" />
              <span>Denda</span>
            </Link>
          </div>

          <div className="space-y-0.5">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Koleksi & Anggota
            </p>
            <Link
              to="/pustakawan/koleksi"
              search={{ q: '', categoryId: undefined, page: 1 }}
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <Library className="size-4 shrink-0" />
              <span>Koleksi</span>
            </Link>

            <Link
              to="/pustakawan/kategori"
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <Tag className="size-4 shrink-0" />
              <span>Kategori</span>
            </Link>

            <Link
              to="/pustakawan/anggota"
              search={{ q: '', role: 'all', status: 'all', page: 1 }}
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <Users className="size-4 shrink-0" />
              <span>Anggota</span>
            </Link>

            <Link
              to="/pustakawan/kartu-anggota"
              search={{ q: '', role: 'all', className: '', majorId: undefined, page: 1 }}
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <CreditCard className="size-4 shrink-0" />
              <span>Kartu Anggota</span>
            </Link>
          </div>

          <div className="space-y-0.5">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Laporan & Sistem
            </p>
            <Link
              to="/pustakawan/laporan"
              search={{ type: 'loans', from: '', to: '' }}
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <BarChart3 className="size-4 shrink-0" />
              <span>Laporan</span>
            </Link>

            <Link
              to="/pustakawan/log-aktivitas"
              search={{ action: 'all', officerId: '', from: '', to: '', page: 1 }}
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <ShieldCheck className="size-4 shrink-0" />
              <span>Log Aktivitas</span>
            </Link>

            <Link
              to="/pustakawan/pengaturan"
              onClick={closeMobileMenu}
              activeProps={{ className: navActiveClass }}
              className={navLinkClass}
            >
              <Settings className="size-4 shrink-0" />
              <span>Pengaturan</span>
            </Link>
          </div>
        </>
      )}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Desktop */}
      {!profile.must_change_password && (
        <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col bg-[oklch(0.185_0.038_258)] text-slate-100 border-r border-slate-800 select-none">
          {/* Brand Header */}
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
            <Link
              to="/beranda"
              className="flex items-center gap-3 font-bold text-white transition hover:opacity-90"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 ring-1 ring-white/15">
                <BookOpen className="size-5" />
              </div>
              <div className="leading-tight">
                <span className="block text-sm font-bold tracking-tight text-white">
                  SIP SMKN 1 Selayar
                </span>
                <span className="block text-[11px] font-normal text-slate-400">
                  Perpustakaan Digital
                </span>
              </div>
            </Link>
          </div>

          {/* Menu Navigasi */}
          {renderSidebarNav()}

          {/* Footer Profil Sidebar */}
          <div className="border-t border-white/10 p-3.5">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                {initials || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  {profile.full_name}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {ROLE_LABELS[profile.role]}
                  {profile.class_name ? ` • ${profile.class_name}` : ''}
                </p>
              </div>
              <Link
                to="/profil"
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                title="Pengaturan Profil"
              >
                <User className="size-4" />
              </Link>
            </div>
          </div>
        </aside>
      )}

      {/* Drawer Mobile */}
      {mobileMenuOpen && !profile.must_change_password && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={closeMobileMenu}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[oklch(0.185_0.038_258)] text-slate-100 shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <Link
                to="/beranda"
                onClick={closeMobileMenu}
                className="flex items-center gap-2.5 font-bold text-white"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
                  <BookOpen className="size-4" />
                </div>
                <span className="text-sm">SIP SMKN 1 Selayar</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobileMenu}
                className="text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Tutup Menu"
              >
                <X className="size-5" />
              </Button>
            </div>
            {renderSidebarNav()}
          </aside>
        </div>
      )}

      {/* Area Utama (Topbar + Main Content) */}
      <div
        className={`flex flex-1 flex-col min-w-0 ${
          !profile.must_change_password ? 'lg:pl-64' : ''
        }`}
      >
        {/* Topbar Sticky */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            {!profile.must_change_password && (
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka Menu Navigasi"
              >
                <Menu className="size-5" />
              </Button>
            )}

            <div className="flex items-center gap-2.5">
              <span className="font-bold text-foreground lg:hidden">
                SIP SMKN 1 Selayar
              </span>
              <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                  <Clock className="size-3.5 text-primary" />
                  <span>WITA (UTC+8)</span>
                </span>
                <span>•</span>
                <span>SMK Negeri 1 Kepulauan Selayar</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {!profile.must_change_password && isLibrarian && (
              <Link to="/pustakawan/sirkulasi" className="hidden sm:inline-flex">
                <Button size="sm" variant="secondary" className="gap-1.5 font-medium">
                  <ScanBarcode className="size-4 text-primary" />
                  <span>Meja Sirkulasi</span>
                </Button>
              </Link>
            )}

            <div className="hidden flex-col items-end sm:flex">
              <span className="text-xs font-semibold leading-none text-foreground">
                {profile.full_name}
              </span>
              <div className="mt-1 flex items-center gap-1">
                <Badge
                  variant={isLibrarian ? 'default' : 'secondary'}
                  className="px-1.5 py-0 text-[10px]"
                >
                  {ROLE_LABELS[profile.role]}
                </Badge>
                {profile.class_name && (
                  <span className="text-[11px] text-muted-foreground">
                    ({profile.class_name})
                  </span>
                )}
              </div>
            </div>

            {!profile.must_change_password && (
              <Link to="/profil">
                <Button variant="outline" size="icon" aria-label="Profil Saya" title="Profil Saya">
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
              className="hover:bg-destructive/10"
            >
              <LogOut className="size-4 text-destructive" />
            </Button>
          </div>
        </header>

        {/* Konten Halaman */}
        <main className="flex-1 pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
