import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '@/lib/config/env'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

export async function analyzeImage(
  imageBase64: string,
  analysisType: 'ekg' | 'skin_lesion' | 'xray' | 'other',
  additionalContext?: string
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompts = {
    ekg: `Sen deneyimli bir kardiyolog yapay zeka asistanısın. Bu EKG görselini detaylı analiz et.

DEĞERLENDIR:
- Ritim (sinüs ritmi, AF, diğer aritmiler)
- Kalp hızı
- PR aralığı
- QRS süresi ve morfolojisi
- QT/QTc intervali
- ST segment değişiklikleri
- T dalga morfolojisi
- Patolojik Q dalgaları
- Aksiyel sapma
- Hipertrofi bulguları

YANIT FORMATI (JSON):
{
  "interpretation": {
    "rhythm": "Ritim değerlendirmesi",
    "rate": "Kalp hızı",
    "intervals": "PR, QRS, QT değerlendirmesi",
    "axis": "Aks değerlendirmesi",
    "findings": ["Önemli bulgular listesi"]
  },
  "clinical_significance": "Klinik önemi",
  "urgent_findings": ["Acil müdahale gerektiren bulgular"],
  "differential_diagnosis": ["Olası tanılar"],
  "recommendations": ["Öneriler"],
  "confidence": "high/medium/low"
}`,

    skin_lesion: `Sen deneyimli bir dermatolog yapay zeka asistanısın. Bu cilt lezyonunu analiz et.

ABCDE KRİTERLERİ:
- Asimetri
- Border (sınırlar)
- Color (renk)
- Diameter (çap)
- Evolution (değişim - eğer öyküde varsa)

DEĞERLENDIR:
- Lezyon tipi
- Lokalizasyon
- Boyut
- Renk özellikleri
- Sınır düzensizliği
- Alarm bulguları

YANIT FORMATI (JSON):
{
  "description": "Lezyon tanımı",
  "abcde_score": {
    "asymmetry": "Değerlendirme",
    "border": "Değerlendirme",
    "color": "Değerlendirme",
    "diameter": "Değerlendirme"
  },
  "differential_diagnosis": ["Olası tanılar"],
  "malignancy_risk": "low/medium/high",
  "urgent_evaluation_needed": true/false,
  "recommendations": ["Öneriler"],
  "confidence": "high/medium/low"
}`,

    xray: `Sen deneyimli bir radyolog yapay zeka asistanısın. Bu radyoloji görselini sistematik olarak değerlendir.

SİSTEMATİK DEĞERLENDİRME:
- Görüntü kalitesi ve teknik yeterlilik
- Anatomi ve normal yapılar
- Patolojik bulgular
- Karşılaştırmalı değerlendirme (eğer önceki görüntü varsa)

YANIT FORMATI (JSON):
{
  "image_type": "Görüntü tipi",
  "technique": "Teknik yeterlilik",
  "systematic_review": {
    "airways": "Değerlendirme",
    "bones": "Değerlendirme",
    "cardiac": "Değerlendirme",
    "diaphragm": "Değerlendirme",
    "edges": "Değerlendirme",
    "fields": "Değerlendirme"
  },
  "findings": ["Bulgular listesi"],
  "impression": "Genel izlenim",
  "recommendations": ["Öneriler"],
  "confidence": "high/medium/low"
}`,

    other: `Sen deneyimli bir klinisyen yapay zeka asistanısın. Bu tıbbi görseli analiz et ve klinik olarak değerlendir.

YANIT FORMATI (JSON):
{
  "description": "Görsel tanımı",
  "findings": ["Gözlemlenen bulgular"],
  "clinical_significance": "Klinik önemi",
  "differential_diagnosis": ["Olası tanılar"],
  "recommendations": ["Öneriler"],
  "confidence": "high/medium/low"
}`,
  }

  const prompt = prompts[analysisType]
  const contextAddition = additionalContext
    ? `\n\nEK KLINIK BAĞLAM:\n${additionalContext}`
    : ''

  try {
    // Base64 string'den data URL prefix'ini kaldır
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const result = await model.generateContent([
      prompt + contextAddition,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      },
    ])

    const response = await result.response
    const text = response.text()

    // JSON formatında dönen yanıtı parse et
    try {
      return JSON.parse(text)
    } catch {
      // Eğer JSON parse edilemezse, text olarak dön
      return { raw_analysis: text, confidence: 'medium' }
    }
  } catch (error) {
    console.error('Gemini Vision API error:', error)
    throw error
  }
}

export async function compareImages(
  image1Base64: string,
  image2Base64: string,
  comparisonType: 'ekg' | 'xray' | 'other',
  context?: string
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompts = {
    ekg: `İki EKG görselini karşılaştır ve aralarındaki farkları değerlendir.

KARŞILAŞTIR:
- Ritim değişiklikleri
- ST-T değişiklikleri
- QRS morfolojisi değişiklikleri
- Interval değişiklikleri
- Yeni gelişen bulgular

YANIT FORMATI (JSON):
{
  "temporal_relationship": "Görüntüler arası süre bilgisi varsa",
  "changes": {
    "improved": ["İyileşen bulgular"],
    "worsened": ["Kötüleşen bulgular"],
    "new_findings": ["Yeni bulgular"],
    "resolved": ["Düzelen bulgular"]
  },
  "clinical_significance": "Değişikliklerin klinik önemi",
  "recommendations": ["Öneriler"]
}`,

    xray: `İki radyoloji görselini karşılaştır.

YANIT FORMATI (JSON):
{
  "interval_changes": ["Bulgulardaki değişiklikler"],
  "progression": "stable/improved/worsened",
  "new_findings": ["Yeni gelişen bulgular"],
  "recommendations": ["Öneriler"]
}`,

    other: `İki tıbbi görseli karşılaştır ve değişiklikleri değerlendir.

YANIT FORMATI (JSON):
{
  "comparison": "Genel karşılaştırma",
  "changes": ["Gözlemlenen değişiklikler"],
  "clinical_significance": "Klinik önemi",
  "recommendations": ["Öneriler"]
}`,
  }

  const prompt = prompts[comparisonType]
  const contextAddition = context ? `\n\nKLİNİK BAĞLAM:\n${context}` : ''

  try {
    const base64Data1 = image1Base64.replace(/^data:image\/\w+;base64,/, '')
    const base64Data2 = image2Base64.replace(/^data:image\/\w+;base64,/, '')

    const result = await model.generateContent([
      'İLK GÖRÜNTÜ:',
      {
        inlineData: {
          data: base64Data1,
          mimeType: 'image/jpeg',
        },
      },
      'İKİNCİ GÖRÜNTÜ:',
      {
        inlineData: {
          data: base64Data2,
          mimeType: 'image/jpeg',
        },
      },
      prompt + contextAddition,
    ])

    const response = await result.response
    const text = response.text()

    try {
      return JSON.parse(text)
    } catch {
      return { raw_comparison: text }
    }
  } catch (error) {
    console.error('Gemini comparison error:', error)
    throw error
  }
}
