/**
 * AI-Generated Handoff API Route
 * POST /api/handoffs/generate - Generate handoff using AI
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import OpenAI from 'openai'
import type { GenerateHandoffPayload, AIGeneratedHandoffContent } from '@/types/handoff.types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// =====================================================
// POST /api/handoffs/generate - Generate handoff using AI
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body: GenerateHandoffPayload = await request.json()

    const {
      workspace_id,
      from_user_id,
      to_user_id,
      shift_id,
      template_id,
      patient_ids,
      // include_pending_tasks = true, // Reserved for future use
      // include_critical_alerts = true, // Reserved for future use
      // include_recent_changes = true, // Reserved for future use
    } = body

    if (!workspace_id || !from_user_id || !to_user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. Check workspace access
    // Organization'a üye olan kullanıcılar workspace'leri görebilir
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('organization_id')
      .eq('id', workspace_id)
      .is('deleted_at', null)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user is a member of the workspace's organization
    const { data: orgMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', workspace.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Also check workspace_members for backward compatibility
    const { data: workspaceMembership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!orgMembership && !workspaceMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Fetch patients data - basic info first
    let patientsQuery = supabase
      .from('patients')
      .select(
        'id, name, age, gender, admission_date, workflow_state, assigned_to, category:patient_categories(id, name, color)'
      )
      .eq('workspace_id', workspace_id)
      .is('deleted_at', null)
      .is('discharge_date', null) // Only active patients

    // Filter by specific patients if provided
    if (patient_ids && patient_ids.length > 0) {
      patientsQuery = patientsQuery.in('id', patient_ids)
    }

    // Order by category priority and admission date
    patientsQuery = patientsQuery.order('created_at', { ascending: false }).limit(50)

    const { data: patients, error: patientsError } = await patientsQuery

    if (patientsError) {
      logger.error({ error: patientsError }, 'Failed to fetch patients')
      return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
    }

    if (!patients || patients.length === 0) {
      return NextResponse.json({ error: 'No active patients found' }, { status: 404 })
    }

    // 4.1. Fetch detailed data for each patient in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patientIds = patients.map((p: any) => p.id)

    // Fetch all data with error handling
    const [
      patientDataResult,
      testsResult,
      analysesResult,
      tasksResult,
      stickyNotesResult,
      assignmentsResult,
      calculatorResultsResult,
    ] = await Promise.allSettled([
      // Patient data (anamnesis, medications, vital_signs, history, demographics)
      supabase
        .from('patient_data')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false }),

      // Test results
      supabase
        .from('patient_tests')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false }),

      // AI analyses (last 3 per patient)
      supabase
        .from('ai_analyses')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false }),

      // Tasks
      supabase
        .from('tasks')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false }),

      // Sticky notes
      supabase
        .from('sticky_notes')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false }),

      // Patient assignments
      supabase
        .from('patient_assignments')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false }),

      // Calculator results
      supabase
        .from('clinical_calculator_results')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    // Extract data from results, handling errors gracefully
    const allPatientData =
      patientDataResult.status === 'fulfilled' ? patientDataResult.value.data : null
    const allTests = testsResult.status === 'fulfilled' ? testsResult.value.data : null
    const allAnalyses = analysesResult.status === 'fulfilled' ? analysesResult.value.data : null
    const allTasks = tasksResult.status === 'fulfilled' ? tasksResult.value.data : null
    const allStickyNotes =
      stickyNotesResult.status === 'fulfilled' ? stickyNotesResult.value.data : null
    const allAssignments =
      assignmentsResult.status === 'fulfilled' ? assignmentsResult.value.data : null
    const calculatorResults =
      calculatorResultsResult.status === 'fulfilled' ? calculatorResultsResult.value.data : null

    // Log any errors (but continue processing)
    if (patientDataResult.status === 'rejected') {
      logger.warn({ error: patientDataResult.reason }, 'Failed to fetch patient_data')
    }
    if (testsResult.status === 'rejected') {
      logger.warn({ error: testsResult.reason }, 'Failed to fetch patient_tests')
    }
    if (analysesResult.status === 'rejected') {
      logger.warn({ error: analysesResult.reason }, 'Failed to fetch ai_analyses')
    }
    if (tasksResult.status === 'rejected') {
      logger.warn({ error: tasksResult.reason }, 'Failed to fetch tasks')
    }
    if (stickyNotesResult.status === 'rejected') {
      logger.warn({ error: stickyNotesResult.reason }, 'Failed to fetch sticky_notes')
    }
    if (assignmentsResult.status === 'rejected') {
      logger.warn({ error: assignmentsResult.reason }, 'Failed to fetch patient_assignments')
    }
    if (calculatorResultsResult.status === 'rejected') {
      logger.warn(
        { error: calculatorResultsResult.reason },
        'Failed to fetch clinical_calculator_results'
      )
    }

    // Group data by patient_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataByPatient = new Map<string, any>()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    patients.forEach((patient: any) => {
      dataByPatient.set(patient.id, {
        patient,
        patientData: [],
        tests: [],
        analyses: [],
        tasks: [],
        stickyNotes: [],
        assignments: [],
        calculatorResults: [],
      })
    })

    // Group patient_data by patient_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allPatientData?.forEach((data: any) => {
      const patientData = dataByPatient.get(data.patient_id)
      if (patientData) {
        patientData.patientData.push(data)
      }
    })

    // Group tests by patient_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allTests?.forEach((test: any) => {
      const patientData = dataByPatient.get(test.patient_id)
      if (patientData) {
        patientData.tests.push(test)
      }
    })

    // Group analyses by patient_id (limit to 3 most recent per patient)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analysesByPatient = new Map<string, any[]>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allAnalyses?.forEach((analysis: any) => {
      if (!analysesByPatient.has(analysis.patient_id)) {
        analysesByPatient.set(analysis.patient_id, [])
      }
      const patientAnalyses = analysesByPatient.get(analysis.patient_id)!
      if (patientAnalyses.length < 3) {
        patientAnalyses.push(analysis)
      }
    })
    analysesByPatient.forEach((analyses, patientId) => {
      const patientData = dataByPatient.get(patientId)
      if (patientData) {
        patientData.analyses = analyses
      }
    })

    // Group tasks by patient_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allTasks?.forEach((task: any) => {
      const patientData = dataByPatient.get(task.patient_id)
      if (patientData) {
        patientData.tasks.push(task)
      }
    })

    // Group sticky notes by patient_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allStickyNotes?.forEach((note: any) => {
      const patientData = dataByPatient.get(note.patient_id)
      if (patientData) {
        patientData.stickyNotes.push(note)
      }
    })

    // Group assignments by patient_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allAssignments?.forEach((assignment: any) => {
      const patientData = dataByPatient.get(assignment.patient_id)
      if (patientData) {
        patientData.assignments.push(assignment)
      }
    })

    // Group calculator results by patient_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    calculatorResults?.forEach((result: any) => {
      const patientData = dataByPatient.get(result.patient_id)
      if (patientData) {
        patientData.calculatorResults.push(result)
      }
    })

    // 6. Fetch template (if provided)
    let template = null
    if (template_id) {
      const { data } = await supabase
        .from('handoff_templates')
        .select('*')
        .eq('id', template_id)
        .single()
      template = data
    }

    // 7. Fetch shift information (if provided)
    let shiftInfo = null
    if (shift_id) {
      const { data: shift } = await supabase
        .from('shift_schedules')
        .select('*, shift_definition:shift_definitions(name, short_name, start_time, end_time)')
        .eq('id', shift_id)
        .single()
      shiftInfo = shift
    }

    // 8. Build comprehensive AI context for each patient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patientsContext = Array.from(dataByPatient.values()).map(
      ({
        patient,
        patientData,
        tests,
        analyses,
        tasks,
        stickyNotes,
        assignments,
        calculatorResults,
      }: any) => {
        // Organize patient_data by type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const demographics = patientData.find((d: any) => d.data_type === 'demographics')?.content
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anamnesis = patientData.find((d: any) => d.data_type === 'anamnesis')?.content
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vitalSigns = patientData
          .filter((d: any) => d.data_type === 'vital_signs')
          .map((d: any) => ({
            ...d.content,
            recorded_at: d.created_at,
          }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const medications = patientData
          .filter((d: any) => d.data_type === 'medications')
          .flatMap((d: any) => (Array.isArray(d.content) ? d.content : [d.content]))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const history = patientData.find((d: any) => d.data_type === 'history')?.content

        // Get latest vital signs
        const latestVitalSigns = vitalSigns[0] || null

        // Get latest AI analysis
        const latestAnalysis = analyses[0]?.ai_response || null

        // Filter pending tasks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pendingTasks = tasks.filter(
          (t: any) => t.status !== 'completed' && t.status !== 'cancelled'
        )

        // Filter critical notes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const criticalNotes = stickyNotes.filter(
          (n: any) => n.note_type === 'urgent' || n.is_pinned
        )

        // Get recent test results (last 5)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recentTests = tests.slice(0, 5).map((t: any) => ({
          type: t.test_type,
          results: t.results,
          date: t.created_at,
          images: t.images || [],
        }))

        // Get calculator results
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recentCalculators = calculatorResults.slice(0, 5).map((r: any) => ({
          type: r.calculator_type,
          score: r.score,
          interpretation: r.score_interpretation,
          risk_category: r.risk_category,
          recommendations: r.recommendations,
          date: r.created_at,
        }))

        // Get current assignment
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentAssignment = assignments.find((a: any) => !a.ended_at) || null

        return {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          category: patient.category?.name || 'Genel',
          admission_date: patient.admission_date,
          workflow_state: patient.workflow_state,
          assigned_to: patient.assigned_to,
          current_assignment: currentAssignment
            ? {
                assigned_to: currentAssignment.assigned_to,
                assigned_at: currentAssignment.created_at,
                notes: currentAssignment.notes,
              }
            : null,

          // Demographics
          demographics: demographics || null,

          // Anamnesis
          anamnesis: anamnesis || null,

          // Vital signs history (last 5 recordings)
          vital_signs_history: vitalSigns.slice(0, 5),
          latest_vital_signs: latestVitalSigns,

          // Medications
          medications: medications || [],

          // Medical history
          medical_history: history || null,

          // Test results
          test_results: recentTests,
          total_tests: tests.length,

          // AI analyses
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ai_analyses: analyses.map((a: any) => ({
            type: a.analysis_type,
            assessment: a.ai_response?.assessment || null,
            differential_diagnosis: a.ai_response?.differentialDiagnosis || null,
            red_flags: a.ai_response?.redFlags || null,
            recommendations: a.ai_response?.recommendations || null,
            created_at: a.created_at,
          })),
          latest_ai_assessment: latestAnalysis?.assessment || null,
          latest_differential_diagnosis: latestAnalysis?.differentialDiagnosis || null,
          latest_red_flags: latestAnalysis?.redFlags || null,
          latest_recommendations: latestAnalysis?.recommendations || null,

          // Clinical calculators
          calculator_results: recentCalculators,

          // Tasks
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pending_tasks: pendingTasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status,
            due_date: t.due_date,
            assigned_to: t.assigned_to,
          })),
          total_tasks: tasks.length,

          // Sticky notes
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          critical_notes: criticalNotes.map((n: any) => ({
            id: n.id,
            content: n.content,
            note_type: n.note_type,
            is_pinned: n.is_pinned,
            created_at: n.created_at,
            created_by: n.created_by,
          })),
          all_notes: stickyNotes.length,
        }
      }
    )

    // 9. Fetch user profiles for context
    const userIds = new Set<string>()
    userIds.add(from_user_id)
    userIds.add(to_user_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    patientsContext.forEach((p: any) => {
      if (p.assigned_to) userIds.add(p.assigned_to)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p.pending_tasks?.forEach((t: any) => {
        if (t.assigned_to) userIds.add(t.assigned_to)
      })
    })

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, specialty')
      .in('user_id', Array.from(userIds))

    const profilesMap = new Map(profiles?.map((p) => [p.user_id, p]) || [])

    // 10. Call OpenAI to generate handoff summary in Turkish
    const fromUser = profilesMap.get(from_user_id)
    const toUser = profilesMap.get(to_user_id)

    const systemPrompt = `Sen Türkiye'deki bir acil servis veya hastane departmanında çalışan deneyimli bir tıbbi asistanısın. 
Görevin, doktorlar için kapsamlı, profesyonel ve detaylı bir vardiya devir notu oluşturmaktır.

ÖNEMLİ KURALLAR:
1. TÜM ÇIKTILAR TÜRKÇE OLMALIDIR - Hiçbir şekilde İngilizce kullanma
2. Tıbbi terminolojiyi doğru ve profesyonel şekilde kullan
3. Hasta güvenliğini ve bakım sürekliliğini önceliklendir
4. Kritik bilgileri vurgula ve acil müdahale gerektiren durumları belirt
5. Her hasta için detaylı ve kapsamlı bilgi ver
6. Vital bulgular, ilaçlar, test sonuçları ve AI analizlerini entegre et
7. Bekleyen görevleri ve kritik uyarıları net bir şekilde listele

DEVRİN YAPISI:
- Genel özet (tüm hastaların durumu hakkında)
- Her hasta için detaylı devir bilgisi
- Kritik uyarılar ve acil durumlar
- Bekleyen görevler ve prosedürler
- İlaç takibi ve zamanlamaları
- Özel talimatlar ve dikkat edilmesi gerekenler
- Kontrol listesi öğeleri`

    const shiftContext = shiftInfo
      ? `Vardiya Bilgisi:
- Vardiya: ${shiftInfo.shift_definition?.name || 'Bilinmiyor'}
- Tarih: ${shiftInfo.shift_date || 'Bilinmiyor'}
- Başlangıç: ${shiftInfo.start_time || 'Bilinmiyor'}
- Bitiş: ${shiftInfo.end_time || 'Bilinmiyor'}
`
      : ''

    // Optimize patient context for AI (limit data size)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const optimizedPatientsContext = patientsContext.map((p: any) => {
      // Limit vital signs history to last 3
      const vitalSignsHistory = p.vital_signs_history?.slice(0, 3) || []

      // Limit test results to last 3
      const testResults = p.test_results?.slice(0, 3) || []

      // Limit AI analyses to last 2
      const aiAnalyses = p.ai_analyses?.slice(0, 2) || []

      // Limit calculator results to last 2
      const calculatorResults = p.calculator_results?.slice(0, 2) || []

      // Limit pending tasks to 10 most important
      const pendingTasks = p.pending_tasks?.slice(0, 10) || []

      // Limit critical notes to 5
      const criticalNotes = p.critical_notes?.slice(0, 5) || []

      return {
        ...p,
        vital_signs_history: vitalSignsHistory,
        test_results: testResults,
        ai_analyses: aiAnalyses,
        calculator_results: calculatorResults,
        pending_tasks: pendingTasks,
        critical_notes: criticalNotes,
      }
    })

    // Validate we have patient data
    if (!optimizedPatientsContext || optimizedPatientsContext.length === 0) {
      logger.error({ patientIds }, 'No patient context built')
      return NextResponse.json({ error: 'Hasta verileri hazırlanamadı' }, { status: 500 })
    }

    // Build user prompt with size check
    // Use a replacer function to handle null/undefined values
    const patientsJson = JSON.stringify(
      optimizedPatientsContext,
      (key, value) => {
        // Remove null and undefined values to reduce size
        if (value === null || value === undefined) {
          return undefined // This will remove the key from JSON
        }
        return value
      },
      2
    )

    const promptSizeMB = Buffer.byteLength(patientsJson, 'utf8') / (1024 * 1024)

    if (promptSizeMB > 1) {
      logger.warn(
        {
          promptSizeMB,
          patientCount: patients.length,
        },
        'Prompt size is large, may cause issues'
      )
    }

    // Log prompt size for debugging
    logger.info(
      {
        promptSizeMB: promptSizeMB.toFixed(2),
        patientCount: patients.length,
        promptLength: patientsJson.length,
      },
      'Generating handoff with patient data'
    )

    const userPrompt = `${shiftContext}
Devir Notu Oluştur:
- Devreden Doktor: ${fromUser?.full_name || 'Bilinmiyor'} ${fromUser?.specialty ? `(${fromUser.specialty})` : ''}
- Devralan Doktor: ${toUser?.full_name || 'Bilinmiyor'} ${toUser?.specialty ? `(${toUser.specialty})` : ''}
- Toplam Hasta Sayısı: ${patients.length}
${template ? `\nŞablon Yapısı: ${JSON.stringify(template.sections, null, 2)}` : ''}

Hasta Verileri (TÜM DETAYLAR):
${patientsJson}

LÜTFEN ŞUNLARI SAĞLA (TÜM ÇIKTILAR TÜRKÇE OLMALI):

1. GENEL ÖZET: Tüm hastaların genel durumu, kritik hasta sayısı, önemli gelişmeler (3-4 cümle)

2. HASTA BAZINDA DETAYLI DEVRİN:
   Her hasta için şunları içeren kapsamlı bir özet:
   - Hasta kimliği ve temel bilgiler
   - Mevcut durum ve workflow_state
   - Son vital bulgular ve trendler
   - Aktif ilaçlar ve dozajları
   - Son test sonuçları ve önemli bulgular
   - AI analiz sonuçları (değerlendirme, ayırıcı tanı, kırmızı bayraklar)
   - Kritik notlar ve uyarılar
   - Bekleyen görevler ve prosedürler
   - Son değişiklikler ve gelişmeler
   - Özel talimatlar

3. KRİTİK UYARILAR: Acil müdahale gerektiren tüm durumlar

4. BEKLEYEN GÖREVLER: Tüm hastalar için bekleyen görevlerin listesi

5. İLAÇ TAKİBİ: Sonraki vardiyada verilmesi gereken ilaçlar ve zamanlamaları

6. ÖZEL TALİMATLAR: Özel dikkat gerektiren durumlar

7. KONTROL LİSTESİ: Devir sırasında kontrol edilmesi gereken öğeler

JSON formatında yanıt ver (TÜM METİNLER TÜRKÇE):
{
  "summary": "Genel özet metni (Türkçe)",
  "patient_summaries": [
    {
      "patient_id": "uuid",
      "patient_name": "isim",
      "summary": "Hasta özelinde detaylı özet (Türkçe, kapsamlı)",
      "current_status": "Mevcut durum açıklaması",
      "vital_signs_summary": "Vital bulgular özeti ve trendler",
      "medications_summary": "Aktif ilaçlar ve dozajları",
      "test_results_summary": "Önemli test sonuçları",
      "ai_assessment_summary": "AI değerlendirme özeti",
      "differential_diagnosis": "Ayırıcı tanı listesi",
      "red_flags": ["Kırmızı bayrak 1", "Kırmızı bayrak 2"],
      "critical_items": ["Kritik öğe 1", "Kritik öğe 2"],
      "pending_tasks": [
        {
          "title": "Görev başlığı",
          "description": "Görev açıklaması",
          "priority": "critical|high|medium|low",
          "due_date": "tarih"
        }
      ],
      "recent_changes": "Son değişiklikler ve gelişmeler",
      "special_instructions": "Özel talimatlar"
    }
  ],
  "overall_statistics": {
    "total_patients": number,
    "critical_patients": number,
    "stable_patients": number,
    "monitoring_patients": number,
    "pending_discharges": number
  },
  "critical_alerts": [
    {
      "patient_id": "uuid",
      "patient_name": "isim",
      "alert": "Uyarı metni (Türkçe)",
      "severity": "critical|high|medium"
    }
  ],
  "pending_tasks_summary": [
    {
      "patient_id": "uuid",
      "patient_name": "isim",
      "task_title": "Görev başlığı",
      "priority": "critical|high|medium|low",
      "due_date": "tarih"
    }
  ],
  "medications_due": [
    {
      "patient_id": "uuid",
      "patient_name": "isim",
      "medication": "İlaç adı",
      "dosage": "Dozaj",
      "due_time": "Zaman",
      "notes": "Notlar"
    }
  ],
  "special_instructions": [
    {
      "category": "patient_care|medication|procedure|follow_up|other",
      "instruction": "Talimat metni (Türkçe)",
      "priority": "critical|high|medium|low"
    }
  ],
  "checklist_items": [
    {
      "title": "Kontrol öğesi başlığı (Türkçe)",
      "category": "patient_care|medication|procedure|follow_up|documentation",
      "priority": "critical|high|medium|low",
      "description": "Açıklama"
    }
  ]
}`

    const startTime = Date.now()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent, professional output
      max_tokens: 4096, // Maximum supported by gpt-4-turbo-preview
      response_format: { type: 'json_object' },
    })

    const responseTime = Date.now() - startTime
    const aiResponse = completion.choices[0].message.content

    if (!aiResponse) {
      logger.error({ completion }, 'AI returned empty response')
      return NextResponse.json({ error: 'AI yanıt üretemedi' }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let generatedContent: any
    try {
      generatedContent = JSON.parse(aiResponse) as AIGeneratedHandoffContent
    } catch (parseError: unknown) {
      logger.error(
        {
          error: parseError,
          aiResponse: aiResponse.substring(0, 500), // Log first 500 chars
        },
        'Failed to parse AI response as JSON'
      )
      return NextResponse.json(
        {
          error: 'AI yanıtı işlenemedi',
          details: process.env.NODE_ENV === 'development' ? parseError.message : undefined,
        },
        { status: 500 }
      )
    }

    // 8. Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      workspace_id,
      model: 'gpt-4-turbo-preview',
      operation: 'handoff_generation',
      input_tokens: completion.usage?.prompt_tokens || 0,
      output_tokens: completion.usage?.completion_tokens || 0,
      total_cost: (completion.usage?.total_tokens || 0) * 0.00003, // Approximate cost
      response_time_ms: responseTime,
      success: true,
    })

    logger.info(
      { userId: user.id, workspaceId: workspace_id, patientCount: patients.length },
      'AI handoff generated successfully'
    )

    return NextResponse.json({
      success: true,
      content: generatedContent,
      metadata: {
        ai_model: 'gpt-4-turbo-preview',
        generation_time_ms: responseTime,
        patient_count: patients.length,
        tokens_used: completion.usage?.total_tokens,
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.error(
      {
        error: error.message || error,
        stack: error.stack,
        name: error.name,
      },
      'Unexpected error in POST /api/handoffs/generate'
    )

    // Log failed AI usage
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from('ai_usage_logs').insert({
          user_id: user.id,
          model: 'gpt-4-turbo-preview',
          operation: 'handoff_generation',
          success: false,
          error: error.message || String(error),
        })
      }
    } catch (logError) {
      logger.error({ error: logError }, 'Failed to log AI usage error')
    }

    // Return user-friendly error message
    const errorMessage = error.message || 'Devir notu oluşturulurken bir hata oluştu'
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
