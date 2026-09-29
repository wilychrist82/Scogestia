/**
 * Types centralisés pour Scogestia
 * Élimine les `as any` récurrents dans le codebase
 */

// ── Database row types ──────────────────────────────────────────────────────

export type School = {
  id: string
  name: string
  slug: string
  country: string | null
  city: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  subscription_plan: string
  subscription_status: string
  billing_cycle: string
  max_students: number
  current_academic_year: string | null
  director_name?: string | null
  signature_url?: string | null
  stamp_url?: string | null
  created_at: string
  updated_at: string
}

export type UserSchoolRole = {
  id: string
  user_id: string
  school_id: string
  role: 'super_admin' | 'admin' | 'comptable' | 'enseignant' | 'parent'
  full_name: string
  phone: string | null
  is_active: boolean
  created_at: string
}

export type ClassRow = {
  id: string
  school_id: string
  name: string
  level: string
  academic_year: string
  main_teacher_id: string | null
  capacity: number
  created_at: string
}

export type Student = {
  id: string
  school_id: string
  matricule: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  gender: string | null
  class_id: string | null
  enrollment_date: string | null
  status: string
  photo_url: string | null
  parent_phone?: string | null
  birth_place?: string | null
  blood_group?: string | null
  address?: string | null
  avatar_url?: string | null
  created_at: string
}

export type StudentWithClass = Student & {
  classes: { name: string } | null
}

export type PaymentSchedule = {
  id: string
  school_id: string
  student_id: string
  academic_year: string
  label: string
  amount_due: number
  due_date: string
  status: 'en_attente' | 'paye' | 'partiel' | 'en_retard' | 'annule'
  created_at: string
}

export type Payment = {
  id: string
  school_id: string
  student_id: string
  schedule_id: string | null
  amount: number
  payment_method: string | null
  transaction_reference: string | null
  paid_at: string
  recorded_by: string | null
  receipt_url: string | null
  created_at: string
}

export type PaymentWithStudent = Payment & {
  student: { first_name: string; last_name: string } | null
}

export type Grade = {
  id: string
  school_id: string
  student_id: string
  class_id: string
  subject_name: string
  evaluation_type: 'devoir_mensuel' | 'composition_trimestrielle' | 'devoir_maison'
  term: string
  score: number
  max_score: number
  coefficient: number
  entered_by: string | null
  entered_at: string
  updated_at: string
}

export type AttendanceRecord = {
  id: string
  school_id: string
  student_id: string
  class_id: string
  date: string
  status: 'present' | 'absent' | 'retard' | 'absent_justifie'
  justification: string | null
  recorded_by: string | null
  created_at: string
}

export type Homework = {
  id: string
  school_id: string
  class_id: string
  subject_name: string
  title: string
  description: string | null
  due_date: string
  attachment_url: string | null
  created_by: string | null
  created_at: string
}

export type Communication = {
  id: string
  school_id: string
  sender_id: string
  recipient_type: string
  subject: string
  content: string
  file_url: string | null
  file_type: string | null
  created_at: string
}

export type Announcement = {
  id: string
  school_id: string
  title: string
  content: string
  target_type: 'all' | 'class' | 'level'
  target_class_id: string | null
  target_level: string | null
  is_published: boolean
  published_at: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export type TimetableSlot = {
  id: string
  school_id: string
  class_id: string
  day_of_week: number
  start_time: string
  end_time: string
  subject_name: string
  teacher_name: string | null
  room: string | null
  created_at: string
  updated_at: string
}

// ── Joined / computed types ─────────────────────────────────────────────────

export type RoleWithSchool = UserSchoolRole & {
  schools: School | null
}

export type StudentSearchResult = {
  id: string
  first_name: string
  last_name: string
  matricule: string
  classes: { name: string } | null
}

export type TeacherListItem = {
  id: string
  full_name: string
}

// ── Utility ─────────────────────────────────────────────────────────────────

/** Safely unwrap a Supabase join result that may be an array or single object */
export function unwrapJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}
