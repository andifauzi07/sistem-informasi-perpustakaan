import { useState, useTransition, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import {
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  QrCode,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase, unwrap } from '@/lib/supabase'
import { majorsQueryOptions } from '@/features/members/api/queries'
import { SingleCardDialog } from '@/features/cards/components/single-card-dialog'
import { BatchCardDialog } from '@/features/cards/components/batch-card-dialog'
import type { CardMember } from '@/features/cards/types'

const cardFilterSchema = z.object({
  q: z.string().catch('').default(''),
  role: z.enum(['all', 'student', 'teacher', 'librarian']).catch('all').default('all'),
  className: z.string().catch('').default(''),
  majorId: z.coerce.number().optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1).default(1),
})

type CardFilter = z.infer<typeof cardFilterSchema>

const PAGE_SIZE = 20

export const Route = createFileRoute('/_app/pustakawan/kartu-anggota')({
  validateSearch: (search: Record<string, unknown>): CardFilter =>
    cardFilterSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(majorsQueryOptions())
  },
  component: KartuAnggotaPage,
})

function KartuAnggotaPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [, startTransition] = useTransition()

  const { data: majors = [] } = useQuery(majorsQueryOptions())

  // Query anggota aktif dengan filter
  const { data: membersResult, isLoading } = useQuery({
    queryKey: ['cards', 'members', search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(
          `
          id,
          member_code,
          full_name,
          role,
          class_name,
          subject,
          position,
          photo_path,
          major:majors(id, code, name)
        `,
          { count: 'exact' }
        )
        .eq('is_active', true)
        .order('member_code', { ascending: true })

      if (search.q.trim()) {
        const kw = `%${search.q.trim()}%`
        query = query.or(`full_name.ilike.${kw},member_code.ilike.${kw}`)
      }

      if (search.role !== 'all') {
        query = query.eq('role', search.role)
      }

      if (search.className.trim()) {
        query = query.ilike('class_name', `%${search.className.trim()}%`)
      }

      if (search.majorId) {
        query = query.eq('major_id', search.majorId)
      }

      const from = (search.page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const res = await query.range(from, to)

      const rows = unwrap(res) as Array<{
        id: string
        member_code: string
        full_name: string
        role: 'student' | 'teacher' | 'librarian'
        class_name: string | null
        subject: string | null
        position: string | null
        photo_path: string | null
        major: { id: number; code: string; name: string } | null
      }>

      const items: CardMember[] = rows.map((r) => ({
        id: r.id,
        member_code: r.member_code,
        full_name: r.full_name,
        role: r.role,
        class_name: r.class_name,
        major_name: r.major?.name || null,
        subject: r.subject,
        position: r.position,
        photo_path: r.photo_path,
      }))

      const count = res.count ?? 0
      const totalPages = Math.ceil(count / PAGE_SIZE)

      return {
        items,
        count,
        totalPages,
      }
    },
  })

  const [queryInput, setQueryInput] = useState(search.q)
  const [classInput, setClassInput] = useState(search.className)

  useEffect(() => {
    const handler = setTimeout(() => {
      if (queryInput !== search.q || classInput !== search.className) {
        startTransition(() => {
          void navigate({
            search: (prev) => ({
              ...prev,
              q: queryInput,
              className: classInput,
              page: 1,
            }),
          })
        })
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [queryInput, classInput, search.q, search.className, navigate])

  // State cetak kartu
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [singlePrintMember, setSinglePrintMember] = useState<CardMember | null>(null)
  const [isBatchOpen, setIsBatchOpen] = useState(false)

  const items = membersResult?.items || []

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map((i) => i.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const selectedMembers = items.filter((i) => selectedIds.includes(i.id))

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cetak Kartu Anggota Perpustakaan
          </h1>
          <p className="text-sm text-muted-foreground">
            Cetak kartu fisik standar ID-1 lengkap dengan kode QR untuk identifikasi meja sirkulasi (FR-CARD-01, FR-CARD-02).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              onClick={() => setIsBatchOpen(true)}
              className="gap-2 shrink-0 bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Cetak {selectedIds.length} Kartu Terpilih
            </Button>
          )}
          {selectedIds.length === 0 && items.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedIds(items.map((i) => i.id))
                setIsBatchOpen(true)
              }}
              className="gap-2 shrink-0"
            >
              <Printer className="h-4 w-4" />
              Cetak Halaman Ini ({items.length} Kartu)
            </Button>
          )}
        </div>
      </div>

      {/* Filter Pencarian & Kategori */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Cari Nama / Nomor */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau nomor induk..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Peran */}
            <Select
              value={search.role}
              onValueChange={(val: 'all' | 'student' | 'teacher' | 'librarian') => {
                startTransition(() => {
                  void navigate({
                    search: (prev) => ({
                      ...prev,
                      role: val,
                      page: 1,
                    }),
                  })
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                <SelectItem value="student">Siswa</SelectItem>
                <SelectItem value="teacher">Guru</SelectItem>
                <SelectItem value="librarian">Pustakawan</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Kelas (Siswa) */}
            <Input
              placeholder="Filter kelas (mis. X TKJ 1)..."
              value={classInput}
              onChange={(e) => setClassInput(e.target.value)}
            />

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

      {/* Tabel Anggota */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Daftar Anggota</CardTitle>
            <CardDescription className="text-xs">
              Ditemukan {membersResult?.count ?? 0} anggota aktif.
            </CardDescription>
          </div>

          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="text-xs gap-1.5"
            >
              {selectedIds.length === items.length ? (
                <>
                  <CheckSquare className="h-4 w-4 text-primary" />
                  Batal Pilih Semua
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  Pilih Semua di Halaman
                </>
              )}
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Memuat data anggota...
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Tidak ada data anggota yang sesuai dengan filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">Pilih</TableHead>
                    <TableHead>Nomor Induk</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Kelas / Jurusan / Mapel</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((member) => {
                    const isSelected = selectedIds.includes(member.id)

                    return (
                      <TableRow key={member.id} className={isSelected ? 'bg-blue-50/40' : ''}>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(member.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-slate-800">
                          {member.member_code}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 text-sm">
                          {member.full_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.role === 'student'
                                ? 'outline'
                                : member.role === 'teacher'
                                  ? 'secondary'
                                  : 'default'
                            }
                            className="text-[10px] capitalize"
                          >
                            {member.role === 'student'
                              ? 'Siswa'
                              : member.role === 'teacher'
                                ? 'Guru'
                                : 'Pustakawan'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {member.role === 'student' && (
                            <span>
                              {member.class_name || '-'} {member.major_name ? `(${member.major_name})` : ''}
                            </span>
                          )}
                          {member.role === 'teacher' && <span>Mapel: {member.subject || '-'}</span>}
                          {member.role === 'librarian' && <span>Jabatan: {member.position || '-'}</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSinglePrintMember(member)}
                            className="gap-1.5 text-xs"
                          >
                            <QrCode className="h-3.5 w-3.5 text-primary" />
                            Cetak Kartu
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginasi */}
      {membersResult && membersResult.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Halaman {search.page} dari {membersResult.totalPages} (Total {membersResult.count} anggota)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={search.page <= 1}
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
              disabled={search.page >= membersResult.totalPages}
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

      {/* Dialog Cetak Kartu Tunggal */}
      <SingleCardDialog
        member={singlePrintMember}
        open={Boolean(singlePrintMember)}
        onOpenChange={(open) => !open && setSinglePrintMember(null)}
      />

      {/* Dialog Cetak Kartu Massal */}
      <BatchCardDialog
        members={selectedMembers.length > 0 ? selectedMembers : items}
        filterTitle={search.className ? `Kelas ${search.className}` : undefined}
        open={isBatchOpen}
        onOpenChange={setIsBatchOpen}
      />
    </div>
  )
}
