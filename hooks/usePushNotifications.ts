import { useState, useEffect } from 'react';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { registerDeviceToken } from '@/app/actions/notifications';
import { shouldSuppressAlert } from '@/components/providers/NotificationProvider';
import { useRouter } from 'next/navigation';

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const registerPushNotifications = async () => {
    try {
      // Demander la permission
      const permStatus = await PushNotifications.requestPermissions();

      if (permStatus.receive === 'granted') {
        // Enregistrer l'appareil pour les notifications push
        await PushNotifications.register();
      } else {
        console.log('Permission de notification push refusée');
      }

      // Écouter l'enregistrement réussi
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('FCM Token:', token.value);
        setFcmToken(token.value);
        
        // Sauvegarder le token via l'action serveur (adminClient) pour dissocier proprement tout ancien compte
        try {
          await registerDeviceToken(token.value);
        } catch (err) {
          console.error("Erreur d'enregistrement du token via registerDeviceToken:", err);
        }
      });

      // Écouter les erreurs d'enregistrement
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Erreur d\'enregistrement Push:', error);
      });

      // Écouter les notifications reçues lorsque l'app est au premier plan
      PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        console.log('Notification reçue (foreground):', notification);

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const data = notification.data || {};

          // 1. Si la notification est destinée à un compte différent de celui connecté : NE PAS SONNER
          if (data.recipient_id && data.recipient_id !== user.id) {
            console.log('[Push] Notification ignorée : destinée à un autre utilisateur sur cet appareil');
            return;
          }

          // 2. Récupérer le nom de l'utilisateur pour vérifier s'il est l'auteur du message
          const { data: roleProfile } = await supabase
            .from('user_school_roles')
            .select('full_name')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

          const currentUserName = (roleProfile?.full_name || user.user_metadata?.full_name || '').trim();

          // Si le titre indique que le message vient de l'utilisateur connecté : NE PAS SONNER
          if (currentUserName && notification.title && notification.title.toLowerCase().includes(currentUserName.toLowerCase())) {
            console.log('[Push] Alerte push bloquée : message envoyé par l\'utilisateur connecté');
            return;
          }

          // 3. Fenêtre de silence anti-écho (si envoyé il y a moins de 8s)
          if (typeof window !== 'undefined') {
            const lastSentTime = parseInt(sessionStorage.getItem('scogestia_last_sent_msg_time') || '0', 10);
            if (Date.now() - lastSentTime < 8000) {
              console.log('[Push] Push ignoré : message envoyé récemment par cet utilisateur');
              return;
            }
          }

          // 4. Déduplication avec NotificationProvider (Realtime) via cache partagé 12s
          const notifId = data.notification_id || notification.id;
          const contentFingerprint = `${notification.title}::${notification.body || ''}`.toLowerCase();

          const isDuplicateId = notifId ? shouldSuppressAlert(String(notifId), 12000) : false;
          const isDuplicateContent = shouldSuppressAlert(contentFingerprint, 12000);

          if (isDuplicateId || isDuplicateContent) {
            console.log('[Push] Notification déjà traitée via Realtime, double sonnerie et toast bloqués');
            return;
          }

          // 5. Carillon doux via Web Audio API si tous les filtres sont passés
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const notes = [523.25, 659.25, 783.99, 1046.50];
              const totalDuration = 4;
              notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                const startTime = ctx.currentTime + i * 0.18;
                const peakVolume = 0.18 - i * 0.02;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + totalDuration - i * 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + totalDuration);
              });
              setTimeout(() => ctx.close().catch(() => {}), (totalDuration + 1) * 1000);
            }
          } catch (e) {
            console.error('[Audio] WebAudio non supporté:', e);
          }

          toast.success(`${notification.title} : ${notification.body}`, {
            duration: 8000,
            position: 'top-center'
          });
        } catch (pushErr) {
          console.error('[Push] Erreur traitement foreground notification:', pushErr);
        }
      });

      // Écouter l'action d'ouverture de notification (quand cliquée)
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          console.log('Action de notification effectuée:', notification);
          const data = notification.notification.data;
          if (data && data.link) {
             router.push(data.link);
          }
        }
      );
      
      // Configuration channel Android
      await PushNotifications.createChannel({
        id: 'scogestia_alerts_v3',
        name: 'Alertes Scogestia',
        description: 'Notifications pour les messages et alertes de l\'application',
        importance: 5,
        visibility: 1,
        sound: 'notification_sound',
        vibration: true,
      });

    } catch (error) {
      console.error('Erreur lors de la configuration des notifications:', error);
    }
  };

  useEffect(() => {
    if (Capacitor.getPlatform() === 'web') return;
    registerPushNotifications();
    return () => {
      PushNotifications.removeAllListeners().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { fcmToken };
};
