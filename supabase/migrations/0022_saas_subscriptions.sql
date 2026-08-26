-- Create saas_subscriptions table
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active', -- 'active', 'expired', 'trial'
  current_period_end timestamptz,
  plan_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_saas_subscriptions_school ON public.saas_subscriptions(school_id);

ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their school's subscription" ON public.saas_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles 
      WHERE user_id = auth.uid() 
      AND school_id = saas_subscriptions.school_id 
      AND role IN ('admin', 'comptable')
    )
  );

-- Create saas_payments table to track transactions
CREATE TABLE IF NOT EXISTS public.saas_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  provider_sale_id text UNIQUE, -- Chariow purchase.id
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'FCFA',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'abandoned'
  plan_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_saas_payments_school ON public.saas_payments(school_id);
CREATE INDEX idx_saas_payments_provider_sale ON public.saas_payments(provider_sale_id);

ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their school's saas payments" ON public.saas_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_school_roles 
      WHERE user_id = auth.uid() 
      AND school_id = saas_payments.school_id 
      AND role IN ('admin', 'comptable')
    )
  );
