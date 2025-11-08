/**
 * FAZ 1: Migration Verification Script
 *
 * Bu script migration sonrası veritabanını kontrol eder.
 * Kullanım: npx ts-node scripts/verify-migration-phase1.ts
 */

import { createClient } from '@supabase/supabase-js'

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Environment variables missing!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface VerificationResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: unknown
}

const results: VerificationResult[] = []

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`)
}

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: unknown) {
  results.push({ name, status, message, details })

  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
  log(emoji, `${name}: ${message}`)

  if (details) {
    console.log('   Details:', details)
  }
}

async function verify() {
  console.log('\n🔍 FAZ 1: Migration Verification Starting...\n')
  console.log('=' . repeat(60))

  // ============================================
  // 1. Check Tables Exist
  // ============================================
  console.log('\n📋 1. Checking if tables exist...\n')

  const requiredTables = ['organizations', 'workspaces', 'workspace_members', 'patient_categories', 'patient_assignments']

  for (const table of requiredTables) {
    const { data, error } = await supabase.from(table).select('id').limit(1)

    if (error) {
      addResult(`Table: ${table}`, 'fail', `Table does not exist or is inaccessible: ${error.message}`)
    } else {
      addResult(`Table: ${table}`, 'pass', 'Table exists and is accessible')
    }
  }

  // ============================================
  // 2. Check Organizations
  // ============================================
  console.log('\n🏥 2. Checking Organizations...\n')

  const { data: orgs, error: orgsError } = await supabase.from('organizations').select('*').is('deleted_at', null)

  if (orgsError) {
    addResult('Organizations Query', 'fail', `Failed to query: ${orgsError.message}`)
  } else if (!orgs || orgs.length === 0) {
    addResult('Organizations Count', 'warning', 'No organizations found - this might be expected if no users exist yet')
  } else {
    addResult('Organizations Count', 'pass', `Found ${orgs.length} organization(s)`, {
      organizations: orgs.map((o) => ({ id: o.id, name: o.name, slug: o.slug })),
    })

    // Check if all orgs have required fields
    const invalidOrgs = orgs.filter((o) => !o.name || !o.slug || !o.subscription_tier)
    if (invalidOrgs.length > 0) {
      addResult('Organizations Validation', 'fail', `${invalidOrgs.length} organization(s) missing required fields`, {
        invalid: invalidOrgs,
      })
    } else {
      addResult('Organizations Validation', 'pass', 'All organizations have required fields')
    }
  }

  // ============================================
  // 3. Check Workspaces
  // ============================================
  console.log('\n🏢 3. Checking Workspaces...\n')

  const { data: workspaces, error: workspacesError } = await supabase.from('workspaces').select('*').is('deleted_at', null)

  if (workspacesError) {
    addResult('Workspaces Query', 'fail', `Failed to query: ${workspacesError.message}`)
  } else if (!workspaces || workspaces.length === 0) {
    addResult('Workspaces Count', 'warning', 'No workspaces found')
  } else {
    addResult('Workspaces Count', 'pass', `Found ${workspaces.length} workspace(s)`, {
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name, type: w.type, org_id: w.organization_id })),
    })

    // Check if all workspaces belong to valid organizations
    if (orgs && orgs.length > 0) {
      const orgIds = new Set(orgs.map((o) => o.id))
      const orphanWorkspaces = workspaces.filter((w) => !orgIds.has(w.organization_id))

      if (orphanWorkspaces.length > 0) {
        addResult('Workspaces-Organizations Link', 'fail', `${orphanWorkspaces.length} workspace(s) have invalid organization_id`)
      } else {
        addResult('Workspaces-Organizations Link', 'pass', 'All workspaces linked to valid organizations')
      }
    }
  }

  // ============================================
  // 4. Check Workspace Members
  // ============================================
  console.log('\n👥 4. Checking Workspace Members...\n')

  const { data: members, error: membersError } = await supabase.from('workspace_members').select('*').eq('status', 'active')

  if (membersError) {
    addResult('Members Query', 'fail', `Failed to query: ${membersError.message}`)
  } else if (!members || members.length === 0) {
    addResult('Members Count', 'warning', 'No active members found')
  } else {
    addResult('Members Count', 'pass', `Found ${members.length} active member(s)`)

    // Check if each workspace has at least one owner
    if (workspaces && workspaces.length > 0) {
      const workspaceOwners = new Map<string, number>()

      for (const member of members) {
        if (member.role === 'owner') {
          workspaceOwners.set(member.workspace_id, (workspaceOwners.get(member.workspace_id) || 0) + 1)
        }
      }

      const workspacesWithoutOwner = workspaces.filter((w) => !workspaceOwners.has(w.id))

      if (workspacesWithoutOwner.length > 0) {
        addResult(
          'Workspace Owners',
          'fail',
          `${workspacesWithoutOwner.length} workspace(s) without an owner`,
          { workspaces: workspacesWithoutOwner.map((w) => w.name) }
        )
      } else {
        addResult('Workspace Owners', 'pass', 'All workspaces have at least one owner')
      }
    }
  }

  // ============================================
  // 5. Check Patient Categories
  // ============================================
  console.log('\n🏷️  5. Checking Patient Categories...\n')

  const { data: categories, error: categoriesError } = await supabase
    .from('patient_categories')
    .select('*')
    .is('deleted_at', null)

  if (categoriesError) {
    addResult('Categories Query', 'fail', `Failed to query: ${categoriesError.message}`)
  } else if (!categories || categories.length === 0) {
    addResult('Categories Count', 'warning', 'No categories found')
  } else {
    addResult('Categories Count', 'pass', `Found ${categories.length} category/categories`)

    // Check if each workspace has at least one default category
    if (workspaces && workspaces.length > 0) {
      const workspaceDefaultCategories = new Map<string, boolean>()

      for (const category of categories) {
        if (category.is_default) {
          workspaceDefaultCategories.set(category.workspace_id, true)
        }
      }

      const workspacesWithoutDefault = workspaces.filter((w) => !workspaceDefaultCategories.has(w.id))

      if (workspacesWithoutDefault.length > 0) {
        addResult(
          'Default Categories',
          'warning',
          `${workspacesWithoutDefault.length} workspace(s) without a default category`,
          { workspaces: workspacesWithoutDefault.map((w) => w.name) }
        )
      } else {
        addResult('Default Categories', 'pass', 'All workspaces have a default category')
      }

      // Check if each workspace has at least 3 categories
      const categoriesPerWorkspace = new Map<string, number>()
      for (const category of categories) {
        categoriesPerWorkspace.set(category.workspace_id, (categoriesPerWorkspace.get(category.workspace_id) || 0) + 1)
      }

      const workspacesWithFewCategories = workspaces.filter((w) => {
        const count = categoriesPerWorkspace.get(w.id) || 0
        return count < 3
      })

      if (workspacesWithFewCategories.length > 0) {
        addResult(
          'Categories per Workspace',
          'warning',
          `${workspacesWithFewCategories.length} workspace(s) have less than 3 categories`,
          {
            workspaces: workspacesWithFewCategories.map((w) => ({
              name: w.name,
              count: categoriesPerWorkspace.get(w.id) || 0,
            })),
          }
        )
      } else {
        addResult('Categories per Workspace', 'pass', 'All workspaces have at least 3 categories')
      }
    }
  }

  // ============================================
  // 6. Check Patients Migration
  // ============================================
  console.log('\n🏥 6. Checking Patients Migration...\n')

  const { data: patients, error: patientsError } = await supabase.from('patients').select('*').is('deleted_at', null)

  if (patientsError) {
    addResult('Patients Query', 'fail', `Failed to query: ${patientsError.message}`)
  } else if (!patients || patients.length === 0) {
    addResult('Patients Count', 'warning', 'No patients found - this might be expected')
  } else {
    addResult('Patients Count', 'pass', `Found ${patients.length} patient(s)`)

    // Check migration status
    const withWorkspace = patients.filter((p) => p.workspace_id)
    const withCategory = patients.filter((p) => p.category_id)
    const withAssignment = patients.filter((p) => p.assigned_to)

    const migrationRate = {
      workspace: ((withWorkspace.length / patients.length) * 100).toFixed(1),
      category: ((withCategory.length / patients.length) * 100).toFixed(1),
      assignment: ((withAssignment.length / patients.length) * 100).toFixed(1),
    }

    if (withWorkspace.length === patients.length) {
      addResult('Patients - Workspace Migration', 'pass', '100% patients have workspace_id')
    } else {
      addResult(
        'Patients - Workspace Migration',
        'fail',
        `Only ${migrationRate.workspace}% patients have workspace_id`,
        { missing: patients.length - withWorkspace.length }
      )
    }

    if (withCategory.length === patients.length) {
      addResult('Patients - Category Migration', 'pass', '100% patients have category_id')
    } else {
      addResult(
        'Patients - Category Migration',
        'warning',
        `Only ${migrationRate.category}% patients have category_id`,
        { missing: patients.length - withCategory.length }
      )
    }

    if (withAssignment.length === patients.length) {
      addResult('Patients - Assignment Migration', 'pass', '100% patients have assigned_to')
    } else {
      addResult(
        'Patients - Assignment Migration',
        'warning',
        `Only ${migrationRate.assignment}% patients have assigned_to`,
        { missing: patients.length - withAssignment.length }
      )
    }
  }

  // ============================================
  // 7. Check Patient Assignments
  // ============================================
  console.log('\n👨‍⚕️ 7. Checking Patient Assignments...\n')

  const { data: assignments, error: assignmentsError } = await supabase
    .from('patient_assignments')
    .select('*')
    .eq('is_active', true)

  if (assignmentsError) {
    addResult('Assignments Query', 'fail', `Failed to query: ${assignmentsError.message}`)
  } else if (!assignments || assignments.length === 0) {
    addResult('Assignments Count', 'warning', 'No active assignments found')
  } else {
    addResult('Assignments Count', 'pass', `Found ${assignments.length} active assignment(s)`)

    // Count by type
    const assignmentsByType = assignments.reduce(
      (acc, a) => {
        acc[a.assignment_type] = (acc[a.assignment_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    addResult('Assignments by Type', 'pass', 'Assignment types distribution', assignmentsByType)
  }

  // ============================================
  // 8. Check Profiles Update
  // ============================================
  console.log('\n👤 8. Checking Profiles Update...\n')

  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*')

  if (profilesError) {
    addResult('Profiles Query', 'fail', `Failed to query: ${profilesError.message}`)
  } else if (!profiles || profiles.length === 0) {
    addResult('Profiles Count', 'warning', 'No profiles found')
  } else {
    addResult('Profiles Count', 'pass', `Found ${profiles.length} profile(s)`)

    const withOrg = profiles.filter((p) => p.current_organization_id)
    const orgRate = ((withOrg.length / profiles.length) * 100).toFixed(1)

    if (withOrg.length === profiles.length) {
      addResult('Profiles - Organization Link', 'pass', '100% profiles linked to an organization')
    } else {
      addResult(
        'Profiles - Organization Link',
        'warning',
        `Only ${orgRate}% profiles linked to an organization`,
        { missing: profiles.length - withOrg.length }
      )
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 VERIFICATION SUMMARY\n')

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const warnings = results.filter((r) => r.status === 'warning').length

  console.log(`✅ Passed:   ${passed}`)
  console.log(`❌ Failed:   ${failed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`📝 Total:    ${results.length}`)

  console.log('\n' + '='.repeat(60))

  if (failed > 0) {
    console.log('\n❌ MIGRATION VERIFICATION FAILED\n')
    console.log('Failed checks:')
    results
      .filter((r) => r.status === 'fail')
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.message}`)
      })
    process.exit(1)
  } else if (warnings > 0) {
    console.log('\n⚠️  MIGRATION VERIFICATION COMPLETED WITH WARNINGS\n')
    console.log('Warnings:')
    results
      .filter((r) => r.status === 'warning')
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.message}`)
      })
    process.exit(0)
  } else {
    console.log('\n✅ MIGRATION VERIFICATION PASSED!\n')
    console.log('🎉 All checks passed successfully!\n')
    process.exit(0)
  }
}

// Run verification
verify().catch((error) => {
  console.error('\n❌ Verification failed with error:\n')
  console.error(error)
  process.exit(1)
})
