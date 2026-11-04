import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Barcode, CheckCircle2, AlertTriangle, ShieldAlert, Archive } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { bookCopiesQueryOptions } from '../api/queries'
import { useAddCopiesMutation, useSetCopyStatusMutation } from '../api/mutations'
import { addCopiesSchema, type AddCopiesFormData } from '../schemas'
import { COPY_STATUS_LABELS, COPY_SOURCE_LABELS, type CopyStatus, type CopySource } from '@/lib/labels'
import { formatRupiah, formatDate } from '@/lib/format'
import { toUserMessage } from '@/lib/errors'
import type { Database } from '@/types/database.types'

type Book = Database['public']['Tables']['books']['Row']
type BookCopy = Database['public']['Tables']['book_copies']['Row']

interface ManageCopiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book?: Book | null
}

export function ManageCopiesDialog({ open, onOpenChange, book }: ManageCopiesDialogProps) {
  if (!book) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[850px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="size-5 text-primary" />
            <span>Kelola Eksemplar Fisik: {book.title}</span>
          </DialogTitle>
          <DialogDescription>
            Lihat daftar inventaris eksemplar fisik, ubah status kondisi buku, atau tambah eksemplar baru.
          </DialogDescription>
        </DialogHeader>

        <ManageCopiesContent book={book} />
      </DialogContent>
    </Dialog>
  )
}

function ManageCopiesContent({ book }: { book: Book }) {
  const { data: copies } = useSuspenseQuery(bookCopiesQueryOptions(book.id))
  const addMutation = useAddCopiesMutation()
  const setStatusMutation = useSetCopyStatusMutation()

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list')
  const [selectedCopyForStatus, setSelectedCopyForStatus] = useState<BookCopy | null>(null)
  const [targetStatus, setTargetStatus] = useState<CopyStatus>('damaged')
  const [statusNotes, setStatusNotes] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddCopiesFormData>({
    resolver: zodResolver(addCopiesSchema),
    defaultValues: {
      bookId: book.id,
      mode: 'auto',
      quantity: 1,
      codes: '',
      source: 'government',
      acquiredAt: new Date().toISOString().split('T')[0],
      price: null,
    },
  })

  const mode = watch('mode')
  const selectedSource = watch('source')

  const onAddSubmit = async (data: AddCopiesFormData) => {
    try {
      await addMutation.mutateAsync({
        ...data,
        bookId: book.id,
      })
      toast.success('Eksemplar baru berhasil ditambahkan')
      reset({
        bookId: book.id,
        mode: 'auto',
        quantity: 1,
        codes: '',
        source: 'government',
        acquiredAt: new Date().toISOString().split('T')[0],
        price: null,
      })
      setActiveTab('list')
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedCopyForStatus) return
    try {
      await setStatusMutation.mutateAsync({
        bookId: book.id,
        data: {
          copyId: selectedCopyForStatus.id,
          status: targetStatus,
          notes: statusNotes.trim() || undefined,
        },
      })
      toast.success(
        `Status eksemplar ${selectedCopyForStatus.code} diperbarui ke ${COPY_STATUS_LABELS[targetStatus]}`
      )
      setSelectedCopyForStatus(null)
      setStatusNotes('')
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  // Menentukan status tujuan yang diperbolehkan sesuai PRD §10.4
  const getAllowedTransitions = (currentStatus: CopyStatus): CopyStatus[] => {
    if (currentStatus === 'available') {
      return ['damaged', 'lost', 'withdrawn']
    }
    if (currentStatus === 'damaged' || currentStatus === 'lost') {
      return ['available', 'withdrawn']
    }
    return []
  }

  const getStatusBadge = (status: CopyStatus) => {
    switch (status) {
      case 'available':
        return (
          <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-3" />
            <span>Tersedia</span>
          </Badge>
        )
      case 'reserved':
        return <Badge variant="secondary">Dipesan</Badge>
      case 'on_loan':
        return <Badge variant="default">Dipinjam</Badge>
      case 'damaged':
        return (
          <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-50 text-amber-700">
            <AlertTriangle className="size-3" />
            <span>Rusak</span>
          </Badge>
        )
      case 'lost':
        return (
          <Badge variant="destructive" className="gap-1">
            <ShieldAlert className="size-3" />
            <span>Hilang</span>
          </Badge>
        )
      case 'withdrawn':
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Archive className="size-3" />
            <span>Ditarik</span>
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'list'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Daftar Eksemplar ({copies.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'add'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Plus className="size-4" />
          <span>Tambah Eksemplar</span>
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="max-h-[350px] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Kode</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[140px]">Sumber</TableHead>
                  <TableHead className="w-[120px]">Tgl Masuk</TableHead>
                  <TableHead className="w-[110px]">Harga</TableHead>
                  <TableHead className="text-right">Aksi Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {copies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                      Belum ada eksemplar fisik untuk buku ini. Silakan tambah eksemplar.
                    </TableCell>
                  </TableRow>
                ) : (
                  copies.map((copy) => {
                    const allowed = getAllowedTransitions(copy.status)
                    const isImmutable = copy.status === 'reserved' || copy.status === 'on_loan' || copy.status === 'withdrawn'

                    return (
                      <TableRow key={copy.id}>
                        <TableCell className="font-mono font-semibold text-foreground">
                          {copy.code}
                        </TableCell>
                        <TableCell>{getStatusBadge(copy.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {copy.source ? COPY_SOURCE_LABELS[copy.source] : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {copy.acquired_at ? formatDate(copy.acquired_at) : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {copy.price ? formatRupiah(copy.price) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {isImmutable ? (
                            <span className="text-[11px] text-muted-foreground italic">
                              {copy.status === 'withdrawn' ? 'Final' : 'Dalam sirkulasi'}
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                setSelectedCopyForStatus(copy)
                                setTargetStatus(allowed[0] || 'damaged')
                                setStatusNotes(copy.notes || '')
                              }}
                            >
                              Ubah Status
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Form Modal Perubahan Status Eksemplar */}
          {selectedCopyForStatus && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  Ubah Status Eksemplar: <span className="font-mono text-primary">{selectedCopyForStatus.code}</span>
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCopyForStatus(null)}
                  className="h-7 text-xs"
                >
                  Tutup
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="target-status">Pilih Status Baru (PRD §10.4)</Label>
                  <Select
                    value={targetStatus}
                    onValueChange={(val) => setTargetStatus(val as CopyStatus)}
                  >
                    <SelectTrigger id="target-status" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllowedTransitions(selectedCopyForStatus.status).map((st) => (
                        <SelectItem key={st} value={st}>
                          {COPY_STATUS_LABELS[st]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status-notes">Catatan Kondisi (Opsional)</Label>
                  <Input
                    id="status-notes"
                    placeholder="Contoh: Rusak jilid lepas / Ditemukan kembali"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCopyForStatus(null)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    void handleUpdateStatus()
                  }}
                  disabled={setStatusMutation.isPending}
                >
                  {setStatusMutation.isPending ? 'Menyimpan...' : 'Perbarui Status'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <form
          onSubmit={(e) => {
            void handleSubmit(onAddSubmit)(e)
          }}
          className="space-y-4 pt-2"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Metode Penomoran Kode</Label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    value="auto"
                    {...register('mode')}
                    className="accent-primary"
                  />
                  <span>Otomatis (B000001...)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    value="manual"
                    {...register('mode')}
                    className="accent-primary"
                  />
                  <span>Manual (Buku Induk Lama)</span>
                </label>
              </div>
            </div>

            {mode === 'auto' ? (
              <div>
                <Label htmlFor="copy-quantity">Jumlah Eksemplar (1 - 100)</Label>
                <Input
                  id="copy-quantity"
                  type="number"
                  min={1}
                  max={100}
                  {...register('quantity', {
                    setValueAs: (v: unknown) =>
                      v === '' || Number.isNaN(Number(v)) ? 1 : Number(v),
                  })}
                  className="mt-1"
                />
                {errors.quantity && (
                  <p className="mt-1 text-xs text-destructive">{errors.quantity.message}</p>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="copy-codes">
                  Daftar Kode Eksemplar <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="copy-codes"
                  placeholder="K-001, K-002 (pisahkan koma)"
                  {...register('codes')}
                  className="mt-1"
                />
                {errors.codes && (
                  <p className="mt-1 text-xs text-destructive">{errors.codes.message}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="copy-source">Sumber Perolehan</Label>
              <Select
                value={selectedSource || 'government'}
                onValueChange={(val) => setValue('source', val as CopySource)}
              >
                <SelectTrigger id="copy-source" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">BOS / Pemerintah</SelectItem>
                  <SelectItem value="purchase">Pembelian Mandiri</SelectItem>
                  <SelectItem value="donation">Sumbangan / Hibah</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="copy-acquired-at">Tanggal Perolehan</Label>
              <Input
                id="copy-acquired-at"
                type="date"
                {...register('acquiredAt')}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="copy-price">Harga Perolehan Satuan (Rp)</Label>
              <Input
                id="copy-price"
                type="number"
                placeholder="Contoh: 85000"
                {...register('price', {
                  setValueAs: (v: unknown) =>
                    v === '' || Number.isNaN(Number(v)) ? null : Number(v),
                })}
                className="mt-1"
              />
              {errors.price && (
                <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab('list')}
              disabled={isSubmitting || addMutation.isPending}
            >
              Kembali
            </Button>
            <Button type="submit" disabled={isSubmitting || addMutation.isPending}>
              {isSubmitting || addMutation.isPending ? 'Menambahkan...' : 'Simpan Eksemplar'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
