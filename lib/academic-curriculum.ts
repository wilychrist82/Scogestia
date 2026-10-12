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
