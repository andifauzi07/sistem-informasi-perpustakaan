import { z } from 'zod'

export const copyStatusEnum = z.enum([
  'available',
  'reserved',
  'on_loan',
  'damaged',
  'lost',
  'withdrawn',
])

export const copySourceEnum = z.enum([
  'purchase',
  'donation',
  'government',
  'other',
])

// Kategori Buku (FR-COL-01)
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama kategori wajib diisi')
    .max(100, 'Nama kategori maksimal 100 karakter'),
  ddcCode: z.string().trim().max(20, 'Kode DDC maksimal 20 karakter').optional(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// Buku (FR-COL-02, FR-COL-03)
export const bookFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul buku wajib diisi')
    .max(300, 'Judul buku maksimal 300 karakter'),
  authors: z
    .string()
    .trim()
    .min(1, 'Penulis wajib diisi')
    .max(300, 'Nama penulis maksimal 300 karakter'),
  publisher: z.string().trim().max(100, 'Penerbit maksimal 100 karakter').optional(),
  publicationYear: z.coerce
    .number()
    .int()
    .min(1800, 'Tahun minimal 1800')
    .max(2100, 'Tahun maksimal 2100')
    .optional()
    .nullable(),
  isbn: z
    .string()
    .trim()
    .transform((val) => val.replace(/[^0-9X]/gi, ''))
    .optional(),
  categoryId: z.coerce.number().int().positive('Kategori wajib dipilih'),
  synopsis: z.string().trim().optional(),
  language: z.string().trim().default('Indonesia'),
  pages: z.coerce.number().int().positive('Jumlah halaman harus lebih dari 0').optional().nullable(),
  edition: z.string().trim().max(50, 'Edisi maksimal 50 karakter').optional(),
  callNumber: z.string().trim().max(50, 'Nomor panggil/lokasi rak maksimal 50 karakter').optional(),
  coverPath: z.string().optional().nullable(),
})

export type BookFormData = z.infer<typeof bookFormSchema>

// Eksemplar (FR-COL-04)
export const addCopiesSchema = z
  .object({
    bookId: z.number().int().positive(),
    mode: z.enum(['auto', 'manual']).default('auto'),
    quantity: z.coerce.number().int().min(1, 'Minimal 1 eksemplar').max(100, 'Maksimal 100 eksemplar').default(1),
    codes: z.string().optional(), // teks dipisah koma/baris baru jika manual
    source: copySourceEnum.optional().nullable(),
    acquiredAt: z.string().optional().nullable(),
    price: z.coerce.number().int().min(0, 'Harga tidak boleh negatif').optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.mode === 'manual') {
        const list = (data.codes || '')
          .split(/[\n,]+/)
          .map((c) => c.trim())
          .filter(Boolean)
        return list.length > 0
      }
      return true
    },
    {
      message: 'Kode eksemplar manual wajib diisi minimal 1 kode',
      path: ['codes'],
    }
  )

export type AddCopiesFormData = z.infer<typeof addCopiesSchema>

// Status Eksemplar (FR-COL-05)
export const setCopyStatusSchema = z.object({
  copyId: z.number().int().positive(),
  status: copyStatusEnum,
  notes: z.string().trim().optional(),
})

export type SetCopyStatusFormData = z.infer<typeof setCopyStatusSchema>

// Filter Koleksi Pustakawan
export const collectionFilterSchema = z.object({
  q: z.string().catch('').default(''),
  categoryId: z.coerce.number().optional().catch(undefined),
  page: z.coerce.number().catch(1).default(1),
})

export type CollectionFilter = z.infer<typeof collectionFilterSchema>
