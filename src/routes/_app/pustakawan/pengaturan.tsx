import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Settings,
  ShieldCheck,
  Building,
  GraduationCap,
  Upload,
  Plus,
  Save,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  librarySettingsQueryOptions,
  loanPoliciesQueryOptions,
  majorsQueryOptions,
} from '@/features/settings/api/queries'
import {
  useUpdateLibraryProfile,
  useUploadLibraryLogo,
  useUpdateLoanPolicy,
  useCreateMajor,
  useUpdateMajor,
} from '@/features/settings/api/mutations'
import {
  libraryProfileSchema,
  loanPolicySchema,
  majorFormSchema,
  validateLogoFile,
  type LibraryProfileFormValues,
  type LoanPolicyFormValues,
  type MajorFormValues,
} from '@/features/settings/schemas'
import { toUserMessage } from '@/lib/errors'

export const Route = createFileRoute('/_app/pustakawan/pengaturan')({
  loader: ({ context }) => {
    return Promise.all([
      context.queryClient.ensureQueryData(librarySettingsQueryOptions()),
      context.queryClient.ensureQueryData(loanPoliciesQueryOptions()),
      context.queryClient.ensureQueryData(majorsQueryOptions()),
    ])
  },
  component: PengaturanPage,
})

function PengaturanPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'policies' | 'majors'>('policies')

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header Halaman */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola kebijakan peminjaman, identitas resmi perpustakaan, dan data master jurusan (FR-SET-01 s.d. FR-SET-03)
        </p>
      </div>

      {/* Navigasi Tab Pengaturan */}
      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'policies'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <ShieldCheck className="size-4" />
          <span>Kebijakan Peminjaman</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'profile'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Building className="size-4" />
          <span>Profil Perpustakaan & Logo</span>
        </button>

        <button
          onClick={() => setActiveTab('majors')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'majors'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <GraduationCap className="size-4" />
          <span>Master Jurusan</span>
        </button>
      </div>

      {/* Konten Tab */}
      {activeTab === 'policies' && <PoliciesSettingsSection />}
      {activeTab === 'profile' && <ProfileSettingsSection />}
      {activeTab === 'majors' && <MajorsSettingsSection />}
    </div>
  )
}

// 1. Bagian Kebijakan Peminjaman (FR-SET-01, TC-SET-01)
function PoliciesSettingsSection() {
  const { data: rawPolicies = [] } = useQuery(loanPoliciesQueryOptions())
  const updatePolicy = useUpdateLoanPolicy()

  const policies = rawPolicies ?? []
  const studentPolicy = policies.find((p) => p.role === 'student')
  const teacherPolicy = policies.find((p) => p.role === 'teacher')

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-500/30 bg-blue-50/40 p-4 text-xs text-blue-950 dark:bg-blue-950/20 dark:text-blue-200">
        <p className="font-semibold flex items-center gap-1.5">
          <AlertTriangle className="size-4 text-blue-600 dark:text-blue-400" />
          Aturan Bisnis Kebijakan (BR-07)
        </p>
        <p className="mt-1 text-muted-foreground">
          Perubahan kuota pinjam, lama pinjam, atau tarif denda harian tidak berlaku surut. Pinjaman yang saat ini sedang aktif tetap menggunakan tarif snapshot saat transaksi dimulai.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Kebijakan Siswa */}
        {studentPolicy && (
          <PolicyFormCard
            key="student"
            title="Kebijakan Siswa"
            role="student"
            initialData={{
              role: 'student',
              max_active_loans: studentPolicy.max_active_loans,
              loan_days: studentPolicy.loan_days,
              daily_fine: studentPolicy.daily_fine,
              pickup_days: studentPolicy.pickup_days,
            }}
            isPending={updatePolicy.isPending}
            onSubmit={async (values) => {
              try {
                await updatePolicy.mutateAsync(values)
                toast.success('Kebijakan peminjaman siswa berhasil diperbarui')
              } catch (err) {
                toast.error(toUserMessage(err))
              }
            }}
          />
        )}

        {/* Kebijakan Guru */}
        {teacherPolicy && (
          <PolicyFormCard
            key="teacher"
            title="Kebijakan Guru"
            role="teacher"
            initialData={{
              role: 'teacher',
              max_active_loans: teacherPolicy.max_active_loans,
              loan_days: teacherPolicy.loan_days,
              daily_fine: teacherPolicy.daily_fine,
              pickup_days: teacherPolicy.pickup_days,
            }}
            isPending={updatePolicy.isPending}
            onSubmit={async (values) => {
              try {
                await updatePolicy.mutateAsync(values)
                toast.success('Kebijakan peminjaman guru berhasil diperbarui')
              } catch (err) {
                toast.error(toUserMessage(err))
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

function PolicyFormCard({
  title,
  role,
  initialData,
  onSubmit,
  isPending,
}: {
  title: string
  role: 'student' | 'teacher'
  initialData: LoanPolicyFormValues
  onSubmit: (values: LoanPolicyFormValues) => Promise<void>
  isPending: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanPolicyFormValues>({
    resolver: zodResolver(loanPolicySchema),
    defaultValues: initialData,
  })

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="border-b px-5 py-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">
          Batas sirkulasi buku untuk anggota dengan peran {role === 'student' ? 'siswa' : 'guru'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Maksimal Pinjaman Aktif (Buku)
            </label>
            <Input
              type="number"
              {...register('max_active_loans', { valueAsNumber: true })}
              className="text-xs"
            />
            {errors.max_active_loans && (
              <p className="text-[11px] text-destructive mt-1">{errors.max_active_loans.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Lama Pinjam (Hari Kalender)
            </label>
            <Input
              type="number"
              {...register('loan_days', { valueAsNumber: true })}
              className="text-xs"
            />
            {errors.loan_days && (
              <p className="text-[11px] text-destructive mt-1">{errors.loan_days.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Tarif Denda Keterlambatan per Hari (Rp)
            </label>
            <Input
              type="number"
              step={100}
              {...register('daily_fine', { valueAsNumber: true })}
              className="text-xs"
            />
            {errors.daily_fine && (
              <p className="text-[11px] text-destructive mt-1">{errors.daily_fine.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Batas Ambil Buku Setelah Disetujui (Hari)
            </label>
            <Input
              type="number"
              {...register('pickup_days', { valueAsNumber: true })}
              className="text-xs"
            />
            {errors.pickup_days && (
              <p className="text-[11px] text-destructive mt-1">{errors.pickup_days.message}</p>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" size="sm" disabled={isPending} className="w-full gap-1.5 shadow-xs">
              <Save className="size-4" />
              <span>{isPending ? 'Menyimpan...' : 'Simpan Kebijakan'}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// 2. Bagian Profil Sekolah & Unggah Logo (FR-SET-02, TC-SET-02)
function ProfileSettingsSection() {
  const { data: settings } = useQuery(librarySettingsQueryOptions())
  const updateProfile = useUpdateLibraryProfile()
  const uploadLogo = useUploadLibraryLogo()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LibraryProfileFormValues>({
    resolver: zodResolver(libraryProfileSchema),
    values: {
      school_name: settings?.school_name ?? 'SMKN 1 Selayar',
      library_name: settings?.library_name ?? 'Perpustakaan SMKN 1 Selayar',
      address: settings?.address ?? 'Jl. Pahlawan No. 1, Benteng, Kepulauan Selayar',
      logo_path: settings?.logo_path ?? null,
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateLogoFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setSelectedFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleUploadLogo = async () => {
    if (!selectedFile) return
    try {
      await uploadLogo.mutateAsync(selectedFile)
      toast.success('Logo perpustakaan berhasil diunggah')
      setSelectedFile(null)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const onSubmit = async (values: LibraryProfileFormValues) => {
    try {
      await updateProfile.mutateAsync(values)
      toast.success('Profil perpustakaan berhasil diperbarui')
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Form Identitas */}
      <Card className="border-border/80 shadow-xs md:col-span-2">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="text-base font-semibold">Identitas Sekolah & Perpustakaan</CardTitle>
          <CardDescription className="text-xs">
            Data ini otomatis dicetak pada kop dokumen resmi laporan dan kartu anggota perpustakaan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Nama Sekolah Resmi
              </label>
              <Input {...register('school_name')} className="text-xs" />
              {errors.school_name && (
                <p className="text-[11px] text-destructive mt-1">{errors.school_name.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Nama Perpustakaan
              </label>
              <Input {...register('library_name')} className="text-xs" />
              {errors.library_name && (
                <p className="text-[11px] text-destructive mt-1">{errors.library_name.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Alamat Sekolah / Perpustakaan
              </label>
              <Input {...register('address')} className="text-xs" />
              {errors.address && (
                <p className="text-[11px] text-destructive mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={updateProfile.isPending}
                className="gap-1.5 shadow-xs"
              >
                <Save className="size-4" />
                <span>{updateProfile.isPending ? 'Menyimpan...' : 'Simpan Profil'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Pengelolaan Logo */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="text-base font-semibold">Logo Perpustakaan</CardTitle>
          <CardDescription className="text-xs">
            Format WebP, PNG, atau JPG (Maks. 2 MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-center">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 bg-muted/20">
            {logoPreview || settings?.logo_path ? (
              <img
                src={logoPreview || settings?.logo_path || ''}
                alt="Logo Perpustakaan"
                className="max-h-32 object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="size-12 stroke-[1.5]" />
                <span className="text-xs">Belum ada logo terunggah</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <input
              type="file"
              id="logo-upload-input"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('logo-upload-input')?.click()}
              className="w-full text-xs gap-1.5"
            >
              <Upload className="size-3.5" />
              <span>Pilih Berkas Logo</span>
            </Button>

            {selectedFile && (
              <Button
                type="button"
                size="sm"
                onClick={() => { void handleUploadLogo() }}
                disabled={uploadLogo.isPending}
                className="w-full text-xs gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="size-3.5" />
                <span>{uploadLogo.isPending ? 'Mengunggah...' : 'Unggah & Pasang Logo'}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 3. Bagian Master Data Jurusan (FR-SET-03, TC-SET-03)
function MajorsSettingsSection() {
  const { data: rawMajors = [] } = useQuery(majorsQueryOptions())
  const majors = rawMajors ?? []
  const createMajor = useCreateMajor()
  const updateMajor = useUpdateMajor()

  const [dialogOpen, setDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MajorFormValues>({
    resolver: zodResolver(majorFormSchema),
    defaultValues: {
      code: '',
      name: '',
      is_active: true,
    },
  })

  const onSubmit = async (values: MajorFormValues) => {
    try {
      await createMajor.mutateAsync(values)
      toast.success('Jurusan baru berhasil ditambahkan')
      reset()
      setDialogOpen(false)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const toggleMajorActive = async (id: number, currentStatus: boolean) => {
    try {
      await updateMajor.mutateAsync({
        id,
        values: { is_active: !currentStatus },
      })
      toast.success(`Status jurusan berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Daftar Jurusan SMKN 1 Selayar</h2>
          <p className="text-xs text-muted-foreground">
            Jurusan aktif akan muncul pada formulir pendaftaran anggota dan filter koleksi
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            reset()
            setDialogOpen(true)
          }}
          className="gap-1.5 text-xs shadow-xs"
        >
          <Plus className="size-4" />
          <span>Tambah Jurusan</span>
        </Button>
      </div>

      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-4 font-semibold w-24">Kode</th>
                  <th className="py-2.5 px-4 font-semibold">Nama Program Keahlian / Jurusan</th>
                  <th className="py-2.5 px-4 font-semibold w-32 text-center">Status</th>
                  <th className="py-2.5 px-4 font-semibold w-32 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {majors.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold">{m.code}</td>
                    <td className="py-2.5 px-4 font-medium">{m.name}</td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge variant={m.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {m.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { void toggleMajorActive(m.id, m.is_active) }}
                        className="h-7 text-xs px-2.5"
                      >
                        {m.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Tambah Jurusan */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Tambah Jurusan Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold block mb-1">Kode Singkat Jurusan (mis. RPL, TKJ)</label>
              <Input
                {...register('code')}
                placeholder="RPL"
                className="font-mono uppercase text-xs"
              />
              {errors.code && <p className="text-destructive mt-1">{errors.code.message}</p>}
            </div>

            <div>
              <label className="font-semibold block mb-1">Nama Lengkap Program Keahlian</label>
              <Input
                {...register('name')}
                placeholder="Rekayasa Perangkat Lunak"
                className="text-xs"
              />
              {errors.name && <p className="text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={createMajor.isPending}>
                {createMajor.isPending ? 'Menyimpan...' : 'Simpan Jurusan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
