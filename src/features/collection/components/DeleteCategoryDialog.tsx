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
import { useDeleteCategoryMutation } from '../api/mutations'
import { toUserMessage } from '@/lib/errors'
import type { Database } from '@/types/database.types'

type Category = Database['public']['Tables']['categories']['Row']

interface DeleteCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
}: DeleteCategoryDialogProps) {
  const deleteMutation = useDeleteCategoryMutation()

  if (!category) return null

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(category.id)
      toast.success('Kategori berhasil dihapus')
      onOpenChange(false)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hapus Kategori Buku</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus kategori <strong>{category.name}</strong>? Tindakan
            ini tidak dapat dibatalkan. Kategori yang masih digunakan oleh buku tidak dapat dihapus.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              void handleDelete()
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Menghapus...' : 'Hapus Kategori'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
