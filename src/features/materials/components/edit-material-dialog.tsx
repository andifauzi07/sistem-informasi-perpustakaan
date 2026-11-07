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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit3Icon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { updateMaterialSchema, type UpdateMaterialFormData } from '../schemas'
import { useUpdateMaterialMutation } from '../api/mutations'
import type { TeachingMaterialItem } from '../api/queries'
import type { Database } from '@/types/database.types'

type MajorRow = Database['public']['Tables']['majors']['Row']

interface EditMaterialDialogProps {
  material: TeachingMaterialItem | null
  majors: MajorRow[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditMaterialDialog({
  material,
  majors,
  open,
  onOpenChange,
}: EditMaterialDialogProps) {
  const mutation = useUpdateMaterialMutation()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMaterialFormData>({
    resolver: zodResolver(updateMaterialSchema),
  })

  React.useEffect(() => {
    if (material && open) {
      reset({
        title: material.title,
        subject: material.subject,
        description: material.description || '',
        gradeLevel: material.grade_level || undefined,
        majorId: material.major_id || undefined,
      })
    }
  }, [material, open, reset])

  if (!material) return null

  const onSubmit = async (data: UpdateMaterialFormData) => {
    try {
      await mutation.mutateAsync({
        id: material.id,
        data,
      })
      toast.success(`Metadata bahan ajar "${data.title}" berhasil diperbarui.`)
      onOpenChange(false)
    } catch (err) {
      toast.error('Gagal memperbarui bahan ajar: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3Icon className="h-5 w-5 text-primary" />
            Ubah Informasi Bahan Ajar
          </DialogTitle>
          <DialogDescription>
            Perbarui judul, mata pelajaran, tingkat, atau jurusan sasaran (FR-MAT-02).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-4 py-2"
        >
          {/* Judul */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title" className="text-xs font-semibold">
              Judul Bahan Ajar <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              placeholder="Judul bahan ajar"
              {...register('title')}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-[11px] font-medium text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Mata Pelajaran */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-subject" className="text-xs font-semibold">
              Mata Pelajaran <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-subject"
              placeholder="Mata pelajaran"
              {...register('subject')}
              disabled={isSubmitting}
            />
            {errors.subject && (
              <p className="text-[11px] font-medium text-destructive">{errors.subject.message}</p>
            )}
          </div>

          {/* Tingkat & Jurusan Sasaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tingkat Kelas</Label>
              <Select
                value={watch('gradeLevel') ? String(watch('gradeLevel')) : 'all'}
                onValueChange={(val) => {
                  setValue('gradeLevel', val === 'all' ? undefined : Number(val), {
                    shouldValidate: true,
                  })
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  <SelectItem value="10">Kelas X</SelectItem>
                  <SelectItem value="11">Kelas XI</SelectItem>
                  <SelectItem value="12">Kelas XII</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Jurusan Sasaran</Label>
              <Select
                value={watch('majorId') ? String(watch('majorId')) : 'all'}
                onValueChange={(val) => {
                  setValue('majorId', val === 'all' ? undefined : Number(val), {
                    shouldValidate: true,
                  })
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Jurusan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jurusan</SelectItem>
                  {majors.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.code} - {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc" className="text-xs font-semibold">
              Deskripsi Singkat
            </Label>
            <Input
              id="edit-desc"
              placeholder="Deskripsi materi"
              {...register('description')}
              disabled={isSubmitting}
            />
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
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <Edit3Icon className="h-4 w-4" />
              )}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
