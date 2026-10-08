'use client'

import { useRef, useState } from 'react'
import { Printer, FileSpreadsheet, X, Download, ShieldCheck, CheckCircle2, Building2 } from 'lucide-react'

export type SchoolInfo = {
  id?: string
  name: string
  city?: string | null
  phone?: string | null
  email?: string | null
  current_academic_year?: string | null
  director_name?: string | null
  signature_url?: string | null
  stamp_url?: string | null
  logo_url?: string | null
}

type Stats = {
  totalEncaisse: number
  totalAttendu: number
  nbImpayes: number
  nbEleves: number
  nbPaiements: number
  repartitionMethode: Record<string, number>
}

type PaymentItem = {
  amount: number
  paid_at: string
  payment_method: string | null
}

type Props = {
  school?: SchoolInfo
  userFullName?: string
  stats: Stats
  payments: PaymentItem[]
  onClose: () => void
}

const formatCFA = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} FCFA`

const METHOD_LABELS: Record<string, string> = {
  especes: 'Espèces',
  tmoney: 'T-Money',
  flooz: 'Flooz',
  wave: 'Wave',
  virement: 'Virement bancaire',
  cheque: 'Chèque',
  Autre: 'Autre',
}

export function FinancialReportDocument({ school, userFullName, stats, payments, onClose }: Props) {
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const printAreaRef = useRef<HTMLDivElement>(null)

  const schoolName = school?.name || 'Établissement Scolaire'
  const academicYear = school?.current_academic_year || '2024-2025'
  const todayStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const nowTime = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const reference = `BIL-FIN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`

  const soldeRestant = Math.max(0, stats.totalAttendu - stats.totalEncaisse)
  const tauxRecouvrement = stats.totalAttendu > 0
    ? Math.min(100, Math.round((stats.totalEncaisse / stats.totalAttendu) * 100))
    : 0

  // Grouper les paiements par mois pour le tableau d'historique
  const parMois: Record<string, number> = {}
  payments.forEach(p => {
    if (!p.paid_at) return
    const mois = new Date(p.paid_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    parMois[mois] = (parMois[mois] || 0) + Number(p.amount)
  })
  const moisEntries = Object.entries(parMois)

  // Export Excel structuré (.xlsx)
  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const xlsx = await import('xlsx')
      const wb = xlsx.utils.book_new()

      // Feuille 1 : Synthèse Générale
      const wsSyntheseData = [
        ['RÉPUBLIQUE SCOGESTIA - ÉTABLISSEMENT ' + schoolName.toUpperCase()],
        ['BILAN ET ÉTAT FINANCIER DE TRÉSORERIE'],
        [`Année Scolaire : ${academicYear}`, `Date d'arrêté : ${todayStr} à ${nowTime}`],
        [`Référence : ${reference}`, `Édité par : ${userFullName || 'Direction'}`],
        [],
        ['--- SYNTHÈSE DES FLUX FINANCIERS ---'],
        ['Indicateur', 'Montant / Valeur', 'Observations'],
        ['Total Prévisionnel Attendu', stats.totalAttendu, 'Somme globale des échéances'],
        ['Total Réellement Encaissé', stats.totalEncaisse, 'Montant total perçu en caisse'],
        ['Solde Restant à Recouvrer', soldeRestant, 'Créances restantes à recouvrer'],
        ['Taux de Recouvrement', `${tauxRecouvrement}%`, 'Niveau d\'avancement des règlements'],
        ['Élèves Actifs Inscrits', stats.nbEleves, 'Effectif total d\'élèves'],
        ['Échéances en Souffrance (Retard)', stats.nbImpayes, 'Dossiers nécessitant une relance'],
        ['Nombre de Règlements Enregistrés', stats.nbPaiements, 'Transactions enregistrées'],
        [],
        ['--- VENTILATION PAR MODE DE RÈGLEMENT ---'],
        ['Mode de Règlement', 'Montant Encaissé (FCFA)', 'Part (%)'],
        ...Object.entries(stats.repartitionMethode).map(([method, amount]) => {
          const pct = stats.totalEncaisse > 0 ? Math.round((amount / stats.totalEncaisse) * 100) : 0
          return [METHOD_LABELS[method] || method, amount, `${pct}%`]
        }),
        ['TOTAL GÉNÉRAL', stats.totalEncaisse, '100%'],
      ]

      if (moisEntries.length > 0) {
        wsSyntheseData.push([])
        wsSyntheseData.push(['--- ENCAISSEMENTS MENSUELS ---'])
        wsSyntheseData.push(['Mois', 'Montant Encaissé (FCFA)'])
        moisEntries.forEach(([m, amt]) => {
          wsSyntheseData.push([m, amt])
        })
      }

      const ws = xlsx.utils.aoa_to_sheet(wsSyntheseData)
      ws['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 35 }]
      xlsx.utils.book_append_sheet(wb, ws, 'Bilan Financier')

      const sanitizedSchool = schoolName.replace(/[^a-zA-Z0-9]/g, '_')
      xlsx.writeFile(wb, `Bilan_Financier_${sanitizedSchool}_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) {
      console.error('[Excel Export Error]', err)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      {/* Barre d'action supérieure (masquée à l'impression) */}
      <div className="sticky top-0 z-10 bg-slate-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Bilan & Rapport Financier Officiel
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Format Officiel Comptable
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {schoolName} • Année scolaire {academicYear} • Référence {reference}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            title="Exporter sous format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingExcel ? 'Exportation...' : 'Exporter en Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
            title="Imprimer ou enregistrer en PDF via le navigateur"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / Télécharger en PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Fermer l'aperçu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Conteneur de prévisualisation A4 */}
      <div className="flex-1 p-4 sm:p-8 flex justify-center items-start print:p-0">
        <div
          ref={printAreaRef}
          className="report-print-sheet bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-2xl rounded-sm print:rounded-none print:shadow-none print:w-full print:max-w-none print:p-6"
          style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}
        >
          {/* ════════ EN-TÊTE OFFICIEL DE L'ÉCOLE ════════ */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6">
            <div className="flex items-start justify-between gap-6">
              {/* Logo & Coordonnées */}
              <div className="flex items-center gap-5">
                {school?.logo_url ? (
                  <div className="w-20 h-20 rounded-lg border border-slate-300 p-1 bg-white shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src={school.logo_url}
                      alt={schoolName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 flex flex-col items-center justify-center text-[10px] font-sans font-bold uppercase shrink-0">
                    <Building2 className="w-6 h-6 mb-1 text-slate-400" />
                    <span>Logo École</span>
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                    {schoolName}
                  </h1>
                  <p className="text-xs font-sans text-slate-600 mt-1">
                    {school?.city ? `${school.city} • ` : ''}
                    {school?.phone ? `Tél : ${school.phone}` : ''}
                    {school?.email ? ` • Email : ${school.email}` : ''}
                  </p>
                  <p className="text-xs font-sans font-bold text-slate-700 mt-0.5 uppercase tracking-wider">
                    Année Scolaire : {academicYear}
                  </p>
                </div>
              </div>

              {/* Réf & Date */}
              <div className="text-right font-sans shrink-0">
                <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono text-slate-700 font-bold">
                  {reference}
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Édité le : <strong>{todayStr}</strong>
                </p>
                <p className="text-[11px] text-slate-500">à {nowTime}</p>
                <p className="text-[11px] text-slate-600 mt-1 italic">
                  Par : {userFullName || 'La Direction'}
                </p>
              </div>
            </div>
          </div>

          {/* ════════ TITRE DU DOCUMENT ════════ */}
          <div className="text-center my-6">
            <div className="inline-block border-y-2 border-slate-900 py-2 px-8">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900 font-sans">
                ÉTAT FINANCIER & BILAN DE TRÉSORERIE
              </h2>
              <p className="text-xs font-sans text-slate-600 italic mt-0.5">
                Arrêté des comptes de scolarité, flux d&apos;encaissements et situation de recouvrement
              </p>
            </div>
          </div>

          {/* ════════ TABLEAU 1 : SYNTHÈSE GLOBALE ════════ */}
          <div className="mb-6 font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3 flex items-center justify-between">
              <span>I. Synthèse Globale des Écritures</span>
              <span className="text-[11px] font-normal text-slate-500">Unité monétaire : FCFA</span>
            </h3>
            <table className="w-full text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                  <th className="p-2.5 text-left border-r border-slate-300">Indicateur Comptable</th>
                  <th className="p-2.5 text-right border-r border-slate-300">Montant / Valeur</th>
                  <th className="p-2.5 text-left">Observations & Niveau d&apos;Exécution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-300">
                    Total Prévisionnel Attendu
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900 border-r border-slate-300 tabular-nums">
                    {formatCFA(stats.totalAttendu)}
                  </td>
                  <td className="p-2.5 text-slate-600">
                    Volume global des scolarités et frais exigibles
                  </td>
                </tr>
                <tr className="bg-emerald-50/50">
                  <td className="p-2.5 font-bold text-emerald-950 border-r border-slate-300">
                    Total Réellement Encaissé
                  </td>
                  <td className="p-2.5 text-right font-black text-emerald-700 border-r border-slate-300 tabular-nums">
                    {formatCFA(stats.totalEncaisse)}
                  </td>
                  <td className="p-2.5 font-semibold text-emerald-800">
                    Somme des règlements effectifs en caisse
                  </td>
                </tr>
                <tr className="bg-rose-50/40">
                  <td className="p-2.5 font-semibold text-rose-950 border-r border-slate-300">
                    Solde Restant à Recouvrer
                  </td>
                  <td className="p-2.5 text-right font-bold text-rose-700 border-r border-slate-300 tabular-nums">
                    {formatCFA(soldeRestant)}
                  </td>
                  <td className="p-2.5 text-slate-600">
                    Créances à percevoir auprès des parents
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-300">
                    Taux Global de Recouvrement
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900 border-r border-slate-300 tabular-nums">
                    {tauxRecouvrement}%
                  </td>
                  <td className="p-2.5 text-slate-600">
                    {tauxRecouvrement >= 80 ? 'Excellent niveau de recouvrement' : tauxRecouvrement >= 50 ? 'Recouvrement en cours' : 'Relances nécessaires'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-300">
                    Effectif Total d&apos;Élèves Actifs
                  </td>
                  <td className="p-2.5 text-right font-semibold text-slate-900 border-r border-slate-300 tabular-nums">
                    {stats.nbEleves} élèves
                  </td>
                  <td className="p-2.5 text-slate-600">
                    Base d&apos;élèves inscrits pour l&apos;année {academicYear}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-300">
                    Échéances en Retard (Impayés)
                  </td>
                  <td className="p-2.5 text-right font-semibold text-slate-900 border-r border-slate-300 tabular-nums">
                    {stats.nbImpayes} dossier{stats.nbImpayes > 1 ? 's' : ''}
                  </td>
                  <td className="p-2.5 text-slate-600">
                    Échéances dont la date limite est échue
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-300">
                    Transactions de Caisse
                  </td>
                  <td className="p-2.5 text-right font-semibold text-slate-900 border-r border-slate-300 tabular-nums">
                    {stats.nbPaiements} versement{stats.nbPaiements > 1 ? 's' : ''}
                  </td>
                  <td className="p-2.5 text-slate-600">
                    Reçus et pièces de paiement enregistrés
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ════════ TABLEAU 2 : VENTILATION PAR MODE DE RÈGLEMENT ════════ */}
          <div className="mb-6 font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">
              II. Ventilation des Encaissements par Mode de Règlement
            </h3>
            {Object.keys(stats.repartitionMethode).length === 0 ? (
              <p className="text-xs italic text-slate-500 py-3 text-center border border-dashed border-slate-200">
                Aucun encaissement enregistré pour la période.
              </p>
            ) : (
              <table className="w-full text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="p-2.5 text-left border-r border-slate-300">Mode de Règlement</th>
                    <th className="p-2.5 text-right border-r border-slate-300">Montant Encaissé (FCFA)</th>
                    <th className="p-2.5 text-right">Quote-part (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(stats.repartitionMethode).map(([method, amount]) => {
                    const pct = stats.totalEncaisse > 0 ? Math.round((amount / stats.totalEncaisse) * 100) : 0
                    return (
                      <tr key={method}>
                        <td className="p-2.5 font-medium text-slate-900 border-r border-slate-300">
                          {METHOD_LABELS[method] || method}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 border-r border-slate-300 tabular-nums">
                          {formatCFA(amount)}
                        </td>
                        <td className="p-2.5 text-right font-medium text-slate-700 tabular-nums">
                          {pct}%
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                    <td className="p-2.5 border-r border-slate-300 uppercase">Total Général</td>
                    <td className="p-2.5 text-right font-black text-emerald-800 border-r border-slate-300 tabular-nums">
                      {formatCFA(stats.totalEncaisse)}
                    </td>
                    <td className="p-2.5 text-right font-black">100%</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* ════════ TABLEAU 3 : HISTORIQUE MENSUEL (si dispo) ════════ */}
          {moisEntries.length > 0 && (
            <div className="mb-6 font-sans">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">
                III. Historique Chronologique des Encaissements Mensuels
              </h3>
              <table className="w-full text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="p-2 text-left border-r border-slate-300">Période (Mois)</th>
                    <th className="p-2 text-right">Volume Encaissé (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {moisEntries.map(([mois, montant]) => (
                    <tr key={mois}>
                      <td className="p-2 font-medium capitalize text-slate-900 border-r border-slate-300">
                        {mois}
                      </td>
                      <td className="p-2 text-right font-bold text-slate-900 tabular-nums">
                        {formatCFA(montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ════════ VISAS & SIGNATURES OFFICIELLES ════════ */}
          <div className="mt-8 pt-4 border-t-2 border-slate-300 font-sans">
            <div className="grid grid-cols-2 gap-8">
              {/* Visa Comptable */}
              <div className="border border-slate-300 rounded p-4 text-center flex flex-col justify-between min-h-[140px] bg-slate-50/30">
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                    Le Service Comptabilité / Caissier
                  </p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">
                    Certifié sincère et conforme aux écritures de caisse
                  </p>
                </div>
                <div className="my-3">
                  <p className="text-xs font-semibold text-slate-900">{userFullName || 'Le Responsable Financier'}</p>
                </div>
                <div className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400">
                  Signature & Émargement
                </div>
              </div>

              {/* Visa Direction & Cachet */}
              <div className="border border-slate-300 rounded p-4 text-center flex flex-col justify-between min-h-[140px] bg-slate-50/30 relative">
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                    La Direction de l&apos;Établissement
                  </p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">
                    Vu et approuvé pour valoir ce que de droit
                  </p>
                </div>

                <div className="my-2 flex items-center justify-center gap-3">
                  {school?.signature_url && (
                    <img
                      src={school.signature_url}
                      alt="Signature"
                      className="h-12 max-w-[90px] object-contain"
                    />
                  )}
                  {school?.stamp_url ? (
                    <img
                      src={school.stamp_url}
                      alt="Cachet"
                      className="h-14 max-w-[90px] object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-blue-700/60 flex flex-col items-center justify-center text-[8px] font-black uppercase text-blue-800 leading-tight">
                      <ShieldCheck className="w-4 h-4 mb-0.5 text-blue-700" />
                      <span>DIRECTION</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-600 font-semibold">
                  {school?.director_name || 'Le Chef d\'Établissement'}
                </div>
              </div>
            </div>
          </div>

          {/* ════════ PIED DE PAGE FORMULAIRE ════════ */}
          <div className="mt-8 pt-3 border-t border-slate-200 text-center font-sans text-[10px] text-slate-500 flex justify-between items-center">
            <span>Scogestia ERP Scolaire • Document Comptable Officiel</span>
            <span>Réf : {reference}</span>
            <span>Page 1 / 1</span>
          </div>
        </div>
      </div>

      {/* Style d'impression injecté */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .report-print-sheet, .report-print-sheet * {
            visibility: visible;
          }
          .report-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 12mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}} />
    </div>
  )
}
