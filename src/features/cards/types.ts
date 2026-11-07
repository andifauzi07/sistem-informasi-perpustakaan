export interface CardMember {
  id: string
  member_code: string
  full_name: string
  role: 'student' | 'teacher' | 'librarian'
  class_name?: string | null
  major_name?: string | null
  subject?: string | null
  position?: string | null
  photo_path?: string | null
}
