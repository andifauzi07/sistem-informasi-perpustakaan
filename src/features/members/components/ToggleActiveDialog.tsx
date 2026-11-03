import { toast } from 'sonner'
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSetActiveMutation } from '../api/mutations'
import { toUserMessage } from '@/lib/errors'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface ToggleActiveDialogProps {
  member: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ToggleActiveDialog({ member, open, onOpenChange }: ToggleActiveDialogProps) {
  const setActiveMutation = useSetActiveMutation()

  if (!member) return null

  const isCurrentlyActive = member.is_active
  const targetActiveState = !isCurrentlyActive

  const handleToggle = async () => {
    try {
      await setActiveMutation.mutateAsync({
        userId: member.id,
        active: targetActiveState,
      })
      toast.success(
        targetActiveState
          ? `Akun ${member.full_name} berhasil diaktifkan kembali!`
          : `Akun ${member.full_name} telah dinonaktifkan.`
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div
            className={`mx-auto mb-2 flex size-12 items-center justify-center rounded-full ${
              isCurrentlyActive ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'
            }`}
          >
            {isCurrentlyActive ? <AlertTriangle className="size-6" /> : <CheckCircle className="size-6" />}
          </div>
          <DialogTitle className="text-center text-lg">
            {isCurrentlyActive ? 'Nonaktifkan Akun Anggota?' : 'Aktifkan Kembali Akun Anggota?'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isCurrentlyActive ? (
              <>
                Akun milik <span className="font-semibold text-foreground">{member.full_name}</span> (
                {member.member_code}) akan dinonaktifkan. Sesi login akan diblokir dan tidak dapat
                meminjam buku. Seluruh riwayat transaksi tetap tersimpan utuh di sistem (BR-16).
              </>
            ) : (
              <>
                Akun milik <span className="font-semibold text-foreground">{member.full_name}</span> (
                {member.member_code}) akan diaktifkan kembali sehingga dapat login dan mengakses layanan
                perpustakaan.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={setActiveMutation.isPending}>
            Batal
          </Button>
          <Button
            variant={isCurrentlyActive ? 'destructive' : 'default'}
            onClick={() => {
              void handleToggle()
            }}
            disabled={setActiveMutation.isPending}
          >
            {setActiveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Memproses...
              </>
            ) : isCurrentlyActive ? (
              'Ya, Nonaktifkan'
            ) : (
              'Ya, Aktifkan Kembali'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
