// Skema validasi autentikasi Zod (CLAUDE.md §8 & PRD §8.1)
import { z } from 'zod'

export const loginSchema = z.object({
  memberCode: z
    .string()
    .trim()
    .min(3, 'Nomor induk minimal 3 karakter')
    .max(30, 'Nomor induk maksimal 30 karakter'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password minimal 8 karakter (BR-21)'),
    confirmPassword: z.string().min(8, 'Konfirmasi password minimal 8 karakter'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  })

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
