import type { CatalogFilter } from '../schemas'

export const catalogKeys = {
  all: ['catalog'] as const,
  search: (filters: CatalogFilter) => ['catalog', 'search', filters] as const,
  detail: (id: number) => ['catalog', 'detail', id] as const,
}
