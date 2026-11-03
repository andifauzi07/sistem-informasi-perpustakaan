import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS } from '@/lib/labels'
import { Users, Key, User } from 'lucide-react'

export const Route = createFileRoute('/_app/beranda')({
  component: BerandaPage,
})

function BerandaPage() {
  const { profile } = Route.useRouteContext()
  const isLibrarian = profile.role === 'librarian'

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Selamat Datang, {profile.full_name}</h1>
        <p className="text-muted-foreground">
          Sistem Informasi Perpustakaan SMKN 1 Selayar • Peran:{' '}
          <span className="font-semibold text-foreground">{ROLE_LABELS[profile.role]}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition hover:shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Profil Saya</CardTitle>
                <CardDescription>Lihat data diri dan akun</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link to="/profil">
              <Button variant="outline" className="w-full">
                Buka Profil
              </Button>
            </Link>
          </CardContent>
        </Card>

        {isLibrarian && (
          <Card className="transition hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Kelola Anggota</CardTitle>
                  <CardDescription>Manajemen data siswa & guru</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link to="/pustakawan/anggota" search={{ q: '', role: 'all', status: 'all', page: 1 }}>
                <Button className="w-full">
                  Daftar Anggota
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="transition hover:shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Key className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Keamanan</CardTitle>
                <CardDescription>Ganti password mandiri</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link to="/profil">
              <Button variant="outline" className="w-full">
                Ganti Password
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
