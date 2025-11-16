import OpenAI from 'openai'
import { env } from '@/lib/config/env'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

import type {
  Demographics,
  Anamnesis,
  Medication,
  VitalSigns,
  MedicalHistory,
  AIAnalysisResponse,
} from '@/types'

export interface PatientContext {
  demographics?: Demographics
  anamnesis?: Anamnesis
  medications?: Medication[]
  vitalSigns?: VitalSigns
  history?: MedicalHistory
  tests?: Array<{
    type: string
    results: Record<string, unknown>
    date: string
  }>
  previousAnalyses?: Array<{
    type: string
    response: AIAnalysisResponse
    date: string
  }>
  calculatorResults?: Array<{
    type: string
    score: number | null
    interpretation: string | null
    riskCategory: string | null
    recommendations: string | null
    inputData: Record<string, unknown>
    date: string
  }>
}

export async function analyzePatient(
  patientContext: PatientContext,
  analysisType: 'initial' | 'updated' = 'initial'
) {
  const systemPrompt = `Sen deneyimli bir acil tıp uzmanı yapay zeka asistanısın. Görevin, acil servisteki hastalar için kanıta dayalı tıbbi analiz ve öneriler sunmak.

ÖNEMLİ PRENSİPLER:
- Sadece güvenilir, akademik kaynaklara dayalı önerilerde bulun
- Öneri ve tanılarını açıklarken mutlaka referanslar ver
- Kesin tanı koyma, sadece ön tanılar ve ayırıcı tanılar öner
- Risk değerlendirmesi yap
- Acil serviste pratik uygulanabilir önerilerde bulun
- Hasta güvenliğini her zaman önceliklendir
- Red flag bulguları vurgula

YANIT FORMATI (JSON):
{
  "summary": "Hastanın genel durumu hakkında özet",
  "differential_diagnosis": ["Olası tanı 1", "Olası tanı 2", ...],
  "red_flags": ["Dikkat edilmesi gereken kritik bulgular"],
  "recommended_tests": [
    {
      "test": "Test adı",
      "priority": "urgent/high/routine",
      "rationale": "Neden gerekli"
    }
  ],
  "treatment_algorithm": {
    "immediate": ["Hemen yapılması gerekenler"],
    "monitoring": ["İzlenmesi gereken parametreler"],
    "medications": ["Önerilen ilaçlar ve dozlar"]
  },
  "consultation": {
    "required": true/false,
    "departments": ["Konsülte edilmesi gereken bölümler"],
    "urgency": "urgent/routine",
    "reason": "Konsültasyon nedeni"
  },
  "disposition": {
    "recommendation": "hospitalize/observe/discharge",
    "criteria": "Karar kriterleri"
  },
  "references": [
    {
      "title": "Kaynak başlığı",
      "source": "Dergi/Kılavuz adı",
      "year": "Yıl",
      "key_point": "İlgili önemli nokta"
    }
  ]
}`

  const userPrompt = `
${analysisType === 'initial' ? 'YENİ HASTA DEĞERLENDİRMESİ' : 'HASTA TAKİP GÜNCELLEMESİ'}

${patientContext.demographics ? `DEMOGRAFİK BİLGİLER:\n${JSON.stringify(patientContext.demographics, null, 2)}\n` : ''}
${patientContext.anamnesis ? `ANAMNEZ:\n${JSON.stringify(patientContext.anamnesis, null, 2)}\n` : ''}
${patientContext.medications ? `KULLANDIĞI İLAÇLAR:\n${JSON.stringify(patientContext.medications, null, 2)}\n` : ''}
${patientContext.vitalSigns ? `VİTAL BULGULAR:\n${JSON.stringify(patientContext.vitalSigns, null, 2)}\n` : ''}
${patientContext.history ? `ÖZGEÇMİŞ:\n${JSON.stringify(patientContext.history, null, 2)}\n` : ''}
${patientContext.tests && patientContext.tests.length > 0 ? `TETKİK SONUÇLARI:\n${JSON.stringify(patientContext.tests, null, 2)}\n` : ''}
${patientContext.calculatorResults && patientContext.calculatorResults.length > 0 ? `KLİNİK KALKÜLATÖR SONUÇLARI:\n${JSON.stringify(patientContext.calculatorResults, null, 2)}\n` : ''}
${patientContext.previousAnalyses && patientContext.previousAnalyses.length > 0 ? `ÖNCEKİ DEĞERLENDİRMELER:\n${JSON.stringify(patientContext.previousAnalyses, null, 2)}\n` : ''}

Yukarıdaki hasta bilgilerini değerlendirerek, kanıta dayalı ve akademik kaynaklarla desteklenmiş bir analiz sun.
${analysisType === 'updated' ? 'Özellikle yeni eklenen verilere göre önceki değerlendirmeni güncelle ve daralt.' : ''}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw error
  }
}

export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  patientContext: PatientContext
) {
  const systemPrompt = `Sen bir acil tıp uzmanı yapay zeka asistanısın. Şu anda belirli bir hasta hakkında konuşuyorsun.

HASTA BAĞLAMI:
${JSON.stringify(patientContext, null, 2)}

KURALLAR:
- Sadece bu hastayla ilgili sorulara cevap ver
- Konu dışı sorulara nazikçe yönlendirme yap
- Kanıta dayalı bilgi ver
- Gerekirse akademik kaynaklar referansla
- Net ve anlaşılır ol
- Hasta güvenliğini önceliklendir`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.5,
    })

    return response.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('OpenAI chat error:', error)
    throw error
  }
}

export async function streamChatWithAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  patientContext: PatientContext
) {
  const systemPrompt = `Sen bir acil tıp uzmanı yapay zeka asistanısın. Şu anda belirli bir hasta hakkında konuşuyorsun.

HASTA BAĞLAMI:
${JSON.stringify(patientContext, null, 2)}

KURALLAR:
- Sadece bu hastayla ilgili sorulara cevap ver
- Konu dışı sorulara nazikçe yönlendirme yap
- Kanıta dayalı bilgi ver
- Gerekirse akademik kaynaklar referansla
- Net ve anlaşılır ol
- Hasta güvenliğini önceliklendir`

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.5,
      stream: true,
    })

    return stream
  } catch (error) {
    console.error('OpenAI streaming error:', error)
    throw error
  }
}
