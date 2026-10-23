import { describe, it, expect } from 'vitest';
import { studentSchema, feeTypeSchema, paymentSchema } from '../lib/validations';

describe('Validation Schemas (Zod)', () => {
  describe('studentSchema', () => {
    it('validates a compliant student payload', () => {
      const validStudent = {
        first_name: 'Koffi',
        last_name: 'Mensah',
        date_of_birth: '2012-05-14',
        class_id: '123e4567-e89b-12d3-a456-426614174000',
      };
      const result = studentSchema.safeParse(validStudent);
      expect(result.success).toBe(true);
    });

    it('rejects short names or invalid date of birth', () => {
      const invalidStudent = {
        first_name: 'A',
        last_name: '',
        date_of_birth: 'invalid-date',
        class_id: 'not-a-uuid',
      };
      const result = studentSchema.safeParse(invalidStudent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('feeTypeSchema', () => {
    it('validates a correct fee type', () => {
      const validFee = {
        label: 'Scolarité Trimestre 1',
        amount: 45000,
        periodicity: 'trimestriel',
        target: 'tous',
      };
      const result = feeTypeSchema.safeParse(validFee);
      expect(result.success).toBe(true);
    });

    it('rejects negative or zero amount', () => {
      const invalidFee = {
        label: 'Frais Inscription',
        amount: -500,
        periodicity: 'annuel',
        target: 'tous',
      };
      const result = feeTypeSchema.safeParse(invalidFee);
      expect(result.success).toBe(false);
    });
  });

  describe('paymentSchema', () => {
    it('validates a legitimate payment entry', () => {
      const validPayment = {
        schedule_id: '123e4567-e89b-12d3-a456-426614174000',
        amount: 25000,
        payment_method: 'TMONEY',
        transaction_reference: 'TRX-2026-9988',
      };
      const result = paymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('rejects payment with non-uuid schedule', () => {
      const invalidPayment = {
        schedule_id: 'abc-xyz',
        amount: 10000,
        payment_method: 'CASH',
      };
      const result = paymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });
  });
});
