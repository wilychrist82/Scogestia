import { FraisManager } from '@/components/admin/finance/FraisManager'

export const dynamic = 'force-dynamic'

export default async function FraisPage() {
  // Les types de frais sont gérés localement (côté client) dans FraisManager.
  // Une future migration pourrait ajouter une table fee_types en DB.
  return (
    <FraisManager feeTypes={[]} />
  )
}
