import { describe, it, expect } from 'vitest'
import { AVATAR_TONES, formatCFA, getAvatarTone, getPaymentMethodLabel } from '../lib/format'

describe('Shared formatting helpers (lib/format.ts)', () => {
  it('formats FCFA amounts cleanly without non-breaking spaces (PDF/Web safe)', () => {
    const out = formatCFA(1500000)
    expect(out).toBe('1 500 000 FCFA')
    expect(out).not.toMatch(/[\u00A0\u202F]/)
    expect(formatCFA('7000')).toBe('7 000 FCFA')
    expect(formatCFA(12500.4)).toBe('12 500 FCFA')
    expect(formatCFA(12500, 'F')).toBe('12 500 F')
    expect(formatCFA(12500, '')).toBe('12 500')
  })

  it('handles null, undefined, or invalid numeric amounts safely', () => {
    expect(formatCFA(0)).toBe('0 FCFA')
    expect(formatCFA(null)).toBe('0 FCFA')
    expect(formatCFA(undefined)).toBe('0 FCFA')
    expect(formatCFA(Number.NaN)).toBe('0 FCFA')
    expect(formatCFA('abc')).toBe('0 FCFA')
  })

  it('resolves known payment methods and safe fallbacks', () => {
    expect(getPaymentMethodLabel('especes')).toBe('Espèces')
    expect(getPaymentMethodLabel('tmoney')).toBe('T-Money')
    expect(getPaymentMethodLabel('virement')).toBe('Virement bancaire')
    expect(getPaymentMethodLabel('banque')).toBe('Virement')
    expect(getPaymentMethodLabel(null)).toBe('Autre')
    expect(getPaymentMethodLabel('crypto')).toBe('crypto')
  })

  it('computes deterministic avatar tones from AVATAR_TONES', () => {
    const toneA1 = getAvatarTone('student-42')
    const toneA2 = getAvatarTone('student-42')
    const toneEmpty = getAvatarTone('')
    expect(toneA1).toBe(toneA2)
    expect(AVATAR_TONES).toContain(toneA1)
    expect(AVATAR_TONES).toContain(toneEmpty)
  })
})
