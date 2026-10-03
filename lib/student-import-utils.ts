export function normalizeText(str: string): string {
  return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function detectClassLevel(className: string): string {
  const clean = normalizeText(className);
  
  // Lycée
  if (
    clean.includes('2nde') || clean.includes('seconde') ||
    clean.includes('1ere') || clean.includes('premiere') ||
    clean.includes('tle') || clean.includes('terminale') ||
    clean.includes('lycee')
  ) {
    return 'Lycée';
  }

  // Collège / Secondaire
  if (
    clean.includes('6e') || clean.includes('6eme') ||
    clean.includes('5e') || clean.includes('5eme') ||
    clean.includes('4e') || clean.includes('4eme') ||
    clean.includes('3e') || clean.includes('3eme') ||
    clean.includes('college') || clean.includes('secondaire')
  ) {
    return 'Collège';
  }

  // Primaire
  if (
    clean.includes('cp1') || clean.includes('cp2') || clean.includes('cp') ||
    clean.includes('ce1') || clean.includes('ce2') || clean.includes('ce') ||
    clean.includes('cm1') || clean.includes('cm2') || clean.includes('cm') ||
    clean.includes('ci') || clean.includes('primaire')
  ) {
    return 'Primaire';
  }

  // Maternelle
  if (
    clean.includes('s1') || clean.includes('s2') ||
    clean.includes('section') || clean.includes('maternelle') ||
    clean.includes('creche') || clean.includes('garderie') ||
    clean.includes('ps') || clean.includes('ms') || clean.includes('gs')
  ) {
    return 'Maternelle';
  }

  return 'Secondaire';
}

export function getRowField(row: Record<string, any>, candidates: string[]): string | undefined {
  const entries = Object.entries(row);
  for (const candidate of candidates) {
    const cleanCand = normalizeText(candidate);
    const found = entries.find(([k]) => {
      const cleanKey = normalizeText(k);
      return cleanKey === cleanCand || cleanKey.replace(/\s+/g, '') === cleanCand.replace(/\s+/g, '');
    });
    if (found && found[1] !== undefined && found[1] !== null) {
      const val = String(found[1]).trim();
      if (val !== '') return val;
    }
  }
  return undefined;
}

export function parseFlexibleDate(val: any): string | null {
  if (!val) return null;
  // Cas Excel serial number
  if (typeof val === 'number') {
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    if (!isNaN(dateInfo.getTime())) {
      return dateInfo.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  // Format DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }
  // Format YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const month = yyyymmdd[2].padStart(2, '0');
    const day = yyyymmdd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }
  return null;
}

export function parseGender(val?: string): 'M' | 'F' | null {
  if (!val) return null;
  const s = normalizeText(val).toUpperCase();
  if (['M', 'MASCULIN', 'GARCON', 'HOMME', 'H', 'BOY', 'MALE'].includes(s)) return 'M';
  if (['F', 'FEMININ', 'FILLE', 'FEMME', 'GIRL', 'FEMALE'].includes(s)) return 'F';
  return null;
}
