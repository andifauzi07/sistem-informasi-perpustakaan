import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  Loader2,
  BookOpen,
  ScanBarcode,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
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
    <div className="grid min-h-screen lg:grid-cols-12 bg-background">
      {/* Panel Identitas Institusi (Kiri pada Desktop) */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between bg-[oklch(0.20_0.045_258)] p-12 text-white relative overflow-hidden">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 size-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-white/15 text-blue-300">
            <BookOpen className="size-6" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-white">
              SMK Negeri 1 Selayar
            </p>
            <p className="text-xs text-slate-300">
              Kepulauan Selayar • Sulawesi Selatan
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-medium text-blue-200 ring-1 ring-white/15">
            <span>Portal Sirkulasi & Katalog Perpustakaan Digital</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight leading-tight sm:text-4xl text-white">
            Layanan Perpustakaan Sekolah yang Cepat, Tertib, dan Transparan.
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Telusuri ketersediaan koleksi buku secara real-time, ajukan peminjaman daring dari
            perangkat Anda, dan pantau masa pinjam beserta riwayat sirkulasi dalam satu sistem
            terpadu.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 space-y-1.5">
              <BookOpen className="size-5 text-blue-300" />
              <p className="text-xs font-semibold text-white">Katalog Real-time</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Cek stok eksemplar tersedia dan nomor panggil rak DDC.
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 space-y-1.5">
              <ScanBarcode className="size-5 text-emerald-300" />
              <p className="text-xs font-semibold text-white">Sirkulasi Barcode</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Peminjaman dan pengembalian cepat dengan pemindai kode.
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 space-y-1.5">
              <Clock className="size-5 text-amber-300" />
              <p className="text-xs font-semibold text-white">Zona Waktu WITA</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Perhitungan tenggat waktu dan kuota akurat otomatis.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <span>© {new Date().getFullYear()} Perpustakaan SMKN 1 Selayar</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Akses Terotentikasi NIS / NIP</span>
          </span>
        </div>
      </div>

      {/* Panel Formulir Login (Kanan) */}
      <div className="flex items-center justify-center p-6 sm:p-10 lg:col-span-5">
        <Card className="w-full max-w-md border-border/80 shadow-md">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <BookOpen className="size-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              <h1>SIP SMKN 1 Selayar</h1>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Sistem Informasi Perpustakaan SMKN 1 Selayar. Masuk menggunakan Nomor Induk (NIS /
              NIP).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                void handleSubmit(onSubmit)(e)
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="memberCode">NIS / NIP</Label>
                <Input
                  id="memberCode"
                  type="text"
                  inputMode="text"
                  autoComplete="username"
                  placeholder="Contoh: 21100456 atau PUSTAKAWAN01"
                  disabled={loginMutation.isPending}
                  className="h-10"
                  {...register('memberCode')}
                />
                {errors.memberCode && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.memberCode.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Masukkan password akun Anda"
                    disabled={loginMutation.isPending}
                    className="h-10 pr-10"
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
                  <p className="text-xs font-medium text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-semibold shadow-xs"
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
          <CardFooter className="flex flex-col space-y-2 border-t bg-muted/30 py-3.5 text-center text-xs text-muted-foreground">
            <p>Lupa password atau belum memiliki akun? Hubungi petugas perpustakaan.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
