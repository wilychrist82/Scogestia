-- 0044_fix_notification_triggers.sql
-- 1. Supprime le trigger doublon obsolète sur la table communications
-- Ce trigger envoyait des notifications push directement à chaque insert dans communications,
-- provoquant un double déclenchement sonore et des alertes vers des destinataires non filtrés.
DROP TRIGGER IF EXISTS on_new_communication_send_push ON public.communications;

-- 2. Améliore la fonction d'envoi push sur public.notifications
-- Inclut l'ID du destinataire (recipient_id) dans le payload afin que l'application cliente
-- puisse rejeter toute notification qui ne lui est pas directement adressée.
CREATE OR REPLACE FUNCTION public.send_push_on_new_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  device_rec record;
  request_body jsonb;
BEGIN
  FOR device_rec IN (
    SELECT fcm_token
    FROM public.user_devices
    WHERE user_id = NEW.user_id
      AND fcm_token IS NOT NULL
  ) LOOP

    request_body := json_build_object(
      'token', device_rec.fcm_token,
      'title', NEW.title,
      'body',  NEW.message,
      'data',  json_build_object(
        'notification_id', NEW.id,
        'recipient_id', NEW.user_id,
        'type', NEW.type,
        'link', coalesce(NEW.action_url, '')
      )
    )::jsonb;

    PERFORM net.http_post(
      url     := 'https://juhlayflzogtomarshpx.supabase.co/functions/v1/send-push-notification',
      body    := request_body,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );

  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_notification_send_push ON public.notifications;
CREATE TRIGGER on_new_notification_send_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.send_push_on_new_notification();
