import { useState, useEffect } from 'react';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'web') {
      registerPushNotifications();
    }
  }, []);

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
        
        // Sauvegarder le token en base de données
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('user_devices')
              .upsert({ 
                user_id: user.id, 
                fcm_token: token.value,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' });
          }
        } catch (err) {
          console.error("Erreur d'enregistrement du token en BDD:", err);
        }
      });

      // Écouter les erreurs d'enregistrement
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Erreur d\'enregistrement Push:', error);
      });

      // Écouter les notifications reçues lorsque l'app est au premier plan
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Notification reçue (foreground):', notification);

        // Carillon doux via Web Audio API (même logique que NotificationProvider)
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const notes = [523.25, 659.25, 783.99, 1046.50];
            const totalDuration = 5;
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
          duration: 4000,
          position: 'top-center'
        });
      });

      // Écouter l'action d'ouverture de notification (quand cliquée)
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          console.log('Action de notification effectuée:', notification);
          // Redirection si un lien est fourni dans le payload de la notification
          const data = notification.notification.data;
          if (data && data.link) {
             router.push(data.link);
          }
        }
      );
      
      // ⚠️  IMPORTANT : Android met en cache les channels de notification.
      // Si on change la config (son, importance...), il FAUT changer l'ID du channel.
      // Le channel v3 force Android à recréer un channel frais avec le nouveau son doux.
      await PushNotifications.createChannel({
        id: 'scogestia_alerts_v3',           // Nouveau ID → force Android à recréer le channel
        name: 'Alertes Scogestia',
        description: 'Notifications pour les messages et alertes de l\'application',
        importance: 5,
        visibility: 1,
        sound: 'notification_sound',          // Sans extension .mp3 (fichier dans res/raw)
        vibration: true,
      });

    } catch (error) {
      console.error('Erreur lors de la configuration des notifications:', error);
    }
  };

  return { fcmToken };
};
