/**
 * Email Notification Service
 * Phase 6: Email Notifications
 *
 * Handles sending email notifications using Resend
 */

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import type {
  EmailTemplateName,
  MentionEmailData,
  AssignmentEmailData,
  CriticalAlertEmailData,
  PatientUpdateEmailData,
  AIAlertEmailData,
} from '@/types/notification.types'

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM_EMAIL = process.env.EMAIL_FROM || 'ACIL <noreply@acil.app>'

/**
 * Email Service
 */
export class EmailService {
  /**
   * Send email using template
   */
  static async sendTemplateEmail(
    to: string,
    toName: string,
    subject: string,
    templateName: EmailTemplateName,
    templateData: Record<string, unknown>
  ): Promise<boolean> {
    if (!resend) {
      console.warn('[EmailService] Resend not configured, skipping email')
      return false
    }

    try {
      const htmlContent = this.renderTemplate(templateName, templateData)

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: `${toName} <${to}>`,
        subject: subject,
        html: htmlContent,
      })

      if (error) {
        console.error('[EmailService] Send email error:', error)
        return false
      }

      console.log('[EmailService] Email sent successfully:', data?.id)
      return true
    } catch (error) {
      console.error('[EmailService] sendTemplateEmail exception:', error)
      return false
    }
  }

  /**
   * Queue email for async sending
   */
  static async queueEmail(
    toEmail: string,
    toName: string,
    userId: string | null,
    subject: string,
    templateName: EmailTemplateName,
    templateData: Record<string, unknown>,
    scheduledFor?: Date
  ): Promise<boolean> {
    try {
      const supabase = await createClient()

      const { error } = await supabase.from('email_queue').insert({
        to_email: toEmail,
        to_name: toName,
        user_id: userId,
        subject: subject,
        template_name: templateName,
        template_data: templateData,
        status: 'pending',
        scheduled_for: scheduledFor?.toISOString() || new Date().toISOString(),
      })

      if (error) {
        console.error('[EmailService] Queue email error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('[EmailService] queueEmail exception:', error)
      return false
    }
  }

  /**
   * Send mention notification email
   */
  static async sendMentionEmail(data: MentionEmailData, to: string, toName: string): Promise<boolean> {
    return this.sendTemplateEmail(
      to,
      toName,
      `${data.mentioned_by_name} sizi etiketledi`,
      'mention',
      data as unknown as Record<string, unknown>
    )
  }

  /**
   * Send assignment notification email
   */
  static async sendAssignmentEmail(
    data: AssignmentEmailData,
    to: string,
    toName: string
  ): Promise<boolean> {
    return this.sendTemplateEmail(to, toName, `Yeni hasta atandı: ${data.patient_name}`, 'assignment', data as unknown as Record<string, unknown>)
  }

  /**
   * Send critical alert email
   */
  static async sendCriticalAlertEmail(
    data: CriticalAlertEmailData,
    to: string,
    toName: string
  ): Promise<boolean> {
    return this.sendTemplateEmail(to, toName, `🚨 Kritik Uyarı: ${data.patient_name}`, 'critical_alert', data as unknown as Record<string, unknown>)
  }

  /**
   * Send patient update email
   */
  static async sendPatientUpdateEmail(
    data: PatientUpdateEmailData,
    to: string,
    toName: string
  ): Promise<boolean> {
    return this.sendTemplateEmail(to, toName, `Hasta Güncellendi: ${data.patient_name}`, 'patient_update', data as unknown as Record<string, unknown>)
  }

  /**
   * Send AI alert email
   */
  static async sendAIAlertEmail(data: AIAlertEmailData, to: string, toName: string): Promise<boolean> {
    return this.sendTemplateEmail(to, toName, `AI Uyarısı: ${data.patient_name}`, 'ai_alert', data as unknown as Record<string, unknown>)
  }

  /**
   * Render email template
   */
  private static renderTemplate(templateName: EmailTemplateName, data: Record<string, unknown>): string {
    // Base email template
    const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ACIL Bildirimi</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 500; }
    .button:hover { background: #5568d3; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .badge { display: inline-block; background: #fee; color: #c00; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 ACIL</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Hasta Takip Sistemi</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Bu otomatik bir bildirimdir. Lütfen bu e-postayı yanıtlamayın.</p>
      <p style="margin-top: 10px;">&copy; 2025 ACIL. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>
`

    // Template-specific content
    switch (templateName) {
      case 'mention':
        const mentionData = data as unknown as MentionEmailData
        return baseTemplate(`
          <h2>💬 Etiketlendiniz</h2>
          <p><strong>${mentionData.mentioned_by_name}</strong> sizi bir notta etiketledi.</p>
          ${mentionData.patient_name ? `<p><strong>Hasta:</strong> ${mentionData.patient_name}</p>` : ''}
          <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #4b5563;">${mentionData.note_content}</p>
          </div>
          <a href="${mentionData.action_url}" class="button">Not'u Görüntüle →</a>
        `)

      case 'assignment':
        const assignmentData = data as unknown as AssignmentEmailData
        return baseTemplate(`
          <h2>👨‍⚕️ Yeni Hasta Atandı</h2>
          <p><strong>${assignmentData.assigned_by_name}</strong> size yeni bir hasta atadı.</p>
          <div style="background: #f9fafb; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0 0 10px;"><strong>Hasta:</strong> ${assignmentData.patient_name}</p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Hasta ID: ${assignmentData.patient_id}</p>
          </div>
          <a href="${assignmentData.action_url}" class="button">Hasta Sayfasına Git →</a>
        `)

      case 'critical_alert':
        const criticalData = data as unknown as CriticalAlertEmailData
        return baseTemplate(`
          <span class="badge">🚨 KRİTİK UYARI</span>
          <h2>${criticalData.alert_type}</h2>
          <p><strong>Hasta:</strong> ${criticalData.patient_name}</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-weight: 500;">${criticalData.alert_message}</p>
          </div>
          <a href="${criticalData.action_url}" class="button" style="background: #ef4444;">ACİL GÖRÜNTÜLE →</a>
          <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">Bu kritik bir uyarıdır. Lütfen derhal kontrol edin.</p>
        `)

      case 'patient_update':
        const updateData = data as unknown as PatientUpdateEmailData
        return baseTemplate(`
          <h2>📝 Hasta Güncellendi</h2>
          <p><strong>${updateData.patient_name}</strong> için ${updateData.update_type} güncellendi.</p>
          <p><strong>Güncelleyen:</strong> ${updateData.updated_by_name}</p>
          <a href="${updateData.action_url}" class="button">Detayları Görüntüle →</a>
        `)

      case 'ai_alert':
        const aiData = data as unknown as AIAlertEmailData
        return baseTemplate(`
          <h2>🤖 AI Uyarısı</h2>
          <span class="badge" style="background: #fef3c7; color: #92400e;">⚠️ ${aiData.alert_severity.toUpperCase()}</span>
          <p><strong>Hasta:</strong> ${aiData.patient_name}</p>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #78350f;">${aiData.alert_message}</p>
          </div>
          ${
            aiData.recommendations && aiData.recommendations.length > 0
              ? `
            <h3 style="font-size: 16px; margin-top: 20px;">Öneriler:</h3>
            <ul style="color: #4b5563;">
              ${aiData.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
            </ul>
          `
              : ''
          }
          <a href="${aiData.action_url}" class="button">Detaylı Analizi Görüntüle →</a>
        `)

      default:
        return baseTemplate(`
          <h2>Bildirim</h2>
          <p>Yeni bir bildiriminiz var.</p>
        `)
    }
  }
}
