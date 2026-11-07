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
import { UploadCloud, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  uploadMaterialFormSchema,
  validateMaterialFile,
  type UploadMaterialFormData,
} from '../schemas'
import { useUploadMaterialMutation } from '../api/mutations'
import type { Database } from '@/types/database.types'

type MajorRow = Database['public']['Tables']['majors']['Row']

interface UploadMaterialDialogProps {
  majors: MajorRow[]
  defaultSubject?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadMaterialDialog({
  majors,
  defaultSubject,
  open,
  onOpenChange,
}: UploadMaterialDialogProps) {
  const mutation = useUploadMaterialMutation()
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [fileError, setFileError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadMaterialFormData>({
    resolver: zodResolver(uploadMaterialFormSchema),
    defaultValues: {
      title: '',
      subject: defaultSubject || '',
      description: '',
      gradeLevel: undefined,
      majorId: undefined,
    },
  })

  React.useEffect(() => {
    if (open) {
      reset({
        title: '',
        subject: defaultSubject || '',
        description: '',
        gradeLevel: undefined,
        majorId: undefined,
      })
      setSelectedFile(null)
      setFileError(null)
    }
  }, [open, defaultSubject, reset])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setFileError(null)
      setValue('file', undefined as unknown as File)
      return
    }

    const check = validateMaterialFile(file)
    if (!check.valid) {
      setFileError(check.error || 'Berkas tidak valid')
      setSelectedFile(null)
      setValue('file', undefined as unknown as File)
      return
    }

    setFileError(null)
    setSelectedFile(file)
    setValue('file', file, { shouldValidate: true })
  }

  const onSubmit = async (data: UploadMaterialFormData) => {
    try {
      await mutation.mutateAsync(data)
      toast.success(`Bahan ajar "${data.title}" berhasil diunggah dan terbit (FR-MAT-01).`)
      onOpenChange(false)
    } catch (err) {
      toast.error('Gagal mengunggah bahan ajar: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Unggah Bahan Ajar Baru
          </DialogTitle>
          <DialogDescription>
            Unggah materi pembelajaran digital untuk siswa (PDF, DOCX, PPTX, XLSX ≤ 10 MB) (FR-MAT-01, BR-20).
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
            <Label htmlFor="title" className="text-xs font-semibold">
              Judul Bahan Ajar <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Contoh: Modul Pemrograman Dasar Pertemuan 1"
              {...register('title')}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-[11px] font-medium text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Mata Pelajaran */}
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs font-semibold">
              Mata Pelajaran <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="Contoh: Informatika / Jaringan Komputer"
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
              <Label htmlFor="gradeLevel" className="text-xs font-semibold">
                Tingkat Kelas
              </Label>
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
              <Label htmlFor="majorId" className="text-xs font-semibold">
                Jurusan Sasaran
              </Label>
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
            <Label htmlFor="description" className="text-xs font-semibold">
              Deskripsi Singkat (Opsional)
            </Label>
            <Input
              id="description"
              placeholder="Ringkasan materi atau petunjuk pengerjaan tugas"
              {...register('description')}
              disabled={isSubmitting}
            />
          </div>

          {/* Input Berkas */}
          <div className="space-y-1.5">
            <Label htmlFor="file" className="text-xs font-semibold">
              Pilih Berkas Dokumen <span className="text-destructive">*</span>
            </Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.docx,.pptx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            {fileError && (
              <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {fileError}
              </p>
            )}
            {errors.file && !fileError && (
              <p className="text-[11px] font-medium text-destructive mt-1">
                {errors.file.message}
              </p>
            )}
            {selectedFile && !fileError && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                Berkas siap diunggah: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
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
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              Unggah & Terbitkan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
