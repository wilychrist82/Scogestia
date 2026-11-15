/**
 * Retourne l'année scolaire courante selon la bascule d'août (month >= 7 en index 0-11).
 * - `separator = '/'` : clés DB académiques (`primary_grades`, `secondary_grades`, `published_bulletins`).
 * - `separator = '-'` (défaut) : finance (`payment_schedules`) et identifiants standards.
 */
export function getDynamicAcademicYear(
  separator: '/' | '-' = '-',
  refDate: Date = new Date()
): string {
  const year = refDate.getFullYear()
  const month = refDate.getMonth()

  if (month < 7) {
    return `${year - 1}${separator}${year}`
  }

  return `${year}${separator}${year + 1}`
}

/**
 * Formate une chaîne d'année scolaire (`2026-2027` ou `2026/2027`) pour l'affichage (`2026 - 2027`).
 */
export function formatAcademicYearDisplay(academicYear?: string | null): string {
  const raw = academicYear?.trim() || getDynamicAcademicYear('-')
  return raw.replace(/\s*[/-]\s*/g, ' - ')
}
