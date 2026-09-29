'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Building2, ShieldCheck, Users, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type UserRole = {
  id: string
  user_id: string
  full_name: string
  role: string
  phone: string | null
  is_active: boolean
  created_at: string
}

type Props = {
  users: UserRole[]
  schoolId: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  comptable: 'Comptable',
  enseignant: 'Enseignant',
  parent: 'Parent',
  super_admin: 'Super Admin',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  comptable: 'bg-purple-50 text-purple-700 border-purple-200',
  enseignant: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  parent: 'bg-amber-50 text-amber-700 border-amber-200',
  super_admin: 'bg-red-50 text-red-700 border-red-200',
}

export function SecuritySettings({ users, schoolId }: Props) {
  const staffUsers = users.filter(u => u.role !== 'parent')
  const parentUsers = users.filter(u => u.role === 'parent')

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Paramètres</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Sécurité & Permissions</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Gérez les comptes utilisateurs et les droits d&apos;accès.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--color-outline-variant)] pb-px -mx-1 px-1 scrollbar-hide">
          <Link href="/admin/parametres" className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors whitespace-nowrap">
            <Building2 size={16} />
            Établissement
          </Link>
          <Link href="/admin/parametres/journal" className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors whitespace-nowrap">
            <ShieldCheck size={16} />
            Journal d&apos;audit
          </Link>
          <Link href="/admin/parametres/securite" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] transition-colors whitespace-nowrap">
            <Lock size={16} />
            Sécurité & Permissions
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['admin', 'comptable', 'enseignant', 'parent'] as const).map(role => {
            const count = users.filter(u => u.role === role && u.is_active).length
            return (
              <div key={role} className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${ROLE_COLORS[role] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {ROLE_LABELS[role]}
                  </span>
                </div>
                <p className="text-2xl font-black text-[var(--color-on-surface)]">{count}</p>
                <p className="text-xs text-[var(--color-on-surface-variant)]">compte{count > 1 ? 's' : ''} actif{count > 1 ? 's' : ''}</p>
              </div>
            )
          })}
        </div>

        {/* Staff Users Table */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
            <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">admin_panel_settings</span>
              Personnel ({staffUsers.length})
            </h3>
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Administrateurs, comptables et enseignants ayant accès au système.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)]">
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Nom complet</th>
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Rôle</th>
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Téléphone</th>
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Statut</th>
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Ajouté le</th>
                </tr>
              </thead>
              <tbody>
                {staffUsers.length > 0 ? staffUsers.map(u => (
                  <tr key={u.id} className="border-b border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-bright)] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-container)] text-[var(--color-primary)] flex items-center justify-center font-bold text-sm">
                          {u.full_name.charAt(0)}
                        </div>
                        <span className="font-semibold text-sm text-[var(--color-on-surface)]">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${ROLE_COLORS[u.role] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">{u.phone || '—'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        u.is_active ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#fce8e6] text-[#d93025]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-[#1e8e3e]' : 'bg-[#d93025]'}`}></span>
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">
                      {format(new Date(u.created_at), 'dd MMM yyyy', { locale: fr })}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--color-on-surface-variant)]">
                      Aucun membre du personnel enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
            <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">verified_user</span>
              Matrice des Permissions
            </h3>
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Droits d&apos;accès par rôle dans Scogestia.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)]">
                  <th className="p-4 text-sm font-semibold text-[var(--color-on-surface-variant)]">Module</th>
                  <th className="p-4 text-sm font-semibold text-center text-[var(--color-on-surface-variant)]">Admin</th>
                  <th className="p-4 text-sm font-semibold text-center text-[var(--color-on-surface-variant)]">Comptable</th>
                  <th className="p-4 text-sm font-semibold text-center text-[var(--color-on-surface-variant)]">Enseignant</th>
                  <th className="p-4 text-sm font-semibold text-center text-[var(--color-on-surface-variant)]">Parent</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { module: 'Tableau de bord', admin: true, comptable: true, enseignant: true, parent: true },
                  { module: 'Gestion des élèves', admin: true, comptable: false, enseignant: false, parent: false },
                  { module: 'Gestion des classes', admin: true, comptable: false, enseignant: false, parent: false },
                  { module: 'Personnel', admin: true, comptable: false, enseignant: false, parent: false },
                  { module: 'Finance (vue complète)', admin: true, comptable: true, enseignant: false, parent: false },
                  { module: 'Finance (paiements)', admin: true, comptable: true, enseignant: false, parent: true },
                  { module: 'Notes (saisie)', admin: true, comptable: false, enseignant: true, parent: false },
                  { module: 'Notes (consultation)', admin: true, comptable: false, enseignant: true, parent: true },
                  { module: 'Présences', admin: true, comptable: false, enseignant: true, parent: true },
                  { module: 'Devoirs', admin: true, comptable: false, enseignant: true, parent: true },
                  { module: 'Bulletins', admin: true, comptable: false, enseignant: false, parent: true },
                  { module: 'Communication', admin: true, comptable: false, enseignant: true, parent: true },
                  { module: 'Rapports', admin: true, comptable: true, enseignant: false, parent: false },
                  { module: 'Paramètres', admin: true, comptable: false, enseignant: false, parent: false },
                  { module: 'Abonnement', admin: true, comptable: false, enseignant: false, parent: false },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-bright)] transition-colors">
                    <td className="p-4 text-sm font-medium text-[var(--color-on-surface)]">{row.module}</td>
                    {(['admin', 'comptable', 'enseignant', 'parent'] as const).map(role => (
                      <td key={role} className="p-4 text-center">
                        {row[role] ? (
                          <span className="material-symbols-outlined text-[18px] text-[#1e8e3e]">check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px] text-gray-300">cancel</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
