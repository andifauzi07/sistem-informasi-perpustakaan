import type { MembersFilter } from '../schemas'

export const memberKeys = {
  all: ['members'] as const,
  lists: () => [...memberKeys.all, 'list'] as const,
  list: (filters: MembersFilter) => [...memberKeys.lists(), filters] as const,
  detail: (id: string) => [...memberKeys.all, 'detail', id] as const,
  majors: () => ['majors'] as const,
}
