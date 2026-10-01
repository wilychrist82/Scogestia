-- 0043_push_notification_links.sql
-- Met à jour les triggers push pour inclure le lien d'action et supporter les rôles enseignant / admin

-- 1. Trigger sur notifications (inclut le lien de redirection)
create or replace function public.send_push_on_new_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  device_rec record;
  request_body jsonb;
begin
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
      'data',  json_build_object(
        'notification_id', NEW.id,
        'type', NEW.type,
        'link', coalesce(NEW.action_url, '')
      )
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

drop trigger if exists on_new_notification_send_push on public.notifications;
create trigger on_new_notification_send_push
  after insert on public.notifications
  for each row execute function public.send_push_on_new_notification();
