import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Copy, Check, KeyRound, Loader2, Plus, UserPlus } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createMemberSchema, type CreateMemberFormData } from '../schemas'
import { useCreateMemberMutation } from '../api/mutations'
import { toUserMessage } from '@/lib/errors'
import type { Database } from '@/types/database.types'

type Major = Database['public']['Tables']['majors']['Row']

interface CreateMemberDialogProps {
  majors: Major[]
}

export function CreateMemberDialog({ majors }: CreateMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const createMutation = useCreateMemberMutation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateMemberFormData>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      memberCode: '',
      fullName: '',
      role: 'student',
      className: '',
      subject: '',
      position: '',
      phone: '',
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: CreateMemberFormData) => {
    try {
      const res = await createMutation.mutateAsync(data)
      setCreatedPassword(res.temp_password)
      toast.success('Anggota berhasil ditambahkan!')
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const handleCopyPassword = () => {
    if (!createdPassword) return
    void navigator.clipboard.writeText(createdPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Password sementara disalin ke clipboard')
  }

  const handleClose = () => {
    setOpen(false)
    setCreatedPassword(null)
    setCopied(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={(val) => (val ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          <span>Tambah Anggota</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-xl">
        {createdPassword ? (
          <div className="space-y-4 py-2">
            <DialogHeader>
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <KeyRound className="size-6" />
              </div>
              <DialogTitle className="text-center text-xl">Akun Berhasil Dibuat!</DialogTitle>
              <DialogDescription className="text-center">
                Salin password sementara berikut dan berikan kepada anggota. Password ini hanya
                ditampilkan satu kali.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between rounded-lg border bg-muted p-4">
              <span className="font-mono text-xl font-bold tracking-wider">{createdPassword}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPassword}
                className="gap-1.5"
              >
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Anggota wajib mengganti password saat pertama kali login ke sistem.
            </p>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Selesai
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e)
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="size-5 text-primary" />
                <span>Tambah Anggota Baru</span>
              </DialogTitle>
              <DialogDescription>
                Masukkan data identitas anggota. Nomor induk dan peran tidak dapat diubah setelah disimpan.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-memberCode">Nomor Induk (NIS / NIP) *</Label>
                <Input
                  id="create-memberCode"
                  placeholder="Contoh: 21100456"
                  disabled={createMutation.isPending}
                  {...register('memberCode')}
                />
                {errors.memberCode && (
                  <p className="text-xs text-destructive">{errors.memberCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-role">Peran *</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(val: 'student' | 'teacher' | 'librarian') => setValue('role', val)}
                  disabled={createMutation.isPending}
                >
                  <SelectTrigger id="create-role">
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Siswa</SelectItem>
                    <SelectItem value="teacher">Guru</SelectItem>
                    <SelectItem value="librarian">Pustakawan</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-xs text-destructive">{errors.role.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-fullName">Nama Lengkap *</Label>
              <Input
                id="create-fullName"
                placeholder="Nama lengkap sesuai data sekolah"
                disabled={createMutation.isPending}
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            {selectedRole === 'student' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-className">Kelas *</Label>
                  <Input
                    id="create-className"
                    placeholder="Contoh: X TKJ 1"
                    disabled={createMutation.isPending}
                    {...register('className')}
                  />
                  {errors.className && (
                    <p className="text-xs text-destructive">{errors.className.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-majorId">Jurusan</Label>
                  <Select
                    onValueChange={(val) => setValue('majorId', val ? Number(val) : undefined)}
                    disabled={createMutation.isPending}
                  >
                    <SelectTrigger id="create-majorId">
                      <SelectValue placeholder="Pilih jurusan (opsional)" />
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

            {selectedRole === 'teacher' && (
              <div className="space-y-2">
                <Label htmlFor="create-subject">Mata Pelajaran (Opsional)</Label>
                <Input
                  id="create-subject"
                  placeholder="Contoh: Matematika, Bahasa Indonesia"
                  disabled={createMutation.isPending}
                  {...register('subject')}
                />
              </div>
            )}

            {selectedRole === 'librarian' && (
              <div className="space-y-2">
                <Label htmlFor="create-position">Jabatan (Opsional)</Label>
                <Input
                  id="create-position"
                  placeholder="Contoh: Kepala Perpustakaan, Petugas Layanan"
                  disabled={createMutation.isPending}
                  {...register('position')}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="create-phone">Nomor Telepon (Opsional)</Label>
              <Input
                id="create-phone"
                placeholder="Contoh: 081234567890"
                disabled={createMutation.isPending}
                {...register('phone')}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose}>
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan & Buat Akun'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
