import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS, LOAN_REQUEST_STATUS_LABELS } from '@/lib/labels'
import { formatDate, formatRupiah } from '@/lib/format'
import {
  Users,
  Key,
  User,
  BookOpen,
  ScanBarcode,
  ClipboardCheck,
  BookmarkCheck,
  Receipt,
  Library,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  memberCirculationSummaryQueryOptions,
  librarianRequestsQueryOptions,
  librarianLoansQueryOptions,
} from '@/features/circulation/api/queries'
import { librarianFinesQueryOptions } from '@/features/fines/api/queries'
import { booksListQueryOptions } from '@/features/collection/api/queries'

export const Route = createFileRoute('/_app/beranda')({
  component: BerandaPage,
})

function BerandaPage() {
  const { profile } = Route.useRouteContext()
  const isLibrarian = profile.role === 'librarian'

  // Query ringkasan anggota (Siswa / Guru)
  const { data: memberSummary } = useQuery({
    ...memberCirculationSummaryQueryOptions(profile.id),
    enabled: !isLibrarian,
  })

  // Query ringkasan operasional Pustakawan
  const { data: booksSummary } = useQuery({
    ...booksListQueryOptions({ q: '', categoryId: undefined, page: 1 }),
    enabled: isLibrarian,
  })
  const { data: pendingRequests } = useQuery({
    ...librarianRequestsQueryOptions({ q: '', status: 'pending', page: 1 }),
    enabled: isLibrarian,
  })
  const { data: activeLoans } = useQuery({
    ...librarianLoansQueryOptions({
      q: '',
      overdueOnly: false,
      returnRequestedOnly: false,
      role: 'all',
      className: '',
      status: 'active',
      page: 1,
    }),
    enabled: isLibrarian,
  })
  const { data: finesSummary } = useQuery({
    ...librarianFinesQueryOptions({
      q: '',
      status: 'unpaid',
      type: 'all',
      className: '',
      page: 1,
    }),
    enabled: isLibrarian,
  })

  const overdueCount =
    activeLoans?.data.filter((l) => Boolean(l.is_overdue)).length ?? 0

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-4 md:p-6">
      {/* Banner Sambutan & Aksi Cepat */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="text-xs">
              {ROLE_LABELS[profile.role]}
            </Badge>
            {profile.class_name && (
              <Badge variant="secondary" className="text-xs">
                Kelas {profile.class_name}
              </Badge>
            )}
            {profile.position && (
              <Badge variant="outline" className="text-xs">
                {profile.position}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Selamat Datang, {profile.full_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Sistem Informasi Perpustakaan SMK Negeri 1 Kepulauan Selayar • Nomor Induk:{' '}
            <span className="font-mono font-semibold text-foreground">
              {profile.member_code}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isLibrarian ? (
            <>
              <Link to="/pustakawan/sirkulasi">
                <Button className="gap-2 shadow-xs">
                  <ScanBarcode className="size-4" />
                  <span>Meja Sirkulasi</span>
                </Button>
              </Link>
              <Link
                to="/pustakawan/pengajuan"
                search={{ q: '', status: 'pending', page: 1 }}
              >
                <Button variant="outline" className="gap-2">
                  <ClipboardCheck className="size-4" />
                  <span>Verifikasi Pengajuan</span>
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/katalog"
                search={{
                  q: '',
                  category: undefined,
                  availableOnly: false,
                  sort: 'relevance',
                  page: 1,
                }}
              >
                <Button className="gap-2 shadow-xs">
                  <BookOpen className="size-4" />
                  <span>Telusuri Katalog Buku</span>
                </Button>
              </Link>
              <Link to="/pinjaman">
                <Button variant="outline" className="gap-2">
                  <BookmarkCheck className="size-4" />
                  <span>Pinjaman Saya</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* KPI Ringkasan Operasional Pustakawan */}
      {isLibrarian && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Total Judul Koleksi
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Library className="size-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight">
                  {booksSummary?.count ?? 0} Judul
                </p>
                <Link
                  to="/pustakawan/koleksi"
                  search={{ q: '', categoryId: undefined, page: 1 }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <span>Kelola koleksi buku</span>
                  <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Antrean Pengajuan
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <ClipboardCheck className="size-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight">
                  {pendingRequests?.count ?? 0} Menunggu
                </p>
                <Link
                  to="/pustakawan/pengajuan"
                  search={{ q: '', status: 'pending', page: 1 }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <span>Proses antrean verifikasi</span>
                  <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Pinjaman Aktif
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <BookmarkCheck className="size-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight">
                  {activeLoans?.count ?? 0} Eksemplar
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {overdueCount > 0 ? (
                    <span className="font-semibold text-destructive">
                      {overdueCount} melewati jatuh tempo
                    </span>
                  ) : (
                    <span>Tidak ada keterlambatan aktif</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Denda Belum Lunas
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <Receipt className="size-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-destructive">
                  {formatRupiah(finesSummary?.summary.unpaidTotal ?? 0)}
                </p>
                <Link
                  to="/pustakawan/denda"
                  search={{
                    q: '',
                    status: 'unpaid',
                    type: 'all',
                    className: '',
                    page: 1,
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <span>Buka manajemen denda</span>
                  <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Panel Pantauan Cepat Pengajuan & Pinjaman */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Pengajuan Menunggu Verifikasi</CardTitle>
                  <CardDescription className="text-xs">
                    Pengajuan peminjaman daring terbaru dari anggota
                  </CardDescription>
                </div>
                <Link
                  to="/pustakawan/pengajuan"
                  search={{ q: '', status: 'pending', page: 1 }}
                >
                  <Button variant="ghost" size="sm" className="text-xs">
                    Lihat Semua
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                {!pendingRequests || pendingRequests.data.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-8 text-center text-muted-foreground">
                    Tidak ada antrean pengajuan yang menunggu verifikasi.
                  </div>
                ) : (
                  pendingRequests.data.slice(0, 4).map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {req.book?.title || 'Buku'}
                        </p>
                        <p className="text-muted-foreground">
                          {req.member?.full_name} ({req.member?.member_code})
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {LOAN_REQUEST_STATUS_LABELS[req.status]}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Pinjaman Aktif Terdekat</CardTitle>
                  <CardDescription className="text-xs">
                    Diurutkan berdasarkan tenggat pengembalian terdekat
                  </CardDescription>
                </div>
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
                >
                  <Button variant="ghost" size="sm" className="text-xs">
                    Lihat Semua
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                {!activeLoans || activeLoans.data.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-8 text-center text-muted-foreground">
                    Belum ada transaksi pinjaman buku yang sedang aktif.
                  </div>
                ) : (
                  activeLoans.data.slice(0, 4).map((loan) => (
                    <div
                      key={loan.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {loan.title} ({loan.copy_code})
                        </p>
                        <p className="text-muted-foreground">
                          {loan.full_name} • Tenggat:{' '}
                          {loan.due_date ? formatDate(loan.due_date) : '-'}
                        </p>
                      </div>
                      {loan.is_overdue ? (
                        <Badge variant="destructive" className="shrink-0">
                          Terlambat {loan.days_overdue} hr
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0">
                          Aktif
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* KPI Ringkasan Sirkulasi Anggota (Siswa & Guru) */}
      {!isLibrarian && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Sisa Kuota Pinjam
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">
                {memberSummary?.remainingQuota ?? 5} / {memberSummary?.maxActiveLoans ?? 5} Buku
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Kuota gabungan pinjaman & pengajuan aktif
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Buku Sedang Dipinjam
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <BookmarkCheck className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">
                {memberSummary?.activeLoans.length ?? 0} Buku
              </p>
              <Link
                to="/pinjaman"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>Lihat tanggal jatuh tempo</span>
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Pengajuan Diproses
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Clock className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">
                {memberSummary?.openRequests.length ?? 0} Pengajuan
              </p>
              <Link
                to="/pinjaman"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>Cek status pengambilan</span>
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Tagihan Denda
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight">
                {formatRupiah(memberSummary?.unpaidFinesTotal ?? 0)}
              </p>
              <Link
                to="/denda"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>Rincian denda saya</span>
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Akses Cepat Modul & Akun */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition hover:shadow-md border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Profil Saya</CardTitle>
                <CardDescription>Lihat data diri dan identitas anggota</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link to="/profil">
              <Button variant="outline" className="w-full">
                Buka Profil
              </Button>
            </Link>
          </CardContent>
        </Card>

        {isLibrarian && (
          <Card className="transition hover:shadow-md border-border/80">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Kelola Anggota</CardTitle>
                  <CardDescription>Manajemen data siswa & guru</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link
                to="/pustakawan/anggota"
                search={{ q: '', role: 'all', status: 'all', page: 1 }}
              >
                <Button className="w-full">Daftar Anggota</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="transition hover:shadow-md border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Key className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Keamanan</CardTitle>
                <CardDescription>Ganti password akun secara mandiri</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link to="/profil">
              <Button variant="outline" className="w-full">
                Ganti Password
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
