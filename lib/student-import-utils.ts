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

export function extractNameParts(row: Record<string, any>): { firstName: string, lastName: string } | null {
  const directFirst = getRowField(row, ['prenom', 'first name', 'first_name', 'prenoms', 'prénoms']);
  const directLast = getRowField(row, ['nom', 'last name', 'last_name', 'nom de famille']);

  if (directFirst && directLast) {
    return { firstName: directFirst, lastName: directLast };
  }

  // Vérifier une colonne combinée éventuelle (ex: "Nom et Prénoms", "Nom Complet")
  const combined = getRowField(row, [
    'nom et prenom', 'nom & prenom', 'nom et prenoms', 'nom & prenoms',
    'noms et prenoms', 'nom complet', 'full name', 'fullname', 'eleve', 'élève', 'apprenant'
  ]);

  if (combined) {
    const parts = combined.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: directLast || parts[0] };
    }
    // Si la première partie est en MAJUSCULES (ex: ADJOKPA Kokou)
    if (parts[0] === parts[0].toUpperCase() && parts[0].length > 1) {
      return { firstName: parts.slice(1).join(' '), lastName: parts[0] };
    }
    // Si la dernière partie est en MAJUSCULES (ex: Kokou ADJOKPA)
    const lastPart = parts[parts.length - 1];
    if (lastPart === lastPart.toUpperCase() && lastPart.length > 1) {
      return { firstName: parts.slice(0, -1).join(' '), lastName: lastPart };
    }
    return {
      lastName: parts[0],
      firstName: parts.slice(1).join(' ')
    };
  }

  if (directLast && !directFirst) {
    return { lastName: directLast, firstName: '-' };
  }
  if (directFirst && !directLast) {
    return { lastName: directFirst, firstName: '-' };
  }

  return null;
}

export function extractClassFromFilename(fileName: string, availableClasses: { id: string, name: string }[]): string | undefined {
  if (!fileName) return undefined;
  const cleanFileName = normalizeText(fileName);
  
  // 1. Chercher d'abord une correspondance directe avec les classes existantes
  for (const cls of availableClasses) {
    const cleanClassName = normalizeText(cls.name);
    // Vérifier mot complet ou occurrence
    const regex = new RegExp(`(^|[^a-z0-9])${cleanClassName}([^a-z0-9]|$)`, 'i');
    if (regex.test(cleanFileName) || cleanFileName.includes(cleanClassName)) {
      return cls.name;
    }
  }

  // 2. Chercher des motifs d'écoles fréquents (ex: CE1, CP1, 6ème, 2nde...)
  const patterns: { match: string, standard: string }[] = [
    { match: 'cp1', standard: 'CP1' },
    { match: 'cp2', standard: 'CP2' },
    { match: 'ce1', standard: 'CE1' },
    { match: 'ce2', standard: 'CE2' },
    { match: 'cm1', standard: 'CM1' },
    { match: 'cm2', standard: 'CM2' },
    { match: 'ci', standard: 'CI' },
    { match: '6eme', standard: '6ème' },
    { match: '6e', standard: '6ème' },
    { match: '5eme', standard: '5ème' },
    { match: '5e', standard: '5ème' },
    { match: '4eme', standard: '4ème' },
    { match: '4e', standard: '4ème' },
    { match: '3eme', standard: '3ème' },
    { match: '3e', standard: '3ème' },
    { match: '2nde', standard: '2nde' },
    { match: 'seconde', standard: '2nde' },
    { match: '1ere', standard: '1ère' },
    { match: 'premiere', standard: '1ère' },
    { match: 'tle', standard: 'Terminale' },
    { match: 'terminale', standard: 'Terminale' },
    { match: 's1', standard: 'S1' },
    { match: 's2', standard: 'S2' }
  ];

  for (const p of patterns) {
    const regex = new RegExp(`(^|[^a-z0-9])${p.match}([^a-z0-9]|$)`, 'i');
    if (regex.test(cleanFileName)) {
      // Trouver si une classe existante porte ce nom
      const found = availableClasses.find(c => normalizeText(c.name).includes(p.match));
      if (found) return found.name;
      return p.standard;
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
