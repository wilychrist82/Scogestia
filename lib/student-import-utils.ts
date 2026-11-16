export function normalizeText(str: string): string {
  return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Clé canonique pour rapprocher les variantes d'orthographe d'une même classe
 * (ex: "6e A" == "6ème A" == "6 ème A", "CP 1" == "C.P.1" == "CP1", "Tle D" == "Terminale D").
 */
export function canonicalClassKey(str: string): string {
  let clean = normalizeText(str)
    .replace(/\bterminales?\b|\bterminals?\b|\bterm\b|\btle\b/g, 'terminale')
    .replace(/\bpremieres?\b|\b1\s*(?:eres?|res?|°|e(?![mr]))/g, '1ere')
    .replace(/\bsecondes?\b|\b2\s*(?:ndes?|nds?|des?|°|e(?![mr]))/g, '2nde')
    .replace(/\bsixiemes?\b/g, '6eme')
    .replace(/\bcinquiemes?\b/g, '5eme')
    .replace(/\bquatriemes?\b/g, '4eme')
    .replace(/\btroisiemes?\b/g, '3eme')
    .replace(/\b([3-6])\s*(?:emes?|°|e(?!m))/g, '$1eme')
    .replace(/\bsection\s*([12])\b/g, 's$1');

  clean = clean.replace(/[^a-z0-9]/g, '');
  return clean;
}

export function detectClassLevel(className: string): string {
  const clean = normalizeText(className);
  const compact = clean.replace(/[^a-z0-9]/g, '');

  // Lycée
  if (
    compact.includes('2nde') || compact.includes('seconde') ||
    compact.includes('1ere') || compact.includes('premiere') ||
    compact.includes('tle') || compact.includes('terminale') ||
    compact.includes('term') || compact.includes('lycee')
  ) {
    return 'Lycée';
  }

  // Collège / Secondaire
  if (
    compact.includes('6e') || compact.includes('6eme') ||
    compact.includes('5e') || compact.includes('5eme') ||
    compact.includes('4e') || compact.includes('4eme') ||
    compact.includes('3e') || compact.includes('3eme') ||
    compact.includes('college') || compact.includes('secondaire')
  ) {
    return 'Collège';
  }

  // Primaire
  if (
    compact.includes('cp1') || compact.includes('cp2') || compact.includes('cp') ||
    compact.includes('ce1') || compact.includes('ce2') || compact.includes('ce') ||
    compact.includes('cm1') || compact.includes('cm2') || compact.includes('cm') ||
    compact === 'ci' || compact.startsWith('ci') || compact.includes('primaire')
  ) {
    return 'Primaire';
  }

  // Maternelle
  if (
    compact.includes('s1') || compact.includes('s2') ||
    compact.includes('section') || compact.includes('maternelle') ||
    compact.includes('creche') || compact.includes('garderie') ||
    compact === 'ps' || compact === 'ms' || compact === 'gs'
  ) {
    return 'Maternelle';
  }

  return 'Secondaire';
}

export function getRowField(row: Record<string, unknown>, candidates: string[]): string | undefined {
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

export function extractNameParts(row: Record<string, unknown>): { firstName: string, lastName: string } | null {
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

export function parseFlexibleDate(val: unknown): string | null {
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

export type ExistingClassRef = {
  id: string
  name: string
  level?: string | null
}

export type ExistingStudentRef = {
  id?: string
  matricule?: string | null
  first_name: string
  last_name: string
  class_id?: string | null
  date_of_birth?: string | null
}

export type AnalyzedStudentRow = {
  rowNumber: number
  firstName: string
  lastName: string
  gender: 'M' | 'F' | null
  dateOfBirth: string | null
  matricule: string | null
  parentPhone: string | null
  rawClassName: string
  resolvedClassId: string | null
  resolvedClassName: string
  resolvedClassKey: string
  isNewClass: boolean
  duplicateReason: string | null
}

export type ClassBreakdownItem = {
  rawClassNames: string[]
  primaryRawClass: string
  resolvedClassId: string | null
  resolvedClassName: string
  resolvedClassKey: string
  level: string
  isNewClass: boolean
  newStudentsCount: number
  duplicateCount: number
}

export type StudentImportAnalysis = {
  rows: AnalyzedStudentRow[]
  newRows: AnalyzedStudentRow[]
  duplicateRows: AnalyzedStudentRow[]
  classes: ClassBreakdownItem[]
  missingClassesToCreate: Array<{ name: string; level: string; canonicalKey: string }>
}

function normalizeNameToken(value: string): string {
  return normalizeText(value).replace(/\s+/g, ' ').trim();
}

/**
 * Rapproche un libellé de classe Excel d'une classe existante dans le logiciel.
 */
export function matchExistingClass<T extends { id: string; name: string }>(
  rawClassName: string,
  existingClasses: T[],
): T | null {
  if (!rawClassName || existingClasses.length === 0) return null;

  const exactNorm = normalizeText(rawClassName);
  const directMatch = existingClasses.find((c) => normalizeText(c.name) === exactNorm);
  if (directMatch) return directMatch;

  const targetKey = canonicalClassKey(rawClassName);
  if (!targetKey) return null;

  const canonicalMatch = existingClasses.find((c) => canonicalClassKey(c.name) === targetKey);
  if (canonicalMatch) return canonicalMatch;

  // Correspondance sans ambiguïté si le logiciel n'a qu'une seule section (ex: "6ème" -> "6ème A")
  const subSectionCandidates = existingClasses.filter((c) => {
    const candKey = canonicalClassKey(c.name);
    if (!candKey.startsWith(targetKey) || candKey === targetKey) return false;
    const suffix = candKey.slice(targetKey.length);
    return /^[a-z][a-z0-9]*$/.test(suffix);
  });

  if (subSectionCandidates.length === 1) {
    return subSectionCandidates[0];
  }

  return null;
}

/**
 * Analyse un lot d'élèves issu d'Excel/CSV :
 * - résout chaque classe sur le logiciel (ou planifie sa création sans doublons de libellés)
 * - détecte les doublons par matricule ou par identité (Nom + Prénom + Classe / DDN)
 */
export function analyzeStudentImportRows(
  rawRows: Array<Record<string, unknown>>,
  existingClasses: ExistingClassRef[],
  existingStudents: ExistingStudentRef[],
  options?: {
    fallbackClassName?: string
    classOverrides?: Record<string, string>
  },
): StudentImportAnalysis {
  const existingById = new Map<string, ExistingClassRef>();
  existingClasses.forEach((c) => existingById.set(c.id, c));

  // Index des doublons existants en base
  const dbMatricules = new Set<string>();
  const dbClassSignatures = new Map<string, Array<{ matricule: string | null; dob: string | null }>>();
  const dbDobSignatures = new Set<string>();

  for (const s of existingStudents) {
    const cleanMat = s.matricule ? s.matricule.toString().trim().toLowerCase() : '';
    if (cleanMat) dbMatricules.add(cleanMat);

    const nFirst = normalizeNameToken(s.first_name || '');
    const nLast = normalizeNameToken(s.last_name || '');
    if (nFirst && nLast) {
      if (s.class_id) {
        const key = `${nLast}|${nFirst}|${s.class_id}`;
        const list = dbClassSignatures.get(key) ?? [];
        list.push({ matricule: cleanMat || null, dob: s.date_of_birth || null });
        dbClassSignatures.set(key, list);
      }
      if (s.date_of_birth) {
        dbDobSignatures.add(`${nLast}|${nFirst}|${s.date_of_birth}`);
      }
    }
  }

  // Index dynamiques pour détecter aussi les doublons internes au fichier Excel
  const batchMatricules = new Set<string>();
  const batchClassSignatures = new Map<string, Array<{ matricule: string | null; dob: string | null }>>();
  const batchDobSignatures = new Set<string>();

  const analyzedRows: AnalyzedStudentRow[] = [];
  const classBuckets = new Map<string, ClassBreakdownItem>();
  const missingClassCanonicalMap = new Map<string, { name: string; level: string; canonicalKey: string }>();

  const hasDisambiguatingTraits = (
    incomingMat: string,
    incomingDob: string | null,
    existingList: Array<{ matricule: string | null; dob: string | null }>,
  ): boolean => {
    // Si deux élèves ont chacun un matricule explicite différent OU une date de naissance différente, ce ne sont pas des doublons.
    return existingList.every((item) => {
      const bothHaveDistinctMat = Boolean(incomingMat && item.matricule && incomingMat !== item.matricule);
      const bothHaveDistinctDob = Boolean(incomingDob && item.dob && incomingDob !== item.dob);
      return bothHaveDistinctMat || bothHaveDistinctDob;
    });
  };

  for (let index = 0; index < rawRows.length; index++) {
    const student = rawRows[index];
    const nameParts = extractNameParts(student);
    const firstName = nameParts?.firstName;
    const lastName = nameParts?.lastName;

    let className = getRowField(student, ['classe', 'class', 'niveau', 'salle', 'cours', 'division', 'groupe', 'section']);
    if (!className && options?.fallbackClassName) {
      className = options.fallbackClassName;
    }

    // Sauter les lignes totalement vides
    if (!firstName && !lastName && !className) {
      continue;
    }

    if (!firstName || !lastName) {
      throw new Error(`Ligne ${index + 2} : Impossible de déterminer le Nom et le Prénom de l'élève.`);
    }

    if (!className) {
      throw new Error(
        `Ligne ${index + 2} : L'élève "${firstName} ${lastName}" n'a pas de classe spécifiée. Sélectionnez une classe de secours ou ajoutez une colonne "Classe" dans votre fichier.`,
      );
    }

    const trimmedRawClass = className.trim();
    const normRawClass = normalizeText(trimmedRawClass);
    const overrideTarget = options?.classOverrides?.[normRawClass];

    let matchedClass: ExistingClassRef | null = null;
    let resolvedNewClassName = trimmedRawClass;

    if (overrideTarget && overrideTarget !== '__auto__') {
      matchedClass = existingById.get(overrideTarget) ?? null;
      if (!matchedClass) {
        resolvedNewClassName = overrideTarget;
      }
    } else {
      matchedClass = matchExistingClass(trimmedRawClass, existingClasses);
    }

    const newCanonKey = canonicalClassKey(resolvedNewClassName) || normRawClass;
    let resolvedClassId: string | null = null;
    let resolvedClassName = resolvedNewClassName;
    let resolvedClassKey = `new:${newCanonKey}`;
    let isNewClass = true;

    if (matchedClass) {
      resolvedClassId = matchedClass.id;
      resolvedClassName = matchedClass.name;
      resolvedClassKey = matchedClass.id;
      isNewClass = false;
    } else {
      const existingMissing = missingClassCanonicalMap.get(newCanonKey);
      if (existingMissing) {
        resolvedClassName = existingMissing.name;
      } else {
        missingClassCanonicalMap.set(newCanonKey, {
          name: resolvedNewClassName,
          level: detectClassLevel(resolvedNewClassName),
          canonicalKey: newCanonKey,
        });
      }
    }

    const rawMatricule = getRowField(student, ['matricule', 'id', 'numero matricule', 'num_matricule']);
    const matricule = rawMatricule ? rawMatricule.trim() : null;
    const cleanMat = matricule ? matricule.toLowerCase() : '';

    const rawDate = getRowField(student, [
      'date de naissance',
      'date naissance',
      'ddn',
      'birth date',
      'date_de_naissance',
      'date_naissance',
      'birthdate',
    ]);
    const dateOfBirth = parseFlexibleDate(rawDate);

    const rawGender = getRowField(student, ['sexe', 'genre', 'gender', 'sex']);
    const gender = parseGender(rawGender);

    const parentPhone =
      getRowField(student, [
        'telephone parent',
        'telephone',
        'contact parent',
        'parent phone',
        'contact',
        'telephone_parent',
        'tel parent',
        'tel',
      ]) || null;

    // Détection stricte des doublons
    const nFirst = normalizeNameToken(firstName);
    const nLast = normalizeNameToken(lastName);
    const classSigKey = `${nLast}|${nFirst}|${resolvedClassKey}`;
    const dobSigKey = dateOfBirth ? `${nLast}|${nFirst}|${dateOfBirth}` : null;

    let duplicateReason: string | null = null;

    if (cleanMat && dbMatricules.has(cleanMat)) {
      duplicateReason = 'Matricule déjà enregistré dans l\'école';
    } else if (cleanMat && batchMatricules.has(cleanMat)) {
      duplicateReason = 'Matricule en double dans le fichier';
    } else {
      const dbClassHits = dbClassSignatures.get(classSigKey);
      const batchClassHits = batchClassSignatures.get(classSigKey);

      if (dbClassHits && !hasDisambiguatingTraits(cleanMat, dateOfBirth, dbClassHits)) {
        duplicateReason = 'Élève déjà inscrit dans cette classe';
      } else if (batchClassHits && !hasDisambiguatingTraits(cleanMat, dateOfBirth, batchClassHits)) {
        duplicateReason = 'Doublon détecté dans le fichier Excel';
      } else if (dobSigKey && dbDobSignatures.has(dobSigKey)) {
        duplicateReason = 'Élève déjà inscrit (même nom et date de naissance)';
      } else if (dobSigKey && batchDobSignatures.has(dobSigKey)) {
        duplicateReason = 'Doublon détecté dans le fichier Excel';
      }
    }

    if (!duplicateReason) {
      if (cleanMat) batchMatricules.add(cleanMat);
      const currentBatchList = batchClassSignatures.get(classSigKey) ?? [];
      currentBatchList.push({ matricule: cleanMat || null, dob: dateOfBirth });
      batchClassSignatures.set(classSigKey, currentBatchList);
      if (dobSigKey) batchDobSignatures.add(dobSigKey);
    }

    const rowObj: AnalyzedStudentRow = {
      rowNumber: index + 2,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      matricule,
      parentPhone,
      rawClassName: trimmedRawClass,
      resolvedClassId,
      resolvedClassName,
      resolvedClassKey,
      isNewClass,
      duplicateReason,
    };

    analyzedRows.push(rowObj);

    let bucket = classBuckets.get(resolvedClassKey);
    if (!bucket) {
      bucket = {
        rawClassNames: [trimmedRawClass],
        primaryRawClass: trimmedRawClass,
        resolvedClassId,
        resolvedClassName,
        resolvedClassKey,
        level: matchedClass?.level || detectClassLevel(resolvedClassName),
        isNewClass,
        newStudentsCount: 0,
        duplicateCount: 0,
      };
      classBuckets.set(resolvedClassKey, bucket);
    } else if (!bucket.rawClassNames.includes(trimmedRawClass)) {
      bucket.rawClassNames.push(trimmedRawClass);
    }

    if (duplicateReason) {
      bucket.duplicateCount++;
    } else {
      bucket.newStudentsCount++;
    }
  }

  return {
    rows: analyzedRows,
    newRows: analyzedRows.filter((r) => r.duplicateReason === null),
    duplicateRows: analyzedRows.filter((r) => r.duplicateReason !== null),
    classes: Array.from(classBuckets.values()),
    missingClassesToCreate: Array.from(missingClassCanonicalMap.values()),
  };
}
