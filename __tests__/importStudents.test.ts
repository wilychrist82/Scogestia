import { describe, it, expect } from 'vitest'
import {
  normalizeText,
  detectClassLevel,
  getRowField,
  extractNameParts,
  extractClassFromFilename,
  parseFlexibleDate,
  parseGender,
  canonicalClassKey,
  matchExistingClass,
  analyzeStudentImportRows,
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

  describe('canonicalClassKey & matchExistingClass', () => {
    it('normalise les variantes de libellés de classes', () => {
      expect(canonicalClassKey('CP 1')).toBe('cp1')
      expect(canonicalClassKey('C.P.1')).toBe('cp1')
      expect(canonicalClassKey('6ème')).toBe('6eme')
      expect(canonicalClassKey('6e')).toBe('6eme')
      expect(canonicalClassKey('6eA')).toBe('6emea')
      expect(canonicalClassKey('6 ème A')).toBe('6emea')
      expect(canonicalClassKey('Tle D')).toBe('terminaled')
      expect(canonicalClassKey('Terminale D')).toBe('terminaled')
      expect(canonicalClassKey('Seconde A4')).toBe('2ndea4')
      expect(canonicalClassKey('1ère C')).toBe('1erec')
    })

    it('associe les variantes Excel aux classes existantes du logiciel', () => {
      const schoolClasses = [
        { id: 'c1', name: 'CP1', level: 'Primaire' },
        { id: 'c2', name: '6ème', level: 'Collège' },
        { id: 'c3', name: 'Terminale D', level: 'Lycée' },
        { id: 'c4', name: '5ème A', level: 'Collège' },
        { id: 'c5', name: '5ème B', level: 'Collège' },
        { id: 'c6', name: '3ème A', level: 'Collège' },
      ]

      expect(matchExistingClass('CP 1', schoolClasses)?.id).toBe('c1')
      expect(matchExistingClass('6e', schoolClasses)?.id).toBe('c2')
      expect(matchExistingClass('Tle D', schoolClasses)?.id).toBe('c3')
      // Section unique sans ambiguïté
      expect(matchExistingClass('3ème', schoolClasses)?.id).toBe('c6')
      // Plusieurs sections existantes -> pas de choix arbitraire
      expect(matchExistingClass('5ème', schoolClasses)).toBeNull()
    })
  })

  describe('analyzeStudentImportRows (multi-classes & anti-doublons)', () => {
    const existingClasses = [
      { id: 'cls-cp1', name: 'CP1', level: 'Primaire' },
      { id: 'cls-cp2', name: 'CP2', level: 'Primaire' },
      { id: 'cls-ce1', name: 'CE1', level: 'Primaire' },
      { id: 'cls-6e', name: '6ème', level: 'Collège' },
      { id: 'cls-3e', name: '3ème', level: 'Collège' },
    ]

    const existingStudents = [
      {
        id: 'stu-1',
        matricule: '1001',
        first_name: 'Kokou',
        last_name: 'MENSAH',
        class_id: 'cls-cp1',
        date_of_birth: '2019-05-14',
      },
      {
        id: 'stu-2',
        matricule: '1002',
        first_name: 'Afi',
        last_name: 'KOFFI',
        class_id: 'cls-6e',
        date_of_birth: '2013-09-22',
      },
    ]

    it('répartit 100 élèves sur CP1..CM2..6ème..3ème dans les bonnes classes et ignore les doublons', () => {
      const classRotation = ['CP1', 'CP 2', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '3ème']
      const batch: Array<Record<string, unknown>> = []

      // 100 élèves variés répartis sur toutes ces classes
      for (let i = 0; i < 100; i++) {
        batch.push({
          'Prénom': `Eleve${i + 1}`,
          'Nom': `FAMILLE${i + 1}`,
          'Classe': classRotation[i % classRotation.length],
          'Sexe': i % 2 === 0 ? 'M' : 'F',
        })
      }

      // Ajout de 3 doublons : même identité DB (sans matricule), même matricule DB, et doublon interne Excel
      batch.push({ 'Prénom': 'Kokou', 'Nom': 'Mensah', 'Classe': 'CP 1' })
      batch.push({ 'Prénom': 'Autre', 'Nom': 'NOM', 'Classe': '3ème', 'Matricule': '1002' })
      batch.push({ 'Prénom': 'Eleve1', 'Nom': 'FAMILLE1', 'Classe': 'CP1' })

      const analysis = analyzeStudentImportRows(batch, existingClasses, existingStudents)

      expect(analysis.newRows).toHaveLength(100)
      expect(analysis.duplicateRows).toHaveLength(3)
      // Les nouvelles classes manquantes doivent être exactement CE2, CM1, CM2 (car CP1, CP2, CE1, 6ème, 3ème existent)
      expect(analysis.missingClassesToCreate.map((c) => c.name).sort()).toEqual(['CE2', 'CM1', 'CM2'])

      // Vérifie que "CP 2" a bien été mappé sur "cls-cp2" (CP2) et "6e" sur "cls-6e" (6ème)
      const cp2Bucket = analysis.classes.find((b) => b.resolvedClassId === 'cls-cp2')
      const sixthBucket = analysis.classes.find((b) => b.resolvedClassId === 'cls-6e')
      expect(cp2Bucket?.resolvedClassName).toBe('CP2')
      expect(sixthBucket?.resolvedClassName).toBe('6ème')
    })

    it('autorise deux homonymes dans la même classe uniquement s’ils ont des matricules ou dates de naissance distincts', () => {
      const rows = [
        {
          'Prénom': 'Kokou',
          'Nom': 'MENSAH',
          'Classe': 'CP1',
          'Matricule': '2050',
          'Date de Naissance': '10/01/2018',
        },
      ]
      const analysis = analyzeStudentImportRows(rows, existingClasses, existingStudents)
      expect(analysis.newRows).toHaveLength(1)
      expect(analysis.duplicateRows).toHaveLength(0)
    })

    it('respecte les remplacements manuels de classes (classOverrides)', () => {
      const rows = [{ 'Prénom': 'Kodjo', 'Nom': 'SOGLO', 'Classe': 'Inconnue X' }]
      const analysis = analyzeStudentImportRows(rows, existingClasses, existingStudents, {
        classOverrides: { 'inconnue x': 'cls-ce1' },
      })

      expect(analysis.newRows).toHaveLength(1)
      expect(analysis.newRows[0].resolvedClassId).toBe('cls-ce1')
      expect(analysis.newRows[0].resolvedClassName).toBe('CE1')
      expect(analysis.missingClassesToCreate).toHaveLength(0)
    })
  })
})
