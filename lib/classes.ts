/**
 * Utilitaires pour le tri et la hiérarchie pédagogique des classes scolaires.
 * Ordre officiel du cursus (du plus petit au plus grand) :
 * 1. Maternelle (TPS, S1/PS, S2/MS, S3/GS)
 * 2. Primaire (CI, CP1, CP2, CE1, CE2, CM1, CM2)
 * 3. Collège / Secondaire 1 (6ème, 5ème, 4ème, 3ème)
 * 4. Lycée / Secondaire 2 (2nde/Seconde, 1ère/Première, Terminale)
 */

export function getClassOrderRank(name: string, level?: string): number {
  const raw = (name || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const n = raw.replace(/\s+/g, '');
  const l = (level || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');

  // 1. MATERNELLE
  if (n.includes('tps') || n.includes('toutepetite')) return 110;
  if (
    n.startsWith('s1') || 
    n.includes('section1') || 
    n.startsWith('ps') || 
    /\b(s1|ps)\b/.test(raw) || 
    n.includes('petitesection')
  ) return 120;

  if (
    n.startsWith('s2') || 
    n.includes('section2') || 
    n.startsWith('ms') || 
    /\b(s2|ms)\b/.test(raw) || 
    n.includes('moyennesection')
  ) return 130;

  if (
    n.startsWith('s3') || 
    n.includes('section3') || 
    n.startsWith('gs') || 
    /\b(s3|gs)\b/.test(raw) || 
    n.includes('grandesection')
  ) return 140;

  if (l.includes('maternelle') || n.includes('maternelle') || n.includes('creche') || n.includes('garderie')) return 150;

  // 2. PRIMAIRE
  if (n.startsWith('ci') || n.includes('initiation') || /\bci\b/.test(raw)) return 210;
  if (n.startsWith('cp1') || n.includes('cp1') || n.includes('cp-1')) return 220;
  if (n.startsWith('cp2') || n.includes('cp2') || n.includes('cp-2')) return 230;
  if (n.startsWith('cp') || /\bcp\b/.test(raw)) return 235;

  if (n.startsWith('ce1') || n.includes('ce1') || n.includes('ce-1')) return 240;
  if (n.startsWith('ce2') || n.includes('ce2') || n.includes('ce-2')) return 250;
  if (n.startsWith('ce') || /\bce\b/.test(raw)) return 255;

  if (n.startsWith('cm1') || n.includes('cm1') || n.includes('cm-1')) return 260;
  if (n.startsWith('cm2') || n.includes('cm2') || n.includes('cm-2')) return 270;
  if (n.startsWith('cm') || /\bcm\b/.test(raw)) return 275;

  if (l.includes('primaire') || n.includes('primaire')) return 290;

  // 3. COLLÈGE (Secondaire 1) - Progression : 6ème -> 5ème -> 4ème -> 3ème
  if (n.startsWith('6') || n.includes('sixieme') || /\b6(e|eme)?\b/.test(raw)) return 310;
  if (n.startsWith('5') || n.includes('cinquieme') || /\b5(e|eme)?\b/.test(raw)) return 320;
  if (n.startsWith('4') || n.includes('quatrieme') || /\b4(e|eme)?\b/.test(raw)) return 330;
  if (n.startsWith('3') || n.includes('troisieme') || /\b3(e|eme)?\b/.test(raw)) return 340;
  if (l.includes('college') || l.includes('secondaire1') || n.includes('college')) return 350;

  // 4. LYCÉE (Secondaire 2) - Progression : 2nde -> 1ère -> Terminale
  if (n.startsWith('2') || n.includes('seconde') || n.includes('2nd') || /\b(2nde|2nd)\b/.test(raw)) return 410;
  if (n.startsWith('1') || n.includes('premiere') || n.includes('1ere') || /\b(1ere|1re)\b/.test(raw)) return 420;
  if (n.startsWith('t') || n.includes('terminale') || n.includes('tle') || /\b(tle|term)\b/.test(raw)) return 430;
  if (l.includes('lycee') || l.includes('secondaire2') || n.includes('lycee')) return 450;

  return 500;
}

/**
 * Trie une liste de classes selon la progression pédagogique (du plus petit au plus grand).
 */
export function sortClasses<T extends { name: string; level?: string | null }>(classes: T[]): T[] {
  return [...classes].sort((a, b) => {
    const rankA = getClassOrderRank(a.name, a.level || undefined);
    const rankB = getClassOrderRank(b.name, b.level || undefined);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' });
  });
}
