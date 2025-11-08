import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '@/lib/config/env'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

export async function analyzeImage(
  imageBase64: string,
  analysisType: 'ekg' | 'skin_lesion' | 'xray' | 'lab_results' | 'other',
  additionalContext?: string
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompts = {
    lab_results: `Sen deneyimli bir klinisyen yapay zeka asistanısın. Bu laboratuvar sonucu görselini/PDF'ini analiz et ve TÜM laboratuvar değerlerini çıkar.

ÖNEMLİ KURALLAR:
1. Görseldeki/PDF'teki TÜM test değerlerini dikkatle oku ve çıkar
2. Test adlarını standart İngilizce field adlarına dönüştür:
   - Hemoglobin/Hb/HGB → "hemoglobin"
   - Lökosit/WBC/Beyaz Küre → "wbc"
   - Trombosit/PLT/Platelet → "platelet"
   - Glukoz/Glucose/Kan Şekeri → "glucose"
   - Kreatinin/Creatinine/Kre → "creatinine"
   - Sodyum/Sodium/Na → "sodium"
   - Potasyum/Potassium/K → "potassium"
   - ALT/SGPT → "alt"
   - AST/SGOT → "ast"
   - D-Dimer/DDimer → "d_dimer"
   - CRP/C-Reaktif Protein → "crp"
   - Troponin → "troponin"
3. Değerleri sayısal olarak çıkar, birimleri atla (sadece sayı)
4. Eğer bir değer aralık olarak verilmişse (örn: "4.5-5.2"), ortalamasını al
5. Referans aralıklarını göz ardı et, sadece hasta değerlerini al
6. ALINAN GÖRSELDE AÇIKÇA GÖRÜLEN TARİH DEĞERLERİNİ ÇIKAR - ECHİ eklemE
7. Yukarıdaki standart testlere uymayan diğer tüm testleri orijinal adlarıyla "values" objesine ekle
   (örn: "TSH": 2.5, "T4": 1.2, "Vitamin D": 25.3, "HbA1c": 5.8)
8. Her test için sayısal değer varsa sayı olarak, yoksa metin olarak kaydet
9. ÖNEMLI: "detected_tests" alanında sadece görselde AÇIKÇA GÖRÜNEN test adlarını listele - şüphelik/tahmin edilen testler ekleme

YANIT FORMATI (JSON) - SADECE JSON DÖNDÜR, AÇIKLAMA YAZMA:
{
  "values": {
    "hemoglobin": sayısal_değer,
    "wbc": sayısal_değer,
    "platelet": sayısal_değer,
    "glucose": sayısal_değer,
    "creatinine": sayısal_değer,
    "sodium": sayısal_değer,
    "potassium": sayısal_değer,
    "alt": sayısal_değer,
    "ast": sayısal_değer,
    "d_dimer": sayısal_değer,
    "crp": sayısal_değer,
    "troponin": "text veya sayısal değer",
    "test_adı_1": değer,
    "test_adı_2": değer,
    "test_adı_n": değer
  },
  "detected_tests": ["Görselde AÇIKÇA görünen tüm test adları (Türkçe orijinal isimler)"],
  "confidence": "high/medium/low"
}

NOT:
- Görselde olmayan STANDART testler için alan ekleme (null kullanma)
- Sadece görselde/PDF'te AÇIKÇA görünen değerleri çıkar
- Standart olmayan testleri mutlaka ekle (TSH, T3, T4, Vitamin D, HbA1c, LDH, Üre, BUN, vb.)
- test_date, notes veya yorum ekleme YOK - YASAKLANMIŞ`,

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
  const contextAddition = additionalContext ? `\n\nEK KLINIK BAĞLAM:\n${additionalContext}` : ''

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
    let text = response.text()

    // JSON formatında dönen yanıtı parse et
    try {
      // Markdown code blocks'u temizle (```json ... ``` veya ``` ... ```)
      text = text
        .replace(/```json?\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim()

      const parsed = JSON.parse(text)
      return parsed
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.log('Raw text:', text)
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
