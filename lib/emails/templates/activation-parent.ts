/**
 * Template HTML : Email d'activation envoyé au parent
 * Contient le lien/code pour activer son compte
 */
export function activationParentEmailHtml({
  parentName,
  studentName,
  schoolName,
  activationCode,
  activationUrl,
}: {
  parentName: string
  studentName: string
  schoolName: string
  activationCode: string
  activationUrl: string
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Activez votre compte Scogestia</title>
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
                <span style="color:#34d399;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">Invitation Parent</span>
              </div>
              <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 4px 0;">Scogestia</h1>
              <p style="color:#94a3b8;font-size:13px;margin:0;">La gestion scolaire réinventée</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <p style="color:#0b1c30;font-size:17px;font-weight:700;margin:0 0 8px 0;">Bonjour ${parentName} 👋</p>
              <p style="color:#3f4944;font-size:14px;line-height:1.7;margin:0 0 24px 0;">
                L'école <strong style="color:#065F46;">${schoolName}</strong> vous invite à accéder au suivi scolaire de 
                <strong>${studentName}</strong> sur Scogestia.<br/>
                Activez votre compte pour consulter les notes, absences et paiements en temps réel.
              </p>

              <!-- Code block -->
              <div style="background:#f8f9ff;border:2px dashed #bec9c2;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px 0;">Votre code d'activation</p>
                <p style="color:#0b1c30;font-size:36px;font-weight:900;letter-spacing:0.2em;margin:0;font-variant-numeric:tabular-nums;">${activationCode}</p>
                <p style="color:#94a3b8;font-size:11px;margin:8px 0 0 0;">Ce code est valable 72 heures</p>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${activationUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#065F46);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;box-shadow:0 4px 20px rgba(5,150,105,0.35);">
                  Activer mon compte →
                </a>
              </div>

              <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
                Ou copiez ce lien dans votre navigateur :<br/>
                <a href="${activationUrl}" style="color:#065F46;word-break:break-all;">${activationUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:24px 40px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 6px 0;">
                Si vous n'attendiez pas cet email, ignorez-le simplement.
              </p>
              <p style="color:#94a3b8;font-size:12px;margin:0 0 8px 0;">
                Besoin d'aide ? <a href="mailto:support@scogestia.com" style="color:#065F46;">support@scogestia.com</a>
              </p>
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
