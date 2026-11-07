import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Ban,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  memberLoanRequestsQueryOptions,
  memberActiveLoansQueryOptions,
} from '@/features/circulation/api/queries'
import {
  useCancelLoanRequestMutation,
  useRequestReturnMutation,
} from '@/features/circulation/api/mutations'
import { calculateRemainingDays } from '@/features/circulation/utils'
import { LOAN_REQUEST_STATUS_LABELS } from '@/lib/labels'
import { formatDate, formatDateTime, formatRupiah } from '@/lib/format'
import { toUserMessage } from '@/lib/errors'

export const Route = createFileRoute('/_app/pinjaman')({
  loader: async ({ context }) => {
    const memberId = context.profile.id
    await Promise.all([
      context.queryClient.ensureQueryData(memberLoanRequestsQueryOptions(memberId)),
      context.queryClient.ensureQueryData(memberActiveLoansQueryOptions(memberId)),
    ])
  },
  component: PinjamanSayaPage,
})

function PinjamanSayaPage() {
  const { profile } = Route.useRouteContext()
  const { data: requests } = useSuspenseQuery(
    memberLoanRequestsQueryOptions(profile.id)
  )
  const { data: activeLoans } = useSuspenseQuery(
    memberActiveLoansQueryOptions(profile.id)
  )

  const cancelMutation = useCancelLoanRequestMutation()
  const returnMutation = useRequestReturnMutation()

  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null)

  // Tampilkan pengajuan pending, approved, expired, dan rejected (dalam 7 hari terakhir sesuai FR-CIR-02)
  const visibleRequests = requests.filter((req) => {
    if (req.status === 'pending' || req.status === 'approved' || req.status === 'expired') {
      return true
    }
    if (req.status === 'rejected') {
      if (!req.decided_at) return true
      return calculateRemainingDays(req.decided_at) >= -7
    }
    return false
  })

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return
    try {
      await cancelMutation.mutateAsync(cancelTargetId)
      toast.success('Pengajuan peminjaman berhasil dibatalkan.')
      setCancelTargetId(null)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const handleRequestReturn = async (loanId: number) => {
    try {
      await returnMutation.mutateAsync(loanId)
      toast.success(
        'Penanda pengembalian berhasil dikirim. Silakan serahkan fisik buku ke meja pustakawan.'
      )
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pinjaman Saya</h1>
          <p className="text-sm text-muted-foreground">
            Pantau status pengajuan buku dan tenggat waktu pinjaman aktif Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/riwayat" search={{ status: 'all', page: 1 }}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <History className="size-4" />
              <span>Riwayat Pinjaman</span>
            </Button>
          </Link>
          <Link
            to="/katalog"
            search={{ q: '', category: undefined, availableOnly: false, sort: 'relevance', page: 1 }}
          >
            <Button size="sm" className="gap-1.5">
              <BookOpen className="size-4" />
              <span>Cari Buku</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Seksi 1: Pinjaman Aktif (FR-CIR-02 & FR-CIR-04) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            <span>Pinjaman Aktif ({activeLoans.length})</span>
          </h2>
        </div>

        {activeLoans.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Anda tidak memiliki pinjaman buku aktif saat ini.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeLoans.map((loan) => {
              const dueDate = loan.due_date || ''
              const remainingDays = calculateRemainingDays(dueDate)
              const isOverdue = Boolean(loan.is_overdue) || remainingDays < 0
              const daysOverdue = loan.days_overdue ?? Math.max(0, -remainingDays)
              const estimatedFine = loan.estimated_fine ?? 0
              const isReturnRequested = Boolean(loan.return_requested_at)

              return (
                <Card
                  key={loan.id}
                  className={isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base leading-snug">
                          {loan.title || 'Buku Perpustakaan'}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Kode Eksemplar:{' '}
                          <span className="font-mono font-semibold text-foreground">
                            {loan.copy_code}
                          </span>
                        </CardDescription>
                      </div>
                      {isOverdue ? (
                        <Badge variant="destructive" className="gap-1 shrink-0">
                          <AlertTriangle className="size-3" />
                          <span>Terlambat {daysOverdue} hari</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 shrink-0">
                          <Clock className="size-3" />
                          <span>
                            {remainingDays === 0
                              ? 'Jatuh tempo hari ini'
                              : `Sisa ${remainingDays} hari`}
                          </span>
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 rounded-md border bg-background p-3">
                      <div>
                        <span className="text-muted-foreground block">Tanggal Pinjam</span>
                        <span className="font-medium text-foreground">
                          {loan.loaned_at ? formatDate(loan.loaned_at) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Jatuh Tempo</span>
                        <span
                          className={`font-semibold ${
                            isOverdue ? 'text-destructive' : 'text-foreground'
                          }`}
                        >
                          {dueDate ? formatDate(dueDate) : '-'}
                        </span>
                      </div>
                    </div>

                    {isOverdue && estimatedFine > 0 && (
                      <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
                        <span>Estimasi Denda Keterlambatan:</span>
                        <span className="font-bold">{formatRupiah(estimatedFine)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      {isReturnRequested ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-700 gap-1">
                          <Clock className="size-3" />
                          <span>Menunggu konfirmasi pengembalian di meja pustakawan</span>
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5"
                          disabled={returnMutation.isPending}
                          onClick={() => {
                            if (loan.id) {
                              void handleRequestReturn(loan.id)
                            }
                          }}
                        >
                          <RotateCcw className="size-3.5" />
                          <span>Ajukan Pengembalian</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Seksi 2: Pengajuan Peminjaman (FR-CIR-02 & FR-CIR-03) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          <span>Pengajuan Peminjaman ({visibleRequests.length})</span>
        </h2>

        {visibleRequests.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Belum ada pengajuan peminjaman yang aktif.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleRequests.map((req) => {
              const canCancel = req.status === 'pending' || req.status === 'approved'

              return (
                <Card key={req.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base leading-snug">
                          {req.books?.title || 'Buku'}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Diajukan: {formatDateTime(req.requested_at)}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          req.status === 'approved'
                            ? 'default'
                            : req.status === 'rejected' || req.status === 'expired'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {LOAN_REQUEST_STATUS_LABELS[req.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    {req.status === 'approved' && (
                      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="size-4" />
                          <span>Siap Diambil di Perpustakaan</span>
                        </div>
                        {req.book_copies?.code && (
                          <p>
                            Eksemplar Dialokasikan:{' '}
                            <strong className="font-mono">{req.book_copies.code}</strong>
                          </p>
                        )}
                        {req.pickup_deadline && (
                          <p>
                            Batas Ambil:{' '}
                            <strong>{formatDateTime(req.pickup_deadline)} WITA</strong>
                          </p>
                        )}
                      </div>
                    )}

                    {req.status === 'rejected' && req.reject_reason && (
                      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 space-y-1 text-destructive">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <XCircle className="size-4" />
                          <span>Alasan Penolakan:</span>
                        </div>
                        <p>{req.reject_reason}</p>
                      </div>
                    )}

                    {req.status === 'expired' && (
                      <p className="text-muted-foreground">
                        Melewati batas waktu pengambilan buku. Eksemplar telah dilepas kembali.
                      </p>
                    )}

                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => setCancelTargetId(req.id)}
                      >
                        <Ban className="size-3.5" />
                        <span>Batalkan Pengajuan</span>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Dialog Konfirmasi Batalkan Pengajuan (FR-CIR-03, TC-CIR-11) */}
      <Dialog
        open={cancelTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTargetId(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batalkan Pengajuan Peminjaman?</DialogTitle>
            <DialogDescription>
              Pengajuan ini akan dibatalkan dan eksemplar yang telah dialokasikan (bila ada) akan
              dilepas kembali ke stok perpustakaan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelTargetId(null)}>
              Kembali
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => {
                void handleConfirmCancel()
              }}
            >
              {cancelMutation.isPending ? 'Membatalkan...' : 'Ya, Batalkan Pengajuan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
