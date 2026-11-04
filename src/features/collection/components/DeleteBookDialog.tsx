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
import { useDeleteBookMutation } from '../api/mutations'
import { toUserMessage } from '@/lib/errors'
import type { Database } from '@/types/database.types'

type Book = Database['public']['Tables']['books']['Row']

interface DeleteBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book?: Book | null
}

export function DeleteBookDialog({ open, onOpenChange, book }: DeleteBookDialogProps) {
  const deleteMutation = useDeleteBookMutation()

  if (!book) return null

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(book.id)
      toast.success('Buku dan seluruh eksemplarnya berhasil dihapus')
      onOpenChange(false)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Hapus Buku Koleksi</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus buku <strong>{book.title}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 text-sm text-muted-foreground">
          <p>
            Tindakan ini akan menghapus buku beserta seluruh eksemplar fisiknya yang belum pernah ditransaksikan.
          </p>
          <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-md border border-amber-200">
            <strong>Aturan Bisnis (BR-17):</strong> Buku yang memiliki riwayat transaksi (pengajuan atau peminjaman) tidak dapat dihapus demi integritas data laporan.
          </p>
        </div>

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
            {deleteMutation.isPending ? 'Menghapus...' : 'Hapus Buku'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
