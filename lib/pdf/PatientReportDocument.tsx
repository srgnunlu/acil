import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

// PDF stilleri
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
    color: '#374151',
  },
  value: {
    width: '70%',
    color: '#1f2937',
  },
  card: {
    backgroundColor: '#f9fafb',
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
    border: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1e40af',
  },
  cardContent: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
  },
  badge: {
    padding: '4 8',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeDischarged: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  badgeConsultation: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  aiSection: {
    backgroundColor: '#eff6ff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
    border: 1,
    borderColor: '#bfdbfe',
  },
  aiTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1e40af',
  },
  aiContent: {
    fontSize: 9,
    color: '#1e3a8a',
    lineHeight: 1.5,
  },
  list: {
    marginLeft: 10,
    marginBottom: 5,
  },
  listItem: {
    fontSize: 10,
    marginBottom: 3,
    color: '#374151',
  },
  summary: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 4,
    marginTop: 20,
    border: 1,
    borderColor: '#fde047',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400e',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#78350f',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#78350f',
  },
})

interface PatientReportData {
  patient: {
    name: string
    age: number
    gender: string
    status: string
    admission_date: string
  }
  data: {
    patient_data: any[]
    tests: any[]
    ai_analyses: any[]
    chat_history: any[]
  }
  summary: {
    total_data_entries: number
    total_tests: number
    total_ai_analyses: number
    total_chat_messages: number
  }
  generated_at: string
}

const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    active: 'Aktif',
    discharged: 'Taburcu',
    consultation: 'Konsültasyon',
  }
  return statusMap[status] || status
}

const getDataTypeText = (type: string) => {
  const typeMap: { [key: string]: string } = {
    anamnesis: 'Anamnez',
    vital_signs: 'Vital Bulgular',
    medications: 'İlaçlar',
    history: 'Geçmiş',
    demographics: 'Demografik Bilgiler',
  }
  return typeMap[type] || type
}

const getTestTypeText = (type: string) => {
  const typeMap: { [key: string]: string } = {
    laboratory: 'Laboratuvar',
    ekg: 'EKG',
    radiology: 'Radyoloji',
    consultation: 'Konsültasyon',
    other: 'Diğer',
  }
  return typeMap[type] || type
}

export const PatientReportDocument = ({ data }: { data: PatientReportData }) => {
  const { patient, data: patientData, summary, generated_at } = data

  return (
    <Document>
      {/* Sayfa 1: Genel Bilgiler */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>HASTA RAPORU</Text>
          <Text style={styles.subtitle}>
            Rapor Tarihi: {format(new Date(generated_at), 'dd MMMM yyyy, HH:mm', { locale: tr })}
          </Text>
        </View>

        {/* Hasta Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hasta Bilgileri</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Ad Soyad:</Text>
            <Text style={styles.value}>{patient.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Yaş:</Text>
            <Text style={styles.value}>{patient.age}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cinsiyet:</Text>
            <Text style={styles.value}>{patient.gender}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Durum:</Text>
            <Text style={styles.value}>{getStatusText(patient.status)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Başvuru Tarihi:</Text>
            <Text style={styles.value}>
              {format(new Date(patient.admission_date), 'dd MMMM yyyy, HH:mm', { locale: tr })}
            </Text>
          </View>
        </View>

        {/* Özet İstatistikler */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Özet İstatistikler</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Toplam Veri Girişi:</Text>
            <Text style={styles.summaryValue}>{summary.total_data_entries}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Toplam Test:</Text>
            <Text style={styles.summaryValue}>{summary.total_tests}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>AI Analizi:</Text>
            <Text style={styles.summaryValue}>{summary.total_ai_analyses}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Chat Mesajı:</Text>
            <Text style={styles.summaryValue}>{summary.total_chat_messages}</Text>
          </View>
        </View>

        {/* Hasta Verileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hasta Verileri</Text>
          {patientData.patient_data.length > 0 ? (
            patientData.patient_data.map((item: any, index: number) => (
              <View key={index} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {getDataTypeText(item.data_type)} - {format(new Date(item.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                </Text>
                <Text style={styles.cardContent}>{item.content}</Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>
              Henüz veri girişi yapılmamış.
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Bu rapor ACIL - AI Powered Medical Emergency System tarafından otomatik olarak oluşturulmuştur.</Text>
        </View>
      </Page>

      {/* Sayfa 2: Test Sonuçları */}
      {patientData.tests.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>TEST SONUÇLARI</Text>
            <Text style={styles.subtitle}>{patient.name}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Sonuçları ({patientData.tests.length})</Text>
            {patientData.tests.map((test: any, index: number) => (
              <View key={index} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {getTestTypeText(test.test_type)} - {test.test_name}
                </Text>
                <View style={{ marginTop: 5 }}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Tarih:</Text>
                    <Text style={styles.value}>
                      {format(new Date(test.created_at), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Sonuç:</Text>
                    <Text style={styles.value}>{test.result || '-'}</Text>
                  </View>
                  {test.notes && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Notlar:</Text>
                      <Text style={styles.value}>{test.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text>Sayfa 2 - Test Sonuçları</Text>
          </View>
        </Page>
      )}

      {/* Sayfa 3: AI Analizleri */}
      {patientData.ai_analyses.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>AI ANALİZLERİ</Text>
            <Text style={styles.subtitle}>{patient.name}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Analizleri ({patientData.ai_analyses.length})</Text>
            {patientData.ai_analyses.map((analysis: any, index: number) => {
              let analysisData
              try {
                analysisData = typeof analysis.analysis === 'string'
                  ? JSON.parse(analysis.analysis)
                  : analysis.analysis
              } catch {
                analysisData = null
              }

              return (
                <View key={index} style={styles.aiSection}>
                  <Text style={styles.cardTitle}>
                    Analiz #{index + 1} - {format(new Date(analysis.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                  </Text>

                  {analysisData && (
                    <View>
                      {analysisData.differential_diagnosis && (
                        <View style={{ marginBottom: 8 }}>
                          <Text style={styles.aiTitle}>Ayırıcı Tanı:</Text>
                          <View style={styles.list}>
                            {analysisData.differential_diagnosis.map((diag: any, i: number) => (
                              <Text key={i} style={styles.listItem}>
                                • {diag.diagnosis} ({diag.probability})
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}

                      {analysisData.red_flags && analysisData.red_flags.length > 0 && (
                        <View style={{ marginBottom: 8 }}>
                          <Text style={styles.aiTitle}>Kırmızı Bayraklar:</Text>
                          <View style={styles.list}>
                            {analysisData.red_flags.map((flag: string, i: number) => (
                              <Text key={i} style={styles.listItem}>⚠ {flag}</Text>
                            ))}
                          </View>
                        </View>
                      )}

                      {analysisData.recommended_tests && (
                        <View style={{ marginBottom: 8 }}>
                          <Text style={styles.aiTitle}>Önerilen Testler:</Text>
                          <View style={styles.list}>
                            {analysisData.recommended_tests.map((test: any, i: number) => (
                              <Text key={i} style={styles.listItem}>
                                • {test.test} - {test.reason}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )
            })}
          </View>

          <View style={styles.footer}>
            <Text>Sayfa 3 - AI Analizleri</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
