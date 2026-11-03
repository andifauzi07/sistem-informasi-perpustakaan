import { User, Calendar, Phone, Key, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/format'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  majors?: { id: number; name: string; code: string } | null
}

interface MemberDetailDialogProps {
  member: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (member: Profile) => void
  onResetPassword: (member: Profile) => void
  onToggleActive: (member: Profile) => void
}

export function MemberDetailDialog({
  member,
  open,
  onOpenChange,
  onEdit,
  onResetPassword,
  onToggleActive,
}: MemberDetailDialogProps) {
  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{member.full_name}</DialogTitle>
              <DialogDescription className="font-mono">{member.member_code}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3">
            <div>
              <span className="text-xs text-muted-foreground">Peran Anggota</span>
              <div className="mt-0.5">
                <Badge variant={member.role === 'librarian' ? 'default' : 'secondary'}>
                  {ROLE_LABELS[member.role]}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">Status Akun</span>
              <div className="mt-0.5 flex items-center gap-1.5">
                {member.is_active ? (
                  <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="size-3" />
                    <span>Aktif</span>
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="size-3" />
                    <span>Nonaktif</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {member.role === 'student' && (
              <>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Kelas</span>
                  <span className="font-medium">{member.class_name || '—'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Jurusan</span>
                  <span className="font-medium">
                    {member.majors ? `${member.majors.code} - ${member.majors.name}` : '—'}
                  </span>
                </div>
              </>
            )}

            {member.role === 'teacher' && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Mata Pelajaran</span>
                <span className="font-medium">{member.subject || '—'}</span>
              </div>
            )}

            {member.role === 'librarian' && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Jabatan</span>
                <span className="font-medium">{member.position || '—'}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="size-3.5" /> Kontak Telepon
              </span>
              <span className="font-medium">{member.phone || 'Belum diisi'}</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5" /> Terdaftar Sejak
              </span>
              <span className="font-medium">{formatDate(member.created_at)}</span>
            </div>

            <div className="flex items-center justify-between pb-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Key className="size-3.5" /> Status Password
              </span>
              <span className="text-xs">
                {member.must_change_password ? (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Wajib Ganti Password
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Password Mandiri Aktif</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onEdit(member)
              }}
            >
              Ubah Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onResetPassword(member)
              }}
            >
              Reset Password
            </Button>
          </div>

          <Button
            variant={member.is_active ? 'destructive' : 'default'}
            size="sm"
            onClick={() => {
              onOpenChange(false)
              onToggleActive(member)
            }}
          >
            {member.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
