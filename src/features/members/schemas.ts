import { z } from 'zod'

export const memberRoleEnum = z.enum(['student', 'teacher', 'librarian'])

export const createMemberSchema = z
  .object({
    memberCode: z
      .string()
      .trim()
      .min(3, 'Nomor induk minimal 3 karakter')
      .max(30, 'Nomor induk maksimal 30 karakter'),
    fullName: z
      .string()
      .trim()
      .min(2, 'Nama lengkap minimal 2 karakter')
      .max(100, 'Nama lengkap maksimal 100 karakter'),
    role: memberRoleEnum,
    className: z.string().trim().optional(),
    majorId: z.number().optional(),
    subject: z.string().trim().optional(),
    position: z.string().trim().optional(),
    phone: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'student') {
        return Boolean(data.className && data.className.length > 0)
      }
      return true
    },
    {
      message: 'Kelas wajib diisi untuk siswa',
      path: ['className'],
    }
  )

export type CreateMemberFormData = z.infer<typeof createMemberSchema>

export const updateMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  className: z.string().trim().optional(),
  majorId: z.number().optional(),
  subject: z.string().trim().optional(),
  position: z.string().trim().optional(),
  phone: z.string().trim().optional(),
})

export type UpdateMemberFormData = z.infer<typeof updateMemberSchema>

export const membersFilterSchema = z.object({
  q: z.string().catch('').default(''),
  role: z.enum(['all', 'student', 'teacher', 'librarian']).catch('all').default('all'),
  status: z.enum(['all', 'active', 'inactive']).catch('all').default('all'),
  page: z.coerce.number().catch(1).default(1),
})

export type MembersFilter = z.infer<typeof membersFilterSchema>
