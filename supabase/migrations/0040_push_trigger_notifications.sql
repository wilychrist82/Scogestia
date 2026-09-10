-- Trigger FCM pour la table notifications (écran en veille / app fermée)
-- Chaque fois qu'une ligne est insérée dans public.notifications,
-- ce trigger appelle la Edge Function send-push-notification via net.http_post
-- pour envoyer une push FCM sur l'appareil du destinataire.

create or replace function public.send_push_on_new_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  device_rec record;
  request_body jsonb;
begin
  -- Chercher le(s) token(s) FCM enregistrés pour cet utilisateur
  for device_rec in (
    select fcm_token
    from public.user_devices
    where user_id = NEW.user_id
      and fcm_token is not null
  ) loop

    request_body := json_build_object(
      'token', device_rec.fcm_token,
      'title', NEW.title,
      'body',  NEW.message,
      'data',  json_build_object('notification_id', NEW.id, 'type', NEW.type)
    )::jsonb;

    perform net.http_post(
      url     := 'https://juhlayflzogtomarshpx.supabase.co/functions/v1/send-push-notification',
      body    := request_body,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );

  end loop;

  return NEW;
end;
$$;

-- Supprimer l'ancien trigger s'il existe, puis recréer
drop trigger if exists on_new_notification_send_push on public.notifications;
create trigger on_new_notification_send_push
  after insert on public.notifications
  for each row execute function public.send_push_on_new_notification();
