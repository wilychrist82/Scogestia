import crypto from 'crypto'

export const PENDING_CHECKOUT_COOKIE = 'scogestia_pending_checkout'

export interface PendingCheckoutPayload {
  saleId: string
  schoolId: string
  planName: string
  expectedAmount: number
  exp: number
}

export function getCheckoutSigningSecret(): string | null {
  return (
    process.env.CHARIOW_WEBHOOK_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.CHARIOW_API_KEY ||
    null
  )
}

function computeHmac(encodedPayload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url')
}

export function signPendingCheckoutToken(
  payload: PendingCheckoutPayload,
  secret: string | null = getCheckoutSigningSecret(),
): string | null {
  if (!secret) return null
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = computeHmac(encoded, secret)
  return `${encoded}.${signature}`
}

export function verifyPendingCheckoutToken(
  token: string | undefined | null,
  secret: string | null = getCheckoutSigningSecret(),
): PendingCheckoutPayload | null {
  if (!token || !secret) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [encoded, providedSig] = parts
  if (!encoded || !providedSig) return null

  const expectedSig = computeHmac(encoded, secret)
  const a = Buffer.from(providedSig, 'utf8')
  const b = Buffer.from(expectedSig, 'utf8')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<PendingCheckoutPayload>
    if (
      typeof parsed.saleId !== 'string' ||
      !parsed.saleId ||
      typeof parsed.schoolId !== 'string' ||
      !parsed.schoolId ||
      typeof parsed.planName !== 'string' ||
      typeof parsed.expectedAmount !== 'number' ||
      !Number.isFinite(parsed.expectedAmount) ||
      typeof parsed.exp !== 'number' ||
      parsed.exp <= Date.now()
    ) {
      return null
    }
    return {
      saleId: parsed.saleId,
      schoolId: parsed.schoolId,
      planName: parsed.planName,
      expectedAmount: parsed.expectedAmount,
      exp: parsed.exp,
    }
  } catch {
    return null
  }
}
