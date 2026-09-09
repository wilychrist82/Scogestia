-- 1. Trigger pour les Devoirs de Maison (Homework)
create or replace function public.send_push_notification_homework()
returns trigger
language plpgsql
security definer
as $$
declare
  parent_rec record;
  request_body jsonb;
begin
  -- Boucler sur tous les parents des élèves de la classe concernée
  for parent_rec in (
    select distinct u.fcm_token
    from public.students s
    join public.parent_student_links psl on psl.student_id = s.id
    join public.user_devices u on u.user_id = psl.parent_user_id
    where s.class_id = NEW.class_id
      and u.fcm_token is not null
  ) loop
    request_body := json_build_object(
      'token', parent_rec.fcm_token,
      'title', 'Nouveau devoir à faire !',
      'body', 'En ' || NEW.subject_name || ' : ' || NEW.title || ' (Pour le ' || to_char(NEW.due_date, 'DD/MM/YYYY') || ')'
    )::jsonb;

    perform net.http_post(
      url := 'https://juhlayflzogtomarshpx.supabase.co/functions/v1/send-push-notification',
      body := request_body,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  end loop;
  return NEW;
end;
$$;

drop trigger if exists on_new_homework_send_push on public.homework;
create trigger on_new_homework_send_push
after insert on public.homework
for each row execute function public.send_push_notification_homework();


-- 2. Trigger pour les Communications (Messages unidirectionnels et bidirectionnels)
create or replace function public.send_push_notification_communication()
returns trigger
language plpgsql
security definer
as $$
declare
  target_rec record;
  request_body jsonb;
  notif_title text;
begin
  -- Définir le titre selon qui a envoyé le message
  if exists (select 1 from public.user_school_roles where user_id = NEW.sender_id and role = 'parent') then
    notif_title := 'Nouveau message d''un parent';
  else
    notif_title := 'Nouveau message de l''école';
  end if;

  -- Cas A: Message direct à un Parent, un Admin, ou un Enseignant (recipient_id est l'ID de l'utilisateur cible)
  if NEW.recipient_type in ('parent', 'admin', 'teacher') then
    for target_rec in (select fcm_token from public.user_devices where user_id = NEW.recipient_id and fcm_token is not null) loop
      request_body := json_build_object('token', target_rec.fcm_token, 'title', notif_title, 'body', NEW.subject)::jsonb;
      perform net.http_post(
        url := 'https://juhlayflzogtomarshpx.supabase.co/functions/v1/send-push-notification', body := request_body, headers := '{"Content-Type": "application/json"}'::jsonb
      );
    end loop;
    
  -- Cas B: Message à toute une classe (recipient_id est l'ID de la classe)
  elsif NEW.recipient_type = 'class' then
    for target_rec in (
      select distinct u.fcm_token
      from public.students s
      join public.parent_student_links psl on psl.student_id = s.id
      join public.user_devices u on u.user_id = psl.parent_user_id
      where s.class_id = NEW.recipient_id and u.fcm_token is not null
    ) loop
      request_body := json_build_object('token', target_rec.fcm_token, 'title', 'Information Classe', 'body', NEW.subject)::jsonb;
      perform net.http_post(
        url := 'https://juhlayflzogtomarshpx.supabase.co/functions/v1/send-push-notification', body := request_body, headers := '{"Content-Type": "application/json"}'::jsonb
      );
    end loop;
    
  -- Cas C: Message à tous les parents de l'école
  elsif NEW.recipient_type = 'all' then
    for target_rec in (
      select distinct u.fcm_token
      from public.user_school_roles usr
      join public.user_devices u on u.user_id = usr.user_id
      where usr.school_id = NEW.school_id and usr.role = 'parent' and u.fcm_token is not null
    ) loop
      request_body := json_build_object('token', target_rec.fcm_token, 'title', 'Annonce de l''école', 'body', NEW.subject)::jsonb;
      perform net.http_post(
        url := 'https://juhlayflzogtomarshpx.supabase.co/functions/v1/send-push-notification', body := request_body, headers := '{"Content-Type": "application/json"}'::jsonb
      );
    end loop;
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_new_communication_send_push on public.communications;
create trigger on_new_communication_send_push
after insert on public.communications
for each row execute function public.send_push_notification_communication();
