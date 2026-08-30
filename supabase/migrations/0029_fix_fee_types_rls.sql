-- Accorder les permissions de base pour les opérations sur fee_types
GRANT ALL ON public.fee_types TO postgres, anon, authenticated, service_role;

-- Corriger la politique RLS pour s'assurer que les INSERTS passent bien la vérification
DROP POLICY IF EXISTS "Comptable and admin can manage fee types" ON public.fee_types;

CREATE POLICY "Comptable and admin can manage fee types"
  ON public.fee_types FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM public.user_school_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'comptable', 'super_admin')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.user_school_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'comptable', 'super_admin')
    )
  );
