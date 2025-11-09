import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Geçici debug endpoint - workspace verilerini kontrol eder
 * Sorun çözüldükten sonra silinebilir
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: any = {
      user: {
        id: user.id,
        email: user.email,
      },
      checks: {},
    }

    // 1. Check workspace_members
    const { data: members, error: memberError } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('user_id', user.id)

    results.checks.workspace_members = {
      count: members?.length || 0,
      data: members,
      error: memberError
        ? {
            message: memberError.message,
            code: memberError.code,
            details: memberError.details,
            hint: memberError.hint,
          }
        : null,
    }

    // 2. Check workspaces
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('created_by', user.id)

    results.checks.workspaces = {
      count: workspaces?.length || 0,
      data: workspaces,
      error: workspaceError ? { message: workspaceError.message, code: workspaceError.code } : null,
    }

    // 3. Check organizations
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', user.id)

    results.checks.organizations = {
      count: organizations?.length || 0,
      data: organizations,
      error: orgError ? { message: orgError.message, code: orgError.code } : null,
    }

    // 4. Check patients
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, tc_kimlik, ad_soyad, workspace_id, organization_id')
      .limit(5)

    results.checks.patients = {
      count: patients?.length || 0,
      data: patients,
      error: patientError ? { message: patientError.message, code: patientError.code } : null,
    }

    // 5. Try the exact query that's failing
    const { data: testMemberships, error: testError } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')

    results.checks.test_query = {
      count: testMemberships?.length || 0,
      data: testMemberships,
      error: testError
        ? {
            message: testError.message,
            code: testError.code,
            details: testError.details,
            hint: testError.hint,
          }
        : null,
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error: any) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
