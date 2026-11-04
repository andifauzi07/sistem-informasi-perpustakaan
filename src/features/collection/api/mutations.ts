import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { collectionKeys } from './keys'
import { compressCoverImage } from '../utils'
import type {
  CategoryFormData,
  BookFormData,
  AddCopiesFormData,
  SetCopyStatusFormData,
} from '../schemas'

// --- KATEGORI ---

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const res = await supabase.from('categories').insert({
        name: data.name,
        ddc_code: data.ddcCode || null,
      }).select().single()
      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.categories() })
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryFormData }) => {
      const res = await supabase
        .from('categories')
        .update({
          name: data.name,
          ddc_code: data.ddcCode || null,
        })
        .eq('id', id)
        .select()
        .single()
      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.categories() })
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all })
    },
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await supabase.from('categories').delete().eq('id', id)
      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.categories() })
    },
  })
}

// --- BUKU ---

export function useCreateBookMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: BookFormData) => {
      const res = await supabase.from('books').insert({
        title: data.title,
        authors: data.authors,
        publisher: data.publisher || null,
        publication_year: data.publicationYear ?? null,
        isbn: data.isbn || null,
        category_id: data.categoryId,
        synopsis: data.synopsis || null,
        language: data.language,
        pages: data.pages ?? null,
        edition: data.edition || null,
        call_number: data.callNumber || null,
        cover_path: data.coverPath || null,
      }).select().single()
      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

export function useUpdateBookMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BookFormData }) => {
      const res = await supabase
        .from('books')
        .update({
          title: data.title,
          authors: data.authors,
          publisher: data.publisher || null,
          publication_year: data.publicationYear ?? null,
          isbn: data.isbn || null,
          category_id: data.categoryId,
          synopsis: data.synopsis || null,
          language: data.language,
          pages: data.pages ?? null,
          edition: data.edition || null,
          call_number: data.callNumber || null,
          cover_path: data.coverPath || null,
        })
        .eq('id', id)
        .select()
        .single()
      return unwrap(res)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.bookDetail(variables.id) })
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

export function useDeleteBookMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookId: number) => {
      const res = await supabase.rpc('delete_book', { p_book_id: bookId })
      return unwrap(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

// --- EKSEMPLAR ---

export function useAddCopiesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: AddCopiesFormData) => {
      let manualCodes: string[] | null = null
      if (data.mode === 'manual' && data.codes) {
        manualCodes = data.codes
          .split(/[\n,]+/)
          .map((c) => c.trim())
          .filter(Boolean)
      }

      const res = await supabase.rpc('add_book_copies', {
        p_book_id: data.bookId,
        p_quantity: data.mode === 'auto' ? data.quantity ?? 1 : manualCodes?.length || 1,
        p_codes: manualCodes,
        p_source: data.source || null,
        p_acquired_at: data.acquiredAt || null,
        p_price: data.price ?? null,
      })
      return unwrap(res)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.bookCopies(variables.bookId) })
      void queryClient.invalidateQueries({ queryKey: collectionKeys.bookDetail(variables.bookId) })
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

export function useSetCopyStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ data }: { bookId: number; data: SetCopyStatusFormData }) => {
      const res = await supabase.rpc('set_copy_status', {
        p_copy_id: data.copyId,
        p_status: data.status,
        p_notes: data.notes || null,
      })
      return unwrap(res)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.bookCopies(variables.bookId) })
      void queryClient.invalidateQueries({ queryKey: collectionKeys.bookDetail(variables.bookId) })
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

// --- UPLOAD SAMPUL BUKU (FR-COL-03) ---

export async function uploadBookCover(bookId: number | string, file: File): Promise<string> {
  const { blob } = await compressCoverImage(file)
  const path = `${bookId}/${crypto.randomUUID()}.webp`

  const res = await supabase.storage.from('covers').upload(path, blob, {
    contentType: 'image/webp',
    upsert: true,
  })

  unwrap(res)
  return path
}
