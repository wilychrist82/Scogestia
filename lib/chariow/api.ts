import { parsePhoneNumberFromString } from 'libphonenumber-js'

const CHARIOW_API_URL = process.env.CHARIOW_API_URL || 'https://api.chariow.com/v1'
const CHARIOW_API_KEY = process.env.CHARIOW_API_KEY

if (!CHARIOW_API_KEY) {
  console.warn('⚠️ CHARIOW_API_KEY is not defined in environment variables.')
}

export type ChariowProduct = {
  id: string
  name: string
  price: number
  currency: string
  status: string
}

export type ChariowCheckoutParams = {
  product_id: string
  email: string
  first_name: string
  last_name: string
  phone: {
    number: string
    country_code: string
  }
  redirect_url: string
  custom_metadata?: Record<string, string>
}

export type ChariowCheckoutResponse = {
  purchase: {
    id: string
    amount: {
      value: number
      currency: string
    }
  }
  payment: {
    checkout_url: string
  }
}

/**
 * Normalise un numéro de téléphone pour l'API Chariow.
 * Chariow exige un numéro national sans le 0 (ex: 763627155) et un code pays ISO2 (ex: FR).
 */
export function resolveChariowPhone(phone: string, phoneCountry?: string): { number: string, country_code: string } {
  // 1. Essayer avec le code pays s'il est fourni (via le selecteur)
  if (phoneCountry) {
    const parsed = parsePhoneNumberFromString(phone, phoneCountry as any)
    if (parsed && parsed.isValid()) {
      return {
        number: parsed.nationalNumber as string,
        country_code: parsed.country || phoneCountry
      }
    }
  }

  // 2. Essayer comme un format international (E.164)
  const parsedInt = parsePhoneNumberFromString(phone)
  if (parsedInt && parsedInt.isValid()) {
    return {
      number: parsedInt.nationalNumber as string,
      country_code: parsedInt.country || ''
    }
  }

  // 3. Fallback brut (non recommandé pour l'Europe/US, mais passe souvent pour l'Afrique si code fourni)
  if (phoneCountry) {
    return {
      number: phone.replace(/[^0-9]/g, ''),
      country_code: phoneCountry
    }
  }

  // 4. Fallback par défaut (risque d'erreur 400 côté Chariow)
  return {
    number: phone.replace(/[^0-9]/g, ''),
    country_code: 'TG' // Par défaut Togo si rien n'est connu
  }
}

/**
 * Récupère la liste des produits publiés sur la boutique Chariow.
 */
export async function getChariowProducts(): Promise<ChariowProduct[]> {
  try {
    const res = await fetch(`${CHARIOW_API_URL}/products?status=active`, { // Supposition de l'endpoint d'après la doc
      headers: {
        'Authorization': `Bearer ${CHARIOW_API_KEY}`,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 3600 } // Cache pendant 1h
    })

    if (!res.ok) {
      console.error('Erreur Chariow API:', await res.text())
      return []
    }

    const json = await res.json()
    // Adapter selon la structure réelle de l'API. On suppose que json.data contient les produits.
    return json.data || json || []
  } catch (error) {
    console.error('Erreur getChariowProducts:', error)
    return []
  }
}

/**
 * Crée un lien de paiement Checkout.
 */
export async function createChariowCheckout(params: ChariowCheckoutParams): Promise<ChariowCheckoutResponse> {
  const res = await fetch(`${CHARIOW_API_URL}/checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CHARIOW_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Erreur Chariow Checkout API:', errText)
    throw new Error(`Erreur lors de la création du paiement: ${errText}`)
  }

  const json = await res.json()
  return json.data || json
}

/**
 * Récupère le statut d'une vente (Source de vérité).
 */
export async function getChariowSaleStatus(saleId: string) {
  const res = await fetch(`${CHARIOW_API_URL}/sales/${saleId}`, {
    headers: {
      'Authorization': `Bearer ${CHARIOW_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    throw new Error(`Impossible de lire la vente ${saleId}`)
  }

  const json = await res.json()
  return json.data || json
}

/**
 * Normalise le statut Chariow vers notre statut interne.
 */
export function mapChariowStatus(rawStatus: string): 'pending' | 'succeeded' | 'failed' | 'abandoned' {
  const status = (rawStatus || '').toLowerCase()
  
  if (['unpaid'].includes(status)) return 'pending' // Garde-fou
  if (status.match(/(failed|error)/)) return 'failed'
  if (status.match(/(cancel|abandon|refund)/)) return 'abandoned'
  if (status.match(/(settle|complete|paid|success)/)) return 'succeeded'
  
  return 'pending'
}
