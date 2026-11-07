import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { EyeOffIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { hideMaterialSchema, type HideMaterialFormData } from '../schemas'
import { useSetMaterialVisibilityMutation } from '../api/mutations'
import type { TeachingMaterialItem } from '../api/queries'

interface HideMaterialDialogProps {
  material: TeachingMaterialItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HideMaterialDialog({
  material,
  open,
  onOpenChange,
}: HideMaterialDialogProps) {
  const mutation = useSetMaterialVisibilityMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HideMaterialFormData>({
    resolver: zodResolver(hideMaterialSchema),
    defaultValues: {
      reason: '',
    },
  })

  React.useEffect(() => {
    if (open) {
      reset({ reason: '' })
    }
  }, [open, reset])

  if (!material) return null

  const onSubmit = async (data: HideMaterialFormData) => {
    try {
      await mutation.mutateAsync({
        id: material.id,
        visible: false,
        reason: data.reason,
      })
      toast.success(`Bahan ajar "${material.title}" berhasil disembunyikan.`)
      onOpenChange(false)
    } catch (err) {
      toast.error(
        'Gagal menyembunyikan bahan ajar: ' +
          (err instanceof Error ? err.message : String(err))
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <EyeOffIcon className="h-5 w-5" />
            Sembunyikan Bahan Ajar
          </DialogTitle>
          <DialogDescription>
            Bahan ajar yang disembunyikan tidak akan tampil di katalog siswa dan tidak dapat diunduh (FR-MAT-04, TC-MAT-05).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-4 py-2"
        >
          <div className="rounded-md bg-slate-50 p-3 border text-xs space-y-1">
            <div className="font-semibold text-slate-800">{material.title}</div>
            <div className="text-muted-foreground">
              Mapel: {material.subject} &bull; Pengunggah: {material.teacher?.full_name || 'Guru'}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-semibold">
              Alasan Penyembunyian <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reason"
              placeholder="Contoh: Dokumen tidak sesuai kurikulum / revisi berkas"
              {...register('reason')}
              disabled={isSubmitting}
            />
            {errors.reason && (
              <p className="text-[11px] font-medium text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <EyeOffIcon className="h-4 w-4" />
              )}
              Sembunyikan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
