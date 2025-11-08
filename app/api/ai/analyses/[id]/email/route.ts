import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { email, message } = await request.json()

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'E-posta adresi gerekli' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulaması gerekli' },
        { status: 401 }
      )
    }

    // Get the analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('id', id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analiz bulunamadı' },
        { status: 404 }
      )
    }

    // Format the analysis for email
    const emailContent = formatAnalysisForEmail(analysis, message)

    // In a production environment, you would integrate with an email service like:
    // - Resend
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP

    // For now, we'll return the formatted content that could be sent
    // You can integrate with your preferred email service

    // Example with Resend (commented out - requires setup):
    /*
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: email,
      subject: 'AI Hasta Analizi',
      html: emailContent,
    });
    */

    // For demonstration, we'll simulate success
    // In production, remove this and use actual email sending above
    console.log('Email would be sent to:', email)
    console.log('Content:', emailContent)

    return NextResponse.json({
      success: true,
      message: 'E-posta gönderildi (demo mode)',
      preview: emailContent,
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'E-posta gönderilirken hata oluştu' },
      { status: 500 }
    )
  }
}

function formatAnalysisForEmail(analysis: any, userMessage?: string): string {
  const response = analysis.ai_response

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #4f46e5; margin-top: 30px; }
    .section { background: #f9fafb; padding: 15px; margin: 15px 0; border-left: 4px solid #2563eb; border-radius: 4px; }
    .red-flag { background: #fef2f2; border-left-color: #ef4444; }
    .diagnosis { background: #f5f3ff; border-left-color: #8b5cf6; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <h1>🏥 AI Destekli Hasta Analizi</h1>

  <p><strong>Analiz Tipi:</strong> ${analysis.analysis_type === 'initial' ? 'İlk Değerlendirme' : 'Güncellenmiş Analiz'}</p>
  <p><strong>Tarih:</strong> ${new Date(analysis.created_at).toLocaleString('tr-TR')}</p>

  ${userMessage ? `<div class="section"><p><strong>Mesaj:</strong> ${userMessage}</p></div>` : ''}
`

  if (response.summary) {
    html += `
  <div class="section">
    <h2>📝 Özet</h2>
    <p>${response.summary}</p>
  </div>
`
  }

  if (response.differential_diagnosis) {
    html += `
  <div class="section diagnosis">
    <h2>🎯 Ayırıcı Tanılar</h2>
    <ol>
      ${response.differential_diagnosis.map((d: string) => `<li>${d}</li>`).join('')}
    </ol>
  </div>
`
  }

  if (response.red_flags && response.red_flags.length > 0) {
    html += `
  <div class="section red-flag">
    <h2>⚠️ Kritik Bulgular</h2>
    <ul>
      ${response.red_flags.map((flag: string) => `<li><strong>${flag}</strong></li>`).join('')}
    </ul>
  </div>
`
  }

  if (response.recommended_tests) {
    html += `
  <div class="section">
    <h2>🔬 Önerilen Tetkikler</h2>
    <ul>
      ${response.recommended_tests
        .map(
          (test: any) =>
            `<li><strong>${test.test}</strong> (${test.priority === 'urgent' ? 'Acil' : test.priority === 'high' ? 'Yüksek' : 'Rutin'})
          ${test.rationale ? `<br><small>${test.rationale}</small>` : ''}</li>`
        )
        .join('')}
    </ul>
  </div>
`
  }

  if (response.treatment_algorithm) {
    html += `<div class="section"><h2>💊 Tedavi Algoritması</h2>`

    if (response.treatment_algorithm.immediate) {
      html += `
    <h3>🚨 Acil Müdahale</h3>
    <ul>
      ${response.treatment_algorithm.immediate.map((item: string) => `<li>${item}</li>`).join('')}
    </ul>
`
    }

    if (response.treatment_algorithm.monitoring) {
      html += `
    <h3>📊 İzlem Parametreleri</h3>
    <ul>
      ${response.treatment_algorithm.monitoring.map((item: string) => `<li>${item}</li>`).join('')}
    </ul>
`
    }

    if (response.treatment_algorithm.medications) {
      html += `
    <h3>💉 İlaç Önerileri</h3>
    <ul>
      ${response.treatment_algorithm.medications
        .map((item: any) =>
          typeof item === 'string' ? `<li>${item}</li>` : `<li>${item.name} ${item.dose} - ${item.frequency}</li>`
        )
        .join('')}
    </ul>
`
    }

    html += `</div>`
  }

  if (response.consultation && response.consultation.required) {
    html += `
  <div class="section">
    <h2>👨‍⚕️ Konsültasyon Önerisi</h2>
    <p><strong>${response.consultation.urgency === 'urgent' ? '⚡ ACİL' : '📋 Önerilen'}</strong></p>
    ${
      response.consultation.departments
        ? `<p><strong>Bölümler:</strong> ${response.consultation.departments.join(', ')}</p>`
        : ''
    }
    ${response.consultation.reason ? `<p><strong>Neden:</strong> ${response.consultation.reason}</p>` : ''}
  </div>
`
  }

  if (response.disposition) {
    html += `
  <div class="section">
    <h2>🏥 Hasta Yönlendirme</h2>
    <p><strong>Öneri:</strong> ${
      response.disposition.recommendation === 'hospitalize'
        ? '🏥 Yatış'
        : response.disposition.recommendation === 'observe'
          ? '👁️ Gözlem'
          : '🏠 Taburcu'
    }</p>
    ${response.disposition.criteria ? `<p>${response.disposition.criteria}</p>` : ''}
  </div>
`
  }

  if (response.references) {
    html += `
  <div class="section">
    <h2>📚 Akademik Kaynaklar</h2>
    <ul>
      ${response.references
        .map(
          (ref: any) =>
            `<li><strong>${ref.title}</strong><br><small>${ref.source}${ref.year ? ` (${ref.year})` : ''}</small>
        ${ref.key_point ? `<br><small><em>${ref.key_point}</em></small>` : ''}</li>`
        )
        .join('')}
    </ul>
  </div>
`
  }

  html += `
  <div class="footer">
    <p>Bu analiz AI destekli bir araç tarafından oluşturulmuştur ve yalnızca bilgilendirme amaçlıdır.</p>
    <p>Kesin tanı ve tedavi için mutlaka bir sağlık profesyoneli ile görüşünüz.</p>
  </div>
</body>
</html>
`

  return html
}
