import { useState, useTransition, useEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { catalogSearchQueryOptions } from '@/features/catalog/api/queries'
import { categoriesListQueryOptions } from '@/features/collection/api/queries'
import { catalogFilterSchema, type CatalogFilter } from '@/features/catalog/schemas'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_app/katalog/')({
  validateSearch: (search: Record<string, unknown>): CatalogFilter =>
    catalogFilterSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(catalogSearchQueryOptions(deps)),
      context.queryClient.ensureQueryData(categoriesListQueryOptions()),
    ])
  },
  component: KatalogPage,
})

function KatalogPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [, startTransition] = useTransition()

  const { data: searchResult } = useSuspenseQuery(catalogSearchQueryOptions(search))
  const { data: categories } = useSuspenseQuery(categoriesListQueryOptions())

  // Local state untuk debounce pencarian 300 ms (FR-CAT-01, TC-CAT-01)
  const [queryInput, setQueryInput] = useState(search.q)

  useEffect(() => {
    const handler = setTimeout(() => {
      if (queryInput !== search.q) {
        startTransition(() => {
          void navigate({
            search: (prev) => ({
              ...prev,
              q: queryInput,
              page: 1,
            }),
          })
        })
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [queryInput, search.q, navigate])

  const handleCategoryChange = (val: string) => {
    startTransition(() => {
      void navigate({
        search: (prev) => ({
          ...prev,
          category: val === 'all' ? undefined : Number(val),
          page: 1,
        }),
      })
    })
  }

  const handleSortChange = (val: string) => {
    startTransition(() => {
      void navigate({
        search: (prev) => ({
          ...prev,
          sort: val as 'relevance' | 'title' | 'newest',
          page: 1,
        }),
      })
    })
  }

  const handleAvailableOnlyChange = (checked: boolean) => {
    startTransition(() => {
      void navigate({
        search: (prev) => ({
          ...prev,
          availableOnly: checked,
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
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header Katalog */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Katalog Perpustakaan
          </h1>
          <p className="text-sm text-muted-foreground">
            Telusuri koleksi buku SMKN 1 Selayar dengan informasi ketersediaan eksemplar fisik
            real-time.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit text-xs">
          Total {searchResult.count} Judul Ditemukan
        </Badge>
      </div>

      {/* Kontrol Pencarian & Filter */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul buku, penulis, atau ISBN..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="w-full sm:w-52">
                <Select
                  value={search.category ? String(search.category) : 'all'}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="w-full h-10">
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

              <div className="w-full sm:w-44">
                <Select value={search.sort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevansi</SelectItem>
                    <SelectItem value="title">Judul A-Z</SelectItem>
                    <SelectItem value="newest">Terbaru</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={search.availableOnly}
                onChange={(e) => handleAvailableOnlyChange(e.target.checked)}
                className="size-4 rounded accent-primary cursor-pointer"
              />
              <span className="font-medium text-foreground">Hanya yang tersedia</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Hasil Pencarian Buku (Paginasi 20 Kartu - FR-CAT-03) */}
      {searchResult.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 text-center">
          <BookOpen className="size-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-semibold">Buku tidak ditemukan</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Coba gunakan kata kunci lain atau nonaktifkan filter ketersediaan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {searchResult.data.map((book) => {
            const isAvailable = book.available_copies > 0
            const coverUrl = book.cover_path
              ? supabase.storage.from('covers').getPublicUrl(book.cover_path).data.publicUrl
              : null

            return (
              <Link
                key={book.id}
                to="/katalog/$bookId"
                params={{ bookId: String(book.id) }}
                className="group flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                {/* Sampul Buku */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted flex items-center justify-center">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={book.title}
                      loading="lazy"
                      width={300}
                      height={400}
                      className="size-full object-cover transition group-hover:scale-105 duration-300"
                    />
                  ) : (
                    /* Typographic Book Cover untuk buku tanpa gambar sampul */
                    <div className="flex size-full flex-col justify-between bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 p-5 pt-11 text-white relative">
                      <div className="absolute inset-y-0 left-0 w-3 bg-white/10 border-r border-white/10" />
                      <div className="pl-2 space-y-2 my-auto">
                        <span className="inline-block rounded bg-white/15 px-2 py-0.5 text-[10px] font-medium text-blue-200">
                          {book.category_name}
                        </span>
                        <p className="font-bold text-base leading-snug line-clamp-3 text-white">
                          {book.title}
                        </p>
                        <p className="text-xs text-slate-300 line-clamp-2">
                          {book.authors}
                        </p>
                      </div>
                      <div className="pl-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10 pt-2">
                        <span className="font-mono">{book.call_number || 'SMKN 1 Selayar'}</span>
                        <span>{book.publication_year || ''}</span>
                      </div>
                    </div>
                  )}

                  {/* Badge Status Ketersediaan */}
                  <div className="absolute top-2.5 right-2.5">
                    {isAvailable ? (
                      <Badge className="bg-emerald-600/95 hover:bg-emerald-600 text-white gap-1 text-[11px] shadow-sm">
                        <CheckCircle2 className="size-3" />
                        <span>Tersedia ({book.available_copies})</span>
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 text-[11px] shadow-sm">
                        <XCircle className="size-3" />
                        <span>Habis (0)</span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Informasi Buku */}
                <div className="flex flex-1 flex-col p-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {book.category_name}
                  </span>
                  <h3 className="mt-1 font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition">
                    {book.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {book.authors} {book.publication_year ? `• ${book.publication_year}` : ''}
                  </p>

                  <div className="mt-auto pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>{book.total_copies} eksemplar</span>
                    {book.call_number && (
                      <span className="font-mono text-[11px] rounded bg-muted px-1.5 py-0.5 text-foreground truncate max-w-[130px]">
                        {book.call_number}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Kontrol Paginasi */}
      {searchResult.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Menampilkan {searchResult.data.length} dari total {searchResult.count} buku (Halaman{' '}
            {searchResult.page} dari {searchResult.totalPages})
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(searchResult.page - 1)}
              disabled={searchResult.page <= 1}
              className="gap-1"
            >
              <ChevronLeft className="size-4" />
              <span>Sebelumnya</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(searchResult.page + 1)}
              disabled={searchResult.page >= searchResult.totalPages}
              className="gap-1"
            >
              <span>Berikutnya</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
