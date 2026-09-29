-- Teachers can read communications that are sent to 'all' or to classes they teach
CREATE POLICY "Enseignants can view their communications" ON public.communications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles 
      WHERE user_id = auth.uid() 
      AND school_id = communications.school_id 
      AND role = 'enseignant'
    )
    AND (
      recipient_type = 'all'
      OR (
        recipient_type = 'class' AND recipient_id IN (
          SELECT class_id 
          FROM public.teacher_class_subjects
          WHERE teacher_id = auth.uid()
        )
      )
    )
  );
