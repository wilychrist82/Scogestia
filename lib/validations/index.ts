import { z } from 'zod';

export const studentSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Date de naissance invalide'
  }),
  class_id: z.string().uuid('Identifiant de classe invalide'),
});

export const updateStudentSchema = z.object({
  student_id: z.string().uuid('Identifiant étudiant invalide'),
  birth_place: z.string().optional(),
  gender: z.enum(['M', 'F', 'autre', '']).optional(),
  blood_group: z.string().optional(),
  address: z.string().optional(),
});

export const feeTypeSchema = z.object({
  label: z.string().min(2, 'Le libellé doit contenir au moins 2 caractères'),
  amount: z.number().positive('Le montant doit être strictement positif'),
  periodicity: z.string().min(1, 'La périodicité est requise'),
  target: z.string().min(1, 'La cible est requise'),
});

export const paymentSchema = z.object({
  schedule_id: z.string().uuid('Échéance invalide'),
  amount: z.number().positive('Le montant doit être strictement positif'),
  payment_method: z.string().min(1, 'Le moyen de paiement est requis'),
  transaction_reference: z.string().optional(),
});
