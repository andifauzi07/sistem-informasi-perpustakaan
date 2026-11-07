import { z } from 'zod'

export const MAX_MATERIAL_FILE_SIZE = 10 * 1024 * 1024 // 10 MB (BR-20)

export const ALLOWED_MATERIAL_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const

export const ALLOWED_MATERIAL_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.xlsx'] as const

export function validateMaterialFile(file: { name: string; size: number; type: string }): {
  valid: boolean
  error?: string
} {
  if (file.size > MAX_MATERIAL_FILE_SIZE) {
    return { valid: false, error: 'Ukuran berkas tidak boleh melebihi 10 MB (BR-20)' }
  }

  const lowerName = file.name.toLowerCase()
  const hasValidExt = ALLOWED_MATERIAL_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  const hasValidMime = (ALLOWED_MATERIAL_MIME_TYPES as readonly string[]).includes(file.type)

  // Browser kadang memberikan tipe MIME kosong untuk berkas Office tertentu, sehingga cek ekstensi juga
  if (!hasValidExt && !hasValidMime) {
    return { valid: false, error: 'Format berkas harus berupa PDF, DOCX, PPTX, atau XLSX' }
  }

  return { valid: true }
}

// Skema Form Unggah Bahan Ajar Baru oleh Guru (FR-MAT-01, BR-20)
export const uploadMaterialFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Judul bahan ajar minimal 3 karakter')
    .max(200, 'Judul bahan ajar maksimal 200 karakter'),
  subject: z
    .string()
    .trim()
    .min(1, 'Mata pelajaran wajib diisi')
    .max(100, 'Mata pelajaran maksimal 100 karakter'),
  description: z
    .string()
    .trim()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional()
    .nullable(),
  majorId: z.number().optional().nullable(),
  gradeLevel: z.number().int().min(10).max(12).optional().nullable(),
  file: z
    .custom<File>((val) => typeof File !== 'undefined' && val instanceof File, {
      message: 'Berkas bahan ajar wajib dipilih',
    })
    .refine((file) => file.size <= MAX_MATERIAL_FILE_SIZE, {
      message: 'Ukuran berkas tidak boleh melebihi 10 MB',
    })
    .refine(
      (file) => {
        const check = validateMaterialFile(file)
        return check.valid
      },
      {
        message: 'Format berkas harus berupa PDF, DOCX, PPTX, atau XLSX',
      }
    ),
})

export type UploadMaterialFormData = z.infer<typeof uploadMaterialFormSchema>

// Skema Form Ubah Metadata Bahan Ajar oleh Guru (FR-MAT-02)
export const updateMaterialSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Judul bahan ajar minimal 3 karakter')
    .max(200, 'Judul bahan ajar maksimal 200 karakter'),
  subject: z
    .string()
    .trim()
    .min(1, 'Mata pelajaran wajib diisi')
    .max(100, 'Mata pelajaran maksimal 100 karakter'),
  description: z
    .string()
    .trim()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional()
    .nullable(),
  majorId: z.number().optional().nullable(),
  gradeLevel: z.number().int().min(10).max(12).optional().nullable(),
})

export type UpdateMaterialFormData = z.infer<typeof updateMaterialSchema>

// Skema Moderasi Visibilitas Bahan Ajar oleh Pustakawan (FR-MAT-04)
export const hideMaterialSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Alasan penyembunyian wajib diisi')
    .max(500, 'Alasan maksimal 500 karakter'),
})

export type HideMaterialFormData = z.infer<typeof hideMaterialSchema>

// Skema Parameter Filter Pencarian & Penelusuran Bahan Ajar (FR-MAT-03)
export const materialsFilterSchema = z.object({
  q: z.string().catch('').default(''),
  subject: z.string().catch('').default(''),
  majorId: z.coerce.number().optional().catch(undefined),
  gradeLevel: z.coerce.number().int().min(10).max(12).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1).default(1),
})

export type MaterialsFilter = z.infer<typeof materialsFilterSchema>
