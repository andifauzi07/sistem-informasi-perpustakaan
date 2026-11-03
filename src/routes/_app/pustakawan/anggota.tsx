import { useState, useTransition } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight, User, MoreHorizontal, KeyRound, Edit, Power, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { membersListQueryOptions, majorsQueryOptions } from '@/features/members/api/queries'
import { membersFilterSchema, type MembersFilter } from '@/features/members/schemas'
import { CreateMemberDialog } from '@/features/members/components/CreateMemberDialog'
import { EditMemberDialog } from '@/features/members/components/EditMemberDialog'
import { ResetPasswordDialog } from '@/features/members/components/ResetPasswordDialog'
import { ToggleActiveDialog } from '@/features/members/components/ToggleActiveDialog'
import { MemberDetailDialog } from '@/features/members/components/MemberDetailDialog'
import { ImportMembersDialog } from '@/features/members/components/ImportMembersDialog'
import { ROLE_LABELS } from '@/lib/labels'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  majors?: { id: number; name: string; code: string } | null
}

export const Route = createFileRoute('/_app/pustakawan/anggota')({
  validateSearch: (search) => membersFilterSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(membersListQueryOptions(deps)),
      context.queryClient.ensureQueryData(majorsQueryOptions()),
    ])
  },
  component: AnggotaPage,
})

function AnggotaPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [, startTransition] = useTransition()

  const { data: membersResult } = useSuspenseQuery(membersListQueryOptions(search))
  const { data: majors } = useSuspenseQuery(majorsQueryOptions())

  // State untuk dialog aksi
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [toggleOpen, setToggleOpen] = useState(false)

  // Filter handlers
  const updateFilters = (newFilters: Partial<MembersFilter>) => {
    startTransition(() => {
      void navigate({
        search: (prev) => ({
          ...prev,
          ...newFilters,
          page: newFilters.page ?? 1,
        }),
      })
    })
  }

  const { data: members, count, page, totalPages } = membersResult

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 py-8">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-6 text-primary" />
            <span>Manajemen Anggota Perpustakaan</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola data siswa, guru, dan pustakawan (Total: {count} anggota terdaftar).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ImportMembersDialog majors={majors} />
          <CreateMemberDialog majors={majors} />
        </div>
      </div>

      {/* Bar Pencarian & Filter */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau nomor induk..."
            defaultValue={search.q}
            onChange={(e) => updateFilters({ q: e.target.value, page: 1 })}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <Select
            value={search.role}
            onValueChange={(val: 'all' | 'student' | 'teacher' | 'librarian') => updateFilters({ role: val, page: 1 })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Peran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Peran</SelectItem>
              <SelectItem value="student">Siswa</SelectItem>
              <SelectItem value="teacher">Guru</SelectItem>
              <SelectItem value="librarian">Pustakawan</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={search.status}
            onValueChange={(val: 'all' | 'active' | 'inactive') => updateFilters({ status: val, page: 1 })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabel Data Anggota (Desktop) & Kartu (Mobile) */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <User className="size-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-semibold">Tidak ada data anggota</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Tidak ditemukan data anggota yang cocok dengan filter atau kata kunci pencarian saat ini.
            </p>
          </div>
        ) : (
          <>
            {/* Tampilan Tabel untuk Tablet/Desktop */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Induk</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Kelas / Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-medium text-xs">
                        {member.member_code}
                      </TableCell>
                      <TableCell className="font-semibold">{member.full_name}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'librarian' ? 'default' : 'secondary'}>
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {member.class_name || member.subject || member.position || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.is_active ? 'default' : 'destructive'}
                          className={member.is_active ? 'bg-emerald-600 hover:bg-emerald-700' : undefined}
                        >
                          {member.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Menu Opsi Anggota">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi Anggota</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMember(member)
                                setDetailOpen(true)
                              }}
                            >
                              <User className="mr-2 size-4" />
                              <span>Lihat Detail</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMember(member)
                                setEditOpen(true)
                              }}
                            >
                              <Edit className="mr-2 size-4" />
                              <span>Ubah Data</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMember(member)
                                setResetOpen(true)
                              }}
                            >
                              <KeyRound className="mr-2 size-4" />
                              <span>Reset Password</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={member.is_active ? 'text-destructive' : 'text-emerald-600'}
                              onClick={() => {
                                setSelectedMember(member)
                                setToggleOpen(true)
                              }}
                            >
                              <Power className="mr-2 size-4" />
                              <span>{member.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Tampilan Kartu untuk Mobile (Lebar < 640px) */}
            <div className="divide-y sm:hidden">
              {members.map((member) => (
                <div key={member.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{member.member_code}</span>
                    <Badge
                      variant={member.is_active ? 'default' : 'destructive'}
                      className={member.is_active ? 'bg-emerald-600' : undefined}
                    >
                      {member.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <div className="font-semibold text-base">{member.full_name}</div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline">{ROLE_LABELS[member.role]}</Badge>
                      <span className="text-muted-foreground">
                        {member.class_name || member.subject || member.position}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member)
                        setDetailOpen(true)
                      }}
                    >
                      Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Navigasi Paginasi 20 baris per halaman (FR-MBR-01) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-2 text-sm">
          <span className="text-muted-foreground">
            Halaman <strong className="text-foreground">{page}</strong> dari{' '}
            <strong className="text-foreground">{totalPages}</strong> (20 baris / halaman)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateFilters({ page: page - 1 })}
              className="gap-1"
            >
              <ChevronLeft className="size-4" />
              <span>Sebelumnya</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateFilters({ page: page + 1 })}
              className="gap-1"
            >
              <span>Berikutnya</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals & Dialogs */}
      <MemberDetailDialog
        member={selectedMember}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(m) => {
          setSelectedMember(m)
          setEditOpen(true)
        }}
        onResetPassword={(m) => {
          setSelectedMember(m)
          setResetOpen(true)
        }}
        onToggleActive={(m) => {
          setSelectedMember(m)
          setToggleOpen(true)
        }}
      />

      <EditMemberDialog
        member={selectedMember}
        majors={majors}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ResetPasswordDialog
        member={selectedMember}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />

      <ToggleActiveDialog
        member={selectedMember}
        open={toggleOpen}
        onOpenChange={setToggleOpen}
      />
    </div>
  )
}
