import { useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { changePasswordSchema, type ChangePasswordFormData } from '@/features/auth/schemas'
import { useChangePasswordMutation } from '@/features/auth/api/mutations'
import { toUserMessage } from '@/lib/errors'

export const Route = createFileRoute('/_app/ganti-password')({
  component: GantiPasswordPage,
})

function GantiPasswordPage() {
  const router = useRouter()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const changePasswordMutation = useChangePasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({ newPassword: data.newPassword })
      toast.success('Password berhasil diperbarui!')
      await router.invalidate()
      void navigate({ to: '/beranda' })
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <KeyRound className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold">Wajib Ganti Password</CardTitle>
          <CardDescription>
            Untuk alasan keamanan akun, Anda wajib menetapkan password baru sebelum melanjutkan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
            <ShieldAlert className="size-4 shrink-0 mt-0.5" />
            <p>Password baru minimal 8 karakter. Jangan bagikan password kepada siapa pun.</p>
          </div>

          <form
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <div className="relative">
                <Input
                  id="newPassword"
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
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <Input
                id="confirmPassword"
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
                'Simpan Password Baru'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
