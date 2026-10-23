import { describe, it, expect } from 'vitest';
import {
  getClassOrderRank,
  sortClasses,
  getNextLevelSuggestion
} from '../lib/classes';

describe('Classes Hierarchy & Ordering (Cursus Pédagogique)', () => {
  it('correctly ranks classes from Maternelle to Lycée', () => {
    // Maternelle
    expect(getClassOrderRank('Section 1')).toBe(120);
    expect(getClassOrderRank('S2')).toBe(130);
    expect(getClassOrderRank('Petite Section')).toBe(120);
    expect(getClassOrderRank('Moyenne Section')).toBe(130);
    expect(getClassOrderRank('Grande Section')).toBe(140);

    // Primaire
    expect(getClassOrderRank('CP1')).toBe(220);
    expect(getClassOrderRank('CP2')).toBe(230);
    expect(getClassOrderRank('CE1')).toBe(240);
    expect(getClassOrderRank('CM2')).toBe(270);

    // Collège (Secondaire 1)
    expect(getClassOrderRank('6ème A')).toBe(310);
    expect(getClassOrderRank('5ème B')).toBe(320);
    expect(getClassOrderRank('4ème')).toBe(330);
    expect(getClassOrderRank('3ème A')).toBe(340);

    // Lycée (Secondaire 2)
    expect(getClassOrderRank('2nde S')).toBe(410);
    expect(getClassOrderRank('1ère A4')).toBe(420);
    expect(getClassOrderRank('Terminale D')).toBe(430);
  });

  it('correctly sorts an unorganized list of classes in strict pedagogical order', () => {
    const rawList = [
      { name: 'Terminale D' },
      { name: 'CP1 A' },
      { name: '6ème 1' },
      { name: 'S1 B' },
      { name: 'CM2' },
      { name: '2nde S' },
      { name: 'CE2' },
      { name: '3ème 2' },
    ];

    const sorted = sortClasses(rawList).map((c) => c.name);

    expect(sorted).toEqual([
      'S1 B',
      'CP1 A',
      'CE2',
      'CM2',
      '6ème 1',
      '3ème 2',
      '2nde S',
      'Terminale D',
    ]);
  });

  it('suggests the right next level for student progression', () => {
    expect(getNextLevelSuggestion('S1')).toBe('S2');
    expect(getNextLevelSuggestion('S2')).toBe('CP1');
    expect(getNextLevelSuggestion('CP1')).toBe('CP2');
    expect(getNextLevelSuggestion('CM2')).toBe('6ème');
    expect(getNextLevelSuggestion('3ème')).toBe('Seconde');
    expect(getNextLevelSuggestion('Première')).toBe('Terminale');
  });
});
