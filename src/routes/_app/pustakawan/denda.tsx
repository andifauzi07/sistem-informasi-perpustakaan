import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Receipt,
  Search,
  Banknote,
  ShieldCheck,
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
  librarianFineFilterSchema,
  waiveFineSchema,
  type WaiveFineFormData,
} from '@/features/fines/schemas'
import { librarianFinesQueryOptions } from '@/features/fines/api/queries'
import {
  usePayFineMutation,
  useWaiveFineMutation,
} from '@/features/fines/api/mutations'
import { FINE_STATUS_LABELS, FINE_TYPE_LABELS } from '@/lib/labels'
import { formatDate, formatRupiah } from '@/lib/format'
import { toUserMessage } from '@/lib/errors'

export const Route = createFileRoute('/_app/pustakawan/denda')({
  validateSearch: (search) => librarianFineFilterSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(librarianFinesQueryOptions(deps))
  },
  component: KelolaDendaPustakawanPage,
})

function KelolaDendaPustakawanPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const { data: finesResult } = useSuspenseQuery(librarianFinesQueryOptions(search))
  const payFineMutation = usePayFineMutation()
  const waiveFineMutation = useWaiveFineMutation()

  const [payModalFine, setPayModalFine] = useState<
    (typeof finesResult.data)[number] | null
  >(null)

  const [waiveModalFine, setWaiveModalFine] = useState<
    (typeof finesResult.data)[number] | null
  >(null)

  const {
    register,
    handleSubmit,
    reset: resetWaiveForm,
    formState: { errors },
  } = useForm<WaiveFineFormData>({
    resolver: zodResolver(waiveFineSchema),
    defaultValues: {
      fineId: 0,
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

  const handleConfirmPay = async () => {
    if (!payModalFine) return
    try {
      await payFineMutation.mutateAsync(payModalFine.id)
      toast.success('Pembayaran denda tunai berhasil dicatat lunas.')
      setPayModalFine(null)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const handleOpenWaive = (fine: (typeof finesResult.data)[number]) => {
    setWaiveModalFine(fine)
    resetWaiveForm({
      fineId: fine.id,
      reason: '',
    })
  }

  const onWaiveSubmit = async (data: WaiveFineFormData) => {
    try {
      await waiveFineMutation.mutateAsync(data)
      toast.success('Denda telah dibebaskan dengan alasan tertulis.')
      setWaiveModalFine(null)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="size-6 text-primary" />
          <span>Manajemen Denda Perpustakaan</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Catat pelunasan denda tunai atau pembebasan denda disertai alasan tertulis.
        </p>
      </div>

      {/* Ringkasan Rekapitulasi Denda */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground">Total Belum Lunas</p>
            <p className="text-2xl font-bold text-destructive">
              {formatRupiah(finesResult.summary.unpaidTotal)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground">Total Lunas (Tunai)</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatRupiah(finesResult.summary.paidTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground">Total Dibebaskan</p>
            <p className="text-2xl font-bold">
              {formatRupiah(finesResult.summary.waivedTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Denda (FR-FIN-06, TC-FIN-05) */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="search-fines">Cari Anggota / Judul Buku</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-fines"
                  placeholder="Ketik nama anggota, nomor induk, atau judul buku..."
                  value={search.q}
                  onChange={(e) => updateSearch({ q: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status Denda</Label>
              <Select
                value={search.status}
                onValueChange={(val) =>
                  updateSearch({
                    status: val as 'all' | 'unpaid' | 'paid' | 'waived',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="unpaid">Belum Lunas</SelectItem>
                  <SelectItem value="paid">Lunas</SelectItem>
                  <SelectItem value="waived">Dibebaskan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fine-class">Filter Kelas</Label>
              <Input
                id="fine-class"
                placeholder="Misal: XI TKJ 1"
                value={search.className}
                onChange={(e) => updateSearch({ className: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Daftar Denda */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Daftar Tagihan Denda ({finesResult.count})
          </CardTitle>
          <CardDescription className="text-xs">
            Pembayaran dicatat secara tunai lunas penuh (BR-13).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Anggota & Kelas</TableHead>
                <TableHead>Buku & Jenis Denda</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi Pustakawan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finesResult.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    Tidak ada data denda yang sesuai dengan filter.
                  </TableCell>
                </TableRow>
              ) : (
                finesResult.data.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDate(fine.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {fine.member?.full_name || '-'}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {fine.member?.member_code}
                        {fine.member?.class_name ? ` (${fine.member.class_name})` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {fine.loan?.copy?.book?.title || 'Buku Perpustakaan'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {FINE_TYPE_LABELS[fine.type]}
                        {fine.days_late ? ` (${fine.days_late} hari)` : ''} • Kode:{' '}
                        <span className="font-mono">{fine.loan?.copy?.code || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatRupiah(fine.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          fine.status === 'unpaid'
                            ? 'destructive'
                            : fine.status === 'paid'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {FINE_STATUS_LABELS[fine.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {fine.status === 'unpaid' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => setPayModalFine(fine)}
                          >
                            <Banknote className="size-3.5" />
                            <span>Catat Bayar</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleOpenWaive(fine)}
                          >
                            <ShieldCheck className="size-3.5" />
                            <span>Bebaskan</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {fine.status === 'paid' && fine.paid_at
                            ? `Diterima (${formatDate(fine.paid_at)})`
                            : fine.status === 'waived' && fine.waived_reason
                              ? `Alasan: ${fine.waived_reason}`
                              : '-'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginasi */}
      {finesResult.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Halaman {finesResult.page} dari {finesResult.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={finesResult.page <= 1}
              onClick={() => updateSearch({ page: finesResult.page - 1 })}
            >
              <ArrowLeft className="size-4 mr-1" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={finesResult.page >= finesResult.totalPages}
              onClick={() => updateSearch({ page: finesResult.page + 1 })}
            >
              Berikutnya
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Catat Pembayaran Tunai (FR-FIN-03, TC-FIN-01) */}
      <Dialog
        open={payModalFine !== null}
        onOpenChange={(open) => {
          if (!open) setPayModalFine(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pelunasan Denda Tunai</DialogTitle>
            <DialogDescription>
              Pastikan uang tunai telah diterima secara penuh sebelum mengonfirmasi pelunasan.
            </DialogDescription>
          </DialogHeader>

          {payModalFine && (
            <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1.5">
              <p>
                <strong>Anggota:</strong> {payModalFine.member?.full_name} (
                {payModalFine.member?.member_code})
              </p>
              <p>
                <strong>Jenis Denda:</strong> {FINE_TYPE_LABELS[payModalFine.type]}
              </p>
              <p className="text-sm">
                <strong>Nominal Tunai:</strong>{' '}
                <span className="font-bold text-emerald-600">
                  {formatRupiah(payModalFine.amount)}
                </span>
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPayModalFine(null)}>
              Batal
            </Button>
            <Button
              disabled={payFineMutation.isPending}
              onClick={() => {
                void handleConfirmPay()
              }}
            >
              {payFineMutation.isPending ? 'Menyimpan...' : 'Ya, Catat Lunas Tunai'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Pembebasan Denda dengan Alasan Wajib (FR-FIN-04, TC-FIN-02) */}
      <Dialog
        open={waiveModalFine !== null}
        onOpenChange={(open) => {
          if (!open) setWaiveModalFine(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bebaskan Tagihan Denda</DialogTitle>
            <DialogDescription>
              Pembebasan denda bersifat final dan wajib disertai alasan tertulis untuk audit.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              void handleSubmit(onWaiveSubmit)(e)
            }}
            className="space-y-4 py-2"
          >
            {waiveModalFine && (
              <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
                <p>
                  <strong>Anggota:</strong> {waiveModalFine.member?.full_name}
                </p>
                <p>
                  <strong>Nominal Dibebaskan:</strong> {formatRupiah(waiveModalFine.amount)}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="waive-reason">Alasan Pembebasan Denda *</Label>
              <Input
                id="waive-reason"
                placeholder="Contoh: Dispensasi sakit / musibah bencana alam..."
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
                onClick={() => setWaiveModalFine(null)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={waiveFineMutation.isPending}>
                {waiveFineMutation.isPending ? 'Memproses...' : 'Konfirmasi Bebaskan Denda'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
