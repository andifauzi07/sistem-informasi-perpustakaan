import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  Barcode,
  Layers,
  Calendar,
  Building,
  Hash,
  MapPin,
  BookmarkCheck,
  AlertCircle,
  AlertTriangle,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { catalogDetailQueryOptions } from '@/features/catalog/api/queries'
import { memberCirculationSummaryQueryOptions } from '@/features/circulation/api/queries'
import { useRequestLoanMutation } from '@/features/circulation/api/mutations'
import { COPY_STATUS_LABELS } from '@/lib/labels'
import { formatRupiah } from '@/lib/format'
import { toUserMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_app/katalog/$bookId')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      catalogDetailQueryOptions(Number(params.bookId))
    )
  },
  component: DetailBukuPage,
})

function DetailBukuPage() {
  const { bookId } = Route.useParams()
  const { profile } = Route.useRouteContext()
  const numericBookId = Number(bookId)
  const { data: book } = useSuspenseQuery(catalogDetailQueryOptions(numericBookId))

  const isMember = profile.role === 'student' || profile.role === 'teacher'
  const { data: memberSummary } = useQuery({
    ...memberCirculationSummaryQueryOptions(profile.id),
    enabled: isMember,
  })

  const requestLoanMutation = useRequestLoanMutation()

  if (!book) {
    return (
      <div className="container mx-auto max-w-xl py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Buku Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground">
          Informasi buku yang Anda cari tidak tersedia atau telah dihapus.
        </p>
        <Link
          to="/katalog"
          search={{ q: '', category: undefined, availableOnly: false, sort: 'relevance', page: 1 }}
        >
          <Button variant="outline">Kembali ke Katalog</Button>
        </Link>
      </div>
    )
  }

  const availability = Array.isArray(book.v_book_availability)
    ? book.v_book_availability[0]
    : book.v_book_availability

  const totalCopies = availability?.total_copies ?? 0
  const availableCopies = availability?.available_copies ?? 0
  const isAvailable = availableCopies > 0

  const hasOpenRequestForBook = Boolean(
    memberSummary?.openRequests.some((r) => r.book_id === numericBookId)
  )
  const hasActiveLoanForBook = Boolean(
    memberSummary?.activeLoans.some((l) => l.book_id === numericBookId)
  )
  const isDuplicateTitle = hasOpenRequestForBook || hasActiveLoanForBook
  const isQuotaFull = memberSummary ? memberSummary.remainingQuota <= 0 : false
  const unpaidFinesTotal = memberSummary?.unpaidFinesTotal ?? 0

  let disableReason: string | null = null
  if (!isAvailable) {
    disableReason = 'Stok eksemplar sedang habis di perpustakaan.'
  } else if (isDuplicateTitle) {
    disableReason = 'Judul ini sudah Anda ajukan atau sedang Anda pinjam.'
  } else if (isQuotaFull) {
    disableReason = `Batas peminjaman tercapai (${memberSummary?.maxActiveLoans ?? 5} buku).`
  }

  const canRequestLoan = isMember && !disableReason && !requestLoanMutation.isPending

  const handleRequestLoan = async () => {
    try {
      await requestLoanMutation.mutateAsync(numericBookId)
      toast.success(
        'Pengajuan peminjaman berhasil dikirim! Silakan tunggu verifikasi pustakawan dan ambil buku sebelum batas waktu.'
      )
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const coverUrl = book.cover_path
    ? supabase.storage.from('covers').getPublicUrl(book.cover_path).data.publicUrl
    : null

  const copies = book.book_copies || []

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Tombol Kembali */}
      <Link
        to="/katalog"
        search={{ q: '', category: undefined, availableOnly: false, sort: 'relevance', page: 1 }}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="size-4" />
        <span>Kembali ke Katalog</span>
      </Link>

      {/* Grid Utama Buku */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Kolom Kiri: Sampul & Aksi */}
        <div className="space-y-4">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-xl border bg-muted shadow-sm flex items-center justify-center">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={book.title}
                width={400}
                height={533}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="size-16 text-muted-foreground/30" />
                <span className="text-sm">Tidak ada sampul</span>
              </div>
            )}
          </div>

          {/* Kotak Ketersediaan & Tombol Ajukan Pinjam (FR-CAT-04, FR-CIR-01, BR-01..BR-04) */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Ketersediaan Fisik</span>
                {isAvailable ? (
                  <Badge className="bg-emerald-600 text-white gap-1 text-xs">
                    <CheckCircle2 className="size-3" />
                    <span>Tersedia ({availableCopies})</span>
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <XCircle className="size-3" />
                    <span>Stok Habis</span>
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Total Eksemplar:</span>
                  <span className="font-semibold text-foreground">{totalCopies}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dapat Dipinjam:</span>
                  <span className="font-semibold text-emerald-600">{availableCopies}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sedang Dipinjam:</span>
                  <span className="font-semibold text-foreground">
                    {availability?.on_loan_copies ?? 0}
                  </span>
                </div>
              </div>

              {/* Peringatan Denda Belum Lunas Non-Blokir (FR-FIN-07, BR-12) */}
              {isMember && unpaidFinesTotal > 0 && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Anda memiliki denda belum lunas sebesar{' '}
                    <strong>{formatRupiah(unpaidFinesTotal)}</strong>. Anda tetap dapat mengajukan
                    pinjaman.
                  </span>
                </div>
              )}

              {/* Tombol Ajukan Pinjam (TC-CAT-04, TC-CIR-01..04) */}
              {isMember ? (
                <div className="pt-2">
                  <Button
                    className="w-full gap-2"
                    disabled={!canRequestLoan}
                    onClick={() => {
                      void handleRequestLoan()
                    }}
                    title={disableReason || 'Ajukan Peminjaman'}
                  >
                    <BookmarkCheck className="size-4" />
                    <span>
                      {requestLoanMutation.isPending
                        ? 'Mengirim Pengajuan...'
                        : !isAvailable
                          ? 'Stok Sedang Habis'
                          : isDuplicateTitle
                            ? 'Sudah Diajukan / Dipinjam'
                            : isQuotaFull
                              ? 'Batas Pinjam Tercapai'
                              : 'Ajukan Pinjam'}
                    </span>
                  </Button>
                  {disableReason && (
                    <p className="mt-2 text-center text-xs text-destructive flex items-center justify-center gap-1">
                      <AlertCircle className="size-3 shrink-0" />
                      <span>{disableReason}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="pt-2 text-center text-xs text-muted-foreground">
                  Pustakawan memproses transaksi melalui menu{' '}
                  <Link to="/pustakawan/sirkulasi" className="font-semibold text-primary underline">
                    Meja Sirkulasi
                  </Link>
                  .
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Metadata Bibliografi Lengkap */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-medium text-xs">
                {book.categories?.name || 'Umum'}
              </Badge>
              {book.categories?.ddc_code && (
                <span className="text-xs font-mono text-muted-foreground">
                  DDC: {book.categories.ddc_code}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {book.title}
            </h1>
            <p className="text-base text-muted-foreground">Penulis: {book.authors}</p>
          </div>

          {/* Rincian Spesifikasi Teknis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Informasi Bibliografi</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 text-sm">
                <div className="flex items-center gap-2">
                  <Building className="size-4 text-muted-foreground shrink-0" />
                  <dt className="text-muted-foreground">Penerbit:</dt>
                  <dd className="font-medium text-foreground">{book.publisher || '-'}</dd>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground shrink-0" />
                  <dt className="text-muted-foreground">Tahun Terbit:</dt>
                  <dd className="font-medium text-foreground">{book.publication_year || '-'}</dd>
                </div>

                <div className="flex items-center gap-2">
                  <Hash className="size-4 text-muted-foreground shrink-0" />
                  <dt className="text-muted-foreground">ISBN:</dt>
                  <dd className="font-mono font-medium text-foreground">{book.isbn || '-'}</dd>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  <dt className="text-muted-foreground">Lokasi / Rak:</dt>
                  <dd className="font-medium text-primary">{book.call_number || '-'}</dd>
                </div>

                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-muted-foreground shrink-0" />
                  <dt className="text-muted-foreground">Jumlah Halaman:</dt>
                  <dd className="font-medium text-foreground">
                    {book.pages ? `${book.pages} hlm` : '-'}
                  </dd>
                </div>

                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-muted-foreground shrink-0" />
                  <dt className="text-muted-foreground">Bahasa / Edisi:</dt>
                  <dd className="font-medium text-foreground">
                    {book.language} {book.edition ? `(${book.edition})` : ''}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Sinopsis */}
          {book.synopsis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Sinopsis / Ringkasan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {book.synopsis}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Daftar Eksemplar Fisik */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Barcode className="size-4 text-primary" />
                <span>Daftar Eksemplar Fisik</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Kode Barcode</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead>Lokasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {copies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-20 text-center text-sm text-muted-foreground">
                        Belum ada eksemplar terdaftar untuk buku ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    copies.map((copy) => (
                      <TableRow key={copy.id}>
                        <TableCell className="font-mono font-semibold text-foreground">
                          {copy.code}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={copy.status === 'available' ? 'outline' : 'secondary'}
                            className={
                              copy.status === 'available'
                                ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700 text-xs'
                                : 'text-xs text-muted-foreground'
                            }
                          >
                            {COPY_STATUS_LABELS[copy.status] || copy.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {book.call_number || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
