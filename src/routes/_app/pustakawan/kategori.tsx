import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Tag, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { categoriesListQueryOptions } from '@/features/collection/api/queries'
import { CategoryDialog } from '@/features/collection/components/CategoryDialog'
import { DeleteCategoryDialog } from '@/features/collection/components/DeleteCategoryDialog'
import { formatDate } from '@/lib/format'
import type { Database } from '@/types/database.types'

type Category = Database['public']['Tables']['categories']['Row']

export const Route = createFileRoute('/_app/pustakawan/kategori')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(categoriesListQueryOptions())
  },
  component: KategoriPage,
})

function KategoriPage() {
  const { data: categories } = useSuspenseQuery(categoriesListQueryOptions())
  const [searchTerm, setSearchTerm] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const filteredCategories = categories.filter((c) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      (c.ddc_code && c.ddc_code.toLowerCase().includes(term))
    )
  })

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategori Buku</h1>
          <p className="text-sm text-muted-foreground">
            Kelola klasifikasi kategori dan kode DDC (Dewey Decimal Classification) koleksi perpustakaan.
          </p>
        </div>
        <Button
          onClick={() => {
            setCategoryToEdit(null)
            setDialogOpen(true)
          }}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>Tambah Kategori</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Daftar Kategori</CardTitle>
              <CardDescription>
                Total {categories.length} kategori terdaftar dalam sistem.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau DDC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">No</TableHead>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead className="w-[140px]">Kode DDC</TableHead>
                  <TableHead className="w-[180px]">Tanggal Dibuat</TableHead>
                  <TableHead className="w-[120px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Tag className="size-8 text-muted-foreground/50" />
                        <p>Tidak ada kategori yang ditemukan.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((cat, idx) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {cat.name}
                      </TableCell>
                      <TableCell>
                        {cat.ddc_code ? (
                          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-mono font-medium">
                            {cat.ddc_code}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(cat.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCategoryToEdit(cat)
                              setDialogOpen(true)
                            }}
                            title="Ubah Kategori"
                            aria-label={`Ubah ${cat.name}`}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setCategoryToDelete(cat)
                              setDeleteOpen(true)
                            }}
                            title="Hapus Kategori"
                            aria-label={`Hapus ${cat.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categoryToEdit={categoryToEdit}
      />

      <DeleteCategoryDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        category={categoryToDelete}
      />
    </div>
  )
}
