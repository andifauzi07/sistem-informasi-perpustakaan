import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  BookOpen,
  Search,
  AlertTriangle,
  FileWarning,
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
  librarianLoanFilterSchema,
  markLoanLostSchema,
  type MarkLoanLostFormData,
} from '@/features/circulation/schemas'
import { librarianLoansQueryOptions } from '@/features/circulation/api/queries'
import { useMarkLoanLostMutation } from '@/features/circulation/api/mutations'
import { LOAN_STATUS_LABELS, ROLE_LABELS } from '@/lib/labels'
import { formatDate, formatRupiah } from '@/lib/format'
import { toUserMessage } from '@/lib/errors'

export const Route = createFileRoute('/_app/pustakawan/pinjaman')({
  validateSearch: (search) => librarianLoanFilterSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(librarianLoansQueryOptions(deps))
  },
  component: DaftarPinjamanPustakawanPage,
})

function DaftarPinjamanPustakawanPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const { data: loansResult } = useSuspenseQuery(librarianLoansQueryOptions(search))
  const markLostMutation = useMarkLoanLostMutation()

  const [lostModalLoan, setLostModalLoan] = useState<
    (typeof loansResult.data)[number] | null
  >(null)

  const {
    register,
    handleSubmit,
    reset: resetLostForm,
    formState: { errors },
  } = useForm<MarkLoanLostFormData>({
    resolver: zodResolver(markLoanLostSchema),
    defaultValues: {
      loanId: 0,
      amount: 50000,
      notes: '',
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

  const handleOpenMarkLost = (loan: (typeof loansResult.data)[number]) => {
    setLostModalLoan(loan)
    resetLostForm({
      loanId: loan.id ?? 0,
      amount: 75000,
      notes: '',
    })
  }

  const onMarkLostSubmit = async (data: MarkLoanLostFormData) => {
    try {
      await markLostMutation.mutateAsync(data)
      toast.success('Pinjaman ditandai hilang dan tagihan denda kehilangan telah diterbitkan.')
      setLostModalLoan(null)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="size-6 text-primary" />
          <span>Daftar Pinjaman & Pemantauan Keterlambatan</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola seluruh transaksi pinjaman aktif, pantau keterlambatan, dan tandai buku hilang.
        </p>
      </div>

      {/* Filter Pinjaman (FR-CIR-12) */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="search-loans">Cari Anggota / Judul / Kode Barcode</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-loans"
                  placeholder="Ketik nama, nomor induk, judul, atau kode eksemplar..."
                  value={search.q}
                  onChange={(e) => updateSearch({ q: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Peran Peminjam</Label>
              <Select
                value={search.role}
                onValueChange={(val) =>
                  updateSearch({ role: val as 'all' | 'student' | 'teacher' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Peran</SelectItem>
                  <SelectItem value="student">Siswa</SelectItem>
                  <SelectItem value="teacher">Guru</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-class">Filter Kelas</Label>
              <Input
                id="filter-class"
                placeholder="Misal: XI TKJ 1"
                value={search.className}
                onChange={(e) => updateSearch({ className: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={search.overdueOnly}
                  onChange={(e) => updateSearch({ overdueOnly: e.target.checked })}
                  className="size-4 rounded border-input"
                />
                <span>Hanya yang terlambat melewati jatuh tempo</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={search.returnRequestedOnly}
                  onChange={(e) =>
                    updateSearch({ returnRequestedOnly: e.target.checked })
                  }
                  className="size-4 rounded border-input"
                />
                <span>Menunggu konfirmasi pengembalian</span>
              </label>
            </div>

            <div className="w-44">
              <Select
                value={search.status}
                onValueChange={(val) =>
                  updateSearch({
                    status: val as 'active' | 'returned' | 'lost' | 'all',
                  })
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Status: Dipinjam (Aktif)</SelectItem>
                  <SelectItem value="returned">Status: Dikembalikan</SelectItem>
                  <SelectItem value="lost">Status: Hilang</SelectItem>
                  <SelectItem value="all">Semua Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Pinjaman */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Data Pinjaman ({loansResult.count})
          </CardTitle>
          <CardDescription className="text-xs">
            Menampilkan status jatuh tempo WITA dan estimasi denda keterlambatan berjalan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anggota</TableHead>
                <TableHead>Buku & Kode</TableHead>
                <TableHead>Tgl Pinjam</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status & Keterlambatan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loansResult.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    Tidak ada data pinjaman yang sesuai dengan filter.
                  </TableCell>
                </TableRow>
              ) : (
                loansResult.data.map((loan) => {
                  const isOverdue = Boolean(loan.is_overdue)
                  const daysOverdue = loan.days_overdue ?? 0
                  const estimatedFine = loan.estimated_fine ?? 0

                  return (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{loan.full_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {loan.member_code} • {loan.role ? ROLE_LABELS[loan.role] : ''}
                          {loan.class_name ? ` (${loan.class_name})` : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{loan.title}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          Kode: <strong>{loan.copy_code}</strong>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {loan.loaned_at ? formatDate(loan.loaned_at) : '-'}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {loan.due_date ? formatDate(loan.due_date) : '-'}
                      </TableCell>
                      <TableCell className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={
                              loan.status === 'lost'
                                ? 'destructive'
                                : loan.status === 'active'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {loan.status ? LOAN_STATUS_LABELS[loan.status] : '-'}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive" className="gap-1 text-[11px]">
                              <AlertTriangle className="size-3" />
                              <span>Terlambat {daysOverdue} hari</span>
                            </Badge>
                          )}
                        </div>
                        {isOverdue && estimatedFine > 0 && (
                          <div className="text-xs text-destructive font-medium">
                            Estimasi Denda: {formatRupiah(estimatedFine)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {loan.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive hover:text-destructive"
                            onClick={() => handleOpenMarkLost(loan)}
                          >
                            <FileWarning className="size-3.5" />
                            <span>Tandai Hilang</span>
                          </Button>
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
      {loansResult.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Halaman {loansResult.page} dari {loansResult.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loansResult.page <= 1}
              onClick={() => updateSearch({ page: loansResult.page - 1 })}
            >
              <ArrowLeft className="size-4 mr-1" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loansResult.page >= loansResult.totalPages}
              onClick={() => updateSearch({ page: loansResult.page + 1 })}
            >
              Berikutnya
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Tandai Buku Hilang (FR-CIR-14, TC-CIR-16) */}
      <Dialog
        open={lostModalLoan !== null}
        onOpenChange={(open) => {
          if (!open) setLostModalLoan(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tandai Pinjaman Buku Hilang</DialogTitle>
            <DialogDescription>
              Status eksemplar akan diubah menjadi <strong>Hilang</strong> dan sistem akan
              menerbitkan tagihan denda penggantian buku hilang kepada peminjam.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              void handleSubmit(onMarkLostSubmit)(e)
            }}
            className="space-y-4 py-2"
          >
            {lostModalLoan && (
              <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
                <p>
                  <strong>Peminjam:</strong> {lostModalLoan.full_name} ({lostModalLoan.member_code})
                </p>
                <p>
                  <strong>Buku:</strong> {lostModalLoan.title} ({lostModalLoan.copy_code})
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="loss-amount">Nominal Ganti Rugi Buku Hilang (Rp) *</Label>
              <Input
                id="loss-amount"
                type="number"
                min={1000}
                step={1000}
                {...register('amount', {
                  setValueAs: (v) =>
                    v === '' || Number.isNaN(Number(v)) ? undefined : Number(v),
                })}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loss-notes">Catatan / Keterangan (Opsional)</Label>
              <Input
                id="loss-notes"
                placeholder="Contoh: Buku hilang saat perjalanan pulang sekolah..."
                {...register('notes')}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLostModalLoan(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={markLostMutation.isPending}
              >
                {markLostMutation.isPending
                  ? 'Memproses...'
                  : 'Konfirmasi Tandai Hilang'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
