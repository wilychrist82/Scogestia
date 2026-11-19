import crypto from 'crypto'

function timingSafeCompare(aStr: string, bStr: string): boolean {
  const a = Buffer.from(aStr)
  const b = Buffer.from(bStr)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Vérifie l'authenticité d'un webhook Chariow Pulse via :
 * 1) paramètre d'URL `?secret=...`
 * 2) en-têtes `x-chariow-secret` / `x-webhook-secret`
 * 3) signature HMAC-SHA256 `x-chariow-signature` / `x-webhook-signature`
 */
export function verifyChariowWebhookRequest(
  req: Request,
  rawBody: string,
  secrets: string[],
): boolean {
  const validSecrets = secrets.map((s) => s.trim()).filter(Boolean)
  if (validSecrets.length === 0) return true

  try {
    const querySecret = new URL(req.url).searchParams.get('secret')
    if (querySecret && validSecrets.some((s) => timingSafeCompare(querySecret, s))) {
      return true
    }
  } catch {
    // URL invalide ignorée
  }

  const headerSecret =
    req.headers.get('x-chariow-secret') ||
    req.headers.get('x-webhook-secret')

  if (headerSecret && validSecrets.some((s) => timingSafeCompare(headerSecret, s))) {
    return true
  }

  const signature =
    req.headers.get('x-chariow-signature') ||
    req.headers.get('x-webhook-signature')

  if (signature) {
    const cleanSig = signature.replace(/^sha256=/i, '').trim()
    for (const secret of validSecrets) {
      const expectedHmac = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex')
      if (timingSafeCompare(cleanSig, expectedHmac)) {
        return true
      }
    }
  }

  return false
}
