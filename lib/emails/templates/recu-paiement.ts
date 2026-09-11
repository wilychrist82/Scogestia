/**
 * Template HTML : Reçu de paiement d'abonnement Scogestia
 */
export function recuPaiementEmailHtml({
  adminName,
  schoolName,
  planName,
  amount,
  currency = 'FCFA',
  paymentDate,
  nextRenewalDate,
  invoiceNumber,
  dashboardUrl = 'https://app.scogestia.com/admin/abonnement',
}: {
  adminName: string
  schoolName: string
  planName: string
  amount: number
  currency?: string
  paymentDate: string
  nextRenewalDate: string
  invoiceNumber: string
  dashboardUrl?: string
}) {
  const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount)

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reçu de paiement — Scogestia</title>
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
                <span style="color:#34d399;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">✓ Paiement confirmé</span>
              </div>
              <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 4px 0;">Scogestia</h1>
              <p style="color:#94a3b8;font-size:13px;margin:0;">Reçu de paiement · N° ${invoiceNumber}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <p style="color:#0b1c30;font-size:16px;font-weight:700;margin:0 0 4px 0;">Bonjour ${adminName},</p>
              <p style="color:#3f4944;font-size:14px;line-height:1.7;margin:0 0 28px 0;">
                Nous confirmons la réception de votre paiement pour l'abonnement de <strong style="color:#065F46;">${schoolName}</strong>.
              </p>

              <!-- Invoice Summary -->
              <div style="background:#f8f9ff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:28px;">
                <div style="background:linear-gradient(135deg,#D1FAE5,#A7F3D0);padding:16px 20px;border-bottom:1px solid #6EE7B7;">
                  <p style="color:#065F46;font-size:13px;font-weight:700;margin:0;text-transform:uppercase;letter-spacing:0.05em;">Détails du paiement</p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="padding:0;">
                  ${[
                    ['Plan souscrit', planName],
                    ['Montant payé', `${formattedAmount} ${currency}`],
                    ['Date de paiement', paymentDate],
                    ['Prochain renouvellement', nextRenewalDate],
                    ['N° de reçu', invoiceNumber],
                  ].map(([label, value], i) => `
                  <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8f9ff'};">
                    <td style="padding:12px 20px;color:#6b7280;font-size:13px;width:50%;">${label}</td>
                    <td style="padding:12px 20px;color:#0b1c30;font-size:13px;font-weight:600;text-align:right;">${value}</td>
                  </tr>`).join('')}
                </table>
              </div>

              <!-- Total Highlight -->
              <div style="background:linear-gradient(135deg,#059669,#065F46);border-radius:12px;padding:20px 24px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;">
                <span style="color:rgba(255,255,255,0.8);font-size:13px;font-weight:600;">Total payé</span>
                <span style="color:#ffffff;font-size:22px;font-weight:900;">${formattedAmount} ${currency}</span>
              </div>

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${dashboardUrl}" style="display:inline-block;background:#0b0f19;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:100px;border:1px solid rgba(255,255,255,0.1);">
                  Voir mon abonnement →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:24px 40px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 6px 0;">
                Conservez cet email comme preuve de paiement.
              </p>
              <p style="color:#94a3b8;font-size:12px;margin:0 0 8px 0;">
                Problème ? <a href="mailto:support@scogestia.com" style="color:#065F46;">support@scogestia.com</a>
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
