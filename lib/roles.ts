/**
 * Constantes centralisées de rôles Scogestia.
 * Partagées entre le proxy (middleware), les layouts et les Server Actions / API routes.
 */

export const ADMIN_SPACE_ROLES = [
  'admin',
  'comptable',
  'secretaire',
  'directeur',
  'censeur',
  'surveillant',
  'conseiller',
] as const

export const ADMIN_MANAGEMENT_ROLES = [
  'admin',
  'super_admin',
  'comptable',
  'secretaire',
  'directeur',
  'censeur',
  'surveillant',
  'conseiller',
] as const

export const ALL_STAFF_ROLES = [
  'admin',
  'super_admin',
  'comptable',
  'secretaire',
  'directeur',
  'censeur',
  'surveillant',
  'conseiller',
  'enseignant',
] as const

export const ACADEMIC_MANAGEMENT_ROLES = [
  'admin',
  'super_admin',
  'directeur',
  'censeur',
  'secretaire',
  'enseignant',
] as const

export const STUDENT_MANAGEMENT_ROLES = [
  'admin',
  'super_admin',
  'comptable',
  'directeur',
  'censeur',
  'secretaire',
] as const

export const BULLETIN_GENERATION_ROLES = [
  'admin',
  'super_admin',
  'directeur',
  'censeur',
  'secretaire',
  'comptable',
] as const

export const FINANCE_ROLES = ['admin', 'comptable'] as const
