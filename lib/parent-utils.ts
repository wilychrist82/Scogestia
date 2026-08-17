import { SupabaseClient } from '@supabase/supabase-js'

export async function resolveStudentId(
  supabase: SupabaseClient, 
  userId: string, 
  searchParams: { [key: string]: string | string[] | undefined }
) {
  const student_id_param = searchParams.student_id as string | undefined

  // Récupérer les enfants de ce parent
  // La RLS parent_student_ids() filtrera automatiquement si on requêtait students directement
  // Mais ici on passe par parent_student_links.
  const { data: links } = await supabase
    .from('parent_student_links')
    .select(`
      student_id,
      student:students(id, first_name, last_name, class_id)
    `)
    .eq('parent_id', userId)

  if (!links || links.length === 0) {
    return { childrenList: [], selectedChild: null, selectedChildId: null }
  }

  const childrenList = links.map(l => l.student).filter(Boolean) as any[]
  
  // Déterminer l'enfant sélectionné
  let selectedChildId = student_id_param
  if (!selectedChildId || !childrenList.some(c => c.id === selectedChildId)) {
    selectedChildId = childrenList[0].id
  }
  
  const selectedChild = childrenList.find(c => c.id === selectedChildId)

  return { childrenList, selectedChild, selectedChildId }
}
