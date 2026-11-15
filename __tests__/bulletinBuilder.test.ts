import { describe, it, expect } from 'vitest'
import {
  buildStudentBulletinData,
  preparePrimarySubjects,
  type BulletinClassItem,
  type BulletinStudentItem,
  type BulletinSubjectItem,
} from '../lib/bulletin-builder'
import { computePrimaryMonthClassRanks, computeSecondaryClassRanks } from '../lib/academic-curriculum'

describe('bulletin-builder helpers', () => {
  describe('preparePrimarySubjects', () => {
    it('filters out secondary subjects, deduplicates accents, and injects virtual Étude de texte when missing', () => {
      const subjects: BulletinSubjectItem[] = [
        { id: 'sec-1', name: 'Physique-Chimie', cycle: 'secondaire', category: 'Sciences', coefficient: 2 },
        { id: 'p-1', name: 'Lecture', cycle: 'primaire', category: 'Français', coefficient: 1 },
        { id: 'p-2', name: 'lecture', cycle: 'primaire', category: 'Français', coefficient: 1 },
        { id: 'p-3', name: 'Calcul', cycle: 'primaire', category: 'Mathématiques', coefficient: 1 },
      ]

      const prepared = preparePrimarySubjects(subjects)
      const names = prepared.map((s) => s.name)
      expect(names).toContain('Lecture')
      expect(names).toContain('Calcul')
      expect(names).toContain('Étude de texte')
      expect(names).not.toContain('Physique-Chimie')
      expect(prepared.filter((s) => s.name.toLowerCase() === 'lecture')).toHaveLength(1)
    })

    it('does not duplicate Étude de texte if already present in DB subjects', () => {
      const subjects: BulletinSubjectItem[] = [
        { id: 'p-etude', name: 'Etude de texte', cycle: 'primaire', category: 'Français', coefficient: 1 },
      ]
      const prepared = preparePrimarySubjects(subjects)
      expect(prepared).toHaveLength(1)
      expect(prepared[0].id).toBe('p-etude')
    })
  })

  describe('buildStudentBulletinData - Primaire', () => {
    const classes: BulletinClassItem[] = [{ id: 'cls-cm1', name: 'CM1', level: 'Primaire' }]
    const students: BulletinStudentItem[] = [
      { id: 'stu-1', first_name: 'Kofi', last_name: 'MENSAH', matricule: 'MAT-01', class_id: 'cls-cm1' },
      { id: 'stu-2', first_name: 'Afi', last_name: 'KODJO', matricule: 'MAT-02', class_id: 'cls-cm1' },
    ]
    const subjects: BulletinSubjectItem[] = [
      { id: 'sub-calc', name: 'Calcul', cycle: 'primaire', category: 'Mathématiques', coefficient: 1 },
    ]

    it('builds primary bulletin totals and keeps local edits isolated to selected student', () => {
      const primaryGrades = [
        { student_id: 'stu-1', subject_id: 'sub-calc', month_number: 1, score: 8 },
        { student_id: 'stu-2', subject_id: 'sub-calc', month_number: 1, score: 9 },
      ]
      const localPrimGrades = { 'sub-calc_1': '10' }
      const computedPrimaryRanks = computePrimaryMonthClassRanks({
        students,
        primaryGrades,
        subjects,
        className: 'CM1',
        classLevel: 'Primaire',
        localScoresOverride: localPrimGrades,
        activeStudentId: 'stu-1',
      })

      const dataStu2 = buildStudentBulletinData({
        studentId: 'stu-2',
        selectedStudentId: 'stu-1',
        selectedLevel: 'primaire',
        selectedClassId: 'cls-cm1',
        selectedTerm: '1er_trimestre',
        schoolName: 'EPL LE ROI',
        academicYear: '2026-2027',
        students,
        classes,
        subjects,
        primaryGrades,
        secondaryGrades: [],
        primaryInfo: [{ student_id: 'stu-2', appreciation: 'Très bien', director_decision: 'Encouragements' }],
        computedPrimaryRanks,
        computedSecondaryRanks: { ranks: {}, minAvg: '-', maxAvg: '-', totalClassed: 0 },
        localPrimGrades,
        localPrimInfo: { appreciation: 'Persévérer', decision: 'Passable' },
      })

      expect(dataStu2).not.toBeNull()
      expect(dataStu2?.academicYear).toBe('2026-2027')
      expect(dataStu2?.monthTotals?.['1']).toBe('9.00')
      expect(dataStu2?.footerInfo).toEqual({ appreciation: 'Très bien', decision: 'Encouragements' })
    })
  })

  describe('buildStudentBulletinData - Secondaire batch isolation', () => {
    const classes: BulletinClassItem[] = [
      { id: 'cls-3e', name: '3ème A', level: 'Collège' },
      { id: 'cls-tle', name: 'Terminale D', level: 'Lycée' },
    ]
    const students: BulletinStudentItem[] = [
      { id: 'stu-a', first_name: 'Jean', last_name: 'AKAKPO', matricule: 'C-01', class_id: 'cls-3e' },
      { id: 'stu-b', first_name: 'Marie', last_name: 'ADJO', matricule: 'C-02', class_id: 'cls-3e' },
      { id: 'stu-c', first_name: 'Paul', last_name: 'SENA', matricule: 'L-01', class_id: 'cls-tle' },
    ]
    const subjects: BulletinSubjectItem[] = [
      { id: 'sub-math', name: 'Mathématiques', cycle: 'secondaire', category: 'Sciences', coefficient: 4 },
    ]

    it('computes independent T1/T2/annual average and pass decision for non-selected class students in Collège', () => {
      const secondaryGrades = [
        // stu-a (selected): faible, moyenne annuelle < 10
        { student_id: 'stu-a', subject_id: 'sub-math', term: '1er_trimestre', class_score: 7, comp_score: 7 },
        { student_id: 'stu-a', subject_id: 'sub-math', term: '2e_trimestre', class_score: 8, comp_score: 8 },
        { student_id: 'stu-a', subject_id: 'sub-math', term: '3e_trimestre', class_score: 9, comp_score: 9 },
        // stu-b (batch peer): T1=13, T2=14, T3=15 -> Annuelle=14.00 -> Admis
        { student_id: 'stu-b', subject_id: 'sub-math', term: '1er_trimestre', class_score: 13, comp_score: 13 },
        { student_id: 'stu-b', subject_id: 'sub-math', term: '2e_trimestre', class_score: 14, comp_score: 14 },
        { student_id: 'stu-b', subject_id: 'sub-math', term: '3e_trimestre', class_score: 15, comp_score: 15 },
      ]

      const classStudents = students.filter((s) => s.class_id === 'cls-3e')
      const computedSecondaryRanks = computeSecondaryClassRanks({
        students: classStudents,
        secondaryGrades,
        subjects,
        className: '3ème A',
        classLevel: 'Collège',
        term: '3e_trimestre',
      })

      const stuBBulletin = buildStudentBulletinData({
        studentId: 'stu-b',
        selectedStudentId: 'stu-a',
        selectedLevel: 'college',
        selectedClassId: 'cls-3e',
        selectedTerm: '3e_trimestre',
        schoolName: 'EPL LE ROI',
        academicYear: '2026-2027',
        students,
        classes,
        subjects,
        primaryGrades: [],
        secondaryGrades,
        computedPrimaryRanks: {},
        computedSecondaryRanks,
        secStats: { min: '', max: '', annual: '', t1: '7.00', t2: '8.00', annual_t3: '8.00' },
        secFooterInfo: { appreciation: 'Effort requis', decision: 'Redouble la classe' },
      })

      expect(stuBBulletin?.termAvg).toBe('15.00')
      expect(stuBBulletin?.stats?.t1).toBe('13.00')
      expect(stuBBulletin?.stats?.t2).toBe('14.00')
      expect(stuBBulletin?.stats?.annual).toBe('14.00')
      expect(stuBBulletin?.footerInfo).toEqual({
        appreciation: '',
        decision: 'Passe en classe supérieure (Admis)',
      })
    })

    it('computes Lycée 2e_semestre annual average cleanly from S1 and S2', () => {
      const secondaryGrades = [
        { student_id: 'stu-c', subject_id: 'sub-math', term: '1er_semestre', class_score: 10, comp_score: 12 }, // moy = 11.00
        { student_id: 'stu-c', subject_id: 'sub-math', term: '2e_semestre', class_score: 12, comp_score: 14 }, // moy = 13.00
      ]

      const computedSecondaryRanks = computeSecondaryClassRanks({
        students: [students[2]],
        secondaryGrades,
        subjects,
        className: 'Terminale D',
        classLevel: 'Lycée',
        term: '2e_semestre',
      })

      const stuCBulletin = buildStudentBulletinData({
        studentId: 'stu-c',
        selectedStudentId: 'stu-a',
        selectedLevel: 'lycee',
        selectedClassId: 'cls-tle',
        selectedTerm: '2e_semestre',
        schoolName: 'EPL LE ROI',
        academicYear: '2026-2027',
        students,
        classes,
        subjects,
        primaryGrades: [],
        secondaryGrades,
        computedPrimaryRanks: {},
        computedSecondaryRanks,
      })

      expect(stuCBulletin?.termAvg).toBe('13.00')
      expect(stuCBulletin?.stats?.annual).toBe('12.00')
      expect(stuCBulletin?.footerInfo?.decision).toBe('Passe en classe supérieure (Admis)')
    })

    it('returns null when student does not exist', () => {
      expect(
        buildStudentBulletinData({
          studentId: 'unknown',
          selectedLevel: 'college',
          selectedTerm: '1er_trimestre',
          schoolName: 'EPL LE ROI',
          students,
          classes,
          subjects,
          primaryGrades: [],
          secondaryGrades: [],
          computedPrimaryRanks: {},
          computedSecondaryRanks: { ranks: {}, minAvg: '-', maxAvg: '-', totalClassed: 0 },
        })
      ).toBeNull()
    })
  })
})
