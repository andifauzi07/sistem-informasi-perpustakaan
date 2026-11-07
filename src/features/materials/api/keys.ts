import type { MaterialsFilter } from '../schemas'

export const materialKeys = {
  all: ['materials'] as const,
  lists: () => ['materials', 'list'] as const,
  list: (filters: MaterialsFilter) => ['materials', 'list', filters] as const,
  mine: () => ['materials', 'mine'] as const,
  detail: (id: number) => ['materials', 'detail', id] as const,
}
