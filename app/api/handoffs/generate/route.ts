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
      include_pending_tasks = true,
      include_critical_alerts = true,
      include_recent_changes = true,
    } = body

    if (!workspace_id || !from_user_id || !to_user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Fetch patients data
    let patientsQuery = supabase
      .from('patients')
      .select(
        `
        id,
        name,
        age,
        gender,
        admission_date,
        workflow_state,
        category:patient_categories(id, name, color),
        patient_data(data_type, content),
        ai_analyses(
          id,
          created_at,
          ai_response
        ),
        tasks(
          id,
          title,
          priority,
          status,
          due_date
        ),
        sticky_notes(
          id,
          content,
          note_type,
          is_pinned,
          created_at
        )
      `
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

    // 5. Fetch template (if provided)
    let template = null
    if (template_id) {
      const { data } = await supabase
        .from('handoff_templates')
        .select('*')
        .eq('id', template_id)
        .single()
      template = data
    }

    // 6. Build AI context
    const patientsContext = patients.map((patient: any) => {
      const latestAnalysis = patient.ai_analyses?.[0]?.ai_response
      const vitalSigns = patient.patient_data?.find((d: any) => d.data_type === 'vital_signs')?.content
      const medications = patient.patient_data?.find((d: any) => d.data_type === 'medications')?.content
      const pendingTasks = patient.tasks?.filter((t: any) => t.status !== 'completed' && t.status !== 'cancelled')
      const criticalNotes = patient.sticky_notes?.filter((n: any) => n.note_type === 'urgent' || n.is_pinned)

      return {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        category: patient.category?.name,
        admission_date: patient.admission_date,
        workflow_state: patient.workflow_state,
        latest_vital_signs: vitalSigns,
        medications,
        latest_ai_assessment: latestAnalysis?.assessment,
        differential_diagnosis: latestAnalysis?.differentialDiagnosis,
        red_flags: latestAnalysis?.redFlags,
        pending_tasks: pendingTasks,
        critical_notes: criticalNotes,
      }
    })

    // 7. Call OpenAI to generate handoff summary
    const systemPrompt = `You are an expert medical assistant helping with shift handoff for doctors.
Your task is to create a comprehensive, structured handoff summary based on patient data.

Focus on:
1. Critical patients that need immediate attention
2. Pending tasks and procedures
3. Important vital signs changes
4. Medication schedules
5. Special instructions or precautions

Be concise but thorough. Use medical terminology appropriately.
Prioritize patient safety and continuity of care.`

    const userPrompt = `Generate a shift handoff summary for ${patients.length} patients.
${template ? `Use this template structure: ${JSON.stringify(template.sections)}` : ''}

Patient Data:
${JSON.stringify(patientsContext, null, 2)}

Please provide:
1. Overall summary (2-3 sentences)
2. Individual patient summaries with critical items
3. List of all pending tasks
4. Critical alerts that need attention
5. Medications due in next shift
6. Special instructions
7. Checklist of handoff items

Format the response as JSON with the following structure:
{
  "summary": "overall summary text",
  "patient_summaries": [
    {
      "patient_id": "uuid",
      "patient_name": "name",
      "summary": "patient specific summary",
      "critical_items": ["item1", "item2"],
      "pending_tasks": ["task1", "task2"],
      "recent_changes": "recent changes text"
    }
  ],
  "overall_statistics": {
    "total_patients": number,
    "critical_patients": number,
    "stable_patients": number,
    "pending_discharges": number
  },
  "critical_alerts": ["alert1", "alert2"],
  "pending_tasks": ["task1", "task2"],
  "medications_due": [
    {
      "patient_id": "uuid",
      "patient_name": "name",
      "medication": "medication name",
      "due_time": "time"
    }
  ],
  "special_instructions": ["instruction1", "instruction2"],
  "checklist_items": [
    {
      "title": "checklist item",
      "category": "patient_care|medication|procedure|follow_up",
      "priority": "critical|high|medium|low"
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
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    })

    const responseTime = Date.now() - startTime
    const aiResponse = completion.choices[0].message.content

    if (!aiResponse) {
      return NextResponse.json({ error: 'Failed to generate handoff' }, { status: 500 })
    }

    const generatedContent: AIGeneratedHandoffContent = JSON.parse(aiResponse)

    // 8. Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      workspace_id,
      model: 'gpt-4-turbo-preview',
      operation: 'handoff_generation',
      input_tokens: completion.usage?.prompt_tokens || 0,
      output_tokens: completion.usage?.completion_tokens || 0,
      total_cost: ((completion.usage?.total_tokens || 0) * 0.00003), // Approximate cost
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
  } catch (error: any) {
    logger.error({ error }, 'Unexpected error in POST /api/handoffs/generate')

    // Log failed AI usage
    if (error.message) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase.from('ai_usage_logs').insert({
          user_id: user.id,
          model: 'gpt-4-turbo-preview',
          operation: 'handoff_generation',
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
