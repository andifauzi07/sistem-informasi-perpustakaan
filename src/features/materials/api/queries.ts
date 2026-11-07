import { queryOptions } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { materialKeys } from './keys'
import type { MaterialsFilter } from '../schemas'

const PAGE_SIZE = 20

export interface TeachingMaterialItem {
  id: number
  teacher_id: string
  title: string
  description: string | null
  subject: string
  major_id: number | null
  grade_level: number | null
  file_path: string
  file_name: string
  mime_type: string
  file_size: number
  status: 'published' | 'hidden'
  hidden_reason: string | null
  hidden_by: string | null
  download_count: number
  created_at: string
  updated_at: string
  teacher?: {
    id: string
    full_name: string
    member_code: string
  } | null
  major?: {
    id: number
    code: string
    name: string
  } | null
}

// Penelusuran Bahan Ajar (FR-MAT-03)
export function materialsListQueryOptions(filters: MaterialsFilter) {
  return queryOptions({
    queryKey: materialKeys.list(filters),
    queryFn: async () => {
      const page = Math.max(1, filters.page)
      const offset = (page - 1) * PAGE_SIZE

      let query = supabase
        .from('teaching_materials')
        .select(
          `
          id,
          teacher_id,
          title,
          description,
          subject,
          major_id,
          grade_level,
          file_path,
          file_name,
          mime_type,
          file_size,
          status,
          hidden_reason,
          hidden_by,
          download_count,
          created_at,
          updated_at,
          teacher:profiles!teaching_materials_teacher_id_fkey(id, full_name, member_code),
          major:majors(id, code, name)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })

      if (filters.q?.trim()) {
        const term = `%${filters.q.trim()}%`
        query = query.or(`title.ilike.${term},subject.ilike.${term}`)
      }

      if (filters.subject?.trim()) {
        query = query.ilike('subject', `%${filters.subject.trim()}%`)
      }

      if (filters.majorId) {
        query = query.eq('major_id', filters.majorId)
      }

      if (filters.gradeLevel) {
        query = query.eq('grade_level', filters.gradeLevel)
      }

      const res = await query.range(offset, offset + PAGE_SIZE - 1)
      const data = unwrap(res) as unknown as TeachingMaterialItem[]
      const count = res.count ?? 0
      const totalPages = Math.ceil(count / PAGE_SIZE)

      return {
        data,
        count,
        page,
        totalPages,
      }
    },
    staleTime: 30_000,
  })
}

// Bahan Ajar Milik Guru yang Login (FR-MAT-02)
export function myMaterialsQueryOptions() {
  return queryOptions({
    queryKey: materialKeys.mine(),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []

      const res = await supabase
        .from('teaching_materials')
        .select(
          `
          id,
          teacher_id,
          title,
          description,
          subject,
          major_id,
          grade_level,
          file_path,
          file_name,
          mime_type,
          file_size,
          status,
          hidden_reason,
          hidden_by,
          download_count,
          created_at,
          updated_at,
          major:majors(id, code, name)
        `
        )
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      return unwrap(res) as unknown as TeachingMaterialItem[]
    },
    staleTime: 30_000,
  })
}

// Detail Bahan Ajar
export function materialDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: materialKeys.detail(id),
    queryFn: async () => {
      const res = await supabase
        .from('teaching_materials')
        .select(
          `
          id,
          teacher_id,
          title,
          description,
          subject,
          major_id,
          grade_level,
          file_path,
          file_name,
          mime_type,
          file_size,
          status,
          hidden_reason,
          hidden_by,
          download_count,
          created_at,
          updated_at,
          teacher:profiles!teaching_materials_teacher_id_fkey(id, full_name, member_code),
          major:majors(id, code, name)
        `
        )
        .eq('id', id)
        .single()

      return unwrap(res) as unknown as TeachingMaterialItem
    },
    staleTime: 30_000,
  })
}
