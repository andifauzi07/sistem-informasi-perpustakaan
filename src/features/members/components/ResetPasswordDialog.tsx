import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy, KeyRound, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useResetPasswordMutation } from '../api/mutations'
import { toUserMessage } from '@/lib/errors'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface ResetPasswordDialogProps {
  member: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetPasswordDialog({ member, open, onOpenChange }: ResetPasswordDialogProps) {
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const resetMutation = useResetPasswordMutation()

  if (!member) return null

  const handleReset = async () => {
    try {
      const res = await resetMutation.mutateAsync(member.id)
      setTempPassword(res.temp_password)
      toast.success('Password berhasil direset!')
    } catch (err) {
      toast.error(toUserMessage(err))
    }
  }

  const handleCopy = () => {
    if (!tempPassword) return
    void navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Password sementara disalin ke clipboard')
  }

  const handleClose = () => {
    setTempPassword(null)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => (val ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-w-md">
        {tempPassword ? (
          <div className="space-y-4 py-2">
            <DialogHeader>
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <KeyRound className="size-6" />
              </div>
              <DialogTitle className="text-center text-xl">Password Berhasil Direset!</DialogTitle>
              <DialogDescription className="text-center">
                Salin password sementara baru berikut dan berikan kepada{' '}
                <span className="font-semibold text-foreground">{member.full_name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between rounded-lg border bg-muted p-4">
              <span className="font-mono text-xl font-bold tracking-wider">{tempPassword}</span>
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Password hanya ditampilkan satu kali. Anggota wajib mengganti password saat login berikutnya.
            </p>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Selesai
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <ShieldAlert className="size-6" />
              </div>
              <DialogTitle className="text-center text-lg">Konfirmasi Reset Password</DialogTitle>
              <DialogDescription className="text-center">
                Anda akan mereset password untuk anggota{' '}
                <span className="font-semibold text-foreground">{member.full_name}</span> (
                {member.member_code}).
              </DialogDescription>
            </DialogHeader>

            <p className="text-sm text-muted-foreground text-center">
              Sistem akan menghasilkan password sementara acak 10 karakter baru dan mewajibkan anggota
              mengganti password saat login.
            </p>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} disabled={resetMutation.isPending}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  void handleReset()
                }}
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Mereset...
                  </>
                ) : (
                  'Ya, Reset Password'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
