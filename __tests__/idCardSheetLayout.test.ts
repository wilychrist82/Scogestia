import { describe, expect, it } from 'vitest'
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  ID_CARDS_PER_PAGE,
  ID_CARD_HEIGHT_MM,
  ID_CARD_WIDTH_MM,
  SINGLE_CARD_POSITION_MM,
  buildCropMarkSegments,
  buildCropMarksForRect,
  getIdCardSlot,
  paginateIdCards,
} from '@/lib/pdf/id-card-sheet-layout'

describe('id-card-sheet-layout (A4 10 cards/page & crop marks)', () => {
  it('paginates cards in batches of 10 without padding the last page', () => {
    const items = Array.from({ length: 24 }, (_, i) => i + 1)
    const pages = paginateIdCards(items)
    expect(pages).toHaveLength(3)
    expect(pages[0]).toHaveLength(ID_CARDS_PER_PAGE)
    expect(pages[1]).toHaveLength(ID_CARDS_PER_PAGE)
    expect(pages[2]).toHaveLength(4)
  })

  it('places all 10 slots inside A4 bounds with exact 94x53.5mm geometry', () => {
    for (let i = 0; i < ID_CARDS_PER_PAGE; i++) {
      const slot = getIdCardSlot(i)
      expect(slot.x).toBeGreaterThanOrEqual(0)
      expect(slot.y).toBeGreaterThanOrEqual(0)
      expect(slot.x + ID_CARD_WIDTH_MM).toBeLessThanOrEqual(A4_WIDTH_MM)
      expect(slot.y + ID_CARD_HEIGHT_MM).toBeLessThanOrEqual(A4_HEIGHT_MM)
    }
    expect(SINGLE_CARD_POSITION_MM.x).toBe((A4_WIDTH_MM - ID_CARD_WIDTH_MM) / 2)
  })

  it('generates 8 crop mark segments per occupied card strictly within A4 page', () => {
    const segs = buildCropMarkSegments(10)
    expect(segs).toHaveLength(80)
    for (const s of segs) {
      expect(s.x1).toBeGreaterThanOrEqual(0)
      expect(s.x2).toBeGreaterThanOrEqual(0)
      expect(s.x1).toBeLessThanOrEqual(A4_WIDTH_MM)
      expect(s.x2).toBeLessThanOrEqual(A4_WIDTH_MM)
      expect(s.y1).toBeGreaterThanOrEqual(0)
      expect(s.y2).toBeGreaterThanOrEqual(0)
      expect(s.y1).toBeLessThanOrEqual(A4_HEIGHT_MM)
      expect(s.y2).toBeLessThanOrEqual(A4_HEIGHT_MM)
    }

    const singleSegs = buildCropMarksForRect(SINGLE_CARD_POSITION_MM.x, SINGLE_CARD_POSITION_MM.y)
    expect(singleSegs).toHaveLength(8)
  })
})
