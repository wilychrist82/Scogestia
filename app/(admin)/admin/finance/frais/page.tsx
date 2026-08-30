import { FraisManager } from '@/components/admin/finance/FraisManager'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function FraisPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id

  const { data: feeTypes, error } = await supabase
    .from('fee_types')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  // Server actions for FraisManager
  async function handleAdd(data: { label: string; amount: number; periodicity: string; target: string }) {
    'use server'
    const supabase = await createClient()
    const { error } = await supabase.from('fee_types').insert({
      school_id: schoolId,
      label: data.label,
      amount: data.amount,
      periodicity: data.periodicity,
      target: data.target
    })
    
    if (error) return { error: error.message }
    revalidatePath('/admin/finance/frais')
    return {}
  }

  async function handleDelete(id: string) {
    'use server'
    const supabase = await createClient()
    const { error } = await supabase.from('fee_types').delete().eq('id', id).eq('school_id', schoolId)
    
    if (error) return { error: error.message }
    revalidatePath('/admin/finance/frais')
    return {}
  }

  return (
    <FraisManager 
      feeTypes={feeTypes || []} 
      onAdd={handleAdd}
      onDelete={handleDelete}
    />
  )
}
