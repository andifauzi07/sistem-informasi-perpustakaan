import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, LogOut, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { changePasswordSchema, type ChangePasswordFormData } from '@/features/auth/schemas'
import { useChangePasswordMutation, useLogoutMutation } from '@/features/auth/api/mutations'
import { ROLE_LABELS } from '@/lib/labels'
import { toUserMessage } from '@/lib/errors'

export const Route = createFileRoute('/_app/profil')({
  component: ProfilPage,
})

function ProfilPage() {
  const { profile } = Route.useRouteContext()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const changePasswordMutation = useChangePasswordMutation()
  const logoutMutation = useLogoutMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onChangePassword = async (data: ChangePasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({ newPassword: data.newPassword })
      toast.success('Password berhasil diperbarui!')
      reset()
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const onLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      void navigate({ to: '/login' })
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Pengguna</h1>
        <p className="text-muted-foreground">Informasi identitas akun dan pengaturan keamanan.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Kartu Data Diri (Read-only) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Data Diri</CardTitle>
                <CardDescription>Informasi identitas terdaftar di perpustakaan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Nomor Induk (NIS/NIP)</span>
              <span className="font-semibold">{profile.member_code}</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Nama Lengkap</span>
              <span className="font-semibold">{profile.full_name}</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Peran</span>
              <Badge variant="outline">{ROLE_LABELS[profile.role]}</Badge>
            </div>

            {profile.role === 'student' && profile.class_name && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Kelas</span>
                <span className="font-semibold">{profile.class_name}</span>
              </div>
            )}

            {profile.role === 'teacher' && profile.subject && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Mata Pelajaran</span>
                <span className="font-semibold">{profile.subject}</span>
              </div>
            )}

            {profile.role === 'librarian' && profile.position && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Jabatan</span>
                <span className="font-semibold">{profile.position}</span>
              </div>
            )}

            {profile.phone && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Nomor Telepon</span>
                <span className="font-semibold">{profile.phone}</span>
              </div>
            )}

            <div className="flex justify-between pb-1">
              <span className="text-muted-foreground">Status Akun</span>
              <Badge variant={profile.is_active ? 'default' : 'destructive'}>
                {profile.is_active ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                void onLogout()
              }}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 size-4" />
              Keluar dari Sesi (Logout)
            </Button>
          </CardFooter>
        </Card>

        {/* Kartu Ganti Password Mandiri */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Ganti Password</CardTitle>
                <CardDescription>Perbarui password akun Anda secara mandiri</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                void handleSubmit(onChangePassword)(e)
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="profileNewPassword">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="profileNewPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 8 karakter"
                    disabled={changePasswordMutation.isPending}
                    className="pr-10"
                    {...register('newPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm font-medium text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileConfirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="profileConfirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ulangi password baru"
                  disabled={changePasswordMutation.isPending}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm font-medium text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Perbarui Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
