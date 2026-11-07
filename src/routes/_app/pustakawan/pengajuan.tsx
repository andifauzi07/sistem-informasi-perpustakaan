import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Clock,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  librarianRequestFilterSchema,
  rejectRequestSchema,
  type RejectRequestFormData,
} from '@/features/circulation/schemas'
import { librarianRequestsQueryOptions } from '@/features/circulation/api/queries'
import {
  useApproveLoanRequestMutation,
  useRejectLoanRequestMutation,
} from '@/features/circulation/api/mutations'
import { LOAN_REQUEST_STATUS_LABELS, ROLE_LABELS } from '@/lib/labels'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { toUserMessage } from '@/lib/errors'

export const Route = createFileRoute('/_app/pustakawan/pengajuan')({
  validateSearch: (search) => librarianRequestFilterSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(librarianRequestsQueryOptions(deps))
  },
  component: AntreanPengajuanPustakawanPage,
})

function AntreanPengajuanPustakawanPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const { data: requestsResult } = useSuspenseQuery(
    librarianRequestsQueryOptions(search)
  )

  const approveMutation = useApproveLoanRequestMutation()
  const rejectMutation = useRejectLoanRequestMutation()

  const [approveModalItem, setApproveModalItem] = useState<
    (typeof requestsResult.data)[number] | null
  >(null)
  const [selectedCopyId, setSelectedCopyId] = useState<string>('auto')

  const [rejectModalItem, setRejectModalItem] = useState<
    (typeof requestsResult.data)[number] | null
  >(null)

  const {
    register,
    handleSubmit,
    reset: resetRejectForm,
    formState: { errors },
  } = useForm<RejectRequestFormData>({
    resolver: zodResolver(rejectRequestSchema),
    defaultValues: {
      requestId: 0,
      reason: '',
    },
  })

  const updateSearch = (patch: Partial<typeof search>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
        page: patch.page ?? 1,
      }),
    })
  }

  const handleOpenApprove = (item: (typeof requestsResult.data)[number]) => {
    setApproveModalItem(item)
    setSelectedCopyId('auto')
  }

  const handleConfirmApprove = async () => {
    if (!approveModalItem) return
    try {
      await approveMutation.mutateAsync({
        requestId: approveModalItem.id,
        copyId: selectedCopyId === 'auto' ? null : Number(selectedCopyId),
      })
      toast.success('Pengajuan peminjaman disetujui dan eksemplar berhasil dialokasikan.')
      setApproveModalItem(null)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const handleOpenReject = (item: (typeof requestsResult.data)[number]) => {
    setRejectModalItem(item)
    resetRejectForm({
      requestId: item.id,
      reason: '',
    })
  }

  const onRejectSubmit = async (data: RejectRequestFormData) => {
    try {
      await rejectMutation.mutateAsync(data)
      toast.success('Pengajuan peminjaman telah ditolak.')
      setRejectModalItem(null)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const availableCopiesForApprove =
    approveModalItem?.book?.book_copies?.filter((c) => c.status === 'available') || []

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Antrean Pengajuan Peminjaman</h1>
        <p className="text-sm text-muted-foreground">
          Verifikasi pengajuan peminjaman daring dari siswa dan guru (diurutkan dari yang terlama).
        </p>
      </div>

      {/* Filter & Pencarian */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="search-pengajuan">Cari Anggota / Judul Buku</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-pengajuan"
                  placeholder="Ketik nama anggota, NIS/NIP, atau judul buku..."
                  value={search.q}
                  onChange={(e) => updateSearch({ q: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status Pengajuan</Label>
              <Select
                value={search.status}
                onValueChange={(val) =>
                  updateSearch({
                    status: val as 'pending' | 'approved' | 'rejected' | 'all',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
                  <SelectItem value="approved">Siap Diambil (Approved)</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                  <SelectItem value="all">Semua Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Antrean Pengajuan (FR-CIR-06, FR-CIR-07, FR-CIR-08, FR-FIN-07) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Daftar Pengajuan ({requestsResult.data.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Memeriksa status pinjaman aktif anggota, keterlambatan, dan peringatan denda belum lunas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu Pengajuan</TableHead>
                <TableHead>Anggota & Ringkasan</TableHead>
                <TableHead>Judul Buku & Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi Pustakawan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requestsResult.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    Tidak ada pengajuan peminjaman pada filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                requestsResult.data.map((req) => {
                  const availObj = req.book?.v_book_availability
                  const availCount = availObj?.available_copies ?? 0
                  const totalCount = availObj?.total_copies ?? 0
                  const unpaidFines = req.memberSummary.unpaidFines

                  return (
                    <TableRow key={req.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDateTime(req.requested_at)}
                      </TableCell>
                      <TableCell className="space-y-1">
                        <div className="font-medium text-sm">
                          {req.member?.full_name || '-'}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {req.member?.member_code} •{' '}
                          {req.member?.role ? ROLE_LABELS[req.member.role] : ''}
                          {req.member?.class_name ? ` (${req.member.class_name})` : ''}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <Badge variant="outline" className="text-[11px]">
                            Pinjaman Aktif: {req.memberSummary.activeLoans}
                          </Badge>
                          {req.memberSummary.overdueLoans > 0 && (
                            <Badge variant="destructive" className="text-[11px]">
                              Terlambat: {req.memberSummary.overdueLoans}
                            </Badge>
                          )}
                          {/* Kotak Peringatan Denda Belum Lunas (FR-FIN-07, BR-12, TC-FIN-03) */}
                          {unpaidFines > 0 && (
                            <Badge
                              variant="outline"
                              className="border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] gap-1"
                            >
                              <AlertTriangle className="size-3 text-amber-600" />
                              <span>Denda Belum Lunas: {formatRupiah(unpaidFines)}</span>
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="space-y-1">
                        <div className="font-medium text-sm">
                          {req.book?.title || '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Stok Tersedia:{' '}
                          <strong
                            className={
                              availCount > 0 ? 'text-emerald-600' : 'text-destructive'
                            }
                          >
                            {availCount}
                          </strong>{' '}
                          / {totalCount} eksemplar
                        </div>
                        {req.reserved_copy?.code && (
                          <div className="text-xs">
                            Alokasi:{' '}
                            <span className="font-mono font-semibold">
                              {req.reserved_copy.code}
                            </span>
                            {req.pickup_deadline && (
                              <span className="text-muted-foreground">
                                {' '}
                                (Batas: {formatDateTime(req.pickup_deadline)})
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="gap-1"
                              disabled={availCount <= 0}
                              onClick={() => handleOpenApprove(req)}
                            >
                              <CheckCircle2 className="size-3.5" />
                              <span>Setujui</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => handleOpenReject(req)}
                            >
                              <XCircle className="size-3.5" />
                              <span>Tolak</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {req.reject_reason ? `Alasan: ${req.reject_reason}` : '-'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginasi */}
      {requestsResult.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Halaman {requestsResult.page} dari {requestsResult.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={requestsResult.page <= 1}
              onClick={() => updateSearch({ page: requestsResult.page - 1 })}
            >
              <ArrowLeft className="size-4 mr-1" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={requestsResult.page >= requestsResult.totalPages}
              onClick={() => updateSearch({ page: requestsResult.page + 1 })}
            >
              Berikutnya
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Setujui Pengajuan & Pilih Eksemplar (FR-CIR-07, TC-CIR-05) */}
      <Dialog
        open={approveModalItem !== null}
        onOpenChange={(open) => {
          if (!open) setApproveModalItem(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setujui Pengajuan Peminjaman</DialogTitle>
            <DialogDescription>
              Sistem akan mengalokasikan 1 eksemplar tersedia dan menetapkan batas waktu
              pengambilan buku oleh anggota.
            </DialogDescription>
          </DialogHeader>

          {approveModalItem && (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-md border bg-muted/40 p-3 space-y-1 text-xs">
                <p>
                  <strong>Anggota:</strong> {approveModalItem.member?.full_name} (
                  {approveModalItem.member?.member_code})
                </p>
                <p>
                  <strong>Buku:</strong> {approveModalItem.book?.title}
                </p>
              </div>

              {approveModalItem.memberSummary.unpaidFines > 0 && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>Peringatan Denda:</strong> Anggota ini memiliki denda belum lunas
                    sebesar{' '}
                    <strong>{formatRupiah(approveModalItem.memberSummary.unpaidFines)}</strong>.
                    Sesuai aturan bisnis BR-12, denda tidak memblokir peminjaman.
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Pilih Eksemplar yang Dialokasikan</Label>
                <Select value={selectedCopyId} onValueChange={setSelectedCopyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alokasi Otomatis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Otomatis (Pilih eksemplar tersedia pertama)
                    </SelectItem>
                    {availableCopiesForApprove.map((copy) => (
                      <SelectItem key={copy.id} value={String(copy.id)}>
                        Kode Barcode: {copy.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveModalItem(null)}>
              Batal
            </Button>
            <Button
              disabled={approveMutation.isPending}
              onClick={() => {
                void handleConfirmApprove()
              }}
            >
              <Clock className="size-4 mr-1.5" />
              <span>
                {approveMutation.isPending ? 'Menyetujui...' : 'Konfirmasi & Alokasikan'}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Tolak Pengajuan dengan Alasan Wajib (FR-CIR-08, TC-CIR-06) */}
      <Dialog
        open={rejectModalItem !== null}
        onOpenChange={(open) => {
          if (!open) setRejectModalItem(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Pengajuan Peminjaman</DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan yang jelas agar anggota mengetahui penyebab pengajuan
              ditolak.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              void handleSubmit(onRejectSubmit)(e)
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">Alasan Penolakan *</Label>
              <Input
                id="reject-reason"
                placeholder="Contoh: Eksemplar buku sedang dalam perbaikan fisik..."
                {...register('reason')}
              />
              {errors.reason && (
                <p className="text-xs text-destructive">{errors.reason.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectModalItem(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? 'Menolak...' : 'Tolak Pengajuan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
