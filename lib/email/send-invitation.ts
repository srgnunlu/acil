// ============================================
// SEND INVITATION EMAIL
// ============================================
// Email service integration for workspace invitations

import {
  generateInvitationEmailHTML,
  generateInvitationEmailText,
} from './templates/invitation-email'
import type { InvitationEmailData } from './templates/invitation-email'

export interface EmailServiceConfig {
  provider: 'resend' | 'sendgrid' | 'supabase' | 'console'
  apiKey?: string
  fromEmail?: string
  fromName?: string
}

/**
 * Send invitation email using configured email service
 */
export async function sendInvitationEmail(
  to: string,
  data: InvitationEmailData,
  config?: EmailServiceConfig
): Promise<{ success: boolean; error?: string }> {
  const emailConfig: EmailServiceConfig = {
    provider: (process.env.EMAIL_PROVIDER as EmailServiceConfig['provider']) || 'console',
    apiKey: process.env.EMAIL_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'noreply@acil.app',
    fromName: process.env.EMAIL_FROM_NAME || 'ACIL',
    ...config,
  }

  const htmlContent = generateInvitationEmailHTML(data)
  const textContent = generateInvitationEmailText(data)

  try {
    switch (emailConfig.provider) {
      case 'resend':
        return await sendViaResend(to, data, htmlContent, textContent, emailConfig)
      case 'sendgrid':
        return await sendViaSendGrid(to, data, htmlContent, textContent, emailConfig)
      case 'supabase':
        return await sendViaSupabase(to, data, htmlContent, textContent, emailConfig)
      case 'console':
      default:
        // Development mode: log to console
        console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 INVITATION EMAIL (Development Mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: ${to}
From: ${emailConfig.fromName} <${emailConfig.fromEmail}>
Subject: ${data.workspaceName} workspace'ine davet edildiniz

${textContent}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `)
        return { success: true }
    }
  } catch (error) {
    console.error('Error sending invitation email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send email via Resend (resend.com)
 */
async function sendViaResend(
  to: string,
  data: InvitationEmailData,
  html: string,
  text: string,
  config: EmailServiceConfig
): Promise<{ success: boolean; error?: string }> {
  if (!config.apiKey) {
    throw new Error('RESEND_API_KEY is required for Resend provider')
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: [to],
        subject: `${data.workspaceName} workspace'ine davet edildiniz`,
        html,
        text,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send email via Resend')
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Resend API error',
    }
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(
  to: string,
  data: InvitationEmailData,
  html: string,
  text: string,
  config: EmailServiceConfig
): Promise<{ success: boolean; error?: string }> {
  if (!config.apiKey) {
    throw new Error('SENDGRID_API_KEY is required for SendGrid provider')
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject: `${data.workspaceName} workspace'ine davet edildiniz`,
          },
        ],
        from: {
          email: config.fromEmail,
          name: config.fromName,
        },
        content: [
          {
            type: 'text/plain',
            value: text,
          },
          {
            type: 'text/html',
            value: html,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || 'Failed to send email via SendGrid')
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SendGrid API error',
    }
  }
}

/**
 * Send email via Supabase (if configured)
 */
async function sendViaSupabase(
  to: string,
  data: InvitationEmailData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  html: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config: EmailServiceConfig
): Promise<{ success: boolean; error?: string }> {
  // Supabase email gönderimi için Edge Function veya başka bir yöntem kullanılabilir
  // Şimdilik console'a log atıyoruz
  console.log('Supabase email sending not yet implemented')
  console.log('To:', to)
  console.log('Subject:', `${data.workspaceName} workspace'ine davet edildiniz`)
  return { success: true }
}
