-- Update the parent's read policy on communications to also allow them to read messages they sent.

DROP POLICY IF EXISTS "Parents can view their communications" ON public.communications;

CREATE POLICY "Parents can view their communications" ON public.communications
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.user_school_roles 
        WHERE user_id = auth.uid() 
        AND school_id = communications.school_id 
        AND role = 'parent'
      )
      AND (
        sender_id = auth.uid() -- Allow reading messages they sent!
        OR recipient_type = 'all'
        OR (recipient_type = 'parent' AND recipient_id = auth.uid())
        OR (
          recipient_type = 'class' AND recipient_id IN (
            SELECT s.class_id 
            FROM public.parent_student_links psl
            JOIN public.students s ON psl.student_id = s.id
            WHERE psl.parent_user_id = auth.uid()
          )
        )
      )
    );
