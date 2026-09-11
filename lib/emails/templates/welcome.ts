/**
 * Template HTML : Email de bienvenue après inscription de l'école
 */
export function welcomeEmailHtml({
  adminName,
  schoolName,
  loginUrl = 'https://app.scogestia.com/connexion',
  trialDays = 14,
}: {
  adminName: string
  schoolName: string
  loginUrl?: string
  trialDays?: number
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue sur Scogestia</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f9ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0b0f19 0%,#0f1823 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
              <div style="display:inline-block;background:rgba(5,150,105,0.2);border:1px solid rgba(5,150,105,0.4);border-radius:50px;padding:6px 16px;margin-bottom:16px;">
                <span style="color:#34d399;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">Bienvenue</span>
              </div>
              <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px 0;letter-spacing:-0.02em;">Scogestia</h1>
              <p style="color:#94a3b8;font-size:13px;margin:0;">La gestion scolaire réinventée</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <p style="color:#0b1c30;font-size:18px;font-weight:700;margin:0 0 8px 0;">Bonjour ${adminName} 👋</p>
              <p style="color:#3f4944;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
                Félicitations ! L'école <strong style="color:#065F46;">${schoolName}</strong> est maintenant inscrite sur Scogestia.
                Votre période d'essai gratuite de <strong>${trialDays} jours</strong> commence dès maintenant.
              </p>

              <!-- Trial Badge -->
              <div style="background:linear-gradient(135deg,#D1FAE5,#A7F3D0);border-radius:12px;padding:20px 24px;margin-bottom:28px;border:1px solid #6EE7B7;">
                <p style="color:#065F46;font-size:14px;font-weight:700;margin:0 0 4px 0;">🎉 Essai gratuit ${trialDays} jours</p>
                <p style="color:#047857;font-size:13px;margin:0;line-height:1.5;">Accès complet à toutes les fonctionnalités. Aucune carte bancaire requise pendant l'essai.</p>
              </div>

              <!-- Steps -->
              <p style="color:#0b1c30;font-size:14px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.05em;">Pour commencer :</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  ['1', 'Configurer votre école', 'Paramètres → Informations de l\'école'],
                  ['2', 'Ajouter vos classes', 'Classes → Nouvelle classe'],
                  ['3', 'Inscrire vos élèves', 'Élèves → Importer ou ajouter manuellement'],
                  ['4', 'Inviter le personnel', 'Personnel → Envoyer une invitation'],
                ].map(([num, title, desc]) => `
                <tr>
                  <td style="padding:0 0 16px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;height:32px;background:#065F46;border-radius:50%;text-align:center;vertical-align:middle;font-size:13px;font-weight:800;color:#fff;">${num}</td>
                        <td style="padding-left:12px;">
                          <p style="color:#0b1c30;font-size:14px;font-weight:700;margin:0 0 2px 0;">${title}</p>
                          <p style="color:#6b7280;font-size:12px;margin:0;">${desc}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join('')}
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin-top:32px;">
                <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#065F46);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;box-shadow:0 4px 20px rgba(5,150,105,0.35);">
                  Accéder à mon tableau de bord →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:24px 40px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 8px 0;">Une question ? Écrivez-nous à <a href="mailto:support@scogestia.com" style="color:#065F46;">support@scogestia.com</a></p>
              <p style="color:#cbd5e1;font-size:11px;margin:0;">© ${new Date().getFullYear()} Scogestia. Tous droits réservés.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
