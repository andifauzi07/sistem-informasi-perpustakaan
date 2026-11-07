import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { bookFormSchema, type BookFormData } from '../schemas'
import {
  useCreateBookMutation,
  useUpdateBookMutation,
  uploadBookCover,
} from '../api/mutations'
import { compressCoverImage } from '../utils'
import { toUserMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Book = Database['public']['Tables']['books']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface BookFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  bookToEdit?: Book | null
}

export function BookFormDialog({
  open,
  onOpenChange,
  categories,
  bookToEdit,
}: BookFormDialogProps) {
  const isEditing = Boolean(bookToEdit)
  const createMutation = useCreateBookMutation()
  const updateMutation = useUpdateBookMutation()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressedInfo, setCompressedInfo] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: '',
      authors: '',
      publisher: '',
      publicationYear: undefined,
      isbn: '',
      categoryId: categories[0]?.id ?? 0,
      synopsis: '',
      language: 'Indonesia',
      pages: undefined,
      edition: '',
      callNumber: '',
      coverPath: null,
    },
  })

  const hasCategories = categories.length > 0

  const selectedCategoryId = watch('categoryId')

  useEffect(() => {
    if (open) {
      setSelectedFile(null)
      setCompressedInfo(null)

      if (bookToEdit) {
        reset({
          title: bookToEdit.title,
          authors: bookToEdit.authors,
          publisher: bookToEdit.publisher || '',
          publicationYear: bookToEdit.publication_year ?? undefined,
          isbn: bookToEdit.isbn || '',
          categoryId: bookToEdit.category_id,
          synopsis: bookToEdit.synopsis || '',
          language: bookToEdit.language,
          pages: bookToEdit.pages ?? undefined,
          edition: bookToEdit.edition || '',
          callNumber: bookToEdit.call_number || '',
          coverPath: bookToEdit.cover_path,
        })

        if (bookToEdit.cover_path) {
          const { data } = supabase.storage.from('covers').getPublicUrl(bookToEdit.cover_path)
          setPreviewUrl(data.publicUrl)
        } else {
          setPreviewUrl(null)
        }
      } else {
        reset({
          title: '',
          authors: '',
          publisher: '',
          publicationYear: undefined,
          isbn: '',
          categoryId: categories[0]?.id ?? 0,
          synopsis: '',
          language: 'Indonesia',
          pages: undefined,
          edition: '',
          callNumber: '',
          coverPath: null,
        })
        setPreviewUrl(null)
      }
    }
  }, [open, bookToEdit, categories, reset])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Berkas harus berupa gambar (JPG, PNG, atau WebP)')
      return
    }

    try {
      setIsProcessingImage(true)
      const res = await compressCoverImage(file)
      setSelectedFile(file)
      const preview = URL.createObjectURL(res.blob)
      setPreviewUrl(preview)
      setCompressedInfo(
        `WebP ${res.width}x${res.height} px (${(res.size / 1024).toFixed(1)} KB)`
      )
    } catch {
      toast.error('Gagal mengompresi gambar sampul')
    } finally {
      setIsProcessingImage(false)
    }
  }

  const handleRemoveCover = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setCompressedInfo(null)
    setValue('coverPath', null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data: BookFormData) => {
    try {
      let finalCoverPath = data.coverPath || null

      if (isEditing && bookToEdit) {
        if (selectedFile) {
          finalCoverPath = await uploadBookCover(bookToEdit.id, selectedFile)
        }
        await updateMutation.mutateAsync({
          id: bookToEdit.id,
          data: { ...data, coverPath: finalCoverPath },
        })
        toast.success('Buku berhasil diperbarui')
      } else {
        const createdBook = await createMutation.mutateAsync({
          ...data,
          coverPath: null,
        })

        if (selectedFile && createdBook?.id) {
          const coverPath = await uploadBookCover(createdBook.id, selectedFile)
          await updateMutation.mutateAsync({
            id: createdBook.id,
            data: { ...data, coverPath },
          })
        }
        toast.success('Buku baru berhasil disimpan')
      }

      onOpenChange(false)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const isPending =
    isSubmitting || isProcessingImage || createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Ubah Informasi Buku' : 'Tambah Buku Baru'}</DialogTitle>
            <DialogDescription>
              Lengkapi metadata bibliografi buku sesuai standar inventaris perpustakaan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="book-title">
                Judul Buku <span className="text-destructive">*</span>
              </Label>
              <Input
                id="book-title"
                placeholder="Contoh: Administrasi Sistem Jaringan"
                {...register('title')}
                disabled={isPending}
                className="mt-1"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="book-authors">
                Penulis <span className="text-destructive">*</span>
              </Label>
              <Input
                id="book-authors"
                placeholder="Contoh: Andi Pratama, dkk."
                {...register('authors')}
                disabled={isPending}
                className="mt-1"
              />
              {errors.authors && (
                <p className="mt-1 text-xs text-destructive">{errors.authors.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="book-category">
                Kategori <span className="text-destructive">*</span>
              </Label>
              {hasCategories ? (
                <Select
                  value={selectedCategoryId ? String(selectedCategoryId) : undefined}
                  onValueChange={(val) =>
                    setValue('categoryId', Number(val), { shouldValidate: true })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="book-category" className="mt-1 w-full">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-64">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name} {cat.ddc_code ? `(${cat.ddc_code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                  Belum ada kategori buku. Tambahkan minimal satu kategori terlebih dahulu di menu{' '}
                  <a href="/pustakawan/kategori" className="font-semibold underline">
                    Kategori
                  </a>
                  .
                </div>
              )}
              {errors.categoryId && hasCategories && (
                <p className="mt-1 text-xs text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="book-publisher">Penerbit</Label>
              <Input
                id="book-publisher"
                placeholder="Contoh: Erlangga"
                {...register('publisher')}
                disabled={isPending}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="book-year">Tahun Terbit</Label>
              <Input
                id="book-year"
                type="number"
                placeholder="Contoh: 2022"
                {...register('publicationYear', {
                  setValueAs: (v: unknown) =>
                    v === '' || Number.isNaN(Number(v)) ? undefined : Number(v),
                })}
                disabled={isPending}
                className="mt-1"
              />
              {errors.publicationYear && (
                <p className="mt-1 text-xs text-destructive">{errors.publicationYear.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="book-isbn">ISBN</Label>
              <Input
                id="book-isbn"
                placeholder="Contoh: 978-602-01-2345-6"
                {...register('isbn')}
                disabled={isPending}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="book-call-number">Nomor Panggil / Lokasi Rak</Label>
              <Input
                id="book-call-number"
                placeholder="Contoh: 004.6 AND a (Rak B3)"
                {...register('callNumber')}
                disabled={isPending}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="book-pages">Jumlah Halaman</Label>
              <Input
                id="book-pages"
                type="number"
                placeholder="Contoh: 280"
                {...register('pages', {
                  setValueAs: (v: unknown) =>
                    v === '' || Number.isNaN(Number(v)) ? undefined : Number(v),
                })}
                disabled={isPending}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="book-edition">Edisi / Cetakan</Label>
              <Input
                id="book-edition"
                placeholder="Contoh: Cetakan ke-2"
                {...register('edition')}
                disabled={isPending}
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="book-synopsis">Sinopsis / Ringkasan</Label>
              <textarea
                id="book-synopsis"
                rows={3}
                placeholder="Deskripsi singkat isi materi buku..."
                {...register('synopsis')}
                disabled={isPending}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Unggah Sampul Buku (FR-COL-03) */}
            <div className="sm:col-span-2">
              <Label>Sampul Buku (WebP otomatis ≤ 600px / 60 KB)</Label>
              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Pratinjau Sampul"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-8" />
                      <span className="text-[10px]">Tanpa Sampul</span>
                    </div>
                  )}
                  {isProcessingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <Loader2 className="size-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      void handleFileChange(e)
                    }}
                    className="hidden"
                    id="cover-file-input"
                    disabled={isPending}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isPending}
                      className="gap-1.5"
                    >
                      <Upload className="size-3.5" />
                      <span>{previewUrl ? 'Ganti Sampul' : 'Pilih Gambar'}</span>
                    </Button>
                    {previewUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCover}
                        disabled={isPending}
                        className="gap-1.5 text-destructive hover:text-destructive"
                      >
                        <X className="size-3.5" />
                        <span>Hapus</span>
                      </Button>
                    )}
                  </div>
                  {compressedInfo && (
                    <p className="text-xs text-muted-foreground">{compressedInfo}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Format gambar dikompres otomatis di peramban ke WebP resolusi tajam dan ukuran ringan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending || !hasCategories}>
              {isPending ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Buku'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
