create table public.payment_webhook_logs (
  id uuid default gen_random_uuid() primary key,
  transaction_id text, -- Peut être nul si on n'arrive pas à parser la requête
  payload jsonb not null,
  status text not null default 'received', -- 'received', 'processed', 'error', 'failed_check'
  error_details text,
  created_at timestamptz not null default now()
);

-- Index pour la recherche par transaction ID
create index idx_webhook_logs_trans_id on public.payment_webhook_logs(transaction_id);
create index idx_webhook_logs_status on public.payment_webhook_logs(status);

-- RLS
alter table public.payment_webhook_logs enable row level security;

-- Seuls les administrateurs et comptables peuvent lire ces logs (si besoin)
create policy "Admins can read webhook logs"
  on public.payment_webhook_logs for select
  using (
    auth.uid() in (
      select user_id from public.user_school_roles 
      where role in ('admin', 'comptable')
    )
  );

-- Seul le service_role peut écrire (via le webhook)
-- Aucune policy d'insertion pour l'authentifié n'est nécessaire car le webhook bypasse RLS.

-- Fonction transactionnelle pour le succès d'un paiement
create or replace function public.process_cinetpay_success(p_transaction_id text, p_amount numeric)
returns void
language plpgsql
security definer
as $$
declare
  v_payment record;
begin
  -- 1. Trouver le paiement concerné et verrouiller la ligne (éviter la double exécution)
  select * into v_payment
  from public.payments
  where transaction_id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaction introuvable: %', p_transaction_id;
  end if;

  if v_payment.status = 'success' then
    -- Déjà traité, on ignore gracieusement
    return;
  end if;

  -- 2. Mettre à jour le paiement
  update public.payments
  set 
    status = 'success', 
    updated_at = now()
  where 
    id = v_payment.id;

  -- 3. Mettre à jour l'échéance (dues)
  -- Note : Dans une logique métier complète, on vérifierait si la somme des paiements couvre le montant total.
  -- Ici, on assume que l'échéance passe à 'paye'.
  update public.dues
  set 
    status = 'paye', 
    updated_at = now()
  where 
    id = v_payment.due_id;

end;
$$;
