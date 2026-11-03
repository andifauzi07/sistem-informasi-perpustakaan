import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Lock, Loader2, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { updateMemberSchema, type UpdateMemberFormData } from '../schemas'
import { useUpdateMemberMutation } from '../api/mutations'
import { ROLE_LABELS } from '@/lib/labels'
import { toUserMessage } from '@/lib/errors'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Major = Database['public']['Tables']['majors']['Row']

interface EditMemberDialogProps {
  member: Profile | null
  majors: Major[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditMemberDialog({ member, majors, open, onOpenChange }: EditMemberDialogProps) {
  const updateMutation = useUpdateMemberMutation()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateMemberFormData>({
    resolver: zodResolver(updateMemberSchema),
    defaultValues: {
      fullName: '',
      className: '',
      majorId: undefined,
      subject: '',
      position: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (member) {
      reset({
        fullName: member.full_name,
        className: member.class_name || '',
        majorId: member.major_id ? Number(member.major_id) : undefined,
        subject: member.subject || '',
        position: member.position || '',
        phone: member.phone || '',
      })
    }
  }, [member, reset])

  if (!member) return null

  const onSubmit = async (data: UpdateMemberFormData) => {
    try {
      await updateMutation.mutateAsync({ id: member.id, data })
      toast.success('Data anggota berhasil diperbarui!')
      onOpenChange(false)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="size-5 text-primary" />
              <span>Ubah Data Anggota</span>
            </DialogTitle>
            <DialogDescription>
              Perbarui informasi anggota. Sesuai aturan sistem (BR-15), nomor induk dan peran tidak dapat diubah.
            </DialogDescription>
          </DialogHeader>

          {/* Kolom Terkunci (BR-15) */}
          <div className="grid gap-4 rounded-lg border bg-muted/50 p-3 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="size-3" /> Nomor Induk (Terkunci)
              </span>
              <p className="font-semibold">{member.member_code}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="size-3" /> Peran (Terkunci)
              </span>
              <div>
                <Badge variant="outline">{ROLE_LABELS[member.role]}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-fullName">Nama Lengkap *</Label>
            <Input
              id="edit-fullName"
              placeholder="Nama lengkap"
              disabled={updateMutation.isPending}
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {member.role === 'student' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-className">Kelas</Label>
                <Input
                  id="edit-className"
                  placeholder="Contoh: X TKJ 1"
                  disabled={updateMutation.isPending}
                  {...register('className')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-majorId">Jurusan</Label>
                <Select
                  defaultValue={member.major_id ? String(member.major_id) : undefined}
                  onValueChange={(val) => setValue('majorId', val ? Number(val) : undefined)}
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger id="edit-majorId">
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    {majors.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.code} - {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {member.role === 'teacher' && (
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Mata Pelajaran</Label>
              <Input
                id="edit-subject"
                placeholder="Mata pelajaran"
                disabled={updateMutation.isPending}
                {...register('subject')}
              />
            </div>
          )}

          {member.role === 'librarian' && (
            <div className="space-y-2">
              <Label htmlFor="edit-position">Jabatan</Label>
              <Input
                id="edit-position"
                placeholder="Jabatan di perpustakaan"
                disabled={updateMutation.isPending}
                {...register('position')}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Nomor Telepon</Label>
            <Input
              id="edit-phone"
              placeholder="Nomor kontak"
              disabled={updateMutation.isPending}
              {...register('phone')}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
