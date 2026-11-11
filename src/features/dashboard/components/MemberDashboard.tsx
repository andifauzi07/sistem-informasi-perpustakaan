import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  BookmarkCheck,
  History,
  FileText,
  FolderOpen,
  Search,
  Clock,
  CheckCircle2,
  Receipt,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { memberDashboardQueryOptions } from '../api/queries'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { ROLE_LABELS } from '@/lib/labels'
import type { Tables } from '@/types/database.types'

interface MemberDashboardProps {
  profile: Tables<'profiles'>
}

export function MemberDashboard({ profile }: MemberDashboardProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const isTeacher = profile.role === 'teacher'
  const { data: metrics } = useQuery(
    memberDashboardQueryOptions(profile.id, isTeacher ? 'teacher' : 'student')
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void navigate({
      to: '/katalog',
      search: {
        q: searchQuery.trim(),
        category: undefined,
        availableOnly: false,
        sort: 'relevance',
        page: 1,
      },
    })
  }

  const activeLoans = metrics?.active_loans_count ?? 0
  const maxLoans = metrics?.max_active_loans ?? (isTeacher ? 5 : 3)
  const overdueCount = metrics?.overdue_loans_count ?? 0
  const pendingRequests = metrics?.pending_requests_count ?? 0
  const readyPickups = metrics?.ready_pickups ?? []
  const unpaidFines = metrics?.unpaid_fines_total ?? 0

  return (
    <div className="space-y-6">
      {/* Banner Sambutan */}
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
            Nomor Induk:{' '}
            <span className="font-mono font-semibold text-foreground">
              {profile.member_code}
            </span>
          </p>
        </div>

        {/* Form Pencarian Cepat Katalog (FR-DSH-01) */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex w-full max-w-sm items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul, pengarang, ISBN..."
              className="pl-9 text-xs"
            />
          </div>
          <Button type="submit" size="sm" className="gap-1.5 shrink-0">
            <span>Cari</span>
          </Button>
        </form>
      </div>

      {/* Peringatan Pengajuan Siap Diambil (BR-05, BR-06) */}
      {readyPickups.length > 0 && (
        <Alert className="border-emerald-500/40 bg-emerald-50/50 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-200">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="font-semibold">
            Buku Siap Diambil di Perpustakaan!
          </AlertTitle>
          <AlertDescription className="mt-1 space-y-1 text-xs">
            <p>
              Pengajuan peminjaman berikut telah disetujui pustakawan dan telah disiapkan:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 font-medium">
              {readyPickups.map((item) => (
                <li key={item.id}>
                  <span className="font-semibold">{item.title}</span>
                  {item.pickup_deadline && (
                    <span className="text-muted-foreground ml-1.5">
                      (Batas ambil: {formatDateTime(item.pickup_deadline)} WITA)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Peringatan Pinjaman Terlambat atau Denda */}
      {(overdueCount > 0 || unpaidFines > 0) && (
        <Alert variant="destructive" className="border-red-500/40 bg-red-50/40 dark:bg-red-950/20">
          <ShieldAlert className="size-4" />
          <AlertTitle className="font-semibold">Peringatan Sirkulasi</AlertTitle>
          <AlertDescription className="mt-1 text-xs space-y-1">
            {overdueCount > 0 && (
              <p>
                Anda memiliki <span className="font-bold">{overdueCount} pinjaman terlambat</span>.{' '}
                Harap segera mengembalikan buku ke meja sirkulasi perpustakaan.
              </p>
            )}
            {unpaidFines > 0 && (
              <p>
                Total denda belum lunas Anda:{' '}
                <span className="font-bold">{formatRupiah(unpaidFines)}</span>. Pembayaran tunai
                dilayani di perpustakaan.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Grid Metrik Keanggotaan (FR-DSH-01, TC-DSH-01) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Kuota Pinjaman */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Status Kuota Pinjam
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <BookmarkCheck className="size-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">
              {String(activeLoans).padStart(2, '0')} / {String(maxLoans).padStart(2, '0')}{' '}
              <span className="text-sm font-normal text-muted-foreground">Buku</span>
            </p>
            <Link
              to="/pinjaman"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <span>Lihat pinjaman aktif</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Pinjaman Terlambat */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Pinjaman Terlambat
              </span>
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${
                  overdueCount > 0
                    ? 'bg-red-500/10 text-red-600 font-bold'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Clock className="size-4" />
              </div>
            </div>
            <p
              className={`mt-3 text-2xl font-bold tracking-tight ${
                overdueCount > 0 ? 'text-red-600' : ''
              }`}
            >
              {overdueCount}{' '}
              <span className="text-sm font-normal text-muted-foreground">Buku</span>
            </p>
            <Link
              to="/pinjaman"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <span>Periksa jatuh tempo</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Pengajuan Terbuka */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Pengajuan Buku
              </span>
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <BookOpen className="size-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">
              {pendingRequests}{' '}
              <span className="text-sm font-normal text-muted-foreground">Menunggu</span>
            </p>
            <Link
              to="/pinjaman"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <span>Status pengajuan</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Denda Belum Lunas */}
        <Card className="border-border/80 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Denda Belum Lunas
              </span>
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${
                  unpaidFines > 0
                    ? 'bg-amber-500/10 text-amber-600 font-bold'
                    : 'bg-emerald-500/10 text-emerald-600'
                }`}
              >
                <Receipt className="size-4" />
              </div>
            </div>
            <p
              className={`mt-3 text-2xl font-bold tracking-tight ${
                unpaidFines > 0 ? 'text-amber-600' : 'text-foreground'
              }`}
            >
              {formatRupiah(unpaidFines)}
            </p>
            <Link
              to="/denda"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <span>Rincian denda</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pintasan Aksi Cepat Anggota (FR-DSH-01) */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Pintasan Navigasi</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Link
            to="/katalog"
            search={{
              q: '',
              category: undefined,
              availableOnly: false,
              sort: 'relevance',
              page: 1,
            }}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 shadow-xs"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Katalog Buku</p>
              <p className="text-xs text-muted-foreground">Cari & ajukan pinjam</p>
            </div>
          </Link>

          <Link
            to="/pinjaman"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 shadow-xs"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <BookmarkCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Pinjaman Saya</p>
              <p className="text-xs text-muted-foreground">Buku yang sedang dipinjam</p>
            </div>
          </Link>

          <Link
            to="/riwayat"
            search={{ status: 'all', page: 1 }}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 shadow-xs"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <History className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Riwayat Pinjaman</p>
              <p className="text-xs text-muted-foreground">Catatan pengembalian</p>
            </div>
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
            className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 shadow-xs"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Bahan Ajar</p>
              <p className="text-xs text-muted-foreground">Materi digital sekolah</p>
            </div>
          </Link>

          {isTeacher && (
            <Link
              to="/guru/bahan-ajar"
              className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50 shadow-xs sm:col-span-2 md:col-span-4"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                <FolderOpen className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Kelola Bahan Ajar Guru</p>
                <p className="text-xs text-muted-foreground">
                  Unggah modul baru atau sembunyikan berkas materi yang Anda bagikan
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
