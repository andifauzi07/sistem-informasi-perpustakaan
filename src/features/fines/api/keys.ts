import type { LibrarianFineFilter } from '../schemas'

export const fineKeys = {
  all: ['fines'] as const,
  member: (memberId: string) => ['fines', 'member', memberId] as const,
  librarianList: (filters: LibrarianFineFilter) =>
    ['fines', 'librarian', filters] as const,
}
