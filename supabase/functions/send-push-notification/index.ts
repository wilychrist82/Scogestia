import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import admin from 'npm:firebase-admin'
import serviceAccount from './service-account.json' with { type: 'json' }

// Initialiser l'application Firebase (si elle n'est pas déjà initialisée)
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gérer la requête preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, title, body, data } = await req.json()

    if (!token || !title || !body) {
      throw new Error('Champs requis manquants (token, title, body)')
    }

    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
      android: {
        notification: {
          channelId: 'default', // Identifiant de channel critique pour le son personnalisé
          sound: 'notification_sound' // Référence au fichier mp3 ajouté précédemment
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'notification_sound.mp3'
          }
        }
      }
    };

    // Envoyer le message via FCM
    const response = await admin.messaging().send(message);

    return new Response(
      JSON.stringify({ success: true, messageId: response }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de la notification :', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
