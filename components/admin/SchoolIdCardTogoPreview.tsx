'use client'

import React, { useId, useMemo } from 'react'
import {
  DEFAULT_CARD_TYPOGRAPHY,
  type CardFontFamily,
  type CardTypographyConfig,
  type CardZoneTextStyle,
} from '@/lib/pdf/student-documents'
import {
  buildStudentQrPayload,
  formatAcademicYearLabel,
  formatCardDateFr,
  formatIeppHeaderDisplay,
  generateQrMatrix,
  sanitizeIeppText,
} from '@/lib/pdf/togo-iepp-card'

export interface TogoPreviewStudent {
  id: string
  matricule: string
  first_name: string
  last_name: string
  date_of_birth?: string | null
  birth_place?: string | null
  gender?: string | null
  avatar_url?: string | null
}

interface Props {
  student: TogoPreviewStudent
  inspectionName: string
  schoolName: string
  examCenter: string
  cardBannerTitle: string
  academicYear: string
  className: string
  directorName: string
  logoUrl?: string
  stampUrl?: string
  signatureUrl?: string
  showVectorEmblemIfNoLogo: boolean
  showVectorStampIfNoStamp: boolean
  typography: CardTypographyConfig
  onPhotoTrigger?: () => void
}

function getCssFontFamily(fontFamily: CardFontFamily): string {
  switch (fontFamily) {
    case 'helvetica':
      return 'Arial, Helvetica, sans-serif'
    case 'verdana':
      return 'Verdana, Geneva, sans-serif'
    case 'courier':
      return '"Courier New", Courier, monospace'
    case 'georgia':
      return 'Georgia, Cambria, serif'
    case 'palatino':
      return '"Palatino Linotype", "Book Antiqua", Palatino, serif'
    default:
      return '"Times New Roman", Times, serif'
  }
}

function buildTextCss(zone: CardZoneTextStyle, basePx: number, overrideColor?: string): React.CSSProperties {
  const scale = Math.max(0.75, Math.min(1.4, zone.sizeScale || 1))
  return {
    fontFamily: getCssFontFamily(zone.fontFamily),
    fontSize: `${(basePx * scale).toFixed(1)}px`,
    fontWeight: zone.bold ? 800 : 500,
    fontStyle: zone.italic ? 'italic' : 'normal',
    textDecoration: zone.underline ? 'underline' : 'none',
    color: overrideColor || zone.color,
  }
}

export function SchoolIdCardTogoPreview({
  student,
  inspectionName,
  schoolName,
  examCenter,
  cardBannerTitle,
  academicYear,
  className,
  directorName,
  logoUrl,
  stampUrl,
  signatureUrl,
  showVectorEmblemIfNoLogo,
  showVectorStampIfNoStamp,
  typography,
  onPhotoTrigger,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const glowId = `togoCardGlow-${uid}`
  const greenId = `togoRibbonGreen-${uid}`
  const goldId = `togoRibbonGold-${uid}`
  const redId = `togoRibbonRed-${uid}`
  const flagShadeId = `flagShade-${uid}`
  const stampArcId = `stampTopArc-${uid}`
  const mapBlurId = `togoMapBlur-${uid}`

  const typo: CardTypographyConfig = {
    ...DEFAULT_CARD_TYPOGRAPHY,
    ...typography,
  }

  const displayIepp = formatIeppHeaderDisplay(inspectionName, typo.headerOfficial.uppercase)

  const cleanSchoolName = (schoolName || 'ÉTABLISSEMENT SCOLAIRE').trim()
  const displaySchoolName = typo.schoolName.uppercase
    ? cleanSchoolName.toUpperCase()
    : cleanSchoolName

  const schoolBasePx =
    displaySchoolName.length > 34
      ? 9.2
      : displaySchoolName.length > 24
        ? 10.2
        : 11.4

  const cleanExamCenter = examCenter.trim()
  const displayExamCenter = cleanExamCenter
    ? `Centre d'écrit : ${cleanExamCenter}`
    : "Centre d'écrit : ........................"

  const rawBanner = cardBannerTitle.trim()
  const displayBannerTitle =
    !rawBanner || rawBanner.toUpperCase() === "CARTE D'IDENTITE SCOLAIRE"
      ? "CARTE D'IDENTITÉ SCOLAIRE"
      : rawBanner.toUpperCase()

  const formattedDob = formatCardDateFr(student.date_of_birth)
  const birthPlaceText = (student.birth_place || '').trim()
  const formattedYear = formatAcademicYearLabel(academicYear)

  const genderCode = (student.gender || '').trim().toUpperCase()
  const sexDisplay =
    genderCode === 'M' || genderCode.startsWith('MASC')
      ? 'Masculin'
      : genderCode === 'F' || genderCode.startsWith('FEM')
        ? 'Féminin'
        : ''

  const qrMatrix = useMemo(
    () =>
      generateQrMatrix(
        buildStudentQrPayload({
          matricule: student.matricule || 'N/A',
          lastName: student.last_name,
          firstName: student.first_name,
          className,
          schoolName: (schoolName || 'ÉTABLISSEMENT SCOLAIRE').trim(),
          academicYear,
          inspectionName: sanitizeIeppText(inspectionName),
        })
      ),
    [
      student.matricule,
      student.last_name,
      student.first_name,
      className,
      schoolName,
      academicYear,
      inspectionName,
    ]
  )

  return (
    <div className="mx-auto w-full max-w-[500px] aspect-[94/53.5] relative rounded-xl overflow-hidden bg-[#FFFDF9] border border-slate-300 shadow-[0_14px_36px_-12px_rgba(15,23,42,0.3)] select-none text-slate-900">
      {/* COUCHE ARRIÈRE-PLAN : Voile lumineux + Bâtiment scolaire filigrane + Carte Togo floutée + Ruban bas */}
      <svg
        viewBox="0 0 940 535"
        preserveAspectRatio="none"
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full z-0"
      >
        <defs>
          <radialGradient id={glowId} cx="56%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#FFFDF9" stopOpacity="1" />
            <stop offset="70%" stopColor="#FEF7EC" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#F5ECE1" stopOpacity="0.85" />
          </radialGradient>
          <linearGradient id={greenId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#005E34" />
            <stop offset="50%" stopColor="#007A3D" />
            <stop offset="100%" stopColor="#005E34" />
          </linearGradient>
          <linearGradient id={goldId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#EAB308" />
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#E5A50A" />
          </linearGradient>
          <linearGradient id={redId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#B80C38" />
            <stop offset="50%" stopColor="#DC1446" />
            <stop offset="100%" stopColor="#9E053F" />
          </linearGradient>
          <filter id={mapBlurId} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        <rect x="0" y="0" width="940" height="535" fill={`url(#${glowId})`} />

        {/* Feuillage discret */}
        <g opacity="0.18" fill="#4D7C46">
          <ellipse cx="26" cy="145" rx="22" ry="9" transform="rotate(-24 26 145)" />
          <ellipse cx="44" cy="128" rx="18" ry="8" transform="rotate(-40 44 128)" />
          <ellipse cx="912" cy="182" rx="20" ry="8" transform="rotate(28 912 182)" />
          <ellipse cx="894" cy="166" rx="16" ry="7" transform="rotate(14 894 166)" />
        </g>

        {/* Bâtiment scolaire pastel très discret */}
        <g opacity="0.2">
          <polygon points="480,255 645,212 805,255" fill="#E8B9B9" />
          <rect x="492" y="255" width="302" height="122" fill="#F2DCDC" />
          <rect x="486" y="255" width="314" height="10" fill="#DFB6B6" />
          {[0, 1, 2, 3, 4, 5].map((c) => (
            <g key={c}>
              <rect x={515 + c * 44} y="274" width="24" height="32" rx="2" fill="#FFF7F7" />
              <rect x={515 + c * 44} y="320" width="24" height="34" rx="2" fill="#FFF7F7" />
            </g>
          ))}
        </g>

        {/* Carte du Togo à droite légèrement floue / opacité réduite façon filigrane */}
        <g transform="translate(756, 145)" opacity="0.34" filter={`url(#${mapBlurId})`}>
          <path
            d="M28,6 L64,4 L76,18 L92,24 L82,45 L108,58 L114,82 L130,104 L136,134 L148,162 L158,194 L146,218 L108,224 L85,208 L81,180 L68,160 L74,132 L58,108 L65,80 L40,56 L32,30 Z"
            fill="#F9CEE0"
            stroke="#DF7096"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <polygon
            points="96,86 102,102 119,102 105,112 110,128 96,118 82,128 87,112 73,102 90,102"
            fill="#E87DA5"
          />
          <text
            x="100"
            y="148"
            textAnchor="middle"
            fill="#D64D7C"
            fontSize="21"
            fontWeight="800"
            fontFamily="Arial, sans-serif"
            letterSpacing="1"
          >
            TOGO
          </text>
        </g>

        {/* Vague tricolore fine tout en bas */}
        <path
          d="M0,382 C18,472 86,508 230,517 C425,529 675,512 940,522 L940,535 L0,535 Z"
          fill={`url(#${greenId})`}
        />
        <path
          d="M0,418 C24,490 104,515 265,522 C470,532 700,516 940,526 L940,535 L0,535 Z"
          fill={`url(#${goldId})`}
        />
        <path
          d="M0,460 C38,508 130,522 308,527 C518,533 740,522 940,530 L940,535 L0,535 Z"
          fill={`url(#${redId})`}
        />
      </svg>

      {/* DRAPEAU TOGOLAIS FLOTTANT HAUT-DROIT */}
      <svg
        viewBox="0 0 220 112"
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 w-[23.5%] h-[20.5%] z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
      >
        <defs>
          <linearGradient id={flagShadeId} x1="0" y1="0" x2="1" y2="0.2">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="48%" stopColor="#000000" stopOpacity="0.16" />
            <stop offset="72%" stopColor="#FFFFFF" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path d="M8,6 Q66,18 135,6 T220,10 L220,30 Q145,24 135,28 T8,28 Z" fill="#006C3E" />
        <path d="M8,28 Q66,38 135,28 T220,30 L220,51 Q145,44 135,48 T8,49 Z" fill="#FACC15" />
        <path d="M8,49 Q66,58 135,48 T220,51 L220,72 Q145,66 135,70 T8,71 Z" fill="#006C3E" />
        <path d="M8,71 Q66,79 135,70 T220,72 L220,92 Q145,86 135,90 T8,92 Z" fill="#FACC15" />
        <path d="M8,92 Q66,100 135,90 T220,92 L220,111 Q145,104 135,108 T8,110 Z" fill="#006C3E" />
        <path d="M8,6 Q52,14 96,10 L96,70 Q52,74 8,71 Z" fill="#D21034" />
        <polygon
          points="51,21 55,34 69,34 58,42 62,55 51,47 40,55 44,42 33,34 47,34"
          fill="#FFFFFF"
        />
        <rect x="8" y="6" width="212" height="105" fill={`url(#${flagShadeId})`} />
      </svg>

      {/* QR CODE POSITIONNÉ À DROITE DEVANT LA CARTE DU TOGO (AU NIVEAU DE CLASSE VERS LE HAUT, TOUCHANT LÉGÈREMENT LE TOGO) */}
      <div className="absolute right-[18.2%] bottom-[29.2%] w-[10.2%] aspect-square rounded-[4px] bg-white border border-slate-300 p-[2px] shadow-2xs z-20">
        <svg
          viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
          className="h-full w-full"
          shapeRendering="crispEdges"
        >
          <rect width={qrMatrix.length} height={qrMatrix.length} fill="#FFFFFF" />
          {qrMatrix.map((row, rIdx) =>
            row.map((cell, cIdx) =>
              cell ? (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={cIdx}
                  y={rIdx}
                  width={1}
                  height={1}
                  fill="#0F172A"
                />
              ) : null
            )
          )}
        </svg>
      </div>

      {/* CONTENU STRUCTURÉ DE LA CARTE */}
      <div className="relative z-10 h-full w-full flex flex-col justify-between px-[3.5%] pt-[1.2%] pb-[1.5%]">
        {/* 1. EN-TÊTE */}
        <div className="flex flex-col">
          <div className="flex items-start gap-1.5">
            {/* Logo agrandi en haut à gauche */}
            <div className="w-[15%] shrink-0 flex items-center justify-center pt-0.5">
              {logoUrl ? (
                <div className="h-[54px] w-[54px] rounded-full bg-white/95 border border-amber-300 shadow-xs p-0.5 flex items-center justify-center overflow-hidden">
                  <img src={logoUrl} alt="Logo école" className="h-full w-full object-contain" />
                </div>
              ) : showVectorEmblemIfNoLogo ? (
                <svg viewBox="0 0 100 84" className="w-13 h-11 drop-shadow-2xs">
                  <g fill="#D6A524">
                    <ellipse cx="22" cy="54" rx="7" ry="3.5" transform="rotate(-35 22 54)" />
                    <ellipse cx="16" cy="43" rx="7" ry="3.5" transform="rotate(-12 16 43)" />
                    <ellipse cx="16" cy="31" rx="7" ry="3.5" transform="rotate(14 16 31)" />
                    <ellipse cx="21" cy="20" rx="6.5" ry="3" transform="rotate(36 21 20)" />
                    <ellipse cx="29" cy="12" rx="6" ry="2.8" transform="rotate(55 29 12)" />

                    <ellipse cx="78" cy="54" rx="7" ry="3.5" transform="rotate(35 78 54)" />
                    <ellipse cx="84" cy="43" rx="7" ry="3.5" transform="rotate(12 84 43)" />
                    <ellipse cx="84" cy="31" rx="7" ry="3.5" transform="rotate(-14 84 31)" />
                    <ellipse cx="79" cy="20" rx="6.5" ry="3" transform="rotate(-36 79 20)" />
                    <ellipse cx="71" cy="12" rx="6" ry="2.8" transform="rotate(-55 71 12)" />
                  </g>
                  <polygon
                    points="50,3 52.8,11 61,11 54.4,16 57,24 50,19 43,24 45.6,16 39,11 47.2,11"
                    fill="#0E2262"
                  />
                  <path
                    d="M27,28 Q38,24 50,30 Q62,24 73,28 L73,57 Q61,51 50,57 Q39,51 27,57 Z"
                    fill="#FFFFFF"
                    stroke="#0E2262"
                    strokeWidth="2.8"
                    strokeLinejoin="round"
                  />
                  <line x1="50" y1="30" x2="50" y2="57" stroke="#0E2262" strokeWidth="2.2" />
                  <path d="M32,37 Q39,35 45,38 M32,44 Q39,42 45,45" stroke="#2E4E9E" strokeWidth="1.6" fill="none" />
                  <path d="M55,38 Q61,35 68,37 M55,45 Q61,42 68,44" stroke="#2E4E9E" strokeWidth="1.6" fill="none" />
                  <path d="M24,62 Q50,75 76,62 L73,67 Q50,79 27,67 Z" fill="#00723A" />
                  <path d="M27,66 Q50,78 73,66 L70,71 Q50,82 30,71 Z" fill="#FACC15" />
                  <path d="M31,70 Q50,81 69,70 L66,75 Q50,85 34,75 Z" fill="#CE112E" />
                </svg>
              ) : (
                <div className="h-12 w-12" />
              )}
            </div>

            {/* Bloc central : IEPP bien visible + Bannière adaptative Nom École + Centre d'écrit agrandi */}
            <div className="flex-1 min-w-0 flex flex-col items-center pt-0.5">
              {/* IEPP très lisible, sans DRE */}
              <div className="w-full flex items-center justify-center gap-1.5 min-h-[16px]">
                <span className="h-[1.8px] flex-1 bg-gradient-to-r from-transparent to-[#A80C46]" />
                <span
                  className="font-black tracking-[0.06em] text-center leading-none whitespace-nowrap"
                  style={buildTextCss(typo.headerOfficial, 13.0, '#0A1950')}
                >
                  {displayIepp}
                </span>
                <span className="h-[1.8px] flex-1 bg-gradient-to-l from-transparent to-[#A80C46]" />
              </div>

              {/* Pilule bordeaux dynamique (s'élargit si le nom est long, rétrécit si le nom est court) */}
              <div className="mt-[2px] inline-flex items-center justify-center w-fit max-w-full rounded-full bg-gradient-to-b from-[#BA074D] via-[#9E053F] to-[#7D0331] border border-[#6E022A] px-3.5 py-[2.5px] shadow-[0_2px_6px_-2px_rgba(140,3,56,0.5)]">
                <span
                  className="text-center font-black tracking-wide leading-tight whitespace-nowrap drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
                  style={buildTextCss(typo.schoolName, schoolBasePx, '#FFFFFF')}
                >
                  {displaySchoolName}
                </span>
              </div>

              {/* Centre d'écrit — police agrandie */}
              <div className="mt-[2.5px] inline-flex items-center justify-center w-fit max-w-full rounded-full bg-gradient-to-r from-[#FFFDF2] via-[#FFF8DB] to-[#FFFDF2] border border-[#D49B1A] px-4 py-[2px]">
                <span className="text-[11.5px] font-extrabold text-[#0E1B52] whitespace-nowrap leading-tight">
                  {displayExamCenter}
                </span>
              </div>
            </div>

            {/* Espace réservé sous le drapeau flottant */}
            <div className="w-[19%] shrink-0" />
          </div>

          {/* Titre "CARTE D'IDENTITÉ SCOLAIRE" SANS cadre arrondi, plus gros & police designer */}
          <div className="mt-[2px] flex flex-col items-center justify-center">
            <span
              className="font-black tracking-[0.09em] leading-none text-center whitespace-nowrap"
              style={{
                fontFamily:
                  typo.bannerTitle.fontFamily === 'courier'
                    ? '"Courier New", Courier, monospace'
                    : 'Georgia, "Palatino Linotype", "Times New Roman", serif',
                fontSize: `${(14.6 * Math.max(0.85, Math.min(1.25, typo.bannerTitle.sizeScale || 1))).toFixed(1)}px`,
                color: '#081B58',
                textShadow: '0.8px 0.8px 0 rgba(214, 175, 86, 0.55)',
              }}
            >
              {displayBannerTitle}
            </span>
            <span className="mt-[2px] h-[1.5px] w-[58%] bg-gradient-to-r from-transparent via-[#C6941E] to-transparent" />
          </div>
        </div>

        {/* 2. CORPS DE LA CARTE : PHOTO PLEINE SURFACE + ANNÉE SCOLAIRE & INFOS ÉLÈVE */}
        <div className="flex gap-[2.8%] items-start flex-1 pt-[1px]">
          {/* Colonne gauche : Cadre Photo 100% photo (tête + épaules + poitrine) + Année Scolaire */}
          <div className="w-[21.2%] shrink-0 flex flex-col items-center gap-[3px]">
            <button
              type="button"
              onClick={onPhotoTrigger}
              title={
                student.avatar_url
                  ? "Cliquez pour changer la photo de l'élève"
                  : "Cliquez pour ajouter la photo de l'élève"
              }
              className="w-full aspect-[19.0/21.4] rounded-[6px] bg-white border-[2px] border-[#A80744] p-[2px] overflow-hidden shadow-2xs cursor-pointer hover:ring-2 hover:ring-[#A80744]/40 transition-all flex items-center justify-center"
            >
              {student.avatar_url ? (
                <img
                  src={student.avatar_url}
                  alt={`${student.first_name} ${student.last_name}`}
                  className="h-full w-full rounded-[3.5px] object-cover object-top"
                />
              ) : (
                <div className="h-full w-full rounded-[3.5px] bg-slate-100 flex items-center justify-center">
                  <svg viewBox="0 0 80 90" className="h-[92%] w-[92%]">
                    <circle cx="40" cy="30" r="17" fill="#B8C0CC" />
                    <path d="M10,88 C10,60 70,60 70,88 Z" fill="#B8C0CC" />
                  </svg>
                </div>
              )}
            </button>

            {/* Pilule Année Scolaire */}
            <div className="w-full rounded-lg bg-gradient-to-b from-[#FFFDF2] to-[#FEF0B8] border border-[#D49B1A] py-[2px] px-1 text-center leading-tight shadow-2xs">
              <div className="text-[7px] font-extrabold text-[#0E1B52]">Année Scolaire</div>
              <div className="text-[9.2px] font-black text-[#A60744]">{formattedYear}</div>
            </div>
          </div>

          {/* Colonne centrale : Informations automatiques (marge droite réservée pour le QR code et la carte du Togo) */}
          <div className="flex-1 min-w-0 pr-[29.5%] flex flex-col gap-[2px] pt-[1px]">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-[10px] font-extrabold text-[#0E1B52] shrink-0">Matricule :</span>
              {student.matricule?.trim() ? (
                <span className="text-[10px] font-bold text-slate-900 truncate leading-tight">
                  {student.matricule}
                </span>
              ) : (
                <span className="flex-1 border-b border-dotted border-slate-400 h-2.5" />
              )}
            </div>

            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-[10px] font-extrabold text-[#0E1B52] shrink-0">Nom :</span>
              {student.last_name?.trim() ? (
                <span
                  className="uppercase truncate leading-tight"
                  style={buildTextCss(typo.studentName, 10.5)}
                >
                  {student.last_name}
                </span>
              ) : (
                <span className="flex-1 border-b border-dotted border-slate-400 h-2.5" />
              )}
            </div>

            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-[10px] font-extrabold text-[#0E1B52] shrink-0">Prénoms :</span>
              {student.first_name?.trim() ? (
                <span
                  className="truncate leading-tight"
                  style={buildTextCss(typo.studentName, 10)}
                >
                  {student.first_name}
                </span>
              ) : (
                <span className="flex-1 border-b border-dotted border-slate-400 h-2.5" />
              )}
            </div>

            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-[9.6px] font-extrabold text-[#0E1B52] shrink-0">
                Date de naissance :
              </span>
              {formattedDob ? (
                <span
                  className="truncate leading-tight"
                  style={buildTextCss(typo.studentDetails, 9.6, '#0F172A')}
                >
                  {formattedDob}
                </span>
              ) : (
                <span className="flex-1 border-b border-dotted border-slate-400 h-2.5" />
              )}
            </div>

            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-[9.6px] font-extrabold text-[#0E1B52] shrink-0">
                Lieu de naissance :
              </span>
              {birthPlaceText ? (
                <span
                  className="truncate leading-tight"
                  style={buildTextCss(typo.studentDetails, 9.6, '#0F172A')}
                >
                  {birthPlaceText}
                </span>
              ) : (
                <span className="flex-1 border-b border-dotted border-slate-400 h-2.5" />
              )}
            </div>

            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-[10px] font-extrabold text-[#0E1B52] shrink-0">Sexe :</span>
              {sexDisplay ? (
                <span
                  className="truncate leading-tight"
                  style={buildTextCss(typo.studentDetails, 10, '#0F172A')}
                >
                  {sexDisplay}
                </span>
              ) : (
                <span className="flex-1 border-b border-dotted border-slate-400 h-2.5" />
              )}
            </div>

            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-[10px] font-extrabold text-[#0E1B52] shrink-0">Classe :</span>
              {className.trim() ? (
                <span
                  className="truncate leading-tight"
                  style={buildTextCss(typo.studentName, 10, '#0E1B52')}
                >
                  {className}
                </span>
              ) : (
                <span className="flex-1 border-b border-dotted border-slate-400 h-2.5" />
              )}
            </div>
          </div>
        </div>

        {/* 3. PIED DE CARTE : DIRECTEUR REMONTÉ AU-DESSUS DE LA BANDE + SIGNATURE + GRAND CACHET À DROITE */}
        <div className="flex items-center justify-end gap-2 pt-0 pb-3.5 pl-[24%] pr-0.5">
          {/* Nom du Chef d'établissement bien remonté au-dessus de la bande basse */}
          <div className="flex-1 min-w-0 flex items-center justify-center">
            {directorName.trim() && (
              <span
                className="truncate font-bold text-[#0E1B52] leading-tight text-center"
                style={buildTextCss(typo.footerInfo, 10.4, '#0E1B52')}
              >
                {directorName.trim()}
              </span>
            )}
          </div>

          {/* Signature du Chef d'établissement (sans cadre ni libellé) + Grand Cachet circulaire */}
          <div className="flex items-center justify-end gap-0.5 shrink-0">
            <div className="h-9 w-20 flex items-center justify-center overflow-hidden">
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt="Signature chef d'établissement"
                  className="h-full w-auto max-w-full object-contain"
                />
              ) : null}
            </div>

            <div className="h-[68px] w-[68px] shrink-0 -ml-2 -my-2 z-20 flex items-center justify-center">
              {stampUrl ? (
                <img
                  src={stampUrl}
                  alt="Cachet officiel"
                  className="h-[68px] w-[68px] object-contain"
                />
              ) : showVectorStampIfNoStamp ? (
                <svg viewBox="0 0 100 100" className="h-[66px] w-[66px] drop-shadow-2xs">
                  <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#10329E" strokeWidth="3.5" />
                  <circle cx="50" cy="50" r="41" fill="none" stroke="#10329E" strokeWidth="1.4" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="#10329E" strokeWidth="1.8" />
                  <path
                    d="M32,40 Q41,37 50,41 Q59,37 68,40 L68,61 Q59,57 50,61 Q41,57 32,61 Z"
                    fill="#1D4ED8"
                    stroke="#0F2670"
                    strokeWidth="1.5"
                  />
                  <line x1="50" y1="41" x2="50" y2="61" stroke="#FFFFFF" strokeWidth="1.5" />
                  <polygon
                    points="16,46 17.5,50 22,50 18.5,52.5 19.8,56.5 16,54 12.2,56.5 13.5,52.5 10,50 14.5,50"
                    fill="#10329E"
                  />
                  <polygon
                    points="84,46 85.5,50 90,50 86.5,52.5 87.8,56.5 84,54 80.2,56.5 81.5,52.5 78,50 82.5,50"
                    fill="#10329E"
                  />
                  <defs>
                    <path id={stampArcId} d="M 15,50 A 35,35 0 1,1 85,50" />
                  </defs>
                  <text
                    fill="#10329E"
                    fontSize="8.6"
                    fontWeight="900"
                    fontFamily="Arial, sans-serif"
                    letterSpacing="0.5"
                  >
                    <textPath href={`#${stampArcId}`} startOffset="50%" textAnchor="middle">
                      ÉTABLISSEMENT SCOLAIRE
                    </textPath>
                  </text>
                  <text
                    x="50"
                    y="87"
                    textAnchor="middle"
                    fill="#10329E"
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="Arial, sans-serif"
                  >
                    TOGO
                  </text>
                </svg>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
