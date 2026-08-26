import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createChariowCheckout, resolveChariowPhone } from '@/lib/chariow/api'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: roleData } = await supabase
      .from('user_school_roles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!roleData || !['admin', 'comptable'].includes(roleData.role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await req.json()
    const { product_id, phone, phoneCountry, plan_name, amount } = body

    if (!product_id || !phone) {
      return NextResponse.json({ error: 'Produit et téléphone requis' }, { status: 400 })
    }

    // Résoudre le format de numéro attendu par Chariow
    const resolvedPhone = resolveChariowPhone(phone, phoneCountry)

    // Créer la vente chez Chariow
    const chariowRes = await createChariowCheckout({
      product_id,
      email: user.email || 'contact@ecole.com',
      first_name: 'Admin', // Chariow exige un prenom et nom
      last_name: 'Ecole',
      phone: resolvedPhone,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/abonnement/success?sale_id={sale_id}`,
      custom_metadata: {
        school_id: roleData.school_id
      }
    })

    // Enregistrer le paiement en 'pending' dans notre base
    await supabase.from('saas_payments').insert({
      school_id: roleData.school_id,
      provider_sale_id: chariowRes.purchase.id,
      amount: chariowRes.purchase.amount.value,
      currency: chariowRes.purchase.amount.currency,
      status: 'pending',
      plan_name: plan_name
    })

    return NextResponse.json({ checkout_url: chariowRes.payment.checkout_url })

  } catch (error: any) {
    console.error('Checkout Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
