/**
 * Vérification centralisée des propriétaires du SaaS (Super Admins).
 *
 * SÉCURITÉ : on ne compare JAMAIS par sous-chaîne (`includes`) ni par domaine
 * (`endsWith`). Un email est considéré comme propriétaire uniquement s'il figure
 * EXACTEMENT dans la variable d'environnement serveur `SUPER_ADMIN_EMAILS`
 * (liste séparée par des virgules). La table `super_admins` (RPC `is_super_admin`)
 * reste la source de vérité principale.
 *
 * Exemple dans .env.local :
 *   SUPER_ADMIN_EMAILS=moi@exemple.com,associe@exemple.com
 */
export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false
  const allowList = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (allowList.length === 0) return false
  return allowList.includes(email.trim().toLowerCase())
}

const DEFAULT_BILLING_TEST_EMAILS = ['alicisme30@gmail.com']

/**
 * Comptes autorisés à tester le produit Chariow de recette (à coût réduit, ex: 600 FCFA).
 * N'accorde aucun privilège Super Admin ni contournement d'expiration d'abonnement.
 */
export function isBillingTestEmail(email?: string | null): boolean {
  if (!email) return false
  const clean = email.trim().toLowerCase()
  if (isOwnerEmail(clean)) return true
  const extra = (process.env.CHARIOW_TEST_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return extra.includes(clean) || DEFAULT_BILLING_TEST_EMAILS.includes(clean)
}
