'use client'

import { LucideIcon } from 'lucide-react'
import { FinanceExecutiveBanner } from './FinanceExecutiveBanner'

type Stat = {
  label: string
  value: string | number
  color?: string
}

type Props = {
  title: string
  subtitle: string
  badge?: string
  icon?: LucideIcon
  stats?: Stat[]
  actions?: React.ReactNode
}

export function FinancePageBanner({
  title,
  subtitle,
  badge = 'GESTION FINANCIÈRE',
  icon,
  stats,
  actions,
}: Props) {
  return (
    <FinanceExecutiveBanner
      title={title}
      subtitle={subtitle}
      badge={badge}
      stats={stats}
      actions={actions}
      className="mb-6"
    />
  )
}
