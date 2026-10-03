import { describe, it, expect } from 'vitest'
import {
  normalizeText,
  detectClassLevel,
  getRowField,
  extractNameParts,
  extractClassFromFilename,
  parseFlexibleDate,
  parseGender
} from '../lib/student-import-utils'

describe('Import Students Helpers', () => {
  describe('normalizeText', () => {
    it('normalise la casse, les espaces et les accents', () => {
      expect(normalizeText('  6Ème A  ')).toBe('6eme a')
      expect(normalizeText('1ÈRE D')).toBe('1ere d')
      expect(normalizeText('Terminale C')).toBe('terminale c')
    })
  })

  describe('detectClassLevel', () => {
    it('détecte correctement le niveau Lycée', () => {
      expect(detectClassLevel('2nde A')).toBe('Lycée')
      expect(detectClassLevel('Seconde C')).toBe('Lycée')
      expect(detectClassLevel('1ère D')).toBe('Lycée')
      expect(detectClassLevel('1ere A4')).toBe('Lycée')
      expect(detectClassLevel('Terminale C')).toBe('Lycée')
      expect(detectClassLevel('Tle D')).toBe('Lycée')
    })

    it('détecte correctement le niveau Collège', () => {
      expect(detectClassLevel('6ème A')).toBe('Collège')
      expect(detectClassLevel('6eme B')).toBe('Collège')
      expect(detectClassLevel('5ème 1')).toBe('Collège')
      expect(detectClassLevel('4eme')).toBe('Collège')
      expect(detectClassLevel('3ème C')).toBe('Collège')
    })

    it('détecte correctement le niveau Primaire', () => {
      expect(detectClassLevel('CP1 A')).toBe('Primaire')
      expect(detectClassLevel('CP2')).toBe('Primaire')
      expect(detectClassLevel('CE1')).toBe('Primaire')
      expect(detectClassLevel('CM2 B')).toBe('Primaire')
    })

    it('détecte correctement le niveau Maternelle', () => {
      expect(detectClassLevel('Petite Section')).toBe('Maternelle')
      expect(detectClassLevel('Grande Section')).toBe('Maternelle')
      expect(detectClassLevel('S1')).toBe('Maternelle')
      expect(detectClassLevel('S2')).toBe('Maternelle')
    })
  })

  describe('extractNameParts', () => {
    it('gère les colonnes séparées Nom et Prénom', () => {
      const row = { 'Nom': 'ADJOKPA', 'Prénom': 'Kokou' }
      expect(extractNameParts(row)).toEqual({ firstName: 'Kokou', lastName: 'ADJOKPA' })
    })

    it('gère une colonne combinée Nom et Prénoms (ex: ADJOKPA Kokou)', () => {
      const row = { 'Nom et Prénoms': 'ADJOKPA Kokou' }
      expect(extractNameParts(row)).toEqual({ firstName: 'Kokou', lastName: 'ADJOKPA' })
    })

    it('gère une colonne combinée avec plusieurs prénoms (ex: KOFFI Jean Paul)', () => {
      const row = { 'Nom et Prénom': 'KOFFI Jean Paul' }
      expect(extractNameParts(row)).toEqual({ firstName: 'Jean Paul', lastName: 'KOFFI' })
    })
  })

  describe('extractClassFromFilename', () => {
    const classes = [
      { id: '1', name: 'CP1' },
      { id: '2', name: 'CE1' },
      { id: '3', name: '6ème A' }
    ]

    it('détecte CE1 depuis "liste alphabétique CE1.xlsx"', () => {
      expect(extractClassFromFilename('liste alphabétique CE1.xlsx', classes)).toBe('CE1')
      expect(extractClassFromFilename('liste alphab&tique CE1.xlsx', classes)).toBe('CE1')
    })

    it('détecte la classe depuis un nom avec tirets ou underscores', () => {
      expect(extractClassFromFilename('eleves_CP1_2026.xlsx', classes)).toBe('CP1')
    })
  })

  describe('getRowField', () => {
    it('extrait les colonnes quel que soit le formatage, la casse ou les accents', () => {
      const row = {
        ' Prénom ': 'Alice',
        'NOM': 'Kouassi',
        'classe': '2nde C',
        'Sexe': 'F'
      }

      expect(getRowField(row, ['prenom', 'first name'])).toBe('Alice')
      expect(getRowField(row, ['nom', 'last name'])).toBe('Kouassi')
      expect(getRowField(row, ['classe', 'class'])).toBe('2nde C')
      expect(getRowField(row, ['sexe', 'genre'])).toBe('F')
    })
  })

  describe('parseFlexibleDate', () => {
    it('parse les dates au format français JJ/MM/AAAA', () => {
      expect(parseFlexibleDate('15/04/2008')).toBe('2008-04-15')
      expect(parseFlexibleDate('01-09-2010')).toBe('2010-09-01')
    })

    it('parse les dates ISO YYYY-MM-DD', () => {
      expect(parseFlexibleDate('2008-04-15')).toBe('2008-04-15')
    })

    it('gère les numéros de série Excel', () => {
      // 39553 = 2008-04-15
      const parsed = parseFlexibleDate(39553)
      expect(parsed).toBe('2008-04-15')
    })

    it('renvoie null si la date est invalide ou vide', () => {
      expect(parseFlexibleDate('')).toBeNull()
      expect(parseFlexibleDate('invalide')).toBeNull()
    })
  })

  describe('parseGender', () => {
    it('normalise M et Masculin', () => {
      expect(parseGender('M')).toBe('M')
      expect(parseGender('m')).toBe('M')
      expect(parseGender('Masculin')).toBe('M')
      expect(parseGender('Garçon')).toBe('M')
      expect(parseGender('Homme')).toBe('M')
    })

    it('normalise F et Féminin', () => {
      expect(parseGender('F')).toBe('F')
      expect(parseGender('f')).toBe('F')
      expect(parseGender('Féminin')).toBe('F')
      expect(parseGender('Femme')).toBe('F')
      expect(parseGender('Fille')).toBe('F')
    })

    it('renvoie null pour les valeurs inconnues', () => {
      expect(parseGender('')).toBeNull()
      expect(parseGender('Inconnu')).toBeNull()
    })
  })
})
