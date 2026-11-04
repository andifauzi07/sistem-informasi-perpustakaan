import { z } from 'zod'

// Filter dan Parameter Pencarian Katalog Buku (FR-CAT-01, FR-CAT-02)
export const catalogFilterSchema = z.object({
  q: z.string().catch('').default(''),
  category: z.coerce.number().optional().catch(undefined),
  availableOnly: z
    .preprocess((val) => {
      if (typeof val === 'string') return val === 'true' || val === '1'
      return Boolean(val)
    }, z.boolean())
    .catch(false)
    .default(false),
  sort: z.enum(['relevance', 'title', 'newest']).catch('relevance').default('relevance'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
})

export type CatalogFilter = z.infer<typeof catalogFilterSchema>
