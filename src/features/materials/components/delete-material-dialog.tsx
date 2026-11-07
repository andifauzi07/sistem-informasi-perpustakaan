import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2Icon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteMaterialMutation } from '../api/mutations'
import type { TeachingMaterialItem } from '../api/queries'

interface DeleteMaterialDialogProps {
  material: TeachingMaterialItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteMaterialDialog({
  material,
  open,
  onOpenChange,
}: DeleteMaterialDialogProps) {
  const mutation = useDeleteMaterialMutation()
  const [isDeleting, setIsDeleting] = React.useState(false)

  if (!material) return null

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await mutation.mutateAsync({
        id: material.id,
        filePath: material.file_path,
      })
      toast.success(`Bahan ajar "${material.title}" beserta berkasnya berhasil dihapus.`)
      onOpenChange(false)
    } catch (err) {
      toast.error('Gagal menghapus bahan ajar: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2Icon className="h-5 w-5" />
            Hapus Bahan Ajar
          </DialogTitle>
          <DialogDescription>
            Tindakan ini tidak dapat dibatalkan. Berkas digital dan data unduhan akan dihapus permanen (FR-MAT-02, BR-20).
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs space-y-1">
            <div className="font-semibold text-slate-900">{material.title}</div>
            <div className="text-muted-foreground">
              Mata Pelajaran: {material.subject} &bull; Berkas: {material.file_name}
            </div>
            <div className="text-muted-foreground font-mono">
              Total Diunduh: {material.download_count} kali
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              void handleDelete()
            }}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2Icon className="h-4 w-4" />
            )}
            Hapus Permanen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
