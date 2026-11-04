import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { categorySchema, type CategoryFormData } from '../schemas'
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '../api/mutations'
import { toUserMessage } from '@/lib/errors'
import type { Database } from '@/types/database.types'

type Category = Database['public']['Tables']['categories']['Row']

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryToEdit?: Category | null
}

export function CategoryDialog({ open, onOpenChange, categoryToEdit }: CategoryDialogProps) {
  const isEditing = Boolean(categoryToEdit)
  const createMutation = useCreateCategoryMutation()
  const updateMutation = useUpdateCategoryMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      ddcCode: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (categoryToEdit) {
        reset({
          name: categoryToEdit.name,
          ddcCode: categoryToEdit.ddc_code || '',
        })
      } else {
        reset({
          name: '',
          ddcCode: '',
        })
      }
    }
  }, [open, categoryToEdit, reset])

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditing && categoryToEdit) {
        await updateMutation.mutateAsync({ id: categoryToEdit.id, data })
        toast.success('Kategori berhasil diperbarui')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Kategori berhasil ditambahkan')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Ubah Kategori' : 'Tambah Kategori Buku'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Perbarui informasi nama kategori atau kode DDC klasifikasi.'
                : 'Masukkan nama kategori baru dan kode DDC (Dewey Decimal Classification) opsional.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">
                Nama Kategori <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category-name"
                placeholder="Contoh: Teknologi Informasi"
                {...register('name')}
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category-ddc">Kode DDC (Opsional)</Label>
              <Input
                id="category-ddc"
                placeholder="Contoh: 004"
                {...register('ddcCode')}
                disabled={isPending}
              />
              {errors.ddcCode && (
                <p className="text-xs text-destructive">{errors.ddcCode.message}</p>
              )}
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
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
