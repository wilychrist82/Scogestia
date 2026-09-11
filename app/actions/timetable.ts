'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TimetableSlot = {
  id: string
  school_id: string
  class_id: string
  day_of_week: number // 1=Lun, 5=Ven, 6=Sam
  start_time: string  // "HH:MM"
  end_time: string    // "HH:MM"
  subject_name: string
  teacher_name: string | null
  room: string | null
  color: string
  created_at: string
  updated_at: string
}

export type SlotInput = Omit<TimetableSlot, 'id' | 'school_id' | 'created_at' | 'updated_at'>

type ActionResult = { success: boolean; error?: string; data?: any }

// ── Lire tous les créneaux d'une classe ──────────────────────────────────────
export async function getTimetableSlots(classId: string): Promise<TimetableSlot[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('timetable_slots')
    .select('*')
    .eq('class_id', classId)
    .order('day_of_week')
    .order('start_time')

  if (error) {
    console.error('[getTimetableSlots]', error)
    return []
  }

  return data || []
}

// ── Créer un créneau ─────────────────────────────────────────────────────────
export async function createTimetableSlot(
  classId: string,
  input: Omit<SlotInput, 'class_id'>
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // Récupérer l'école
  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'comptable'])
    .limit(1)
    .maybeSingle()

  if (!roleData?.school_id) {
    return { success: false, error: 'Accès refusé. Seuls les administrateurs peuvent modifier l\'emploi du temps.' }
  }

  // Validation des heures
  if (input.start_time >= input.end_time) {
    return { success: false, error: 'L\'heure de fin doit être après l\'heure de début.' }
  }

  const { data, error } = await supabase
    .from('timetable_slots')
    .insert({
      school_id: roleData.school_id,
      class_id: classId,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      end_time: input.end_time,
      subject_name: input.subject_name.trim(),
      teacher_name: input.teacher_name?.trim() || null,
      room: input.room?.trim() || null,
      color: input.color || '#065F46',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23P01') {
      return { success: false, error: 'Ce créneau chevauche un créneau existant pour cette classe.' }
    }
    return { success: false, error: `Erreur: ${error.message}` }
  }

  revalidatePath('/admin/academique/emplois')
  return { success: true, data }
}

// ── Modifier un créneau ──────────────────────────────────────────────────────
export async function updateTimetableSlot(
  slotId: string,
  updates: Partial<Omit<SlotInput, 'class_id'>>
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  if (updates.start_time && updates.end_time && updates.start_time >= updates.end_time) {
    return { success: false, error: 'L\'heure de fin doit être après l\'heure de début.' }
  }

  const { data, error } = await supabase
    .from('timetable_slots')
    .update({
      ...updates,
      subject_name: updates.subject_name?.trim(),
      teacher_name: updates.teacher_name?.trim() || null,
      room: updates.room?.trim() || null,
    })
    .eq('id', slotId)
    .select()
    .single()

  if (error) {
    if (error.code === '23P01') {
      return { success: false, error: 'Ce créneau chevauche un créneau existant.' }
    }
    return { success: false, error: `Erreur: ${error.message}` }
  }

  revalidatePath('/admin/academique/emplois')
  return { success: true, data }
}

// ── Supprimer un créneau ─────────────────────────────────────────────────────
export async function deleteTimetableSlot(slotId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('timetable_slots')
    .delete()
    .eq('id', slotId)

  if (error) {
    return { success: false, error: `Erreur: ${error.message}` }
  }

  revalidatePath('/admin/academique/emplois')
  return { success: true }
}
