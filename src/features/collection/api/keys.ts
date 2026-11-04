import type { CollectionFilter } from '../schemas'

export const collectionKeys = {
  all: ['collection'] as const,
  categories: () => ['categories'] as const,
  books: (filters: CollectionFilter) => ['books', 'list', filters] as const,
  bookDetail: (id: number) => ['books', 'detail', id] as const,
  bookCopies: (bookId: number) => ['books', 'copies', bookId] as const,
}
