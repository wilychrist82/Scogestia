import { describe, it, expect } from 'vitest';
import {
  normalizeSubjectName,
  detectClassSeriesKey,
  isCollegeClass,
  getCoefficientForSubject,
  detectPrimaryLevel,
  formatRank,
} from '../lib/academic-curriculum';

describe('Academic Curriculum Rules (Official Togo & West African Standards)', () => {
  describe('Subject normalization', () => {
    it('normalizes subject names properly', () => {
      expect(normalizeSubjectName('Maths')).toBe('Mathématiques');
      expect(normalizeSubjectName('Physique-Chimie')).toBe('Sciences physiques');
      expect(normalizeSubjectName('SVT / Biologie')).toBe('SVT');
      expect(normalizeSubjectName('Philosophie')).toBe('Philosophie');
      expect(normalizeSubjectName('Anglais Oral')).toBe('Anglais');
      expect(normalizeSubjectName('Histoire Geo')).toBe('Histoire-Géographie');
    });
  });

  describe('Class series detection (Lycée)', () => {
    it('identifies Terminale series', () => {
      expect(detectClassSeriesKey('Terminale D')).toBe('tle_D');
      expect(detectClassSeriesKey('Tle C')).toBe('tle_C');
      expect(detectClassSeriesKey('Terminale A4')).toBe('tle_A4');
    });

    it('identifies Première series', () => {
      expect(detectClassSeriesKey('1ère D')).toBe('1ere_D');
      expect(detectClassSeriesKey('1ere A4')).toBe('1ere_A4');
      expect(detectClassSeriesKey('Première C')).toBe('1ere_C');
    });

    it('identifies Seconde series', () => {
      expect(detectClassSeriesKey('2nde S')).toBe('2nde_S');
      expect(detectClassSeriesKey('Seconde A4')).toBe('2nde_A4');
    });

    it('returns null for non-lycée classes', () => {
      expect(detectClassSeriesKey('6ème A')).toBeNull();
      expect(detectClassSeriesKey('CM2')).toBeNull();
    });
  });

  describe('College rule: uniform coefficient 2', () => {
    it('detects college classes accurately', () => {
      expect(isCollegeClass('6ème B')).toBe(true);
      expect(isCollegeClass('5ème 1')).toBe(true);
      expect(isCollegeClass('4ème')).toBe(true);
      expect(isCollegeClass('3ème A')).toBe(true);
      expect(isCollegeClass('CP1')).toBe(false);
      expect(isCollegeClass('Terminale D')).toBe(false);
    });

    it('enforces coefficient 2 for all subjects in college', () => {
      expect(getCoefficientForSubject('Mathématiques', '6ème A')).toBe(2);
      expect(getCoefficientForSubject('Français', '3ème B')).toBe(2);
      expect(getCoefficientForSubject('Sciences physiques', '4ème')).toBe(2);
      expect(getCoefficientForSubject('Anglais', '5ème')).toBe(2);
      expect(getCoefficientForSubject('EPS', '3ème')).toBe(2);
    });
  });

  describe('Lycée coefficients by series', () => {
    it('applies scientific coefficients for Terminale D (SVT 4, Maths 3, Physique 3)', () => {
      expect(getCoefficientForSubject('SVT', 'Terminale D')).toBe(4);
      expect(getCoefficientForSubject('Mathématiques', 'Terminale D')).toBe(3);
      expect(getCoefficientForSubject('Sciences physiques', 'Terminale D')).toBe(3);
      expect(getCoefficientForSubject('Philosophie', 'Terminale D')).toBe(2);
    });

    it('applies scientific coefficients for Terminale C (Maths 5, Physique 4, SVT 1)', () => {
      expect(getCoefficientForSubject('Mathématiques', 'Terminale C')).toBe(5);
      expect(getCoefficientForSubject('Sciences physiques', 'Terminale C')).toBe(4);
      expect(getCoefficientForSubject('SVT', 'Terminale C')).toBe(1);
    });

    it('applies literary coefficients for Terminale A4 (Philo 4, Français 3, Hist-Géo 3)', () => {
      expect(getCoefficientForSubject('Philosophie', 'Terminale A4')).toBe(4);
      expect(getCoefficientForSubject('Français', 'Terminale A4')).toBe(3);
      expect(getCoefficientForSubject('Histoire-Géographie', 'Terminale A4')).toBe(3);
      expect(getCoefficientForSubject('Mathématiques', 'Terminale A4')).toBe(2);
    });
  });

  describe('Primary level detection', () => {
    it('correctly categorizes primary sections', () => {
      expect(detectPrimaryLevel('CP1')).toBe('CP');
      expect(detectPrimaryLevel('CP2')).toBe('CP');
      expect(detectPrimaryLevel('CE1')).toBe('CE');
      expect(detectPrimaryLevel('CE2')).toBe('CE');
      expect(detectPrimaryLevel('CM1')).toBe('CM');
      expect(detectPrimaryLevel('CM2')).toBe('CM');
    });
  });

  describe('Rank formatting and ex-aequo', () => {
    it('formats 1st rank with French ordinals', () => {
      expect(formatRank(1)).toBe('1er');
      expect(formatRank(1, true)).toBe('1er ex');
    });

    it('formats other ranks with e', () => {
      expect(formatRank(2)).toBe('2e');
      expect(formatRank(2, true)).toBe('2e ex');
      expect(formatRank(15)).toBe('15e');
      expect(formatRank(15, true)).toBe('15e ex');
    });
  });
});
