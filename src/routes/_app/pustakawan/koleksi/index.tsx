import { useState, useTransition } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  Search,
  Plus,
  BookOpen,
  MoreHorizontal,
  Edit,
  Trash2,
  Barcode,
  Printer,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { booksListQueryOptions, categoriesListQueryOptions } from '@/features/collection/api/queries'
import { collectionFilterSchema, type CollectionFilter } from '@/features/collection/schemas'
import { BookFormDialog } from '@/features/collection/components/BookFormDialog'
import { ManageCopiesDialog } from '@/features/collection/components/ManageCopiesDialog'
import { PrintBarcodeDialog } from '@/features/collection/components/PrintBarcodeDialog'
import { DeleteBookDialog } from '@/features/collection/components/DeleteBookDialog'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Book = Database['public']['Tables']['books']['Row']

export const Route = createFileRoute('/_app/pustakawan/koleksi/')({
  validateSearch: (search: Record<string, unknown>): CollectionFilter =>
    collectionFilterSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(booksListQueryOptions(deps)),
      context.queryClient.ensureQueryData(categoriesListQueryOptions()),
    ])
  },
  component: KoleksiPustakawanPage,
})

function KoleksiPustakawanPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [, startTransition] = useTransition()

  const { data: booksResult } = useSuspenseQuery(booksListQueryOptions(search))
  const { data: categories } = useSuspenseQuery(categoriesListQueryOptions())

  // State Dialog
  const [bookFormOpen, setBookFormOpen] = useState(false)
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null)

  const [manageCopiesOpen, setManageCopiesOpen] = useState(false)
  const [bookForCopies, setBookForCopies] = useState<Book | null>(null)

  const [printBarcodeOpen, setPrintBarcodeOpen] = useState(false)
  const [bookForBarcode, setBookForBarcode] = useState<Book | null>(null)

  const [deleteBookOpen, setDeleteBookOpen] = useState(false)
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null)

  const handleSearchChange = (q: string) => {
    startTransition(() => {
      void navigate({
        search: (prev) => ({
          ...prev,
          q,
          page: 1,
        }),
      })
    })
  }

  const handleCategoryChange = (val: string) => {
    startTransition(() => {
      void navigate({
        search: (prev) => ({
          ...prev,
          categoryId: val === 'all' ? undefined : Number(val),
          page: 1,
        }),
      })
    })
  }

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      void navigate({
        search: (prev) => ({
          ...prev,
          page: newPage,
        }),
      })
    })
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Koleksi Buku</h1>
          <p className="text-sm text-muted-foreground">
            Kelola inventaris buku, nomor panggil/rak, stok eksemplar fisik, dan pencetakan barcode.
          </p>
        </div>
        <Button
          onClick={() => {
            setBookToEdit(null)
            setBookFormOpen(true)
          }}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>Tambah Buku</span>
        </Button>
      </div>

      {/* Filter & Kontrol Pencarian */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul, penulis, atau ISBN..."
                defaultValue={search.q}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="w-full sm:w-56">
              <Select
                value={search.categoryId ? String(search.categoryId) : 'all'}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Koleksi Buku */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">Sampul</TableHead>
              <TableHead>Judul & Penulis</TableHead>
              <TableHead className="w-[150px]">Kategori</TableHead>
              <TableHead className="w-[120px]">ISBN</TableHead>
              <TableHead className="w-[110px] text-center">Ketersediaan</TableHead>
              <TableHead className="w-[140px]">Lokasi Rak</TableHead>
              <TableHead className="w-[80px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {booksResult.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <BookOpen className="size-8 text-muted-foreground/50" />
                    <p>Tidak ada buku yang sesuai dengan kriteria pencarian.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              booksResult.data.map((book) => {
                const availability = Array.isArray(book.v_book_availability)
                  ? book.v_book_availability[0]
                  : book.v_book_availability
                const totalCopies = availability?.total_copies ?? 0
                const availableCopies = availability?.available_copies ?? 0
                const coverUrl = book.cover_path
                  ? supabase.storage.from('covers').getPublicUrl(book.cover_path).data.publicUrl
                  : null

                return (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div className="size-12 overflow-hidden rounded bg-muted flex items-center justify-center border shrink-0">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={book.title}
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon className="size-5 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground line-clamp-1">
                          {book.title}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {book.authors} {book.publication_year ? `(${book.publication_year})` : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-foreground">
                        {book.categories?.name || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {book.isbn || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={availableCopies > 0 ? 'outline' : 'secondary'}
                        className={
                          availableCopies > 0
                            ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700 font-semibold text-xs'
                            : 'text-xs text-muted-foreground'
                        }
                      >
                        {availableCopies} / {totalCopies}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {book.call_number || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Aksi Koleksi</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setBookForCopies(book)
                              setManageCopiesOpen(true)
                            }}
                            className="gap-2 cursor-pointer"
                          >
                            <Barcode className="size-4 text-primary" />
                            <span>Kelola Eksemplar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setBookForBarcode(book)
                              setPrintBarcodeOpen(true)
                            }}
                            className="gap-2 cursor-pointer"
                          >
                            <Printer className="size-4" />
                            <span>Cetak Barcode</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setBookToEdit(book)
                              setBookFormOpen(true)
                            }}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit className="size-4" />
                            <span>Ubah Informasi</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setBookToDelete(book)
                              setDeleteBookOpen(true)
                            }}
                            className="gap-2 text-destructive cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                            <span>Hapus Judul</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Paginasi Kontrol */}
        {booksResult.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-xs text-muted-foreground">
              Menampilkan {booksResult.data.length} dari total {booksResult.count} buku (Halaman{' '}
              {booksResult.page} dari {booksResult.totalPages})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(booksResult.page - 1)}
                disabled={booksResult.page <= 1}
                className="gap-1"
              >
                <ChevronLeft className="size-4" />
                <span>Sebelumnya</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(booksResult.page + 1)}
                disabled={booksResult.page >= booksResult.totalPages}
                className="gap-1"
              >
                <span>Berikutnya</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Form Tambah / Ubah Buku */}
      <BookFormDialog
        open={bookFormOpen}
        onOpenChange={setBookFormOpen}
        categories={categories}
        bookToEdit={bookToEdit}
      />

      {/* Dialog Kelola Eksemplar */}
      <ManageCopiesDialog
        open={manageCopiesOpen}
        onOpenChange={setManageCopiesOpen}
        book={bookForCopies}
      />

      {/* Dialog Cetak Barcode Code 128 */}
      <PrintBarcodeDialog
        open={printBarcodeOpen}
        onOpenChange={setPrintBarcodeOpen}
        book={bookForBarcode}
      />

      {/* Dialog Konfirmasi Hapus Buku */}
      <DeleteBookDialog
        open={deleteBookOpen}
        onOpenChange={setDeleteBookOpen}
        book={bookToDelete}
      />
    </div>
  )
}
