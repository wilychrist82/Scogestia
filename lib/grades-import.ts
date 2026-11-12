import * as XLSX from 'xlsx'
import {
  formatRank,
  getCoefficientForSubject,
  getPrimarySubjectMaxScore,
} from '@/lib/academic-curriculum'
import {
  AverageScale,
  ClassResultsReport,
  ComputedStudentRow,
  ExportClassItem,
  ExportColumnDef,
  ExportCycle,
  ExportStudentItem,
  ExportSubjectItem,
  FilterMode,
  getAppreciation,
  getLegendText,
  getPeriodLabel,
  normalizeGender,
  PrimaryPeriodKey,
  RecapGenderStats,
  SortMode,
  SubjectStatsRow,
} from '@/lib/grades-export'

export interface ParsedExcelColumn {
  colIndex: number
  rawHeader: string
  cleanName: string
  explicitCoef: number | null
  maxObservedScore: number
  suggestedMaxScore: number
  hasAnyGrade: boolean
}

export interface ParsedExcelStudentRow {
  rowIndex: number
  rowNumberLabel: string
  matricule: string
  fullName: string
  lastName: string
  firstName: string
  gender: 'M' | 'F' | ''
  /** Map colIndex -> numeric score (or null if blank/absent) */
  scoresByColIndex: Record<number, number | null>
  /** Also keyed by parsed column key `col_${colIndex}` */
  scores: Record<string, number | null>
}

export interface ParsedExcelSheetResult {
  sheetName: string
  allSheetNames: string[]
  detectedTitle: string | null
  detectedDivisor: number | null
  detectedPrimaryPeriod: PrimaryPeriodKey | null
  detectedSecondaryTerm: string | null
  columns: ParsedExcelColumn[]
  rows: ParsedExcelStudentRow[]
  warnings: string[]
}

export interface StudentMatchResult {
  excelRowIndex: number
  excelFullName: string
  matchedStudentId: string | null
  matchMethod: 'matricule' | 'exact_name' | 'reversed_name' | 'token_name' | 'unmatched'
}

export interface SubjectMappingItem {
  colKey: string
  colIndex: number
  excelName: string
  maxScore: number
  coefficient: number
  matchedSubjectId: string | null
  confidence: 'exact' | 'synonym' | 'partial' | 'unmatched'
}

export function normalizeImportText(raw?: string | null): string {
  return (raw || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`´]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function parseFrenchScore(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') {
    if (!isFinite(raw) || isNaN(raw)) return null
    return Math.round(raw * 100) / 100
  }
  const str = String(raw).trim()
  if (!str) return null
  const lower = str.toLowerCase()
  if (
    lower === '-' ||
    lower === '—' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower.startsWith('abs') ||
    lower === 'nc'
  ) {
    return null
  }
  // Remplacer virgule française et espaces insécables
  const cleaned = str.replace(/\s+/g, '').replace(',', '.')
  if (!/^-?\d+(?:\.\d+)?$/.test(cleaned)) {
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) || !isFinite(parsed) ? null : Math.round(parsed * 100) / 100
  }
  const num = parseFloat(cleaned)
  return isNaN(num) || !isFinite(num) ? null : Math.round(num * 100) / 100
}

function splitFullName(rawFullName: string): { lastName: string; firstName: string; fullName: string } {
  const cleaned = rawFullName.replace(/\s+/g, ' ').trim()
  if (!cleaned) return { lastName: '', firstName: '', fullName: '' }

  const tokens = cleaned.split(' ')
  if (tokens.length === 1) {
    return {
      lastName: tokens[0].toUpperCase(),
      firstName: '',
      fullName: tokens[0].toUpperCase(),
    }
  }

  // Détecter les tokens entièrement en majuscules en début (ex: "LAWSON-AVUNSU Latevi", "DA SILVEIRA Koffi")
  const upperTokens: string[] = []
  let idx = 0
  while (idx < tokens.length - 1) {
    const tok = tokens[idx]
    const letters = tok.replace(/[^a-zA-ZÀ-ÿ]/g, '')
    if (letters.length > 0 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) {
      upperTokens.push(tok)
      idx++
    } else {
      break
    }
  }

  if (upperTokens.length > 0 && idx < tokens.length) {
    const last = upperTokens.join(' ')
    const first = tokens.slice(idx).join(' ')
    return {
      lastName: last,
      firstName: first,
      fullName: `${last} ${first}`.trim(),
    }
  }

  const last = tokens[0].toUpperCase()
  const first = tokens.slice(1).join(' ')
  return {
    lastName: last,
    firstName: first,
    fullName: `${last} ${first}`.trim(),
  }
}

type ColumnRole = 'num' | 'fullname' | 'lastname' | 'firstname' | 'gender' | 'matricule' | 'class' | 'computed' | 'discipline'

function classifyHeaderColumn(rawHeader: string): ColumnRole {
  const norm = normalizeImportText(rawHeader)
  if (!norm) return 'computed'

  if (norm === 'n' || norm === 'no' || norm === 'num' || norm === 'numero' || norm === 'ordre') {
    return 'num'
  }
  if (
    norm === 'nom et prenom' ||
    norm === 'nom et prenoms' ||
    norm === 'nom prenom' ||
    norm === 'nom prenoms' ||
    norm === 'noms et prenoms' ||
    norm === 'eleve' ||
    norm === 'eleves' ||
    norm === 'apprenant' ||
    norm === 'etudiant'
  ) {
    return 'fullname'
  }
  if (norm === 'nom' || norm === 'nom de famille' || norm === 'noms') {
    return 'lastname'
  }
  if (norm === 'prenom' || norm === 'prenoms') {
    return 'firstname'
  }
  if (norm === 'sexe' || norm === 'sex' || norm === 'genre' || norm === 'm f') {
    return 'gender'
  }
  if (norm === 'matricule' || norm === 'mat' || norm === 'code eleve' || norm === 'id eleve') {
    return 'matricule'
  }
  if (norm === 'classe') {
    return 'class'
  }

  // Colonnes de résultats déjà calculées dans certains classeurs (ignorées à la lecture des notes)
  if (
    norm === 'total' ||
    norm === 'total points' ||
    norm === 'total des points' ||
    norm === 'points' ||
    norm === 'somme' ||
    norm === 'moyenne' ||
    norm === 'moy' ||
    norm === 'moyenne generale' ||
    norm === 'moyenne 20' ||
    norm === 'moyenne 10' ||
    norm === 'rang' ||
    norm === 'classement' ||
    norm === 'appreciation' ||
    norm === 'appreciations' ||
    norm === 'observation' ||
    norm === 'observations' ||
    norm === 'decision' ||
    norm === 'mention'
  ) {
    return 'computed'
  }

  return 'discipline'
}

function isStopOrFooterRow(nameText: string): boolean {
  const norm = normalizeImportText(nameText)
  if (!norm) return true
  const exactFooters = new Set([
    'total',
    'moyenne',
    'moyenne classe',
    'plus forte moyenne',
    'plus faible moyenne',
    'admis',
    'pourcentage',
    'recapitulation',
    'observations',
  ])
  if (exactFooters.has(norm)) return true
  const prefixes = [
    'appreciations',
    'appreciation ',
    'legende',
    'moyenne generale',
    'moyenne de la classe',
    'total classe',
    'total general',
    'effectif',
    'taux de reussite',
    'nb ',
    'fait a ',
    'le directeur',
    'la directrice',
    'le censeur',
  ]
  return prefixes.some(p => norm.startsWith(p.trim()))
}

function extractCoefAndName(rawHeader: string): { cleanName: string; explicitCoef: number | null } {
  const cleaned = rawHeader.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
  const coefMatch = cleaned.match(/\((?:coef|coeff|c)\.?\s*(\d+(?:[.,]\d+)?)\)/i)
  if (coefMatch) {
    const coefVal = parseFloat(coefMatch[1].replace(',', '.'))
    const cleanName = cleaned.replace(coefMatch[0], '').replace(/\s+/g, ' ').trim()
    return {
      cleanName: cleanName || cleaned,
      explicitCoef: !isNaN(coefVal) && coefVal > 0 ? coefVal : null,
    }
  }
  return { cleanName: cleaned, explicitCoef: null }
}

function detectMetadataFromText(
  texts: string[],
  fileName?: string
): {
  detectedDivisor: number | null
  detectedPrimaryPeriod: PrimaryPeriodKey | null
  detectedSecondaryTerm: string | null
} {
  const combined = [...texts, fileName || ''].join(' | ')
  const normCombined = normalizeImportText(combined)

  let detectedDivisor: number | null = null
  for (const txt of texts) {
    const divMatch = txt.match(
      /(?:moyenne\s*=\s*total\s*[÷\/]|total\s*[÷\/]|div(?:iseur|\.)?\s*[:=]?)\s*(\d+(?:[.,]\d+)?)/i
    )
    if (divMatch) {
      const parsed = parseFloat(divMatch[1].replace(',', '.'))
      if (!isNaN(parsed) && parsed > 0) {
        detectedDivisor = parsed
        break
      }
    }
  }

  const monthMap: Array<[string, PrimaryPeriodKey]> = [
    ['octobre', 'month_1'],
    ['novembre', 'month_2'],
    ['decembre', 'month_3'],
    ['janvier', 'month_4'],
    ['fevrier', 'month_5'],
    ['mars', 'month_6'],
    ['avril', 'month_7'],
    ['mai', 'month_8'],
    ['juin', 'month_9'],
  ]
  let detectedPrimaryPeriod: PrimaryPeriodKey | null = null
  for (const [mName, pKey] of monthMap) {
    if (normCombined.includes(mName)) {
      detectedPrimaryPeriod = pKey
      break
    }
  }
  if (!detectedPrimaryPeriod) {
    const mNumMatch = normCombined.match(/\bmois\s*([1-9])\b/)
    if (mNumMatch) {
      detectedPrimaryPeriod = `month_${mNumMatch[1]}` as PrimaryPeriodKey
    } else if (normCombined.includes('1er trimestre') || normCombined.includes('premier trimestre')) {
      detectedPrimaryPeriod = 'trim_1'
    } else if (normCombined.includes('2e trimestre') || normCombined.includes('2eme trimestre') || normCombined.includes('deuxieme trimestre')) {
      detectedPrimaryPeriod = 'trim_2'
    } else if (normCombined.includes('3e trimestre') || normCombined.includes('3eme trimestre') || normCombined.includes('troisieme trimestre')) {
      detectedPrimaryPeriod = 'trim_3'
    }
  }

  let detectedSecondaryTerm: string | null = null
  if (normCombined.includes('1er semestre') || normCombined.includes('premier semestre')) {
    detectedSecondaryTerm = '1er_semestre'
  } else if (normCombined.includes('2e semestre') || normCombined.includes('2eme semestre') || normCombined.includes('deuxieme semestre')) {
    detectedSecondaryTerm = '2e_semestre'
  } else if (normCombined.includes('1er trimestre') || normCombined.includes('premier trimestre')) {
    detectedSecondaryTerm = '1er_trimestre'
  } else if (normCombined.includes('2e trimestre') || normCombined.includes('2eme trimestre') || normCombined.includes('deuxieme trimestre')) {
    detectedSecondaryTerm = '2e_trimestre'
  } else if (normCombined.includes('3e trimestre') || normCombined.includes('3eme trimestre') || normCombined.includes('troisieme trimestre')) {
    detectedSecondaryTerm = '3e_trimestre'
  }

  return { detectedDivisor, detectedPrimaryPeriod, detectedSecondaryTerm }
}

export function listWorkbookSheetNames(arrayBuffer: ArrayBuffer): string[] {
  const wb = XLSX.read(arrayBuffer, { type: 'array', bookSheets: true })
  return wb.SheetNames || []
}

/**
 * Parse un fichier Excel (.xlsx, .xls, .csv, .ods) rempli par un enseignant
 * (compatible à 100% avec les feuilles du style "COMPOSITION MENSUELLE – OCTOBRE 2026"
 * avec bannière titre + ligne méta + groupes + en-têtes verticales, OU tableau simple ligne 1).
 */
export function parseExcelWorkbookGrades(
  arrayBuffer: ArrayBuffer,
  options?: {
    sheetName?: string
    fileName?: string
    className?: string
    classLevel?: string
  }
): ParsedExcelSheetResult {
  const isCsv = options?.fileName?.toLowerCase().endsWith('.csv')
  let wb: XLSX.WorkBook
  if (isCsv) {
    const rawText = new TextDecoder('utf-8').decode(new Uint8Array(arrayBuffer)).replace(/^\uFEFF/, '')
    const firstLine = rawText.split(/\r?\n/)[0] || ''
    const fs = firstLine.includes(';') ? ';' : undefined
    wb = XLSX.read(rawText, { type: 'string', FS: fs, raw: true })
  } else {
    wb = XLSX.read(arrayBuffer, { type: 'array' })
  }
  const allSheetNames = wb.SheetNames || []
  if (allSheetNames.length === 0) {
    throw new Error('Le fichier Excel ne contient aucune feuille.')
  }

  // Par défaut, éviter "Récapitulation" si une feuille "Résultats" ou autre existe en premier
  let targetSheet = options?.sheetName
  if (!targetSheet || !allSheetNames.includes(targetSheet)) {
    const preferred = allSheetNames.find(
      name => !normalizeImportText(name).includes('recapitul') && !normalizeImportText(name).includes('merite')
    )
    targetSheet = preferred || allSheetNames[0]
  }

  const ws = wb.Sheets[targetSheet]
  const matrix = XLSX.utils.sheet_to_json<any[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
  })

  if (!matrix || matrix.length === 0) {
    throw new Error(`La feuille "${targetSheet}" est vide.`)
  }

  // 1. Trouver la ligne d'en-tête réelle (contient "Nom et Prénom", "Nom", "Élève", etc.)
  let headerRowIdx = -1
  let bestScore = -1

  const scanLimit = Math.min(20, matrix.length)
  for (let r = 0; r < scanLimit; r++) {
    const row = matrix[r] || []
    let rowScore = 0
    let hasNameCol = false
    let nonEmptyCount = 0

    for (const cell of row) {
      if (cell === null || cell === undefined) continue
      const txt = String(cell).trim()
      if (!txt) continue
      nonEmptyCount++
      const role = classifyHeaderColumn(txt)
      if (role === 'fullname' || role === 'lastname' || role === 'firstname') {
        hasNameCol = true
        rowScore += 10
      } else if (role === 'num' || role === 'gender' || role === 'matricule') {
        rowScore += 3
      } else if (role === 'computed') {
        rowScore += 2
      } else if (role === 'discipline') {
        rowScore += 1
      }
    }

    // Éviter la ligne de groupe ("ÉLÈVES" | "NOTES PAR DISCIPLINE" | "RÉSULTATS")
    const joinedNorm = normalizeImportText(row.filter(Boolean).join(' '))
    if (joinedNorm.includes('notes par discipline') && !hasNameCol) {
      continue
    }

    if (hasNameCol && nonEmptyCount >= 2 && rowScore > bestScore) {
      bestScore = rowScore
      headerRowIdx = r
    }
  }

  if (headerRowIdx === -1) {
    throw new Error(
      `Impossible de détecter la ligne d'en-tête des élèves dans la feuille "${targetSheet}". Vérifiez qu'une colonne "Nom et Prénom" (ou "Nom" / "Prénom") existe.`
    )
  }

  // 2. Extraire métadonnées au-dessus de l'en-tête (Titre, Mois, Diviseur)
  const preambleTexts: string[] = []
  let detectedTitle: string | null = null
  for (let r = 0; r < headerRowIdx; r++) {
    const row = matrix[r] || []
    for (const cell of row) {
      if (cell === null || cell === undefined) continue
      const s = String(cell).replace(/\s+/g, ' ').trim()
      if (!s) continue
      const n = normalizeImportText(s)
      if (n === 'eleves' || n === 'notes par discipline' || n === 'resultats') continue
      preambleTexts.push(s)
      if (
        !detectedTitle &&
        s.length >= 6 &&
        !n.startsWith('classe') &&
        !n.includes('moyenne =')
      ) {
        detectedTitle = s
      }
    }
  }

  const { detectedDivisor, detectedPrimaryPeriod, detectedSecondaryTerm } = detectMetadataFromText(
    preambleTexts,
    options?.fileName
  )

  // 3. Analyser les colonnes à partir de headerRowIdx
  const headerRow = matrix[headerRowIdx] || []
  const maxCols = matrix.reduce((m, row) => Math.max(m, (row || []).length), headerRow.length)

  let numColIdx = -1
  let fullNameColIdx = -1
  let lastNameColIdx = -1
  let firstNameColIdx = -1
  let genderColIdx = -1
  let matriculeColIdx = -1
  const disciplineCandidates: Array<{ colIndex: number; rawHeader: string; cleanName: string; explicitCoef: number | null }> = []

  for (let c = 0; c < maxCols; c++) {
    const rawCell = headerRow[c]
    if (rawCell === null || rawCell === undefined) continue
    const rawStr = String(rawCell).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
    if (!rawStr) continue

    const role = classifyHeaderColumn(rawStr)
    if (role === 'num' && numColIdx === -1) numColIdx = c
    else if (role === 'fullname' && fullNameColIdx === -1) fullNameColIdx = c
    else if (role === 'lastname' && lastNameColIdx === -1) lastNameColIdx = c
    else if (role === 'firstname' && firstNameColIdx === -1) firstNameColIdx = c
    else if (role === 'gender' && genderColIdx === -1) genderColIdx = c
    else if (role === 'matricule' && matriculeColIdx === -1) matriculeColIdx = c
    else if (role === 'discipline') {
      const { cleanName, explicitCoef } = extractCoefAndName(rawStr)
      disciplineCandidates.push({ colIndex: c, rawHeader: rawStr, cleanName, explicitCoef })
    }
  }

  const warnings: string[] = []
  if (disciplineCandidates.length === 0) {
    warnings.push('Aucune colonne de discipline/rubrique détectée dans le tableau.')
  }

  // 4. Lire les lignes élèves
  const parsedRows: ParsedExcelStudentRow[] = []
  const colMaxObserved: Record<number, number> = {}
  const colHasGrade: Record<number, boolean> = {}

  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || []

    let rawFullName = ''
    let lastName = ''
    let firstName = ''

    if (fullNameColIdx !== -1) {
      rawFullName = String(row[fullNameColIdx] ?? '').replace(/\s+/g, ' ').trim()
      const split = splitFullName(rawFullName)
      lastName = split.lastName
      firstName = split.firstName
    } else {
      lastName = lastNameColIdx !== -1 ? String(row[lastNameColIdx] ?? '').replace(/\s+/g, ' ').trim() : ''
      firstName = firstNameColIdx !== -1 ? String(row[firstNameColIdx] ?? '').replace(/\s+/g, ' ').trim() : ''
      rawFullName = `${lastName} ${firstName}`.trim()
    }

    if (!rawFullName) continue

    // Arrêter / sauter les lignes de légende ou totaux de bas de page
    if (isStopOrFooterRow(rawFullName)) continue

    // Vérifier aussi si toute la ligne ressemble à une ligne de légende (ex: N° vide et col 1 très long avec "Appréciations :")
    const rawNum = numColIdx !== -1 ? String(row[numColIdx] ?? '').trim() : ''
    if (rawFullName.includes(':') && rawFullName.length > 45) continue

    const genderRaw = genderColIdx !== -1 ? String(row[genderColIdx] ?? '').trim() : ''
    const matricule = matriculeColIdx !== -1 ? String(row[matriculeColIdx] ?? '').trim() : ''

    const scoresByColIndex: Record<number, number | null> = {}
    const scores: Record<string, number | null> = {}

    for (const disc of disciplineCandidates) {
      const parsedVal = parseFrenchScore(row[disc.colIndex])
      scoresByColIndex[disc.colIndex] = parsedVal
      scores[`col_${disc.colIndex}`] = parsedVal
      if (parsedVal !== null) {
        colHasGrade[disc.colIndex] = true
        if ((colMaxObserved[disc.colIndex] ?? 0) < parsedVal) {
          colMaxObserved[disc.colIndex] = parsedVal
        }
      }
    }

    parsedRows.push({
      rowIndex: r,
      rowNumberLabel: rawNum || String(parsedRows.length + 1),
      matricule,
      fullName: rawFullName,
      lastName: lastName || rawFullName.toUpperCase(),
      firstName,
      gender: normalizeGender(genderRaw),
      scoresByColIndex,
      scores,
    })
  }

  if (parsedRows.length === 0) {
    throw new Error(`Aucun élève valide trouvé sous les en-têtes dans la feuille "${targetSheet}".`)
  }

  const hasSeparateQuestionsCol = disciplineCandidates.some(dc => {
    const n = normalizeImportText(dc.cleanName)
    return n === 'questions' || n === 'question'
  })

  const columns: ParsedExcelColumn[] = disciplineCandidates.map(dc => {
    const maxObserved = colMaxObserved[dc.colIndex] ?? 0
    const normCol = normalizeImportText(dc.cleanName)
    const isSplitDicteeOnly =
      hasSeparateQuestionsCol &&
      (normCol.includes('ecrire les mots') || normCol === 'dictee') &&
      !normCol.includes('question')
    const curriculumMax = isSplitDicteeOnly
      ? 10
      : getPrimarySubjectMaxScore(dc.cleanName, options?.className, options?.classLevel)
    const suggestedMaxScore = maxObserved > 10 ? 20 : curriculumMax
    return {
      colIndex: dc.colIndex,
      rawHeader: dc.rawHeader,
      cleanName: dc.cleanName,
      explicitCoef: dc.explicitCoef,
      maxObservedScore: maxObserved,
      suggestedMaxScore,
      hasAnyGrade: Boolean(colHasGrade[dc.colIndex]),
    }
  })

  return {
    sheetName: targetSheet,
    allSheetNames,
    detectedTitle,
    detectedDivisor,
    detectedPrimaryPeriod,
    detectedSecondaryTerm,
    columns,
    rows: parsedRows,
    warnings,
  }
}

const SUBJECT_SYNONYM_GROUPS: Array<{ excelAliases: string[]; dbAliases: string[] }> = [
  {
    excelAliases: ['je sais ecrire les mots', 'dictee', 'ecrire les mots'],
    dbAliases: ['je sais ecrire les mots', 'dictee'],
  },
  {
    excelAliases: ['je produis un texte', 'redaction', 'production ecrite', 'expression ecrite'],
    dbAliases: ['je produis un texte', 'redaction'],
  },
  {
    excelAliases: ['etude de texte', 'etude texte'],
    dbAliases: ['etude de texte', 'etude texte'],
  },
  {
    excelAliases: ['j apprends a lire', 'lecture'],
    dbAliases: ['lecture'],
  },
  {
    excelAliases: ['je sais parler', 'langage', 'je sais dire'],
    dbAliases: ['je sais parler', 'langage', 'recitation'],
  },
  {
    excelAliases: ['calcul mental'],
    dbAliases: ['calcul mental'],
  },
  {
    excelAliases: ['calcul ecrit'],
    dbAliases: ['calcul ecrit'],
  },
  {
    excelAliases: ['probleme', 'problemes'],
    dbAliases: ['probleme'],
  },
  {
    excelAliases: ['science humaine', 'sciences humaines', 'histoire geographie', 'hist geo', 'hg'],
    dbAliases: ['sciences humaines', 'histoire geographie', 'histoire'],
  },
  {
    excelAliases: ['sciences et technologie', 'science et technologie', 'edusivip', 'sciences observation'],
    dbAliases: ['sciences et technologie', 'edusivip'],
  },
  {
    excelAliases: ['education sociale', 'ecm', 'education civique'],
    dbAliases: ['education sociale', 'ecm'],
  },
  {
    excelAliases: ['education artistique', 'arts plastiques', 'dessin'],
    dbAliases: ['arts plastiques', 'dessin', 'education artistique'],
  },
  {
    excelAliases: ['education musicale', 'chant', 'musique'],
    dbAliases: ['chant', 'education musicale', 'musique'],
  },
  {
    excelAliases: ['recitation'],
    dbAliases: ['recitation'],
  },
  {
    excelAliases: ['eps', 'sport', 'education physique'],
    dbAliases: ['eps', 'education physique'],
  },
  {
    excelAliases: ['anglais', 'english'],
    dbAliases: ['anglais'],
  },
  {
    excelAliases: ['francais'],
    dbAliases: ['francais'],
  },
  {
    excelAliases: ['mathematiques', 'maths', 'math'],
    dbAliases: ['mathematiques', 'math'],
  },
  {
    excelAliases: ['svt', 'sciences de la vie', 'biologie'],
    dbAliases: ['svt', 'biologie'],
  },
  {
    excelAliases: ['sciences physiques', 'physique chimie', 'physique', 'pc', 'sp'],
    dbAliases: ['sciences physiques', 'physique'],
  },
  {
    excelAliases: ['philosophie', 'philo'],
    dbAliases: ['philosophie'],
  },
]

/**
 * Associe de manière 1-pour-1 les rubriques d'un fichier Excel aux matières de l'école dans Scogestia.
 */
export function suggestSubjectMappings(
  parsedCols: ParsedExcelColumn[],
  dbSubjects: ExportSubjectItem[],
  classItem?: ExportClassItem | null,
  isPrimary: boolean = true
): SubjectMappingItem[] {
  const candidateSubjects = dbSubjects.filter(s => {
    const cyc = (s.cycle || '').toLowerCase()
    if (isPrimary) return !cyc || cyc === 'primaire' || cyc === 'maternelle'
    return cyc === 'secondaire'
  })

  const usedDbIds = new Set<string>()
  const hasSeparateQuestionsCol = parsedCols.some(c => {
    const n = normalizeImportText(c.cleanName)
    return n === 'questions' || n === 'question'
  })

  return parsedCols.map(col => {
    const excelNorm = normalizeImportText(col.cleanName)
    let matchedSubjectId: string | null = null
    let confidence: SubjectMappingItem['confidence'] = 'unmatched'

    // 1. Exact match
    const exact = candidateSubjects.find(
      s => !usedDbIds.has(s.id) && normalizeImportText(s.name) === excelNorm
    )
    if (exact) {
      matchedSubjectId = exact.id
      confidence = 'exact'
    }

    // 2. Synonym groups
    if (!matchedSubjectId) {
      for (const group of SUBJECT_SYNONYM_GROUPS) {
        const excelMatches = group.excelAliases.some(
          alias => excelNorm === alias || excelNorm.includes(alias)
        )
        if (!excelMatches) continue

        const dbMatch = candidateSubjects.find(s => {
          if (usedDbIds.has(s.id)) return false
          const dbNorm = normalizeImportText(s.name)
          return group.dbAliases.some(alias => dbNorm === alias || dbNorm.includes(alias))
        })
        if (dbMatch) {
          matchedSubjectId = dbMatch.id
          confidence = 'synonym'
          break
        }
      }
    }

    // 3. Partial containment (with >= 5 chars token overlap)
    if (!matchedSubjectId && excelNorm.length >= 4) {
      const partial = candidateSubjects.find(s => {
        if (usedDbIds.has(s.id)) return false
        const dbNorm = normalizeImportText(s.name)
        return (
          dbNorm.length >= 4 &&
          (dbNorm.includes(excelNorm) || excelNorm.includes(dbNorm))
        )
      })
      if (partial) {
        matchedSubjectId = partial.id
        confidence = 'partial'
      }
    }

    if (matchedSubjectId) {
      usedDbIds.add(matchedSubjectId)
    }

    const coef = isPrimary
      ? 1
      : col.explicitCoef ??
        getCoefficientForSubject(
          col.cleanName,
          classItem?.name,
          classItem?.level || undefined,
          2
        )

    const isSplitDicteeOnly =
      hasSeparateQuestionsCol &&
      (excelNorm.includes('ecrire les mots') || excelNorm === 'dictee') &&
      !excelNorm.includes('question')

    const dynamicMaxScore = isPrimary
      ? col.maxObservedScore > 10
        ? 20
        : isSplitDicteeOnly
          ? 10
          : getPrimarySubjectMaxScore(col.cleanName, classItem?.name, classItem?.level || undefined)
      : 20

    return {
      colKey: `col_${col.colIndex}`,
      colIndex: col.colIndex,
      excelName: col.cleanName,
      maxScore: dynamicMaxScore,
      coefficient: coef,
      matchedSubjectId,
      confidence,
    }
  })
}

/**
 * Associe chaque ligne élève du fichier Excel aux élèves inscrits dans la classe Scogestia.
 */
export function matchStudentsToClass(
  excelRows: ParsedExcelStudentRow[],
  classStudents: ExportStudentItem[]
): StudentMatchResult[] {
  const usedIds = new Set<string>()

  return excelRows.map(row => {
    // 1. Par matricule
    if (row.matricule) {
      const matNorm = row.matricule.trim().toLowerCase()
      const byMat = classStudents.find(
        s => !usedIds.has(s.id) && (s.matricule || '').trim().toLowerCase() === matNorm
      )
      if (byMat) {
        usedIds.add(byMat.id)
        return {
          excelRowIndex: row.rowIndex,
          excelFullName: row.fullName,
          matchedStudentId: byMat.id,
          matchMethod: 'matricule',
        }
      }
    }

    const excelFullNorm = normalizeImportText(row.fullName)

    // 2. Nom complet exact (`LAST FIRST`)
    const byExact = classStudents.find(s => {
      if (usedIds.has(s.id)) return false
      const lf = normalizeImportText(`${s.last_name} ${s.first_name}`)
      return lf === excelFullNorm
    })
    if (byExact) {
      usedIds.add(byExact.id)
      return {
        excelRowIndex: row.rowIndex,
        excelFullName: row.fullName,
        matchedStudentId: byExact.id,
        matchMethod: 'exact_name',
      }
    }

    // 3. Nom inversé (`FIRST LAST`)
    const byReversed = classStudents.find(s => {
      if (usedIds.has(s.id)) return false
      const fl = normalizeImportText(`${s.first_name} ${s.last_name}`)
      return fl === excelFullNorm
    })
    if (byReversed) {
      usedIds.add(byReversed.id)
      return {
        excelRowIndex: row.rowIndex,
        excelFullName: row.fullName,
        matchedStudentId: byReversed.id,
        matchMethod: 'reversed_name',
      }
    }

    // 4. Ensemble de mots identiques ou sous-ensemble complet
    const excelTokens = excelFullNorm.split(' ').filter(t => t.length >= 2)
    if (excelTokens.length >= 2) {
      const byTokens = classStudents.find(s => {
        if (usedIds.has(s.id)) return false
        const dbTokens = normalizeImportText(`${s.last_name} ${s.first_name}`)
          .split(' ')
          .filter(t => t.length >= 2)
        if (dbTokens.length < 2) return false
        const allExcelInDb = excelTokens.every(t => dbTokens.includes(t))
        const allDbInExcel = dbTokens.every(t => excelTokens.includes(t))
        return allExcelInDb || allDbInExcel
      })
      if (byTokens) {
        usedIds.add(byTokens.id)
        return {
          excelRowIndex: row.rowIndex,
          excelFullName: row.fullName,
          matchedStudentId: byTokens.id,
          matchMethod: 'token_name',
        }
      }
    }

    return {
      excelRowIndex: row.rowIndex,
      excelFullName: row.fullName,
      matchedStudentId: null,
      matchMethod: 'unmatched',
    }
  })
}

function formatDivisorNumber(val: number): string {
  const rounded = Math.round(val * 100) / 100
  return rounded.toString().replace('.', ',')
}

/**
 * Construit un ClassResultsReport complet directement à partir d'un fichier Excel importé
 * (calcul automatique des totaux, moyennes, rangs avec ex-æquo, appréciations, stats G/F,
 * et extraction des admis par ordre de mérite du 1er au dernier).
 */
export function buildReportFromImportedData(params: {
  parsed: ParsedExcelSheetResult
  classItem: ExportClassItem
  cycle: ExportCycle
  primaryPeriod?: PrimaryPeriodKey
  secondaryTerm?: string
  scale?: AverageScale
  customDivisor?: number | null
  sortMode?: SortMode
  filterMode?: FilterMode
  customTitle?: string
  schoolName?: string
  academicYear?: string
  columnConfigOverrides?: Record<number, { maxScore?: number; coefficient?: number }>
}): ClassResultsReport {
  const {
    parsed,
    classItem,
    cycle,
    primaryPeriod = parsed.detectedPrimaryPeriod || 'month_1',
    secondaryTerm = parsed.detectedSecondaryTerm || '1er_trimestre',
    sortMode = 'alphabetical',
    filterMode = 'all',
    schoolName = 'Établissement Scolaire',
    academicYear = '2026-2027',
    columnConfigOverrides,
  } = params

  const isPrimary = cycle === 'primaire' || cycle === 'maternelle'
  const scale: AverageScale = isPrimary ? params.scale || 20 : 20
  const passThreshold = scale === 10 ? 5 : 10

  // 1. Colonnes de disciplines issues exactement du fichier Excel importé
  const columns: ExportColumnDef[] = parsed.columns.map(c => {
    const ov = columnConfigOverrides?.[c.colIndex]
    const maxScore = ov?.maxScore ?? (isPrimary ? c.suggestedMaxScore : 20)
    const coefficient = isPrimary
      ? 1
      : ov?.coefficient ??
        c.explicitCoef ??
        getCoefficientForSubject(c.cleanName, classItem.name, classItem.level || undefined, 2)

    return {
      id: `col_${c.colIndex}`,
      name: c.cleanName,
      shortName: isPrimary ? c.cleanName : `${c.cleanName} (c.${coefficient})`,
      maxScore,
      coefficient,
      hasAnyGrade: c.hasAnyGrade,
    }
  })

  // 2. Barème et diviseur
  const activeColumns = columns.filter(c => c.hasAnyGrade)
  const columnsForDenominator = activeColumns.length > 0 ? activeColumns : columns

  let barèmeTotal = 0
  let divisor = 1
  if (isPrimary) {
    barèmeTotal = columnsForDenominator.reduce((acc, c) => acc + c.maxScore, 0)
    const autoDivisor = barèmeTotal > 0 ? barèmeTotal / scale : 1
    if (params.customDivisor && params.customDivisor > 0) {
      divisor = params.customDivisor
    } else if (
      scale === 20 &&
      parsed.detectedDivisor &&
      parsed.detectedDivisor > 0
    ) {
      divisor = parsed.detectedDivisor
    } else {
      divisor = autoDivisor
    }
  } else {
    barèmeTotal = columnsForDenominator.reduce((acc, c) => acc + c.coefficient, 0)
    divisor =
      params.customDivisor && params.customDivisor > 0
        ? params.customDivisor
        : barèmeTotal > 0
          ? barèmeTotal
          : 1
  }

  // 3. Totaux & Moyennes par élève
  const rawRows: ComputedStudentRow[] = parsed.rows.map((stu, idx) => {
    const scores: Record<string, number | null> = {}
    let totalPoints = 0
    let gradedCount = 0
    let studentCoefSum = 0

    for (const col of columns) {
      const val = stu.scores[col.id] ?? null
      scores[col.id] = val
      if (val !== null && val !== undefined && !isNaN(val)) {
        gradedCount++
        if (isPrimary) {
          totalPoints += val
        } else {
          totalPoints += val * col.coefficient
          studentCoefSum += col.coefficient
        }
      }
    }

    const isAbsent = gradedCount === 0
    const finalTotal = isAbsent ? null : Number(totalPoints.toFixed(2))

    let average: number | null = null
    if (!isAbsent && finalTotal !== null) {
      if (isPrimary) {
        average = divisor > 0 ? Number((finalTotal / divisor).toFixed(2)) : null
      } else {
        const effDiv =
          params.customDivisor && params.customDivisor > 0
            ? params.customDivisor
            : studentCoefSum > 0
              ? studentCoefSum
              : divisor
        average = effDiv > 0 ? Number((finalTotal / effDiv).toFixed(2)) : null
      }
    }

    const appr = getAppreciation(average, scale)
    return {
      studentId: `excel_row_${idx}_${stu.rowIndex}`,
      lastName: stu.lastName,
      firstName: stu.firstName,
      fullName: stu.fullName,
      matricule: stu.matricule,
      gender: stu.gender,
      scores,
      gradedCount,
      totalPoints: finalTotal,
      average,
      rankNum: null,
      rankText: '-',
      isExAequo: false,
      isPassing: average !== null && average >= passThreshold,
      isAbsent,
      appreciation: appr.label,
      appreciationBucket: appr.bucket,
    }
  })

  // 4. Rangs officiels avec ex-æquo (sur les présents)
  const presentRows = rawRows
    .filter(r => !r.isAbsent && r.average !== null)
    .sort((a, b) => {
      if ((b.average ?? 0) !== (a.average ?? 0)) {
        return (b.average ?? 0) - (a.average ?? 0)
      }
      return (b.totalPoints ?? 0) - (a.totalPoints ?? 0)
    })

  const rankById = new Map<string, { rankNum: number; rankText: string; isExAequo: boolean }>()
  let currentRank = 1
  for (let i = 0; i < presentRows.length; i++) {
    const cur = presentRows[i]
    const prev = i > 0 ? presentRows[i - 1] : null
    const next = i < presentRows.length - 1 ? presentRows[i + 1] : null

    const sameAsPrev =
      prev !== null &&
      prev.average === cur.average &&
      Math.abs((prev.totalPoints ?? 0) - (cur.totalPoints ?? 0)) < 0.001

    const sameAsNext =
      next !== null &&
      next.average === cur.average &&
      Math.abs((next.totalPoints ?? 0) - (cur.totalPoints ?? 0)) < 0.001

    if (!sameAsPrev) currentRank = i + 1
    const isExAequo = sameAsPrev || sameAsNext
    rankById.set(cur.studentId, {
      rankNum: currentRank,
      rankText: formatRank(currentRank, isExAequo),
      isExAequo,
    })
  }

  const allRows: ComputedStudentRow[] = rawRows.map(r => {
    const rk = rankById.get(r.studentId)
    return rk ? { ...r, ...rk } : r
  })

  // 5. Ordre de mérite des élèves ayant la moyenne uniquement
  const meritPassingRows = allRows
    .filter(r => !r.isAbsent && r.isPassing)
    .sort((a, b) => {
      if ((b.average ?? 0) !== (a.average ?? 0)) {
        return (b.average ?? 0) - (a.average ?? 0)
      }
      return (b.totalPoints ?? 0) - (a.totalPoints ?? 0)
    })

  let displayRows =
    filterMode === 'passing_only'
      ? allRows.filter(r => !r.isAbsent && r.isPassing)
      : [...allRows]

  if (sortMode === 'merit') {
    displayRows = [...displayRows].sort((a, b) => {
      if (a.isAbsent && !b.isAbsent) return 1
      if (!a.isAbsent && b.isAbsent) return -1
      if (a.isAbsent && b.isAbsent) return a.fullName.localeCompare(b.fullName, 'fr')
      if ((b.average ?? 0) !== (a.average ?? 0)) {
        return (b.average ?? 0) - (a.average ?? 0)
      }
      if ((b.totalPoints ?? 0) !== (a.totalPoints ?? 0)) {
        return (b.totalPoints ?? 0) - (a.totalPoints ?? 0)
      }
      return a.fullName.localeCompare(b.fullName, 'fr')
    })
  } else {
    displayRows = [...displayRows].sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr'))
  }

  // 6. Statistiques de récapitulation
  const countGender = (rows: ComputedStudentRow[]): RecapGenderStats => {
    let boys = 0
    let girls = 0
    let other = 0
    for (const r of rows) {
      if (r.gender === 'M') boys++
      else if (r.gender === 'F') girls++
      else other++
    }
    return { boys, girls, other, total: rows.length }
  }

  const presentAll = allRows.filter(r => !r.isAbsent)
  const absentAll = allRows.filter(r => r.isAbsent)
  const passingAll = presentAll.filter(r => r.isPassing)
  const failingAll = presentAll.filter(r => !r.isPassing)

  const classAverage =
    presentAll.length > 0
      ? Number(
          (presentAll.reduce((acc, r) => acc + (r.average ?? 0), 0) / presentAll.length).toFixed(2)
        )
      : null

  const passRatePct =
    presentAll.length > 0
      ? Number(((passingAll.length / presentAll.length) * 100).toFixed(1))
      : null

  const highestRow = presentRows[0] || null
  const lowestRow = presentRows.length > 0 ? presentRows[presentRows.length - 1] : null

  const bucketDefs: Array<{
    bucket: ComputedStudentRow['appreciationBucket']
    label: string
    rangeLabel: string
  }> = [
    {
      bucket: 'tres_bon',
      label: 'Très bon travail ; félicitations',
      rangeLabel: scale === 10 ? '≥ 9,00' : '≥ 18,00',
    },
    {
      bucket: 'bon',
      label: 'Bon travail',
      rangeLabel: scale === 10 ? '8,00 à 8,99' : '16,00 à 17,99',
    },
    {
      bucket: 'assez_bon',
      label: 'Assez bon travail',
      rangeLabel: scale === 10 ? '6,00 à 7,99' : '12,00 à 15,99',
    },
    {
      bucket: 'passable',
      label: 'Passable',
      rangeLabel: scale === 10 ? '5,00 à 5,99' : '10,00 à 11,99',
    },
    {
      bucket: 'mediocre',
      label: 'Travail médiocre',
      rangeLabel: scale === 10 ? '3,00 à 4,99' : '6,00 à 9,99',
    },
    {
      bucket: 'tres_insuffisant',
      label: 'Travail très insuffisant',
      rangeLabel: scale === 10 ? '< 3,00' : '< 6,00',
    },
    {
      bucket: 'absent',
      label: 'Absent(e)',
      rangeLabel: 'Non noté',
    },
  ]

  const appreciationBreakdown = bucketDefs.map(def => {
    const matched = allRows.filter(r => r.appreciationBucket === def.bucket)
    const gc = countGender(matched)
    return {
      bucket: def.bucket,
      label: def.label,
      rangeLabel: def.rangeLabel,
      boys: gc.boys,
      girls: gc.girls,
      total: gc.total,
      pct: allRows.length > 0 ? Number(((gc.total / allRows.length) * 100).toFixed(1)) : 0,
    }
  })

  const subjectStats: SubjectStatsRow[] = columns.map(col => {
    const vals: number[] = []
    for (const r of allRows) {
      const v = r.scores[col.id]
      if (v !== null && v !== undefined && !isNaN(v)) vals.push(v)
    }
    const halfMax = col.maxScore / 2
    const passingCount = vals.filter(v => v >= halfMax).length
    return {
      columnId: col.id,
      name: col.name,
      maxScore: col.maxScore,
      coefficient: col.coefficient,
      gradedCount: vals.length,
      minScore: vals.length > 0 ? Math.min(...vals) : null,
      maxFoundScore: vals.length > 0 ? Math.max(...vals) : null,
      average:
        vals.length > 0
          ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
          : null,
      passingCount,
      passRatePct:
        vals.length > 0 ? Number(((passingCount / vals.length) * 100).toFixed(1)) : null,
    }
  })

  const formulaLabel = isPrimary
    ? `Moyenne = Total ÷ ${formatDivisorNumber(divisor)}`
    : `Moyenne = Σ(Moy × Coef) ÷ ${formatDivisorNumber(divisor)}`

  const title =
    params.customTitle?.trim() ||
    parsed.detectedTitle ||
    `RÉSULTATS IMPORTÉS – ${classItem.name.toUpperCase()}`

  return {
    title,
    periodLabel: getPeriodLabel(isPrimary, primaryPeriod, secondaryTerm),
    className: classItem.name,
    schoolName,
    academicYear,
    cycle,
    isPrimary,
    scale,
    passThreshold,
    sortMode,
    filterMode,
    formulaLabel,
    divisor,
    barèmeTotal,
    columns,
    allRows,
    displayRows,
    meritPassingRows,
    stats: {
      enrolled: countGender(allRows),
      present: countGender(presentAll),
      absent: countGender(absentAll),
      passing: countGender(passingAll),
      failing: countGender(failingAll),
      passRatePct,
      classAverage,
      highestAverage: highestRow?.average ?? null,
      highestStudentName: highestRow?.fullName ?? null,
      lowestAverage: lowestRow?.average ?? null,
      lowestStudentName: lowestRow?.fullName ?? null,
      appreciationBreakdown,
      subjectStats,
    },
    legendText: getLegendText(scale),
  }
}
