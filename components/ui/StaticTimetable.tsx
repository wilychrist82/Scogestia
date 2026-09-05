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
      <tr className="bg-[#fce4d6]">
        <th className="border border-gray-400 p-2 text-center font-bold text-gray-900 w-28">HORAIRES</th>
        <th className="border border-gray-400 p-2 text-center font-bold text-gray-900 w-24">DURÉE EN MIN</th>
        <th className="border border-gray-400 p-2 text-center font-bold text-gray-900">LUNDI</th>
        <th className="border border-gray-400 p-2 text-center font-bold text-gray-900">MARDI</th>
        <th className="border border-gray-400 p-2 text-center font-bold text-gray-900">MERCREDI</th>
        <th className="border border-gray-400 p-2 text-center font-bold text-gray-900">JEUDI</th>
        <th className="border border-gray-400 p-2 text-center font-bold text-gray-900">VENDREDI</th>
      </tr>
    </thead>
  )

  const TitleHeader = ({ title }: { title: string }) => (
    <div className="text-center mb-6">
      <div className="flex items-start justify-between mt-4 text-[10px] font-bold">
        <div className="flex flex-col items-center text-center">
          <span>MINISTERE DES ENSEIGNEMENTS</span>
          <span>PRIMAIRE ET SECONDAIRE</span>
          <span>---------------</span>
          <span>CABINET</span>
          <span>---------------</span>
          <span>SECRETARIAT GENERAL</span>
        </div>
        <div className="flex flex-col items-center mt-[-10px]">
          <span className="material-symbols-outlined text-5xl text-green-600">public</span>
        </div>
        <div className="flex flex-col items-center text-center text-blue-800">
          <span>REPUBLIQUE TOGOLAISE</span>
          <span>TRAVAIL - LIBERTE - PATRIE</span>
        </div>
      </div>
      <h2 className="text-lg font-bold underline mt-6 uppercase">{title}</h2>
    </div>
  )

  const renderMaternelle = () => (
    <div className="overflow-x-auto">
      <TitleHeader title="EMPLOI DU TEMPS DU PRESCOLAIRE" />
      <table className="w-full min-w-[800px] border-collapse bg-white text-sm">
        <TheadBase />
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-semibold">7H 00 - 8H 00</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]"></td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">ACCUEIL ET MENAGE</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">8H 00 - 8H 30</td>
            <td className="border border-gray-400 p-2 text-center">30</td>
            <td className="border border-gray-400 p-2 text-center">EPS :<br/><span className="italic">Gymnastique</span></td>
            <td className="border border-gray-400 p-2 text-center">EPS :<br/><span className="italic">Gymnastique</span></td>
            <td className="border border-gray-400 p-2 text-center">EPS :<br/><span className="italic">Gymnastique</span></td>
            <td className="border border-gray-400 p-2 text-center">EPS :<br/><span className="italic">Gymnastique</span></td>
            <td className="border border-gray-400 p-2 text-center">EPS :<br/><span className="italic">Gymnastique</span></td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">8H 30 - 9H 00</td>
            <td className="border border-gray-400 p-2 text-center">30</td>
            <td className="border border-gray-400 p-2 text-center">Mathématiques</td>
            <td className="border border-gray-400 p-2 text-center">Sciences et Technologie</td>
            <td className="border border-gray-400 p-2 text-center">Mathématiques</td>
            <td className="border border-gray-400 p-2 text-center">Sciences et Technologie</td>
            <td className="border border-gray-400 p-2 text-center">Sciences et Technologie</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">9H 00 - 9H 30</td>
            <td className="border border-gray-400 p-2 text-center">30</td>
            <td className="border border-gray-400 p-2 text-center">ES :<br/>Jeux individuels</td>
            <td className="border border-gray-400 p-2 text-center">ES :<br/>Jeux individuels</td>
            <td className="border border-gray-400 p-2 text-center">ES :<br/>Jeux individuels</td>
            <td className="border border-gray-400 p-2 text-center">ES :<br/>Jeux individuels</td>
            <td className="border border-gray-400 p-2 text-center">Mathématiques</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-semibold">9H 30 - 10H 00</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]">30</td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">10H 00 - 10H 20</td>
            <td className="border border-gray-400 p-2 text-center">20</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-gray-400 p-2 text-center">LC :<br/><span className="italic">J'apprends à parler</span></td>
            <td className="border border-gray-400 p-2 text-center">LC :<br/><span className="italic">J'apprends à parler</span></td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-gray-400 p-2 text-center">LC :<br/><span className="italic">J'apprends à parler</span></td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">10H 20 - 10H 40</td>
            <td className="border border-gray-400 p-2 text-center">20</td>
            <td className="border border-gray-400 p-2 text-center">LC :<br/><span className="italic">J'apprends à lire</span></td>
            <td className="border border-gray-400 p-2 text-center">LC :<br/><span className="italic">J'apprends à lire</span></td>
            <td className="border border-gray-400 p-2 text-center">EAC :<br/><span className="italic">Éducation musicale et poétique</span></td>
            <td className="border border-gray-400 p-2 text-center">ES :<br/>ECM ou Prévention routière</td>
            <td className="border border-gray-400 p-2 text-center">LC :<br/><span className="italic">J'apprends à lire</span></td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">10H 40 - 11H 00</td>
            <td className="border border-gray-400 p-2 text-center">20</td>
            <td className="border border-gray-400 p-2 text-center italic">Éducation musicale et poétique</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-gray-400 p-2 text-center">LC :<br/><span className="italic">J'apprends à lire</span></td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-semibold">11H 00 - 15H 00</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]"></td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7] tracking-[0.2em]">INTER-CLASSE</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-semibold">15H 00 - 15H 30</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]">30</td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">ACCUEIL ET REPOS</td>
            <td rowSpan={4} className="border border-gray-400 p-2 text-center font-bold">LIBRE</td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">ACCUEIL ET REPOS</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">15H 30 - 16H 00</td>
            <td className="border border-gray-400 p-2 text-center">30</td>
            <td className="border border-gray-400 p-2 text-center">LC :<br/><span className="italic">J'apprends à écrire</span></td>
            <td className="border border-gray-400 p-2 text-center">LC :<br/><span className="italic">J'apprends à écrire</span></td>
            <td className="border border-gray-400 p-2 text-center">LC :<br/><span className="italic">J'apprends à écrire</span></td>
            <td className="border border-gray-400 p-2 text-center">EAC :<br/><span className="italic">Activités créatrices et manuelles</span></td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-semibold">16H 00 - 16H 30</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]"></td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">RECREATION</td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">16H 30 - 17H 00</td>
            <td className="border border-gray-400 p-2 text-center">30</td>
            <td className="border border-gray-400 p-2 text-center">ES :<br/>ECM ou Prévention routière</td>
            <td className="border border-gray-400 p-2 text-center">EAC :<br/><span className="italic">Activités créatrices et manuelles</span></td>
            <td className="border border-gray-400 p-2 text-center">EPS :<br/><span className="italic">Jeux collectifs</span></td>
            <td className="border border-gray-400 p-2 text-center">EPS :<br/><span className="italic">Jeux collectifs</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  const renderCP = () => (
    <div className="overflow-x-auto">
      <TitleHeader title="EMPLOI DE TEMPS AU COURS PRÉPARATOIRE (CP)" />
      <table className="w-full min-w-[800px] border-collapse bg-white text-sm">
        <TheadBase />
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">07H 20 - 07H 30</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">10 min</td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">MONTEE DES COULEURS</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">07H 30 - 07H 45</td>
            <td className="border border-gray-400 p-2 text-center">15 min</td>
            <td className="border border-gray-400 p-2 text-center">Éducation sociale</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-gray-400 p-2 text-center">Éducation sociale</td>
            <td className="border border-gray-400 p-2 text-center">Éducation sociale</td>
            <td className="border border-gray-400 p-2 text-center">Education sociale :<br/>Prévention routière</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">07H 45 - 08H 05</td>
            <td className="border border-gray-400 p-2 text-center">20min</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">08H 05 - 08H 25</td>
            <td className="border border-gray-400 p-2 text-center">20min</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">08H 25 - 08H 45</td>
            <td className="border border-gray-400 p-2 text-center">20min</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">08H 45 - 09H 10</td>
            <td className="border border-gray-400 p-2 text-center">25min</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">09H 10 - 09H 30</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]"></td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7] tracking-[0.2em]">R E C R E A T I O N</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">09H 30 - 10H 20</td>
            <td className="border border-gray-400 p-2 text-center">60min</td>
            <td className="border border-gray-400 p-2 text-center">Mathématiques</td>
            <td className="border border-gray-400 p-2 text-center">Mathématiques</td>
            <td className="border border-gray-400 p-2 text-center">Mathématiques</td>
            <td className="border border-gray-400 p-2 text-center">Mathématiques</td>
            <td className="border border-gray-400 p-2 text-center">Mathématiques</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">10H 20 - 10H 40</td>
            <td className="border border-gray-400 p-2 text-center">20min</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">10H 40 - 11H 00</td>
            <td className="border border-gray-400 p-2 text-center">20min</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">11H 00 - 11H 15</td>
            <td className="border border-gray-400 p-2 text-center">15min</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">11H 15 - 11H 30</td>
            <td className="border border-gray-400 p-2 text-center">15min</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à dire</td>
            <td className="border border-gray-400 p-2 text-center">Éducation musicale</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à dire</td>
            <td className="border border-gray-400 p-2 text-center">Éducation musicale</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à dire</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">11H 30 - 15H 00</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]"></td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7] tracking-[0.2em]">I N T E R C L A S S E</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">15H 00 - 15H 20</td>
            <td className="border border-gray-400 p-2 text-center">20min</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td rowSpan={6} className="border border-gray-400 p-2 text-center font-bold">LIBRE</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">15H 20 - 15H 45</td>
            <td className="border border-gray-400 p-2 text-center">20min</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">15H 40 - 16H 05</td>
            <td className="border border-gray-400 p-2 text-center">25min</td>
            <td className="border border-gray-400 p-2 text-center">Arts plastiques</td>
            <td className="border border-gray-400 p-2 text-center">Arts plastiques</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">Arts plastiques</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">16H 05 - 16H 15</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]"></td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7] tracking-[0.2em]">R E C R E A T I O N</td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7] tracking-[0.2em]">R E C R E A T I O N</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">16H 15 - 16H 35</td>
            <td className="border border-gray-400 p-2 text-center">20min</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">16H 35 - 17H 00</td>
            <td className="border border-gray-400 p-2 text-center">25min</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler</td>
            <td className="border border-gray-400 p-2 text-center">EPS</td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center">EPS</td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  const renderCE = () => (
    <div className="overflow-x-auto">
      <TitleHeader title="EMPLOI DU TEMPS DU COURS ELEMENTAIRE (CE)" />
      <table className="w-full min-w-[800px] border-collapse bg-white text-sm">
        <TheadBase />
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">07h 20 - 07h 30</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">10</td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">MONTEE DES COULEURS</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">07h 30 - 07h 50</td>
            <td className="border border-gray-400 p-2 text-center">20</td>
            <td colSpan={3} className="border border-gray-400 p-2 text-center">Education Sociale (Education Civique et Morale)</td>
            <td className="border border-gray-400 p-2 text-center">Education Sociale<br/>(Prévention Routière)</td>
            <td className="border border-gray-400 p-2 text-center">Sciences et<br/>Technologie</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">07h 50 - 08h 10</td>
            <td className="border border-gray-400 p-2 text-center">20</td>
            <td colSpan={3} className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
            <td rowSpan={2} className="border border-gray-400 p-2 text-center">Mathématiques</td>
            <td className="border border-gray-400 p-2 text-center">Consolidation<br/>Mathématiques</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">08h 10 - 09h 10</td>
            <td className="border border-gray-400 p-2 text-center">60</td>
            <td colSpan={3} className="border border-gray-400 p-2 text-center">Mathématiques</td>
            <td rowSpan={3} className="border border-gray-400 p-2 text-center">Education Artistique et<br/>Culturelle<br/>Arts Plastiques</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">09h 10 - 09h 30</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]">20</td>
            <td colSpan={4} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">09h 30 - 10h 00</td>
            <td className="border border-gray-400 p-2 text-center">30</td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center">J'apprends à parler (Expression Orale)</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à<br/>parler (Expression Orale)</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">Anglais</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">10h 00 - 10h 30</td>
            <td className="border border-gray-400 p-2 text-center">30</td>
            <td colSpan={3} className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">Je manipule les phrases 2<br/>(Conjugaison)</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">Anglais</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">10h 30 - 11h 30</td>
            <td className="border border-gray-400 p-2 text-center">60</td>
            <td className="border border-gray-400 p-2 text-center">J'utilise des mots nouveaux<br/>(Vocabulaire) (30')<br/><span className="bg-yellow-300 px-1 font-semibold">Anglais</span> (30')</td>
            <td className="border border-gray-400 p-2 text-center">J'utilise des mots nouveaux<br/>(Vocabulaire) (30')<br/><span className="bg-yellow-300 px-1 font-semibold">Anglais</span> (30')</td>
            <td className="border border-gray-400 p-2 text-center">Je manipule les<br/>phrases 1<br/>(Grammaire) (30')<br/><span className="bg-yellow-300 px-1 font-semibold">Anglais</span> (30')</td>
            <td className="border border-gray-400 p-2 text-center">Je sais utiliser ce que<br/>j'ai Appris cette<br/>semaine</td>
            <td className="border border-gray-400 p-2 text-center">Éducation Physique Et<br/>Sportive</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">11h 30 - 15h 00</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]"></td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7] tracking-[0.2em]">INTERCLASSE</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">15h 00 - 15h 40</td>
            <td className="border border-gray-400 p-2 text-center">40</td>
            <td className="border border-gray-400 p-2 text-center">Sciences et Technologie</td>
            <td className="border border-gray-400 p-2 text-center">Sciences Humaines<br/>(Géographie)</td>
            <td rowSpan={2} className="border border-gray-400 p-2 text-center font-bold">LIBRE</td>
            <td className="border border-gray-400 p-2 text-center">Sciences Humaines<br/>(Histoire)</td>
            <td rowSpan={2} className="border border-gray-400 p-2 text-center">Éducation Artistique et<br/>Culturelle<br/>(Activités Créatrices Manuelle (ACM)<br/>et Activités Créatrices Sur Textile "ACT")</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">15h 40 - 16h 10</td>
            <td className="border border-gray-400 p-2 text-center">30</td>
            <td className="border border-gray-400 p-2 text-center">Education Artistique et Culturelle<br/>(Arts Plastiques)</td>
            <td className="border border-gray-400 p-2 text-center">Je sais écrire les mots<br/>(Orthographe)</td>
            <td className="border border-gray-400 p-2 text-center">Je produis un texte<br/>(Expression Écrite)</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">16h 10 - 16h 20</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]">10</td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">16h 20 - 16h 40</td>
            <td className="border border-gray-400 p-2 text-center">20</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à dire</td>
            <td rowSpan={2} className="border border-gray-400 p-2 text-center">Education Physique et Sportive</td>
            <td rowSpan={2} className="border border-gray-400 p-2 text-center font-bold">LIBRE</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à dire</td>
            <td rowSpan={2} className="border border-gray-400 p-2 text-center">Education Artistique et<br/>Culturelle (Education Musicale)</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">16h 40 - 17h 00</td>
            <td className="border border-gray-400 p-2 text-center">20</td>
            <td className="border border-gray-400 p-2 text-center">Education Artistique et Culturelle<br/>(Education Musicale)</td>
            <td className="border border-gray-400 p-2 text-center">Education Artistique et<br/>Culturelle (Education Musicale)</td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  const renderCM = () => (
    <div className="overflow-x-auto">
      <TitleHeader title="EMPLOI DU TEMPS DU COURS MOYEN (CM)" />
      <table className="w-full min-w-[800px] border-collapse bg-white text-sm">
        <TheadBase />
        <tbody>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">07H 20 - 07H 30</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">10</td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">MONTÉE DES COULEURS</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">07H 30 - 07H 50</td>
            <td className="border border-gray-400 p-2 text-center">20</td>
            <td className="border border-gray-400 p-2 text-center">Éducation Sociale 1<br/>(Éducation civique et morale)</td>
            <td className="border border-gray-400 p-2 text-center">Éducation Sociale 1</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS (40')</td>
            <td className="border border-gray-400 p-2 text-center">Éducation Sociale 2<br/>(Prévention routière)</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">07H 50 - 08H 10</td>
            <td className="border border-gray-400 p-2 text-center">20</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à écrire</td>
            <td className="border border-gray-400 p-2 text-center"></td>
            <td className="border border-gray-400 p-2 text-center">Éducation Sociale 2</td>
            <td className="border border-gray-400 p-2 text-center"></td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">08H 10 - 09H 10</td>
            <td className="border border-gray-400 p-2 text-center">60</td>
            <td colSpan={3} className="border border-gray-400 p-2 text-center">Mathématiques (60')</td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center">Dictée-Questions ou<br/>Étude de Texte</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">09H 10 - 09H 30</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]">20</td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7]">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">09H 30 - 10H 10</td>
            <td className="border border-gray-400 p-2 text-center">40</td>
            <td className="border border-gray-400 p-2 text-center">Compte rendu de<br/>rédaction ou d'étude de texte</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à lire</td>
            <td className="border border-gray-400 p-2 text-center">Je manipule les phrases 2</td>
            <td className="border border-gray-400 p-2 text-center">Contrôle orthographique</td>
            <td className="border border-gray-400 p-2 text-center bg-yellow-300 font-semibold">ANGLAIS (40')</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">10H 10 - 11H 30</td>
            <td className="border border-gray-400 p-2 text-center">80</td>
            <td className="border border-gray-400 p-2 text-center">J'apprends à parler (20')<br/><span className="bg-yellow-300 px-1 font-semibold">ANGLAIS (40')</span><br/>Éducation musicale (20')</td>
            <td className="border border-gray-400 p-2 text-center">J'utilise des mots nouveaux (30')<br/>Je sais écrire les mots (20')<br/><span className="bg-yellow-300 px-1 font-semibold">ANGLAIS (30')</span></td>
            <td className="border border-gray-400 p-2 text-center">Je sais écrire les mots (20')<br/>J'apprends à dire (20')<br/>Sciences et Technologie (40')</td>
            <td className="border border-gray-400 p-2 text-center"><span className="bg-yellow-300 px-1 font-semibold">ANGLAIS (40')</span><br/>Je produis un texte (40')</td>
            <td className="border border-gray-400 p-2 text-center">Correction des exercices<br/>de mathématique<br/>Problème Calcul mental</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold"></td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]"></td>
            <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7] tracking-[0.2em]">INTERCLASSE</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">15H 00 - 15H 40</td>
            <td className="border border-gray-400 p-2 text-center">40</td>
            <td className="border border-gray-400 p-2 text-center">Je manipule les phrases 1</td>
            <td className="border border-gray-400 p-2 text-center">Sciences humaines 1</td>
            <td rowSpan={3} className="border border-gray-400 p-2 text-center font-bold">LIBRE</td>
            <td className="border border-gray-400 p-2 text-center">Sciences humaines 2</td>
            <td className="border border-gray-400 p-2 text-center">Devoir de leçons</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">15H 40 - 16H 05</td>
            <td className="border border-gray-400 p-2 text-center">25</td>
            <td className="border border-gray-400 p-2 text-center">Éducation artistique</td>
            <td className="border border-gray-400 p-2 text-center">Cartographie</td>
            <td className="border border-gray-400 p-2 text-center">Éducation artistique</td>
            <td rowSpan={3} className="border border-gray-400 p-2 text-center">Activités Manuelles</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7] font-bold">16H 05 - 16H 15</td>
            <td className="border border-gray-400 p-2 text-center bg-[#ddebf7]">10</td>
            <td colSpan={2} className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7] tracking-[0.2em]">RECREATION</td>
            <td className="border border-gray-400 p-2 text-center font-bold bg-[#ddebf7] tracking-[0.2em]">RECREATION</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-2 text-center">16H 15 - 17H 00</td>
            <td className="border border-gray-400 p-2 text-center">45</td>
            <td className="border border-gray-400 p-2 text-center">Sciences et Technologie</td>
            <td className="border border-gray-400 p-2 text-center">Éducation Physique et<br/>Sportive</td>
            <td className="border border-gray-400 p-2 text-center font-bold">LIBRE</td>
            <td className="border border-gray-400 p-2 text-center">Éducation Physique et<br/>Sportive</td>
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
