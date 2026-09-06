'use client'

import React from 'react'

type TimetableLevel = 'maternelle' | 'cp' | 'ce' | 'cm' | null

interface StaticTimetableProps {
  level: TimetableLevel
}

export function StaticTimetable({ level }: StaticTimetableProps) {
  if (!level) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)]">
        <span className="material-symbols-outlined text-5xl text-gray-400 mb-4">calendar_month</span>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Bientôt disponible</h3>
        <p className="text-gray-500 text-center max-w-md">
          L'emploi du temps pour cette classe n'est pas standardisé ou est en cours de configuration. Il sera disponible très prochainement.
        </p>
      </div>
    )
  }

  const TheadBase = () => (
    <thead>
      <tr className="bg-orange-50/80">
        <th className="border border-slate-300 p-1.5 text-left align-top font-bold text-gray-900 w-28">HORAIRES</th>
        <th className="border border-slate-300 p-1.5 text-left align-top font-bold text-gray-900 w-24">DURÉE EN MIN</th>
        <th className="border border-slate-300 p-1.5 text-left align-top font-bold text-gray-900">LUNDI</th>
        <th className="border border-slate-300 p-1.5 text-left align-top font-bold text-gray-900">MARDI</th>
        <th className="border border-slate-300 p-1.5 text-left align-top font-bold text-gray-900">MERCREDI</th>
        <th className="border border-slate-300 p-1.5 text-left align-top font-bold text-gray-900">JEUDI</th>
        <th className="border border-slate-300 p-1.5 text-left align-top font-bold text-gray-900">VENDREDI</th>
      </tr>
    </thead>
  )

    const TitleHeader = ({ title }: { title: string }) => (
    <div className="text-center mb-8 mt-4">
      <h2 className="text-xl sm:text-2xl font-black text-blue-700 underline underline-offset-4 decoration-4 uppercase tracking-wide">{title}</h2>
    </div>
  )

  const renderMaternelle = () => (
    <div className="overflow-x-auto">
      <TitleHeader title="EMPLOI DU TEMPS DU PRESCOLAIRE" />
      <table className="w-full min-w-[800px] border-collapse bg-white text-[13px] font-medium text-slate-700">
        <TheadBase />
        <tbody>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-semibold whitespace-nowrap font-semibold text-slate-900">7H 00 - 8H 00</td>
            <td className="border border-slate-300 p-1.5 text-left align-top bg-blue-50/80"></td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">ACCUEIL ET MENAGE</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">8H 00 - 8H 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">30</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">EPS : <span className="italic">Gymnastique</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">EPS : <span className="italic">Gymnastique</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">EPS : <span className="italic">Gymnastique</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">EPS : <span className="italic">Gymnastique</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">EPS : <span className="italic">Gymnastique</span></td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">8H 30 - 9H 00</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Mathématiques</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Sciences et Technologie</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Mathématiques</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Sciences et Technologie</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Sciences et Technologie</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">9H 00 - 9H 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">30</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">ES : Jeux individuels</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">ES : Jeux individuels</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">ES : Jeux individuels</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">ES : Jeux individuels</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Mathématiques</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-semibold whitespace-nowrap font-semibold text-slate-900">9H 30 - 10H 00</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80">30</td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">10H 00 - 10H 20</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">LC : <span className="italic">J'apprends à parler</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">LC : <span className="italic">J'apprends à parler</span></td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">LC : <span className="italic">J'apprends à parler</span></td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">10H 20 - 10H 40</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">LC : <span className="italic">J'apprends à lire</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">LC : <span className="italic">J'apprends à lire</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">EAC : <span className="italic">Éducation musicale et poétique</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">ES : ECM ou Prévention routière</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">LC : <span className="italic">J'apprends à lire</span></td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">10H 40 - 11H 00</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle italic">Éducation musicale et poétique</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">LC : <span className="italic">J'apprends à lire</span></td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-semibold whitespace-nowrap font-semibold text-slate-900">11H 00 - 15H 00</td>
            <td className="border border-slate-300 p-1.5 text-left align-top bg-blue-50/80"></td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest tracking-[0.2em]">INTER-CLASSE</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-semibold whitespace-nowrap font-semibold text-slate-900">15H 00 - 15H 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80">30</td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">ACCUEIL ET REPOS</td>
            <td rowSpan={4} className="border border-slate-300 p-1.5 text-center align-middle font-bold">LIBRE</td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">ACCUEIL ET REPOS</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">15H 30 - 16H 00</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">30</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">LC : <span className="italic">J'apprends à écrire</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">LC : <span className="italic">J'apprends à écrire</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">LC : <span className="italic">J'apprends à écrire</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">EAC : <span className="italic">Activités créatrices et manuelles</span></td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-semibold whitespace-nowrap font-semibold text-slate-900">16H 00 - 16H 30</td>
            <td className="border border-slate-300 p-1.5 text-left align-top bg-blue-50/80"></td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">RECREATION</td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">16H 30 - 17H 00</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">30</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">ES : ECM ou Prévention routière</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">EAC : <span className="italic">Activités créatrices et manuelles</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">EPS : <span className="italic">Jeux collectifs</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">EPS : <span className="italic">Jeux collectifs</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  const renderCP = () => (
    <div className="overflow-x-auto">
      <TitleHeader title="EMPLOI DE TEMPS AU COURS PRÉPARATOIRE (CP)" />
      <table className="w-full min-w-[800px] border-collapse bg-white text-[13px] font-medium text-slate-700">
        <TheadBase />
        <tbody>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold whitespace-nowrap font-semibold text-slate-900">07H 20 - 07H 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold">10 min</td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">MONTEE DES COULEURS</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">07H 30 - 07H 45</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">15 min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation sociale</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation sociale</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation sociale</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">Education sociale : Prévention routière</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">07H 45 - 08H 05</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">08H 05 - 08H 25</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">08H 25 - 08H 45</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">08H 45 - 09H 10</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">25min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold whitespace-nowrap font-semibold text-slate-900">09H 10 - 09H 30</td>
            <td className="border border-slate-300 p-1.5 text-left align-top bg-blue-50/80"></td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest tracking-[0.2em]">R E C R E A T I O N</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">09H 30 - 10H 20</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">60min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Mathématiques</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Mathématiques</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Mathématiques</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Mathématiques</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Mathématiques</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">10H 20 - 10H 40</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">10H 40 - 11H 00</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">11H 00 - 11H 15</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">15min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">11H 15 - 11H 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">15min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à dire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation musicale</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à dire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation musicale</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à dire</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold whitespace-nowrap font-semibold text-slate-900">11H 30 - 15H 00</td>
            <td className="border border-slate-300 p-1.5 text-left align-top bg-blue-50/80"></td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest tracking-[0.2em]">I N T E R C L A S S E</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">15H 00 - 15H 20</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td rowSpan={6} className="border border-slate-300 p-1.5 text-center align-middle font-bold">LIBRE</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">15H 20 - 15H 45</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">15H 40 - 16H 05</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">25min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Arts plastiques</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Arts plastiques</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Arts plastiques</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold whitespace-nowrap font-semibold text-slate-900">16H 05 - 16H 15</td>
            <td className="border border-slate-300 p-1.5 text-left align-top bg-blue-50/80"></td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest tracking-[0.2em]">R E C R E A T I O N</td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest tracking-[0.2em]">R E C R E A T I O N</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">16H 15 - 16H 35</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">16H 35 - 17H 00</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">25min</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">EPS</td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle">EPS</td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  const renderCE = () => (
    <div className="overflow-x-auto">
      <TitleHeader title="EMPLOI DU TEMPS DU COURS ELEMENTAIRE (CE)" />
      <table className="w-full min-w-[800px] border-collapse bg-white text-[13px] font-medium text-slate-700">
        <TheadBase />
        <tbody>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold whitespace-nowrap font-semibold text-slate-900">07h 20 - 07h 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold">10</td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">MONTEE DES COULEURS</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">07h 30 - 07h 50</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20</td>
            <td colSpan={3} className="border border-slate-300 p-1.5 text-left align-top">Education Sociale (Education Civique et Morale)</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Education Sociale (Prévention Routière)</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Sciences et Technologie</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">07h 50 - 08h 10</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20</td>
            <td colSpan={3} className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
            <td rowSpan={2} className="border border-slate-300 p-1.5 text-center align-middle">Mathématiques</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Consolidation Mathématiques</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">08h 10 - 09h 10</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">60</td>
            <td colSpan={3} className="border border-slate-300 p-1.5 text-center align-middle">Mathématiques</td>
            <td rowSpan={3} className="border border-slate-300 p-1.5 text-left align-top">Education Artistique et Culturelle Arts Plastiques</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold whitespace-nowrap font-semibold text-slate-900">09h 10 - 09h 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80">20</td>
            <td colSpan={4} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">09h 30 - 10h 00</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">30</td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler (Expression Orale)</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à parler (Expression Orale)</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">Anglais</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">10h 00 - 10h 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">30</td>
            <td colSpan={3} className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Je manipule les phrases 2 (Conjugaison)</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">Anglais</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">10h 30 - 11h 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">60</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">J'utilise des mots nouveaux (Vocabulaire) (30') <span className="bg-yellow-300 px-1 font-semibold">Anglais</span> (30')</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">J'utilise des mots nouveaux (Vocabulaire) (30') <span className="bg-yellow-300 px-1 font-semibold">Anglais</span> (30')</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">Je manipule les phrases 1 (Grammaire) (30') <span className="bg-yellow-300 px-1 font-semibold">Anglais</span> (30')</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">Je sais utiliser ce que j'ai Appris cette semaine</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation Physique Et Sportive</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold whitespace-nowrap font-semibold text-slate-900">11h 30 - 15h 00</td>
            <td className="border border-slate-300 p-1.5 text-left align-top bg-blue-50/80"></td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest tracking-[0.2em]">INTERCLASSE</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">15h 00 - 15h 40</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">40</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Sciences et Technologie</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Sciences Humaines (Géographie)</td>
            <td rowSpan={2} className="border border-slate-300 p-1.5 text-center align-middle font-bold">LIBRE</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Sciences Humaines (Histoire)</td>
            <td rowSpan={2} className="border border-slate-300 p-1.5 text-left align-top">Éducation Artistique et Culturelle (Activités Créatrices Manuelle (ACM) et Activités Créatrices Sur Textile "ACT")</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">15h 40 - 16h 10</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">30</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">Education Artistique et Culturelle (Arts Plastiques)</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Je sais écrire les mots (Orthographe)</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Je produis un texte (Expression Écrite)</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold whitespace-nowrap font-semibold text-slate-900">16h 10 - 16h 20</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80">10</td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">16h 20 - 16h 40</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à dire</td>
            <td rowSpan={2} className="border border-slate-300 p-1.5 text-center align-middle">Education Physique et Sportive</td>
            <td rowSpan={2} className="border border-slate-300 p-1.5 text-center align-middle font-bold">LIBRE</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à dire</td>
            <td rowSpan={2} className="border border-slate-300 p-1.5 text-left align-top">Education Artistique et Culturelle (Education Musicale)</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">16h 40 - 17h 00</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">Education Artistique et Culturelle (Education Musicale)</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">Education Artistique et Culturelle (Education Musicale)</td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  const renderCM = () => (
    <div className="overflow-x-auto">
      <TitleHeader title="EMPLOI DU TEMPS DU COURS MOYEN (CM)" />
      <table className="w-full min-w-[800px] border-collapse bg-white text-[13px] font-medium text-slate-700">
        <TheadBase />
        <tbody>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold whitespace-nowrap font-semibold text-slate-900">07H 20 - 07H 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold">10</td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">MONTÉE DES COULEURS</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">07H 30 - 07H 50</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">Éducation Sociale 1 (Éducation civique et morale)</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation Sociale 1</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS (40')</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">Éducation Sociale 2 (Prévention routière)</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">07H 50 - 08H 10</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">20</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à écrire</td>
            <td className="border border-slate-300 p-1.5 text-left align-top"></td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation Sociale 2</td>
            <td className="border border-slate-300 p-1.5 text-left align-top"></td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">08H 10 - 09H 10</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">60</td>
            <td colSpan={3} className="border border-slate-300 p-1.5 text-center align-middle">Mathématiques (60')</td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle">Dictée-Questions ou Étude de Texte</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold whitespace-nowrap font-semibold text-slate-900">09H 10 - 09H 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80">20</td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">09H 30 - 10H 10</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">40</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">Compte rendu de rédaction ou d'étude de texte</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">J'apprends à lire</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Je manipule les phrases 2</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Contrôle orthographique</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-yellow-300 font-semibold">ANGLAIS (40')</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">10H 10 - 11H 30</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">80</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">J'apprends à parler (20') <span className="bg-yellow-300 px-1 font-semibold">ANGLAIS (40')</span> Éducation musicale (20')</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">J'utilise des mots nouveaux (30') Je sais écrire les mots (20') <span className="bg-yellow-300 px-1 font-semibold">ANGLAIS (30')</span></td>
            <td className="border border-slate-300 p-1.5 text-left align-top">Je sais écrire les mots (20') J'apprends à dire (20') Sciences et Technologie (40')</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle"><span className="bg-yellow-300 px-1 font-semibold">ANGLAIS (40')</span> Je produis un texte (40')</td>
            <td className="border border-slate-300 p-1.5 text-left align-top">Correction des exercices de mathématique Problème Calcul mental</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-left align-top bg-blue-50/80 font-bold"></td>
            <td className="border border-slate-300 p-1.5 text-left align-top bg-blue-50/80"></td>
            <td colSpan={5} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest tracking-[0.2em]">INTERCLASSE</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">15H 00 - 15H 40</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">40</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Je manipule les phrases 1</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Sciences humaines 1</td>
            <td rowSpan={3} className="border border-slate-300 p-1.5 text-center align-middle font-bold">LIBRE</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Sciences humaines 2</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Devoir de leçons</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">15H 40 - 16H 05</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">25</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation artistique</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Cartographie</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation artistique</td>
            <td rowSpan={3} className="border border-slate-300 p-1.5 text-center align-middle">Activités Manuelles</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80 font-bold whitespace-nowrap font-semibold text-slate-900">16H 05 - 16H 15</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle bg-blue-50/80">10</td>
            <td colSpan={2} className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest tracking-[0.2em]">RECREATION</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle font-bold bg-blue-50/80 text-blue-900 uppercase tracking-widest tracking-[0.2em]">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-1.5 text-center align-middle whitespace-nowrap font-semibold text-slate-900">16H 15 - 17H 00</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">45</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Sciences et Technologie</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation Physique et Sportive</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle font-bold">LIBRE</td>
            <td className="border border-slate-300 p-1.5 text-center align-middle">Éducation Physique et Sportive</td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="w-full bg-white p-4 sm:p-6 rounded-xl border border-[var(--color-outline-variant)] shadow-sm">
      {level === 'maternelle' && renderMaternelle()}
      {level === 'cp' && renderCP()}
      {level === 'ce' && renderCE()}
      {level === 'cm' && renderCM()}
    </div>
  )
}
