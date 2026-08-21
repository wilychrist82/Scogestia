import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function ParentMessagesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  if (!roleData) redirect('/')

  const schoolId = roleData.school_id

  // Get parent's children's classes to filter class messages
  const { data: links } = await supabase
    .from('parent_student_links')
    .select(`
      student_id,
      students!inner(class_id)
    `)
    .eq('parent_user_id', user.id)
    .eq('school_id', schoolId)

  const classIds = links?.map(l => (l.students as any).class_id).filter(Boolean) || []

  // Build the OR query for RLS or just direct query. RLS is already handling it, but let's be explicit.
  // Actually, since RLS is enabled, we can just query all communications for this school, and RLS will filter out what the parent shouldn't see!
  const { data: messages } = await supabase
    .from('communications')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Messages</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Consultez les communications de l'école.</p>
          </div>
        </div>

        <div className="space-y-4">
          {!messages || messages.length === 0 ? (
            <div className="bg-[var(--color-surface-container-lowest)] p-12 rounded-xl border border-[var(--color-outline-variant)] text-center">
              <span className="material-symbols-outlined text-5xl text-[var(--color-on-surface-variant)] mb-4 opacity-50">drafts</span>
              <h3 className="text-xl font-bold text-[var(--color-on-surface)]">Aucun message</h3>
              <p className="text-[var(--color-on-surface-variant)] mt-2">Vous n'avez reçu aucun message pour le moment.</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-lg font-bold text-[var(--color-on-surface)]">{msg.subject}</h3>
                  <span className="text-xs font-semibold text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] px-3 py-1 rounded-full whitespace-nowrap">
                    {format(new Date(msg.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </span>
                </div>
                <div className="text-[var(--color-on-surface-variant)] whitespace-pre-wrap text-base">
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
