import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { loginSchema, type LoginFormData } from '@/features/auth/schemas'
import { useLoginMutation } from '@/features/auth/api/mutations'
import { toUserMessage } from '@/lib/errors'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const loginMutation = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      memberCode: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await loginMutation.mutateAsync(data)
      toast.success(`Selamat datang, ${result.profile.full_name}!`)

      if (result.profile.must_change_password) {
        void navigate({ to: '/ganti-password' })
      } else {
        void navigate({ to: '/beranda' })
      }
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            <h1>SIP SMKN 1 Selayar</h1>
          </CardTitle>
          <CardDescription>
            Sistem Informasi Perpustakaan SMKN 1 Selayar. Masuk dengan Nomor Induk (NIS / NIP).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="memberCode">NIS / NIP</Label>
              <Input
                id="memberCode"
                type="text"
                inputMode="text"
                autoComplete="username"
                placeholder="Contoh: 21100456 atau 198203..."
                disabled={loginMutation.isPending}
                {...register('memberCode')}
              />
              {errors.memberCode && (
                <p className="text-sm font-medium text-destructive">{errors.memberCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  disabled={loginMutation.isPending}
                  className="pr-10"
                  {...register('password')}
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
              {errors.password && (
                <p className="text-sm font-medium text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
          <p>Lupa password? Hubungi pustakawan perpustakaan.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
