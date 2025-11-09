import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kullanıcının zaten workspace'i var mı kontrol et
    const { data: existingMembership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        {
          success: true,
          message: 'Workspace zaten mevcut',
          workspace_id: existingMembership.workspace_id,
        },
        { status: 200 }
      )
    }

    // Organization oluştur
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: `${user.user_metadata?.full_name || user.email?.split('@')[0]}'s Clinic`,
        slug: `org-${user.id.substring(0, 8)}`,
        type: 'clinic',
        settings: {
          timezone: 'Europe/Istanbul',
          language: 'tr',
          date_format: 'DD/MM/YYYY',
          time_format: '24h',
        },
        subscription_tier: 'free',
        subscription_status: 'trial',
        max_users: 10,
        max_workspaces: 3,
        max_patients_per_workspace: 50,
      })
      .select('id')
      .single()

    if (orgError || !organization) {
      console.error('Organization creation error:', orgError)
      return NextResponse.json({ error: 'Organization oluşturulamadı' }, { status: 500 })
    }

    // Workspace oluştur
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        organization_id: organization.id,
        name: 'Acil Servis',
        slug: 'acil-servis',
        description: 'Ana çalışma alanı',
        type: 'emergency_department',
        color: '#ef4444',
        icon: '🚑',
        settings: {
          patient_limit: 50,
          require_approval_for_new_patients: false,
          enable_auto_analysis: true,
          enable_notifications: true,
        },
        is_active: true,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (workspaceError || !workspace) {
      console.error('Workspace creation error:', workspaceError)
      return NextResponse.json({ error: 'Workspace oluşturulamadı' }, { status: 500 })
    }

    // Kullanıcıyı workspace'e owner olarak ekle
    const { error: memberError } = await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
      invited_by: user.id,
      joined_at: new Date().toISOString(),
    })

    if (memberError) {
      console.error('Member creation error:', memberError)
      return NextResponse.json({ error: 'Üye ekleme başarısız oldu' }, { status: 500 })
    }

    // Default kategorileri oluştur
    const defaultCategories = [
      { name: 'Acil', color: '#ef4444', icon: '🚨', is_default: true },
      { name: 'Yatan', color: '#f59e0b', icon: '🏥', is_default: true },
      { name: 'Ayaktan', color: '#3b82f6', icon: '🚶', is_default: true },
      { name: 'Taburcu', color: '#10b981', icon: '✅', is_default: true },
      { name: 'Sevk', color: '#8b5cf6', icon: '↗️', is_default: true },
    ]

    const { error: categoriesError } = await supabase.from('patient_categories').insert(
      defaultCategories.map((cat) => ({
        workspace_id: workspace.id,
        ...cat,
      }))
    )

    if (categoriesError) {
      console.error('Categories creation error:', categoriesError)
      return NextResponse.json({ error: 'Kategoriler oluşturulamadı' }, { status: 500 })
    }

    // Kullanıcının mevcut hastalarını workspace'e taşı
    await supabase
      .from('patients')
      .update({ workspace_id: workspace.id })
      .eq('user_id', user.id)
      .is('workspace_id', null)

    return NextResponse.json(
      {
        success: true,
        message: 'Workspace başarıyla oluşturuldu',
        workspace_id: workspace.id,
        organization_id: organization.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Setup initialization error:', error)
    return NextResponse.json({ error: 'Beklenmeyen hata oluştu' }, { status: 500 })
  }
}
