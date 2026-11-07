import { useState, useTransition, useEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  materialsListQueryOptions,
  type TeachingMaterialItem,
} from '@/features/materials/api/queries'
import { majorsQueryOptions } from '@/features/members/api/queries'
import {
  useDownloadMaterialMutation,
  useSetMaterialVisibilityMutation,
} from '@/features/materials/api/mutations'
import {
  materialsFilterSchema,
  type MaterialsFilter,
} from '@/features/materials/schemas'
import { HideMaterialDialog } from '@/features/materials/components/hide-material-dialog'

export const Route = createFileRoute('/_app/bahan-ajar/')({
  validateSearch: (search: Record<string, unknown>): MaterialsFilter =>
    materialsFilterSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(materialsListQueryOptions(deps)),
      context.queryClient.ensureQueryData(majorsQueryOptions()),
    ])
  },
  component: BahanAjarPage,
})

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(fileName: string, mimeType: string) {
  const lower = (fileName + ' ' + mimeType).toLowerCase()
  if (lower.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
  if (lower.includes('sheet') || lower.includes('xls'))
    return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
  if (lower.includes('presentation') || lower.includes('ppt'))
    return <Presentation className="h-5 w-5 text-amber-500" />
  return <File className="h-5 w-5 text-blue-500" />
}

function BahanAjarPage() {
  const search = Route.useSearch()
  const { profile } = Route.useRouteContext()
  const navigate = useNavigate({ from: Route.fullPath })
  const [, startTransition] = useTransition()

  const { data: listResult } = useSuspenseQuery(materialsListQueryOptions(search))
  const { data: majors } = useSuspenseQuery(majorsQueryOptions())

  const downloadMutation = useDownloadMaterialMutation()
  const setVisibilityMutation = useSetMaterialVisibilityMutation()

  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [hideTarget, setHideTarget] = useState<TeachingMaterialItem | null>(null)

  // Local state debounce search
  const [queryInput, setQueryInput] = useState(search.q)

  useEffect(() => {
    const handler = setTimeout(() => {
      if (queryInput !== search.q) {
        startTransition(() => {
          void navigate({
            search: (prev) => ({
              ...prev,
              q: queryInput,
              page: 1,
            }),
          })
        })
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [queryInput, search.q, navigate])

  const handleDownload = async (item: TeachingMaterialItem) => {
    try {
      setDownloadingId(item.id)
      await downloadMutation.mutateAsync({
        id: item.id,
        filePath: item.file_path,
        fileName: item.file_name,
      })
      toast.success(`Mengunduh ${item.file_name}`)
    } catch (err) {
      toast.error('Gagal mengunduh bahan ajar: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setDownloadingId(null)
    }
  }

  const handleUnhide = async (item: TeachingMaterialItem) => {
    try {
      await setVisibilityMutation.mutateAsync({
        id: item.id,
        visible: true,
      })
      toast.success(`Bahan ajar "${item.title}" kini kembali ditampilkan.`)
    } catch (err) {
      toast.error('Gagal menampilkan bahan ajar: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const isTeacher = profile?.role === 'teacher'
  const isLibrarian = profile?.role === 'librarian'

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bahan Ajar & Materi Pembelajaran
          </h1>
          <p className="text-sm text-muted-foreground">
            Akses dan unduh materi digital yang diunggah oleh guru mata pelajaran SMKN 1 Selayar (FR-MAT-03).
          </p>
        </div>

        {isTeacher && (
          <Button asChild className="gap-2 shrink-0">
            <Link to="/guru/bahan-ajar">
              <Plus className="h-4 w-4" />
              Kelola Bahan Ajar Saya
            </Link>
          </Button>
        )}
      </div>

      {/* Filter & Pencarian */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Input Pencarian */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul materi atau mata pelajaran..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Tingkat Kelas */}
            <Select
              value={search.gradeLevel ? String(search.gradeLevel) : 'all'}
              onValueChange={(val) => {
                startTransition(() => {
                  void navigate({
                    search: (prev) => ({
                      ...prev,
                      gradeLevel: val === 'all' ? undefined : Number(val),
                      page: 1,
                    }),
                  })
                })
              }}
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

            {/* Filter Jurusan */}
            <Select
              value={search.majorId ? String(search.majorId) : 'all'}
              onValueChange={(val) => {
                startTransition(() => {
                  void navigate({
                    search: (prev) => ({
                      ...prev,
                      majorId: val === 'all' ? undefined : Number(val),
                      page: 1,
                    }),
                  })
                })
              }}
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
        </CardContent>
      </Card>

      {/* Daftar Bahan Ajar */}
      {listResult.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              Tidak ada bahan ajar yang ditemukan
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Coba sesuaikan kata kunci pencarian atau bersihkan filter tingkat dan jurusan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listResult.data.map((item) => {
            const isHidden = item.status === 'hidden'
            const isDownloading = downloadingId === item.id

            return (
              <Card
                key={item.id}
                className={`flex flex-col justify-between transition hover:shadow-sm ${
                  isHidden ? 'border-amber-300 bg-amber-50/20' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getFileIcon(item.file_name, item.mime_type)}
                      <span className="text-xs font-mono font-semibold uppercase text-muted-foreground">
                        {item.file_name.split('.').pop() || 'FILE'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      {item.grade_level ? (
                        <Badge variant="outline" className="text-[10px]">
                          Kelas {item.grade_level}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Semua Kelas
                        </Badge>
                      )}
                      {item.major ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {item.major.code}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Semua Jurusan
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardTitle className="text-base font-bold text-slate-900 leading-snug pt-1">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-sky-700">
                    {item.subject} &bull; {item.teacher?.full_name || 'Guru'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {item.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Keterangan Ukuran & Download Count */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                    <span>{formatBytes(item.file_size)}</span>
                    <span>{item.download_count}× diunduh</span>
                  </div>

                  {/* Status Hidden untuk Pustakawan */}
                  {isHidden && (
                    <div className="rounded-md bg-amber-100 p-2 text-xs text-amber-900 space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <EyeOff className="h-3.5 w-3.5" />
                        Disembunyikan oleh Pustakawan
                      </div>
                      {item.hidden_reason && (
                        <p className="text-[11px] italic">Alasan: {item.hidden_reason}</p>
                      )}
                    </div>
                  )}

                  {/* Tombol Aksi */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      onClick={() => {
                        void handleDownload(item)
                      }}
                      disabled={isDownloading || isHidden}
                      className="flex-1 gap-2 text-xs"
                      size="sm"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Unduh Berkas
                    </Button>

                    {/* Aksi Moderasi Pustakawan (FR-MAT-04) */}
                    {isLibrarian && (
                      <>
                        {isHidden ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              void handleUnhide(item)
                            }}
                            className="gap-1.5 text-xs text-emerald-700 hover:text-emerald-800"
                            title="Tampilkan kembali"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Tampilkan
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHideTarget(item)}
                            className="gap-1.5 text-xs text-amber-700 hover:text-amber-800"
                            title="Sembunyikan materi"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            Sembunyikan
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginasi */}
      {listResult.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Halaman {listResult.page} dari {listResult.totalPages} (Total {listResult.count} materi)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={listResult.page <= 1}
              onClick={() => {
                startTransition(() => {
                  void navigate({
                    search: (prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }),
                  })
                })
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={listResult.page >= listResult.totalPages}
              onClick={() => {
                startTransition(() => {
                  void navigate({
                    search: (prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }),
                  })
                })
              }}
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Sembunyikan Bahan Ajar */}
      <HideMaterialDialog
        material={hideTarget}
        open={Boolean(hideTarget)}
        onOpenChange={(open) => !open && setHideTarget(null)}
      />
    </div>
  )
}
