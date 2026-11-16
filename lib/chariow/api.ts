import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

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

/**
 * Détermine si un produit Chariow est un produit de test/recette (nom explicite ou prix <= 1 500 FCFA).
 * Empêche qu'un produit de test (ex: 600 FCFA) ne remplace les vrais plans publics (Standard / Pro / Annuel).
 */
export function isTestChariowProduct(
  product: Pick<ChariowProduct, 'id' | 'name' | 'price'>,
  testProductId?: string | null,
): boolean {
  if (testProductId && product.id === testProductId) return true
  const name = (product.name || '').trim()
  if (/\b(test|sandbox|essai|demo)\b/i.test(name)) return true
  return Number(product.price) > 0 && Number(product.price) <= 1500
}

/**
 * Sépare les plans publics des éventuels produits de recette Chariow.
 */
export function partitionChariowProducts(
  products: ChariowProduct[],
  options: { canUseTestPlan: boolean; testProductId?: string | null },
): { publicPlans: ChariowProduct[]; testPlan: ChariowProduct | null } {
  const list = Array.isArray(products) ? products : []

  const publicPlans = list.filter((p) => {
    if (isTestChariowProduct(p, options.testProductId)) return false
    const lower = (p?.name || '').toLowerCase()
    return lower.includes('scogestia') || lower.includes('plan')
  })

  const testPlan = options.canUseTestPlan
    ? list.find((p) => isTestChariowProduct(p, options.testProductId)) ?? null
    : null

  return { publicPlans, testPlan }
}

/**
 * Extrait l'identifiant réel d'une vente depuis les paramètres de redirection Chariow
 * (en ignorant les placeholders non remplacés comme `{sale_id}` et en lisant `purchase`).
 */
export function resolveChariowReturnSaleId(params: { get: (key: string) => string | null }): string | null {
  const candidates = [
    params.get('purchase'),
    params.get('sale'),
    params.get('sale_id'),
    params.get('transaction_id'),
  ]
  for (const raw of candidates) {
    const trimmed = raw?.trim()
    if (trimmed && !/^\{.*\}$/.test(trimmed)) {
      return trimmed
    }
  }
  return null
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
  purchase?: {
    id: string
    amount?: {
      value?: number
      currency?: string
    } | number
  }
  sale?: {
    id: string
    amount?: {
      value?: number
      currency?: string
    } | number
  }
  payment?: {
    checkout_url: string
  }
  checkout_url?: string
}

/**
 * Normalise un numéro de téléphone pour l'API Chariow.
 * Chariow exige un numéro national sans le 0 (ex: 763627155) et un code pays ISO2 (ex: FR).
 */
export function resolveChariowPhone(phone: string, phoneCountry?: string): { number: string, country_code: string } {
  // 1. Essayer avec le code pays s'il est fourni (via le selecteur)
  if (phoneCountry) {
    const parsed = parsePhoneNumberFromString(phone, phoneCountry as CountryCode)
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
      next: { revalidate: 60 } // Rafraîchit le catalogue toutes les minutes
    })

    if (!res.ok) {
      console.error('Erreur Chariow API:', await res.text())
      return []
    }

    const json = await res.json()
    const rawList: any[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []
    return rawList.map((raw) => {
      const priceValue =
        raw?.pricing?.current_price?.value ??
        raw?.pricing?.effective?.value ??
        raw?.pricing?.sale_price?.value ??
        raw?.pricing?.price?.value ??
        raw?.price ??
        0
      const currency =
        raw?.pricing?.current_price?.currency ??
        raw?.pricing?.effective?.currency ??
        raw?.currency ??
        'FCFA'

      return {
        id: String(raw?.id || ''),
        name: String(raw?.name || ''),
        price: Number(priceValue) || 0,
        currency: String(currency),
        status: String(raw?.status || 'active'),
      }
    })
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
