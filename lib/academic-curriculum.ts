/**
 * Définition et règles de calcul officielles du cursus pédagogique (Secondaire 1 & Secondaire 2).
 * Conforme aux programmes en vigueur (Togo et Afrique de l'Ouest francophone).
 */

export type LyceeSeriesKey = 
  | '2nde_S' 
  | '2nde_A4' 
  | '1ere_A4' 
  | '1ere_D' 
  | '1ere_C' 
  | 'tle_A4' 
  | 'tle_D' 
  | 'tle_C';

export interface SeriesConfig {
  key: LyceeSeriesKey;
  label: string;
  shortLabel: string;
  level: '2nde' | '1ere' | 'tle';
  series: 'A4' | 'S' | 'C' | 'D';
  track: 'Littéraire' | 'Scientifique';
  description: string;
  coefficients: Record<string, number>;
}

export const LYCEE_SERIES_CONFIG: Record<LyceeSeriesKey, SeriesConfig> = {
  // SECONDE (2nde)
  '2nde_S': {
    key: '2nde_S',
    label: 'Seconde S (Scientifique)',
    shortLabel: '2nde S',
    level: '2nde',
    series: 'S',
    track: 'Scientifique',
    description: 'Filière scientifique générale avec renforcement en Mathématiques, Sciences physiques et SVT.',
    coefficients: {
      'SVT': 4,
      'Mathématiques': 3,
      'Sciences physiques': 3,
      'Français': 2,
      'Histoire-Géographie': 2,
      'Anglais': 2,
      'ECM': 2,
      'EPS': 2,
      'Rédaction': 2,
      'Philosophie': 2,
    }
  },
  '2nde_A4': {
    key: '2nde_A4',
    label: 'Seconde A4 (Littéraire)',
    shortLabel: '2nde A4',
    level: '2nde',
    series: 'A4',
    track: 'Littéraire',
    description: 'Filière littéraire avec renforcement en Philosophie, Français et Histoire-Géographie.',
    coefficients: {
      'Philosophie': 4,
      'Français': 3,
      'Histoire-Géographie': 3,
      'SVT': 1,
      'Anglais': 2,
      'Mathématiques': 2,
      'Sciences physiques': 2,
      'ECM': 2,
      'EPS': 2,
      'Rédaction': 1,
    }
  },

  // PREMIÈRE (1ère)
  '1ere_A4': {
    key: '1ere_A4',
    label: 'Première A4 (Littéraire)',
    shortLabel: '1ère A4',
    level: '1ere',
    series: 'A4',
    track: 'Littéraire',
    description: 'Littéraire approfondi : Philosophie, Français et Histoire-Géo dominants.',
    coefficients: {
      'Philosophie': 4,
      'Français': 3,
      'Histoire-Géographie': 3,
      'SVT': 1,
      'Anglais': 2,
      'Mathématiques': 2,
      'Sciences physiques': 2,
      'ECM': 2,
      'EPS': 2,
    }
  },
  '1ere_D': {
    key: '1ere_D',
    label: 'Première D (Sciences de la Nature & SVT)',
    shortLabel: '1ère D',
    level: '1ere',
    series: 'D',
    track: 'Scientifique',
    description: 'Biologie et sciences expérimentales dominantes avec SVT coef 4.',
    coefficients: {
      'SVT': 4,
      'Mathématiques': 3,
      'Sciences physiques': 3,
      'Philosophie': 2,
      'Français': 2,
      'Histoire-Géographie': 2,
      'Anglais': 2,
      'ECM': 2,
      'EPS': 2,
    }
  },
  '1ere_C': {
    key: '1ere_C',
    label: 'Première C (Mathématiques & Physique)',
    shortLabel: '1ère C',
    level: '1ere',
    series: 'C',
    track: 'Scientifique',
    description: 'Excellence mathématique et physique avec Math coef 5 et Physique coef 4.',
    coefficients: {
      'Mathématiques': 5,
      'Sciences physiques': 4,
      'SVT': 1,
      'Philosophie': 2,
      'Français': 2,
      'Histoire-Géographie': 2,
      'Anglais': 2,
      'ECM': 2,
      'EPS': 2,
    }
  },

  // TERMINALE (Tle)
  'tle_A4': {
    key: 'tle_A4',
    label: 'Terminale A4 (Littéraire)',
    shortLabel: 'Tle A4',
    level: 'tle',
    series: 'A4',
    track: 'Littéraire',
    description: 'Baccalauréat A4 : Philosophie coef 4, Français coef 3, HG coef 3.',
    coefficients: {
      'Philosophie': 4,
      'Français': 3,
      'Histoire-Géographie': 3,
      'SVT': 1,
      'Anglais': 2,
      'Mathématiques': 2,
      'Sciences physiques': 2,
      'ECM': 2,
      'EPS': 2,
    }
  },
  'tle_D': {
    key: 'tle_D',
    label: 'Terminale D (Sciences Naturelles & SVT)',
    shortLabel: 'Tle D',
    level: 'tle',
    series: 'D',
    track: 'Scientifique',
    description: 'Baccalauréat D : SVT coef 4, Mathématiques coef 3, Physique coef 3.',
    coefficients: {
      'SVT': 4,
      'Mathématiques': 3,
      'Sciences physiques': 3,
      'Philosophie': 2,
      'Français': 2,
      'Histoire-Géographie': 2,
      'Anglais': 2,
      'ECM': 2,
      'EPS': 2,
    }
  },
  'tle_C': {
    key: 'tle_C',
    label: 'Terminale C (Mathématiques & Sciences Physiques)',
    shortLabel: 'Tle C',
    level: 'tle',
    series: 'C',
    track: 'Scientifique',
    description: 'Baccalauréat C : Mathématiques coef 5, Physique coef 4, SVT coef 1.',
    coefficients: {
      'Mathématiques': 5,
      'Sciences physiques': 4,
      'SVT': 1,
      'Philosophie': 2,
      'Français': 2,
      'Histoire-Géographie': 2,
      'Anglais': 2,
      'ECM': 2,
      'EPS': 2,
    }
  }
};

/**
 * Normalise le nom d'une matière pour correspondance exacte avec les clés de coefficient.
 */
export function normalizeSubjectName(name: string): string {
  const n = (name || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (n.includes('philo')) return 'Philosophie';
  if (n.includes('math')) return 'Mathématiques';
  if (n.includes('physiq') || n.includes('pc') || n.includes('sp') || n.includes('chimie')) return 'Sciences physiques';
  if (n.includes('svt') || n.includes('terre') || n.includes('biologie')) return 'SVT';
  if (n.includes('francais')) return 'Français';
  if (n.includes('redact')) return 'Rédaction';
  if (n.includes('anglais') || n.includes('english')) return 'Anglais';
  if (n.includes('hist') || n.includes('geo')) return 'Histoire-Géographie';
  if (n.includes('ecm') || n.includes('civique') || n.includes('morale')) return 'ECM';
  if (n.includes('eps') || n.includes('sport')) return 'EPS';
  
  return name.trim();
}

/**
 * Détecte la clé de série (ex: '1ere_D', 'tle_C', '2nde_A4') à partir du nom ou niveau de la classe.
 */
export function detectClassSeriesKey(className: string, level?: string): LyceeSeriesKey | null {
  const raw = `${level || ''} ${className || ''}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const n = raw.replace(/[^a-z0-9]/g, '');

  // 1. TERMINALE
  if (raw.includes('terminale') || raw.includes('tle') || n.startsWith('tle') || n.startsWith('term')) {
    if (raw.includes('a4') || raw.includes('serie a') || n.includes('a4') || n.includes('tea4')) return 'tle_A4';
    if (raw.includes('c') && !raw.includes('college')) return 'tle_C';
    if (raw.includes('d')) return 'tle_D';
    return 'tle_D'; // Défaut scientifique
  }

  // 2. PREMIÈRE
  if (raw.includes('premiere') || raw.includes('1ere') || raw.includes('1re') || n.startsWith('1ere') || n.startsWith('1re') || n.startsWith('prem')) {
    if (raw.includes('a4') || raw.includes('serie a') || n.includes('a4') || n.includes('1a4')) return '1ere_A4';
    if (raw.includes('c')) return '1ere_C';
    if (raw.includes('d')) return '1ere_D';
    return '1ere_D'; // Défaut scientifique
  }

  // 3. SECONDE
  if (raw.includes('seconde') || raw.includes('2nde') || raw.includes('2nd') || n.startsWith('2nde') || n.startsWith('2nd') || n.startsWith('sec')) {
    if (raw.includes('a4') || raw.includes('serie a') || n.includes('a4') || n.includes('2a4')) return '2nde_A4';
    if (raw.includes('s') || raw.includes('c') || raw.includes('d') || raw.includes('scien')) return '2nde_S';
    return '2nde_S'; // Défaut scientifique
  }

  return null;
}

/**
 * Détecte si une classe appartient au Collège (Secondaire 1 : 6ème, 5ème, 4ème, 3ème).
 */
export function isCollegeClass(className?: string, classLevel?: string): boolean {
  const raw = `${classLevel || ''} ${className || ''}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ['6eme', '6ème', '5eme', '5ème', '4eme', '4ème', '3eme', '3ème', 'college', 'collège', 'secondaire1', '6e', '5e', '4e', '3e'].some(k => raw.includes(k));
}

/**
 * Récupère le coefficient officiel d'une matière pour une classe donnée.
 * Si la classe est du Collège (Secondaire 1), retourne strictement 2 (règle officielle : toutes les matières coef 2 partout).
 * Si la classe est du Lycée (Secondaire 2), applique la table de coefficients de sa série.
 * Sinon, retourne le coefficient par défaut de la matière (ou 2).
 */
export function getCoefficientForSubject(
  subjectName: string,
  className?: string,
  classLevel?: string,
  defaultCoefficient: number = 2
): number {
  if (isCollegeClass(className, classLevel)) {
    return 2; // Strictement 2 pour toutes les matières au Secondaire 1 (Collège)
  }

  if (!className && !classLevel) return defaultCoefficient;

  const seriesKey = detectClassSeriesKey(className || '', classLevel);
  if (!seriesKey) {
    return defaultCoefficient;
  }

  const series = LYCEE_SERIES_CONFIG[seriesKey];
  if (!series) return defaultCoefficient;

  const normalized = normalizeSubjectName(subjectName);
  if (series.coefficients[normalized] !== undefined) {
    return series.coefficients[normalized];
  }

  // Chercher par inclusion partielle
  for (const [subjKey, coef] of Object.entries(series.coefficients)) {
    if (normalized.toLowerCase().includes(subjKey.toLowerCase()) || subjKey.toLowerCase().includes(normalized.toLowerCase())) {
      return coef;
    }
  }

  return defaultCoefficient || 2;
}

/**
 * Suggestions de classes standard pour le Lycée avec leurs séries.
 */
export const STANDARD_LYCEE_CLASSES = [
  { name: '2nde S', level: 'Seconde', track: 'Scientifique', seriesKey: '2nde_S' as const },
  { name: '2nde A4', level: 'Seconde', track: 'Littéraire', seriesKey: '2nde_A4' as const },
  { name: '1ère A4', level: 'Première', track: 'Littéraire', seriesKey: '1ere_A4' as const },
  { name: '1ère D', level: 'Première', track: 'Scientifique', seriesKey: '1ere_D' as const },
  { name: '1ère C', level: 'Première', track: 'Scientifique', seriesKey: '1ere_C' as const },
  { name: 'Terminale A4', level: 'Terminale', track: 'Littéraire', seriesKey: 'tle_A4' as const },
  { name: 'Terminale D', level: 'Terminale', track: 'Scientifique', seriesKey: 'tle_D' as const },
  { name: 'Terminale C', level: 'Terminale', track: 'Scientifique', seriesKey: 'tle_C' as const },
];

/**
 * Détection du niveau primaire : CP (CP1, CP2, CI), CE (CE1, CE2), CM (CM1, CM2).
 */
export type PrimaryLevel = 'CP' | 'CE' | 'CM' | 'AUTRE';

export function detectPrimaryLevel(className?: string, classLevel?: string): PrimaryLevel {
  const full = `${classLevel || ''} ${className || ''}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // 1. CM : CM1, CM2, CM, Cours Moyen
  if (
    /\b(cm2|cm1|cm\s*2|cm\s*1|cours\s+moyen)\b/i.test(full) ||
    full.includes('cm2') || full.includes('cm1') || full.includes('cours moyen') ||
    /\bcm\b/i.test(full)
  ) {
    return 'CM';
  }

  // 2. CE : CE1, CE2, CE, Cours Elémentaire
  if (
    /\b(ce2|ce1|ce\s*2|ce\s*1|cours\s+elementaire)\b/i.test(full) ||
    full.includes('ce2') || full.includes('ce1') || full.includes('cours elementaire') ||
    /\bce\b/i.test(full)
  ) {
    return 'CE';
  }

  // 3. CP : CP1, CP2, CI, Cours Préparatoire, Cours d'Initiation
  if (
    /\b(cp2|cp1|cp\s*2|cp\s*1|ci|cours\s+preparatoire|initiation)\b/i.test(full) ||
    full.includes('cp2') || full.includes('cp1') || full.includes('cours preparatoire') || full.includes('ci') ||
    /\bcp\b/i.test(full)
  ) {
    return 'CP';
  }

  return 'AUTRE';
}

/**
 * Fonctions de reconnaissance précise des matières du primaire
 */
export function isProblemeSubject(subjectName: string): boolean {
  const s = (subjectName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s.includes('problem');
}

export function isDicteeQuestionsSubject(subjectName: string): boolean {
  const s = (subjectName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Ne pas confondre avec rédaction / production d'écrit
  if (s.includes('redact') || s.includes('produis')) return false;
  return s.includes('dictee') || s.includes('ecrire les mots');
}

export function isCalculEcritSubject(subjectName: string): boolean {
  const s = (subjectName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Ne pas confondre avec calcul mental
  if (s.includes('mental')) return false;
  return s.includes('calcul ecrit') || s.includes('calcul-ecrit') || s.includes('calcul_ecrit');
}

export function isEtudeDeTexteSubject(subjectName: string): boolean {
  const s = (subjectName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Ne pas confondre avec rédaction / production d'écrit
  if (s.includes('redact') || s.includes('produis')) return false;
  // Strictement "Étude de texte" (ne pas inclure la simple "lecture")
  return s.includes('etude de texte') || s.includes('etude de textes') || s.includes('etude texte') || s.includes('texte suivi de questions');
}

export function isLectureSubject(subjectName: string): boolean {
  const s = (subjectName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (isEtudeDeTexteSubject(s)) return false;
  return s.includes('lecture');
}

/**
 * Ordre officiel des disciplines du primaire (Togo & Afrique de l'Ouest) :
 * 1. Dictée-questions
 * 2. Rédaction / Expression écrite
 * 3. Lecture (notée sur 10 de CP1 au CM2)
 * 4. Étude de texte (notée sur 20 au CM1 et CM2, sur 10 avant)
 * 5. Langage / Élocution
 * 6. Calcul écrit
 * 7. Calcul mental
 * 8. Problème
 * etc.
 */
export function getPrimarySubjectOrder(name: string): number {
  const n = (name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes('ecrire les mots') || n.includes('dictee')) return 10;
  if (n.includes('produis un texte') || n.includes('redact')) return 20;
  if (n.includes('lecture') && !n.includes('etude')) return 30;
  if (n.includes('etude de texte') || n.includes('etude texte')) return 35; // IMMÉDIATEMENT APRÈS LA LECTURE
  if (n.includes('parler') || n.includes('langage')) return 40;
  if (n.includes('calcul ecrit')) return 50;
  if (n.includes('calcul mental')) return 60;
  if (n.includes('problem')) return 70;
  if (n.includes('science') || n.includes('histoire') || n.includes('geo')) return 80;
  if (n.includes('sociale') || n.includes('ecm')) return 90;
  if (n.includes('technologie') || n.includes('edusivip')) return 100;
  if (n.includes('plastique') || n.includes('dessin')) return 110;
  if (n.includes('chant')) return 120;
  if (n.includes('recitation')) return 130;
  if (n.includes('anglais')) return 140;
  if (n.includes('eps') || n.includes('sport')) return 150;
  return 200;
}

/**
 * Règles officielles de notation au Primaire (Togo & Afrique de l'Ouest) :
 * - CP (CP1, CP2, CI) : TOUTES les disciplines sont notées sur 10.
 * - CE (CE1, CE2) : 2 disciplines notées sur 20 (Problème, Dictée-questions). Toutes les autres sur 10.
 * - CM (CM1, CM2) : 4 disciplines notées sur 20 (Problème, Dictée-questions, Calcul écrit, Étude de texte).
 * - IMPORTANT : La Lecture est notée sur 10 du CP1 au CM2.
 */
export function getPrimarySubjectMaxScore(
  subjectName: string,
  className?: string,
  classLevel?: string
): number {
  // RÈGLE STRICTE : La discipline "Lecture" est notée sur 10 de CP1 au CM2
  if (isLectureSubject(subjectName)) {
    return 10;
  }

  const level = detectPrimaryLevel(className, classLevel);

  if (level === 'CM') {
    // 4 disciplines notées sur 20 en CM (CM1, CM2) :
    // 1. Problème
    // 2. Dictée-questions
    // 3. Calcul écrit
    // 4. Étude de texte
    if (isProblemeSubject(subjectName)) return 20;
    if (isDicteeQuestionsSubject(subjectName)) return 20;
    if (isCalculEcritSubject(subjectName)) return 20;
    if (isEtudeDeTexteSubject(subjectName)) return 20;

    return 10;
  }

  if (level === 'CE') {
    // 2 disciplines notées sur 20 en CE (CE1, CE2) :
    // 1. Problème
    // 2. Dictée-questions
    if (isProblemeSubject(subjectName)) return 20;
    if (isDicteeQuestionsSubject(subjectName)) return 20;

    return 10;
  }

  // CP (CP1, CP2), CI, Maternelle, etc. -> TOUTES les disciplines sur 10
  return 10;
}

/**
 * Calcule la moyenne d'une discipline pour un élève sur son barème officiel (sur 10 ou sur 20).
 * Retourne la moyenne formatée (ex: 15.50) ou null si aucune note saisie.
 */
export function calculateDisciplineAverage(scores: (number | null | undefined)[]): number | null {
  const valid = scores.filter((s): s is number => typeof s === 'number' && !isNaN(s));
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / valid.length).toFixed(2));
}

/**
 * Calcule la moyenne générale pondérée ramenée STRICTEMENT sur 10 (au Primaire).
 * Pour chaque note saisie, elle est pondérée par son barème max (10 ou 20).
 * Formule officielle : (Somme des points obtenus / Somme des barèmes possibles) * 10
 */
export function calculatePrimaryGeneralAverage(
  entries: Array<{ score: number | null | undefined; maxScore: number }>
): { totalPoints: number; maxPossible: number; averageOutOf10: number | null } {
  let totalPoints = 0;
  let maxPossible = 0;
  let count = 0;

  for (const entry of entries) {
    if (entry.score !== null && entry.score !== undefined && !isNaN(entry.score)) {
      totalPoints += entry.score;
      maxPossible += (entry.maxScore || 10);
      count++;
    }
  }

  const averageOutOf10 = maxPossible > 0 ? Number(((totalPoints / maxPossible) * 10).toFixed(2)) : null;

  return {
    totalPoints: Number(totalPoints.toFixed(2)),
    maxPossible,
    averageOutOf10
  };
}

/**
 * Calcul officiel de la moyenne annuelle au Collège (Secondaire 1) :
 * Somme des moyennes sur 20 des trois trimestres (T1 + T2 + T3) divisée par 3.
 * Calculée au 3ème trimestre, donne droit au passage en classe supérieure si >= 10/20.
 */
export function calculateCollegeAnnualAverage(
  t1Avg: number | null | undefined,
  t2Avg: number | null | undefined,
  t3Avg: number | null | undefined
): number | null {
  const t1 = (typeof t1Avg === 'number' && !isNaN(t1Avg)) ? t1Avg : null;
  const t2 = (typeof t2Avg === 'number' && !isNaN(t2Avg)) ? t2Avg : null;
  const t3 = (typeof t3Avg === 'number' && !isNaN(t3Avg)) ? t3Avg : null;

  // Si aucun trimestre n'a de note
  if (t1 === null && t2 === null && t3 === null) return null;

  // Calcul officiel sur les 3 trimestres
  // S'ils sont tous disponibles : (T1 + T2 + T3) / 3
  const availableTerms = [t1, t2, t3].filter((t): t is number => t !== null);
  if (availableTerms.length === 0) return null;

  // Règle officielle : divisé par 3
  const sum = (t1 || 0) + (t2 || 0) + (t3 || 0);
  return Number((sum / 3).toFixed(2));
}

/**
 * Calcul officiel de la moyenne annuelle au Lycée (Secondaire 2) :
 * Somme des moyennes sur 20 des 2 semestres (S1 + S2) divisée par 2.
 * Calculée au 2ème semestre, donne droit au passage en classe supérieure si >= 10/20.
 */
export function calculateLyceeAnnualAverage(
  s1Avg: number | null | undefined,
  s2Avg: number | null | undefined
): number | null {
  const s1 = (typeof s1Avg === 'number' && !isNaN(s1Avg)) ? s1Avg : null;
  const s2 = (typeof s2Avg === 'number' && !isNaN(s2Avg)) ? s2Avg : null;

  if (s1 === null && s2 === null) return null;

  const sum = (s1 || 0) + (s2 || 0);
  return Number((sum / 2).toFixed(2));
}

/**
 * Décision de passage en classe supérieure selon la moyenne annuelle :
 * - Collège et Lycée : moyenne sur 20, admis si >= 10/20.
 * - Primaire : moyenne sur 10, admis si >= 5/10 (évaluation par composition).
 */
export function getAnnualPassDecision(
  average: number | null | undefined,
  cycle: 'college' | 'lycee' | 'primaire' | 'maternelle'
): { passed: boolean; label: string; threshold: number } {
  if (average === null || average === undefined || isNaN(average)) {
    return { passed: false, label: 'En attente', threshold: cycle === 'primaire' ? 5 : 10 };
  }

  if (cycle === 'primaire' || cycle === 'maternelle') {
    const passed = average >= 5;
    return {
      passed,
      label: passed ? 'Passe en classe supérieure (Admis)' : 'Redouble (Non admis)',
      threshold: 5
    };
  }

  const passed = average >= 10;
  return {
    passed,
    label: passed ? 'Passe en classe supérieure (Admis)' : 'Redouble (Non admis)',
    threshold: 10
  };
}
