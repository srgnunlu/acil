// ============================================
// INVITATION EMAIL TEMPLATE
// ============================================
// HTML email template for workspace invitations

export interface InvitationEmailData {
  inviterName: string
  workspaceName: string
  role: string
  invitationUrl: string
  expiresInDays: number
  message?: string
}

export function generateInvitationEmailHTML(data: InvitationEmailData): string {
  const { inviterName, workspaceName, role, invitationUrl, expiresInDays, message } = data

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workspace Daveti</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">ACIL</h1>
              <p style="margin: 8px 0 0; color: #e0e7ff; font-size: 16px;">AI Destekli Hasta Takip Sistemi</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">
                Workspace Daveti
              </h2>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Merhaba,
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> sizi <strong>${workspaceName}</strong> workspace'ine <strong>${role}</strong> rolünde davet etti.
              </p>

              ${
                message
                  ? `
              <div style="margin: 20px 0; padding: 16px; background-color: #f9fafb; border-left: 4px solid #2563eb; border-radius: 4px;">
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; font-style: italic;">
                  "${message}"
                </p>
              </div>
              `
                  : ''
              }

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${invitationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Daveti Kabul Et
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Veya bu linki kopyalayıp tarayıcınıza yapıştırın:
              </p>
              <p style="margin: 8px 0 20px; color: #2563eb; font-size: 12px; word-break: break-all;">
                ${invitationUrl}
              </p>

              <div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                  ⏰ Bu davet ${expiresInDays} gün boyunca geçerlidir.
                </p>
              </div>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Eğer bu daveti beklemiyorsanız, bu e-postayı görmezden gelebilirsiniz.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} ACIL. Tüm hakları saklıdır.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                Bu otomatik bir e-postadır, lütfen yanıtlamayın.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function generateInvitationEmailText(data: InvitationEmailData): string {
  const { inviterName, workspaceName, role, invitationUrl, expiresInDays, message } = data

  return `
ACIL - Workspace Daveti

Merhaba,

${inviterName} sizi ${workspaceName} workspace'ine ${role} rolünde davet etti.

${message ? `Mesaj: "${message}"\n` : ''}

Daveti kabul etmek için: ${invitationUrl}

Bu davet ${expiresInDays} gün boyunca geçerlidir.

Eğer bu daveti beklemiyorsanız, bu e-postayı görmezden gelebilirsiniz.

© ${new Date().getFullYear()} ACIL. Tüm hakları saklıdır.
  `.trim()
}
