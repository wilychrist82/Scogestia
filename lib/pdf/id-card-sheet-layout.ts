/**
 * Gabarit unique de la planche A4 des cartes scolaires.
 * Partagé par le moteur PDF (jsPDF) et par l'aperçu papier HTML afin que
 * ce que l'utilisateur voit à l'écran corresponde exactement au PDF imprimé.
 */

export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297

export const ID_CARD_WIDTH_MM = 94
export const ID_CARD_HEIGHT_MM = 53.5

export const ID_CARDS_PER_PAGE = 10
export const ID_CARD_COLUMNS_X_MM = [8.5, 107.5] as const
export const ID_CARD_ROWS_Y_MM = [10, 66, 122, 178, 234] as const

/** Conversion CSS : 1 mm = 96 / 25.4 px */
export const CSS_PX_PER_MM = 96 / 25.4

/** Position d'une carte unitaire sur A4 : centrée horizontalement, en haut de page (économie de papier). */
export const SINGLE_CARD_POSITION_MM = {
  x: (A4_WIDTH_MM - ID_CARD_WIDTH_MM) / 2,
  y: ID_CARD_ROWS_Y_MM[0],
} as const

export interface IdCardSlot {
  slotIndex: number
  col: number
  row: number
  x: number
  y: number
}

export function getIdCardSlot(slotIndex: number): IdCardSlot {
  const safe = Math.max(0, Math.min(ID_CARDS_PER_PAGE - 1, slotIndex))
  const col = safe % 2
  const row = Math.floor(safe / 2)
  return {
    slotIndex: safe,
    col,
    row,
    x: ID_CARD_COLUMNS_X_MM[col],
    y: ID_CARD_ROWS_Y_MM[row],
  }
}

/** Découpe une liste en pages de 10 cartes (la dernière page n'est pas complétée). */
export function paginateIdCards<T>(items: T[]): T[][] {
  const pages: T[][] = []
  for (let i = 0; i < items.length; i += ID_CARDS_PER_PAGE) {
    pages.push(items.slice(i, i + ID_CARDS_PER_PAGE))
  }
  return pages
}

export interface CropMarkSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

const CROP_OFFSET_MM = 0.6
const CROP_OUTER_LENGTH_MM = 4

/** Traits de coupe pour une carte isolée (marges libres tout autour). */
export function buildCropMarksForRect(
  x: number,
  y: number,
  w: number = ID_CARD_WIDTH_MM,
  h: number = ID_CARD_HEIGHT_MM
): CropMarkSegment[] {
  const o = CROP_OFFSET_MM
  const l = CROP_OUTER_LENGTH_MM
  const r = x + w
  const b = y + h
  return [
    { x1: x - o, y1: y, x2: x - o - l, y2: y },
    { x1: x - o, y1: b, x2: x - o - l, y2: b },
    { x1: r + o, y1: y, x2: r + o + l, y2: y },
    { x1: r + o, y1: b, x2: r + o + l, y2: b },
    { x1: x, y1: y - o, x2: x, y2: y - o - l },
    { x1: r, y1: y - o, x2: r, y2: y - o - l },
    { x1: x, y1: b + o, x2: x, y2: b + o + l },
    { x1: r, y1: b + o, x2: r, y2: b + o + l },
  ]
}

/**
 * Calcule les traits de coupe (repères de découpe) aux 4 coins de chaque carte occupée.
 * Les traits restent dans les marges ou les gouttières entre cartes sans jamais
 * empiéter sur une carte voisine.
 */
export function buildCropMarkSegments(occupiedSlots: number): CropMarkSegment[] {
  const count = Math.max(0, Math.min(ID_CARDS_PER_PAGE, occupiedSlots))
  const segments: CropMarkSegment[] = []
  const lastRow = ID_CARD_ROWS_Y_MM.length - 1

  const gutterX = ID_CARD_COLUMNS_X_MM[1] - (ID_CARD_COLUMNS_X_MM[0] + ID_CARD_WIDTH_MM)
  const gutterY = ID_CARD_ROWS_Y_MM[1] - (ID_CARD_ROWS_Y_MM[0] + ID_CARD_HEIGHT_MM)
  const innerOffY = CROP_OFFSET_MM * 0.6
  const innerLenX = Math.max(0.5, gutterX / 2 - CROP_OFFSET_MM)
  const innerLenY = Math.max(0.4, gutterY / 2 - innerOffY)

  for (let i = 0; i < count; i++) {
    const { col, row, x, y } = getIdCardSlot(i)
    const right = x + ID_CARD_WIDTH_MM
    const bottom = y + ID_CARD_HEIGHT_MM

    // Côté gouttière (entre deux cartes) : traits courts ; côté marge de la feuille : traits longs
    const lenLeft = col === 1 ? innerLenX : CROP_OUTER_LENGTH_MM
    const lenRight = col === 0 ? innerLenX : CROP_OUTER_LENGTH_MM
    const lenTop = row > 0 ? innerLenY : CROP_OUTER_LENGTH_MM
    const lenBottom = row < lastRow ? innerLenY : CROP_OUTER_LENGTH_MM
    const offY = row > 0 ? innerOffY : CROP_OFFSET_MM
    const offYBottom = row < lastRow ? innerOffY : CROP_OFFSET_MM

    // Traits horizontaux (prolongent les bords haut/bas vers l'extérieur)
    segments.push({ x1: x - CROP_OFFSET_MM, y1: y, x2: x - CROP_OFFSET_MM - lenLeft, y2: y })
    segments.push({ x1: x - CROP_OFFSET_MM, y1: bottom, x2: x - CROP_OFFSET_MM - lenLeft, y2: bottom })
    segments.push({ x1: right + CROP_OFFSET_MM, y1: y, x2: right + CROP_OFFSET_MM + lenRight, y2: y })
    segments.push({ x1: right + CROP_OFFSET_MM, y1: bottom, x2: right + CROP_OFFSET_MM + lenRight, y2: bottom })

    // Traits verticaux (prolongent les bords gauche/droit vers l'extérieur)
    segments.push({ x1: x, y1: y - offY, x2: x, y2: y - offY - lenTop })
    segments.push({ x1: right, y1: y - offY, x2: right, y2: y - offY - lenTop })
    segments.push({ x1: x, y1: bottom + offYBottom, x2: x, y2: bottom + offYBottom + lenBottom })
    segments.push({ x1: right, y1: bottom + offYBottom, x2: right, y2: bottom + offYBottom + lenBottom })
  }

  return segments
}
