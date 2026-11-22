'use client'

import React from 'react'
import { Camera, Loader2 } from 'lucide-react'
import type {
  CardFontFamily,
  CardTypographyConfig,
  CardZoneTextStyle,
} from '@/lib/pdf/student-documents'
import { formatCardDateFr } from '@/lib/pdf/togo-iepp-card'

/** Largeur de conception (px) du Modèle 1 — utilisée pour la mise à l'échelle exacte sur la planche A4. */
export const CLASSIC_CARD_DESIGN_WIDTH = 465

export interface ClassicPreviewStudent {
  id: string
  matricule: string
  first_name: string
  last_name: string
  date_of_birth?: string | null
  birth_place?: string | null
  gender?: string | null
  avatar_url?: string | null
}

type LetterFieldKey =
  | 'ministryAcronym'
  | 'schoolName'
  | 'inspectionName'
  | 'bannerTitle'
  | 'examCenter'
  | 'republicTitle'

interface Props {
  student: ClassicPreviewStudent
  typography: CardTypographyConfig
  ministryAcronym: string
  republicTitle: string
  republicMotto: string
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
  themeUrl?: string | null
  /** 'studio' = atelier interactif ; 'paper' = rendu à plat pour la planche A4 / impression */
  variant?: 'studio' | 'paper'
  onPhotoFile?: (file: File) => void
  isUploadingPhoto?: boolean
}

const CSS_FONTS: Record<CardFontFamily, string> = {
  times: '"Times New Roman", Times, serif',
  georgia: 'Georgia, Cambria, serif',
  palatino: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
  helvetica: 'Arial, Helvetica, sans-serif',
  verdana: 'Verdana, Geneva, sans-serif',
  courier: '"Courier New", Courier, monospace',
}

const DEFAULT_MEPST_COLORS = ['#0F172A', '#0F172A', '#DC2626', '#F59E0B', '#1D4ED8']

function zoneCss(zone: CardZoneTextStyle, basePx: number, overrideColor?: string): React.CSSProperties {
  const scale = Math.max(0.65, Math.min(1.6, zone.sizeScale || 1))
  return {
    fontFamily: CSS_FONTS[zone.fontFamily] || CSS_FONTS.times,
    fontSize: `${(basePx * scale).toFixed(1)}px`,
    fontWeight: zone.bold ? 900 : 400,
    fontStyle: zone.italic ? 'italic' : 'normal',
    textDecoration: zone.underline ? 'underline' : 'none',
    textTransform: zone.uppercase ? 'uppercase' : 'none',
    color: overrideColor || zone.color,
  }
}

export function SchoolIdCardClassicPreview({
  student,
  typography,
  ministryAcronym,
  republicTitle,
  republicMotto,
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
  themeUrl,
  variant = 'studio',
  onPhotoFile,
  isUploadingPhoto = false,
}: Props) {
  const typo = typography
  const isPaper = variant === 'paper'

  const renderMulticolor = (text: string, fieldKey: LetterFieldKey, fallbackColor: string) => {
    const saved = typo.letterColors?.[fieldKey]
    const defaultMepst =
      fieldKey === 'ministryAcronym' && text.trim().toUpperCase() === 'MEPST'
        ? DEFAULT_MEPST_COLORS
        : undefined
    const colors = Array.isArray(saved) && saved.some(Boolean) ? saved : defaultMepst
    if (!colors || colors.length === 0) return <>{text}</>
    return (
      <>
        {Array.from(text).map((ch, idx) => (
          <span key={idx} style={{ color: colors[idx] || fallbackColor }}>
            {ch}
          </span>
        ))}
      </>
    )
  }

  const formattedDob = formatCardDateFr(student.date_of_birth)

  const photoInner = (
    <>
      {student.avatar_url ? (
        <img
          src={student.avatar_url}
          alt={`${student.first_name} ${student.last_name}`}
          className="w-full h-full object-cover object-top"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-2">
          <Camera className="h-6 w-6 text-blue-800 mb-1" />
          {!isPaper && (
            <span className="text-[9px] font-extrabold text-blue-900 uppercase">
              + Cliquer pour Photo
            </span>
          )}
        </div>
      )}
    </>
  )

  return (
    <div
      className={`mx-auto w-full max-w-[465px] aspect-[94/53.5] flex rounded-md p-[5px] bg-[#007A33] select-none ${
        isPaper ? '' : 'shadow-md'
      }`}
    >
      <div className="flex-1 flex min-h-0 rounded-[2px] p-[4px] bg-[#FFCE00]">
        <div className="relative flex-1 flex flex-col min-h-0 bg-[#EEF4FA] text-slate-900 overflow-hidden">
          {/* Image du Thème en arrière-plan */}
          {themeUrl && (
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
              <img src={themeUrl} alt="" className="h-full w-full object-fill" />
              <div className="absolute inset-0 bg-white/30" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 58% 52%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.36) 65%, rgba(255,255,255,0.08) 100%)',
                }}
              />
            </div>
          )}

          {/* En-tête */}
          <div className="px-2.5 pt-1.5 pb-1.5 relative z-10 min-h-[62px] shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col items-center shrink-0 min-w-[44px]">
                <div
                  className="leading-none tracking-tight h-[14px]"
                  style={zoneCss(typo.headerOfficial, 13, '#0F172A')}
                >
                  {ministryAcronym.trim().length > 0 ? (
                    <span style={zoneCss(typo.headerOfficial, 12.5)}>
                      {renderMulticolor(
                        (typo.headerOfficial.uppercase
                          ? ministryAcronym.trim().toUpperCase()
                          : ministryAcronym.trim()
                        ).slice(0, 12),
                        'ministryAcronym',
                        typo.headerOfficial.color
                      )}
                    </span>
                  ) : null}
                </div>

                {logoUrl ? (
                  <div className="mt-1 h-11 w-10 rounded-full border border-emerald-600 bg-white flex items-center justify-center shadow-2xs overflow-hidden">
                    <img src={logoUrl} alt="Logo école" className="h-9 w-9 object-contain" />
                  </div>
                ) : showVectorEmblemIfNoLogo ? (
                  <div className="mt-1 h-11 w-10 rounded-full border border-emerald-600 bg-white flex flex-col items-center justify-center shadow-2xs">
                    <span className="text-[6px] font-bold text-emerald-800">🇹🇬</span>
                    <span className="px-1 py-0.5 rounded-full bg-amber-300 text-[8px] font-serif font-black text-slate-950 border border-amber-500">
                      RT
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 h-11 w-10" />
                )}
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="text-right leading-tight min-h-[22px]">
                  {republicTitle.trim() && (
                    <div
                      className="tracking-tight"
                      style={zoneCss(typo.headerOfficial, 10.5, '#0F172A')}
                    >
                      {renderMulticolor(
                        (typo.headerOfficial.uppercase
                          ? republicTitle.trim().toUpperCase()
                          : republicTitle.trim()
                        ).slice(0, 28),
                        'republicTitle',
                        '#0F172A'
                      )}
                    </div>
                  )}
                  {republicMotto.trim() && (
                    <div className="pr-2" style={zoneCss(typo.headerOfficial, 9.5, '#0F172A')}>
                      {republicMotto}
                    </div>
                  )}
                </div>

                <div className="text-center mt-0.5 space-y-0.5">
                  {inspectionName.trim() && (
                    <div
                      className="tracking-wide truncate"
                      style={zoneCss(typo.headerOfficial, 10.5)}
                    >
                      {renderMulticolor(
                        (typo.headerOfficial.uppercase
                          ? inspectionName.trim().toUpperCase()
                          : inspectionName.trim()
                        ).slice(0, 38),
                        'inspectionName',
                        typo.headerOfficial.color
                      )}
                    </div>
                  )}
                  {schoolName.trim() && (
                    <div
                      className="leading-none tracking-tight truncate"
                      style={zoneCss(typo.schoolName, 15)}
                    >
                      {renderMulticolor(
                        (typo.schoolName.uppercase
                          ? schoolName.trim().toUpperCase()
                          : schoolName.trim()
                        ).slice(0, 34),
                        'schoolName',
                        typo.schoolName.color
                      )}
                    </div>
                  )}
                  {examCenter.trim() && (
                    <div className="leading-tight" style={zoneCss(typo.headerOfficial, 11)}>
                      <span className="text-slate-950">Centre d&apos;Ecrit: </span>
                      <span style={{ color: typo.headerOfficial.color }}>
                        {renderMulticolor(
                          examCenter.trim().slice(0, 26),
                          'examCenter',
                          typo.headerOfficial.color
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Double trait tricolore */}
          <div className="relative z-10 h-[2px] w-full bg-red-700 shrink-0" />
          <div className="relative z-10 h-[2px] w-full bg-[#007A33] shrink-0" />
          <div className="relative z-10 h-[1.5px] w-full bg-[#FFCE00] shrink-0" />

          {/* Corps : Photo + Infos */}
          <div
            className={`relative z-10 grid grid-cols-12 flex-1 min-h-0 ${
              themeUrl ? 'bg-transparent' : 'bg-[#F8FAFC]'
            }`}
          >
            <div className="col-span-4 p-1 flex min-h-0">
              {onPhotoFile && !isPaper ? (
                <label
                  className="w-full h-full border-2 border-[#C2410C] bg-sky-100 overflow-hidden flex flex-col items-center justify-center relative cursor-pointer group"
                  title="Cliquez pour importer la photo de cet élève"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingPhoto}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      e.currentTarget.value = ''
                      if (f) onPhotoFile(f)
                    }}
                  />
                  {photoInner}
                  <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                    {isUploadingPhoto ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Changer Photo'}
                  </div>
                </label>
              ) : (
                <div className="w-full h-full border-2 border-[#C2410C] bg-sky-100 overflow-hidden flex flex-col items-center justify-center">
                  {photoInner}
                </div>
              )}
            </div>

            <div className="col-span-8 flex flex-col justify-between pb-1.5 pr-1.5 min-w-0">
              <div>
                <div
                  className="py-0.5 px-2 text-center border-b border-amber-200/80 min-h-[20px]"
                  style={{ backgroundColor: typo.bannerBgColor || '#FDE0C6' }}
                >
                  {cardBannerTitle.trim() && (
                    <span className="tracking-tight" style={zoneCss(typo.bannerTitle, 11.5)}>
                      {renderMulticolor(
                        (typo.bannerTitle.uppercase
                          ? cardBannerTitle.trim().toUpperCase()
                          : cardBannerTitle.trim()
                        ).slice(0, 34),
                        'bannerTitle',
                        typo.bannerTitle.color
                      )}
                    </span>
                  )}
                </div>

                <div className="px-2 pt-1.5 space-y-0.5 leading-snug">
                  <div className="truncate">
                    <span style={zoneCss(typo.studentDetails, 12)}>Nom: </span>
                    <span className="uppercase" style={zoneCss(typo.studentName, 12)}>
                      {student.last_name}
                    </span>
                  </div>
                  <div className="truncate">
                    <span style={zoneCss(typo.studentDetails, 12)}>Prénoms: </span>
                    <span style={zoneCss(typo.studentName, 12)}>{student.first_name}</span>
                  </div>
                  <div className="truncate">
                    <span style={zoneCss(typo.studentDetails, 11.5)}>
                      Né (e) le {formattedDob || '—'}{' '}
                      {student.birth_place ? `à ${student.birth_place}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span style={zoneCss(typo.studentDetails, 12, '#D94619')}>Sexe </span>
                      <span style={zoneCss(typo.studentDetails, 12)}>: </span>
                      <span style={zoneCss(typo.studentName, 12, '#122AB9')}>
                        {student.gender || '—'}
                      </span>
                    </div>
                    <span className="text-[9px] font-sans font-bold text-slate-400">
                      Mle: {student.matricule}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-2 pt-1 flex items-end justify-between relative">
                <div className="leading-tight">
                  <div
                    className="underline decoration-[#122AB9]"
                    style={zoneCss(typo.footerInfo, 11, '#0F172A')}
                  >
                    <span className="text-slate-950">Année </span>
                    <span className="text-[#122AB9]">Scolaire</span>
                  </div>
                  <div className="pl-1 min-h-[16px]" style={zoneCss(typo.footerInfo, 13)}>
                    {academicYear}
                  </div>
                  <div className="mt-0.5" style={zoneCss(typo.footerInfo, 12, '#0F172A')}>
                    <span className="text-slate-950 font-semibold">Classe : </span>
                    <span style={zoneCss(typo.footerInfo, 12, '#192AB9')}>{className}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end min-w-[100px] min-h-[58px] justify-end">
                  <div className="relative flex items-center justify-center h-14 w-28">
                    {stampUrl ? (
                      <img src={stampUrl} alt="Cachet officiel" className="h-14 w-16 object-contain" />
                    ) : showVectorStampIfNoStamp ? (
                      <div className="h-12 w-12 rounded-full border-2 border-[#122ABE] flex flex-col items-center justify-center text-[#122ABE] text-center p-0.5 bg-white/60">
                        <span className="text-[4.2px] font-black uppercase leading-none">
                          REPUBLIQUE TOGOLAISE
                        </span>
                        <span className="text-[6.5px] font-black my-0.5">★ RT ★</span>
                        <span className="text-[4px] font-extrabold uppercase leading-none truncate max-w-[36px]">
                          {(schoolName || 'ÉCOLE').slice(0, 14)}
                        </span>
                      </div>
                    ) : null}

                    {signatureUrl && (
                      <img
                        src={signatureUrl}
                        alt="Signature Directeur"
                        className="h-11 w-20 object-contain absolute right-0 bottom-0 pointer-events-none"
                      />
                    )}
                  </div>

                  {directorName.trim() && (
                    <div className="leading-none mt-0.5" style={zoneCss(typo.footerInfo, 11)}>
                      {directorName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
