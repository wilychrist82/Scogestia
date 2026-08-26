'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  error?: string;
  success?: boolean;
} | null;

async function getActiveSchoolId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: roleData, error } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .single();

  if (error || !roleData) throw new Error('École introuvable');
  return roleData.school_id;
}

export async function generateSchedule(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const type = formData.get('type') as string; // 'individual' or 'class'
  const studentId = formData.get('studentId') as string;
  const classId = formData.get('classId') as string;
  const label = formData.get('label') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const dueDate = formData.get('dueDate') as string;
  const academicYear = '2026-2027'; // Should be dynamic in a real app

  if (!label || !amount || !dueDate) {
    return { error: 'Veuillez remplir les champs obligatoires (libellé, montant, date).' };
  }

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();

    if (type === 'individual') {
      if (!studentId) return { error: 'Veuillez sélectionner un élève.' };
      
      const { error } = await supabase.from('payment_schedules').insert({
        school_id,
        student_id: studentId,
        academic_year: academicYear,
        label,
        amount_due: amount,
        due_date: dueDate,
        status: 'en_attente'
      });
      if (error) throw error;
    } else if (type === 'class') {
      if (!classId) return { error: 'Veuillez sélectionner une classe.' };
      
      // Fetch all students in the class
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', school_id)
        .eq('class_id', classId)
        .eq('status', 'actif');
        
      if (studentsError) throw studentsError;
      if (!students || students.length === 0) return { error: 'Cette classe ne contient aucun élève actif.' };

      // Insert schedules for all students
      const inserts = students.map(student => ({
        school_id,
        student_id: student.id,
        academic_year: academicYear,
        label,
        amount_due: amount,
        due_date: dueDate,
        status: 'en_attente'
      }));

      const { error } = await supabase.from('payment_schedules').insert(inserts);
      if (error) throw error;
    } else {
      return { error: 'Type de génération invalide.' };
    }

    revalidatePath('/admin/finance/echeances');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

import { feeTypeSchema, paymentSchema } from '@/lib/validations';

export async function recordPayment(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = paymentSchema.safeParse({
    schedule_id: formData.get('scheduleId'),
    amount: parseFloat(formData.get('amount') as string),
    payment_method: formData.get('paymentMethod'),
    transaction_reference: formData.get('transactionRef') || undefined,
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }

  const { schedule_id: scheduleId, amount, payment_method: paymentMethod, transaction_reference: transactionRef } = validatedFields.data;

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the schedule to verify it
    const { data: schedule, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('id, student_id, amount_due, status')
      .eq('id', scheduleId)
      .eq('school_id', school_id)
      .single();

    if (scheduleError || !schedule) {
      return { error: 'Échéance introuvable ou non autorisée.' };
    }

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Insert payment
    const { error: paymentError } = await supabase.from('payments').insert({
      school_id,
      student_id: schedule.student_id,
      schedule_id: schedule.id,
      amount,
      payment_method: paymentMethod,
      transaction_reference: transactionRef,
      receipt_number: receiptNumber,
      recorded_by: user?.id
    });

    if (paymentError) throw paymentError;

    // Fetch total paid so far
    const { data: allPayments, error: calcError } = await supabase
      .from('payments')
      .select('amount')
      .eq('schedule_id', schedule.id);

    if (calcError) throw calcError;

    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Update schedule status
    let newStatus = schedule.status;
    if (totalPaid >= schedule.amount_due) {
      newStatus = 'paye';
    } else if (totalPaid > 0) {
      newStatus = 'partiel';
    }

    if (newStatus !== schedule.status) {
      const { error: updateError } = await supabase
        .from('payment_schedules')
        .update({ status: newStatus })
        .eq('id', schedule.id);
        
      if (updateError) throw updateError;
    }

    revalidatePath('/admin/finance/paiements');
    revalidatePath('/admin/finance/echeances');
    revalidatePath('/admin/finance');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function sendPaymentReminder(
  parentUserId: string,
  studentName: string,
  amountDue: number,
  daysLate: number,
  label: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const schoolId = await getActiveSchoolId()

  const formatCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'FCFA')
  }

  const subject = `Relance : Retard de paiement pour ${studentName}`
  const content = `Bonjour,\n\nSauf erreur de notre part, le paiement de "${label}" pour votre enfant ${studentName} est en retard de ${daysLate} jours.\n\nLe montant restant à payer est de ${formatCFA(amountDue)}.\n\nMerci de bien vouloir régulariser la situation dans les plus brefs délais.\n\nCordialement,\nLa Direction`

  const { error } = await supabase
    .from('communications')
    .insert({
      school_id: schoolId,
      sender_id: user.id,
      recipient_type: 'parent',
      recipient_id: parentUserId,
      subject,
      content
    })

  if (error) {
    console.error('Erreur lors de l\'envoi de la relance :', error)
    return { error: 'Erreur lors de l\'envoi de la relance' }
  }

  return { success: true }
}

export async function sendBulkPaymentReminders(
  reminders: {
    parentUserId: string,
    studentName: string,
    amountDue: number,
    daysLate: number,
    label: string
  }[]
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const schoolId = await getActiveSchoolId()

  const formatCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'FCFA')
  }

  const communications = reminders.map(reminder => ({
    school_id: schoolId,
    sender_id: user.id,
    recipient_type: 'parent',
    recipient_id: reminder.parentUserId,
    subject: `Relance : Retard de paiement pour ${reminder.studentName}`,
    content: `Bonjour,\n\nSauf erreur de notre part, le paiement de "${reminder.label}" pour votre enfant ${reminder.studentName} est en retard de ${reminder.daysLate} jours.\n\nLe montant restant à payer est de ${formatCFA(reminder.amountDue)}.\n\nMerci de bien vouloir régulariser la situation dans les plus brefs délais.\n\nCordialement,\nLa Direction`
  }))

  if (communications.length === 0) {
    return { error: 'Aucune relance à envoyer' }
  }

  const { error } = await supabase
    .from('communications')
    .insert(communications)

  if (error) {
    console.error('Erreur lors de l\'envoi des relances massives :', error)
    return { error: 'Erreur lors de l\'envoi des relances' }
  }

  return { success: true }
}

export async function addFeeType(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = feeTypeSchema.safeParse({
    label: formData.get('label'),
    amount: parseFloat(formData.get('amount') as string),
    periodicity: formData.get('periodicity'),
    target: formData.get('target'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }

  const { label, amount, periodicity, target } = validatedFields.data;

  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    
    const { error } = await supabase.from('fee_types').insert({
      school_id,
      label,
      amount,
      periodicity,
      target
    });

    if (error) throw error;

    revalidatePath('/admin/finance/frais');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteFeeType(id: string): Promise<ActionState> {
  try {
    const school_id = await getActiveSchoolId();
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('fee_types')
      .delete()
      .eq('id', id)
      .eq('school_id', school_id);

    if (error) throw error;

    revalidatePath('/admin/finance/frais');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
