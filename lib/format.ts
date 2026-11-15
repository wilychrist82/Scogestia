/**
 * Formate un montant numérique en Francs CFA sans espaces insécables Unicode
 * (compatibilité Web, Excel et PDF Helvetica).
 */
export function formatCFA(
  amount: number | string | null | undefined,
  suffix = 'FCFA'
): string {
  const numeric = typeof amount === 'string' ? Number(amount) : amount
  const safe = typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : 0
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  })
    .format(safe)
    .replace(/[\u00A0\u202F]/g, ' ')

  return suffix ? `${formatted} ${suffix}` : formatted
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  especes: 'Espèces',
  tmoney: 'T-Money',
  flooz: 'Flooz',
  wave: 'Wave',
  banque: 'Virement',
  virement: 'Virement bancaire',
  cheque: 'Chèque',
  autre: 'Autre',
  Autre: 'Autre',
}

export function getPaymentMethodLabel(method?: string | null): string {
  if (!method) return 'Autre'
  return PAYMENT_METHOD_LABELS[method] ?? method
}

export const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-900 ring-emerald-300',
  'bg-sky-100 text-sky-900 ring-sky-300',
  'bg-violet-100 text-violet-900 ring-violet-300',
  'bg-amber-100 text-amber-900 ring-amber-300',
  'bg-rose-100 text-rose-900 ring-rose-300',
  'bg-teal-100 text-teal-900 ring-teal-300',
] as const

export function getAvatarTone(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return AVATAR_TONES[h % AVATAR_TONES.length]
}
