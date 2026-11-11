import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ScanBarcode,
  ClipboardCheck,
  BookmarkCheck,
  Receipt,
  Library,
  Users,
  BarChart3,
  Settings,
  Clock,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { librarianDashboardQueryOptions } from '../api/queries'
import { formatRupiah } from '@/lib/format'
import { ROLE_LABELS } from '@/lib/labels'
import type { Tables } from '@/types/database.types'

interface LibrarianDashboardProps {
  profile: Tables<'profiles'>
}

export function LibrarianDashboard({ profile }: LibrarianDashboardProps) {
  const { data: kpi, refetch } = useQuery(librarianDashboardQueryOptions())

  const pendingRequests = kpi?.pending_requests ?? 0
  const readyPickups = kpi?.ready_pickups ?? 0
  const activeLoans = kpi?.active_loans ?? 0
  const overdueLoans = kpi?.overdue_loans ?? 0
  const pendingReturns = kpi?.pending_returns ?? 0
  const unpaidFinesTotal = kpi?.unpaid_fines_total ?? 0
  const unpaidFinesCount = kpi?.unpaid_fines_count ?? 0

  return (
    <div className="space-y-6">
      {/* Banner Sambutan Pustakawan */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="text-xs">
              {ROLE_LABELS[profile.role]}
            </Badge>
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
            Dasbor Kendali Perpustakaan SMKN 1 Kepulauan Selayar • Petugas:{' '}
            <span className="font-mono font-semibold text-foreground">
              {profile.member_code}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
        </div>
      </div>

      {/* Grid Metrik KPI Operasional (FR-DSH-02, TC-DSH-02) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Indikator Kinerja Utama (KPI)</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            className="text-xs gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="size-3" />
            <span>Segarkan</span>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. Pengajuan Menunggu */}
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Pengajuan Menunggu
                </span>
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${
                    pendingRequests > 0
                      ? 'bg-amber-500/10 text-amber-600 font-bold'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <ClipboardCheck className="size-4" />
                </div>
              </div>
              <p
                className={`mt-3 text-2xl font-bold tracking-tight ${
                  pendingRequests > 0 ? 'text-amber-600' : 'text-foreground'
                }`}
              >
                {pendingRequests}{' '}
                <span className="text-sm font-normal text-muted-foreground">Pengajuan</span>
              </p>
              <Link
                to="/pustakawan/pengajuan"
                search={{ q: '', status: 'pending', page: 1 }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>Proses verifikasi</span>
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>

          {/* 2. Siap Diambil */}
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Siap Diambil (Disetujui)
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                {readyPickups}{' '}
                <span className="text-sm font-normal text-muted-foreground">Buku</span>
              </p>
              <Link
                to="/pustakawan/pengajuan"
                search={{ q: '', status: 'approved', page: 1 }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>Daftar siap checkout</span>
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>

          {/* 3. Pinjaman Aktif */}
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Pinjaman Aktif
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <BookmarkCheck className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                {activeLoans}{' '}
                <span className="text-sm font-normal text-muted-foreground">Eksemplar</span>
              </p>
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
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>Lihat semua pinjaman</span>
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>

          {/* 4. Terlambat */}
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Pinjaman Terlambat
                </span>
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${
                    overdueLoans > 0
                      ? 'bg-red-500/10 text-red-600 font-bold'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Clock className="size-4" />
                </div>
              </div>
              <p
                className={`mt-3 text-2xl font-bold tracking-tight ${
                  overdueLoans > 0 ? 'text-red-600' : 'text-foreground'
                }`}
              >
                {overdueLoans}{' '}
                <span className="text-sm font-normal text-muted-foreground">Buku</span>
              </p>
              <Link
                to="/pustakawan/pinjaman"
                search={{
                  q: '',
                  overdueOnly: true,
                  returnRequestedOnly: false,
                  role: 'all',
                  className: '',
                  status: 'active',
                  page: 1,
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>Tindak lanjuti</span>
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>

          {/* 5. Pengembalian Menunggu Konfirmasi */}
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Menunggu Konfirmasi Kembali
                </span>
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${
                    pendingReturns > 0
                      ? 'bg-amber-500/10 text-amber-600 font-bold'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <AlertTriangle className="size-4" />
                </div>
              </div>
              <p
                className={`mt-3 text-2xl font-bold tracking-tight ${
                  pendingReturns > 0 ? 'text-amber-600' : 'text-foreground'
                }`}
              >
                {pendingReturns}{' '}
                <span className="text-sm font-normal text-muted-foreground">Pengajuan</span>
              </p>
              <Link
                to="/pustakawan/pinjaman"
                search={{
                  q: '',
                  overdueOnly: false,
                  returnRequestedOnly: true,
                  role: 'all',
                  className: '',
                  status: 'active',
                  page: 1,
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>Periksa pengembalian</span>
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>

          {/* 6. Denda Belum Lunas */}
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Piutang Denda Belum Lunas
                </span>
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${
                    unpaidFinesTotal > 0
                      ? 'bg-amber-500/10 text-amber-600 font-bold'
                      : 'bg-emerald-500/10 text-emerald-600'
                  }`}
                >
                  <Receipt className="size-4" />
                </div>
              </div>
              <p
                className={`mt-3 text-2xl font-bold tracking-tight ${
                  unpaidFinesTotal > 0 ? 'text-amber-600' : 'text-foreground'
                }`}
              >
                {formatRupiah(unpaidFinesTotal)}
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
                <span>{unpaidFinesCount} transaksi belum lunas</span>
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Aksi Cepat Pustakawan (Mockup Gambar 3.10) */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Aksi Cepat Operasional</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Link
            to="/pustakawan/sirkulasi"
            className="flex items-center gap-3.5 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 shadow-xs"
          >
            <div className="flex size-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
              <ScanBarcode className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Pinjam / Kembalikan</p>
              <p className="text-xs text-muted-foreground">
                Meja sirkulasi peminjaman & pengembalian buku fisik
              </p>
            </div>
          </Link>

          <Link
            to="/pustakawan/pengajuan"
            search={{ q: '', status: 'pending', page: 1 }}
            className="flex items-center gap-3.5 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 shadow-xs"
          >
            <div className="flex size-11 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
              <ClipboardCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Reservasi Buku</p>
              <p className="text-xs text-muted-foreground">
                Verifikasi & alokasikan eksemplar pengajuan anggota
              </p>
            </div>
          </Link>

          <Link
            to="/pustakawan/anggota"
            search={{ q: '', role: 'all', status: 'all', page: 1 }}
            className="flex items-center gap-3.5 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 shadow-xs"
          >
            <div className="flex size-11 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Daftar Member</p>
              <p className="text-xs text-muted-foreground">
                Manajemen akun siswa & guru, reset password, impor
              </p>
            </div>
          </Link>

          <Link
            to="/pustakawan/koleksi"
            search={{ q: '', categoryId: undefined, page: 1 }}
            className="flex items-center gap-3.5 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 shadow-xs"
          >
            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
              <Library className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Koleksi Buku</p>
              <p className="text-xs text-muted-foreground">
                Katalog judul, eksemplar, barcode, dan penarikan fisik
              </p>
            </div>
          </Link>

          <Link
            to="/pustakawan/laporan"
            search={{ type: 'loans', from: '', to: '' }}
            className="flex items-center gap-3.5 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 shadow-xs"
          >
            <div className="flex size-11 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 shrink-0">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Laporan Perpustakaan</p>
              <p className="text-xs text-muted-foreground">
                Rekapitulasi sirkulasi, denda & ekspor PDF / Excel
              </p>
            </div>
          </Link>

          <Link
            to="/pustakawan/pengaturan"
            className="flex items-center gap-3.5 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 shadow-xs"
          >
            <div className="flex size-11 items-center justify-center rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-300 shrink-0">
              <Settings className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Pengaturan Sistem</p>
              <p className="text-xs text-muted-foreground">
                Profil sekolah, tarif denda, kuota pinjam & master jurusan
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
