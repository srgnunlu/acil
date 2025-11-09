#!/usr/bin/env tsx
/**
 * RLS Policies Test Script
 *
 * Bu script, veritabanındaki RLS (Row Level Security) policies'lerin
 * doğru çalışıp çalışmadığını test eder.
 *
 * Kullanım:
 *   npx tsx scripts/test-rls-policies.ts
 *
 * Gereksinimler:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable (admin access için)
 */

import { createClient } from '@supabase/supabase-js'

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL environment variable gerekli')
  process.exit(1)
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable gerekli')
  console.error('   Bu script admin access gerektirir')
  process.exit(1)
}

// Admin client (service role key ile)
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// ============================================
// TYPES
// ============================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface RLSTableStatus {
  tablename: string
  rowsecurity: boolean
}

interface RLSPolicy {
  schemaname: string
  tablename: string
  policyname: string
  permissive: string
  roles: string[]
  cmd: string
  qual: string | null
  with_check: string | null
}

interface TestResult {
  testName: string
  passed: boolean
  error?: string
  details?: string
}

// ============================================
// TEST FUNCTIONS
// ============================================

/**
 * 1. RLS Durumunu Kontrol Et
 */
async function checkRLSStatus(): Promise<TestResult[]> {
  const results: TestResult[] = []
  const tables = [
    'organizations',
    'workspaces',
    'workspace_members',
    'patients',
    'patient_categories',
    'workspace_invitations',
    'user_activity_log',
  ]

  console.log('\n📋 1. RLS Durumunu Kontrol Ediliyor...\n')

  for (const table of tables) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data, error } = await adminClient.rpc('exec_sql', {
        query: `
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = $1
        `,
        params: [table],
      })

      if (error) {
        // RPC yoksa direkt SQL sorgusu yapalım
        const { data: tableData, error: tableError } = await adminClient
          .from('pg_tables')
          .select('tablename, rowsecurity')
          .eq('schemaname', 'public')
          .eq('tablename', table)
          .single()

        if (tableError) {
          results.push({
            testName: `RLS Status Check - ${table}`,
            passed: false,
            error: tableError.message,
          })
          continue
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rowsecurity = (tableData as any)?.rowsecurity
        results.push({
          testName: `RLS Status Check - ${table}`,
          passed: rowsecurity === true,
          details: rowsecurity ? '✅ RLS aktif' : '❌ RLS pasif',
        })
      }
    } catch (error) {
      results.push({
        testName: `RLS Status Check - ${table}`,
        passed: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      })
    }
  }

  return results
}

/**
 * 2. RLS Policies Listesini Çıkar
 */
async function listRLSPolicies(): Promise<RLSPolicy[]> {
  console.log('\n📋 2. RLS Policies Listeleniyor...\n')

  try {
    // PostgreSQL system catalog'dan policies'leri çek
    const { data, error } = await adminClient
      .from('pg_policies')
      .select('*')
      .in('tablename', [
        'organizations',
        'workspaces',
        'workspace_members',
        'patients',
        'patient_categories',
        'workspace_invitations',
        'user_activity_log',
      ])
      .order('tablename', { ascending: true })
      .order('policyname', { ascending: true })

    if (error) {
      console.error('❌ Policies listelenemedi:', error)
      return []
    }

    return (data || []) as RLSPolicy[]
  } catch (error) {
    console.error('❌ Policies listelenirken hata:', error)
    return []
  }
}

/**
 * 3. Policy Coverage Kontrolü
 */
async function checkPolicyCoverage(policies: RLSPolicy[]): Promise<TestResult[]> {
  const results: TestResult[] = []
  const requiredTables = [
    'organizations',
    'workspaces',
    'workspace_members',
    'patients',
    'patient_categories',
  ]

  const requiredOperations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']

  console.log('\n📋 3. Policy Coverage Kontrol Ediliyor...\n')

  for (const table of requiredTables) {
    const tablePolicies = policies.filter((p) => p.tablename === table)
    const operations = tablePolicies.map((p) => p.cmd)

    for (const operation of requiredOperations) {
      const hasPolicy = operations.includes(operation)
      results.push({
        testName: `Policy Coverage - ${table}.${operation}`,
        passed: hasPolicy,
        details: hasPolicy
          ? `✅ ${operation} policy mevcut`
          : `⚠️ ${operation} policy eksik (gerekli olabilir)`,
      })
    }
  }

  return results
}

/**
 * 4. Test Senaryoları
 */
async function runTestScenarios(): Promise<TestResult[]> {
  const results: TestResult[] = []

  console.log('\n📋 4. Test Senaryoları Çalıştırılıyor...\n')
  console.log('⚠️  Bu testler için test kullanıcıları ve verileri gerekli')
  console.log('⚠️  Manuel test yapılması önerilir\n')

  // Test senaryoları için placeholder
  results.push({
    testName: 'Workspace Isolation Test',
    passed: false,
    details:
      "Manuel test gerekli - Farklı workspace'lerdeki kullanıcılar birbirinin verilerini görememeli",
  })

  results.push({
    testName: 'Role-based Access Test',
    passed: false,
    details: 'Manuel test gerekli - Observer rolü sadece okuma yapabilmeli',
  })

  results.push({
    testName: 'Organization Isolation Test',
    passed: false,
    details:
      "Manuel test gerekli - Farklı organization'lardaki kullanıcılar birbirinin verilerini görememeli",
  })

  return results
}

/**
 * 5. Eksik Policies'leri Tespit Et
 */
async function detectMissingPolicies(policies: RLSPolicy[]): Promise<TestResult[]> {
  const results: TestResult[] = []

  console.log('\n📋 5. Eksik Policies Tespit Ediliyor...\n')

  // Organizations için INSERT/UPDATE/DELETE policies kontrolü
  const orgPolicies = policies.filter((p) => p.tablename === 'organizations')
  const orgOperations = orgPolicies.map((p) => p.cmd)

  if (!orgOperations.includes('INSERT')) {
    results.push({
      testName: 'Missing Policy - organizations.INSERT',
      passed: false,
      details:
        '⚠️ Organizations tablosu için INSERT policy eksik (API route ile kontrol ediliyor olabilir)',
    })
  }

  if (!orgOperations.includes('UPDATE')) {
    results.push({
      testName: 'Missing Policy - organizations.UPDATE',
      passed: false,
      details:
        '⚠️ Organizations tablosu için UPDATE policy eksik (API route ile kontrol ediliyor olabilir)',
    })
  }

  if (!orgOperations.includes('DELETE')) {
    results.push({
      testName: 'Missing Policy - organizations.DELETE',
      passed: false,
      details:
        '⚠️ Organizations tablosu için DELETE policy eksik (API route ile kontrol ediliyor olabilir)',
    })
  }

  // Workspaces için UPDATE/DELETE policies kontrolü
  const wsPolicies = policies.filter((p) => p.tablename === 'workspaces')
  const wsOperations = wsPolicies.map((p) => p.cmd)

  if (!wsOperations.includes('UPDATE')) {
    results.push({
      testName: 'Missing Policy - workspaces.UPDATE',
      passed: false,
      details: '⚠️ Workspaces tablosu için UPDATE policy eksik',
    })
  }

  if (!wsOperations.includes('DELETE')) {
    results.push({
      testName: 'Missing Policy - workspaces.DELETE',
      passed: false,
      details: '⚠️ Workspaces tablosu için DELETE policy eksik',
    })
  }

  // Workspace_members için UPDATE/DELETE policies kontrolü
  const wmPolicies = policies.filter((p) => p.tablename === 'workspace_members')
  const wmOperations = wmPolicies.map((p) => p.cmd)

  if (!wmOperations.includes('UPDATE')) {
    results.push({
      testName: 'Missing Policy - workspace_members.UPDATE',
      passed: false,
      details: '⚠️ Workspace_members tablosu için UPDATE policy eksik',
    })
  }

  if (!wmOperations.includes('DELETE')) {
    results.push({
      testName: 'Missing Policy - workspace_members.DELETE',
      passed: false,
      details: '⚠️ Workspace_members tablosu için DELETE policy eksik',
    })
  }

  return results
}

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
  console.log('🔒 RLS Policies Test Script Başlatılıyor...\n')
  console.log('='.repeat(60))

  const allResults: TestResult[] = []

  try {
    // 1. RLS Durumunu Kontrol Et
    const rlsStatusResults = await checkRLSStatus()
    allResults.push(...rlsStatusResults)

    // 2. Policies Listesini Çıkar
    const policies = await listRLSPolicies()
    console.log(`✅ ${policies.length} policy bulundu\n`)

    // Policies'leri tablo bazında grupla ve göster
    const policiesByTable = policies.reduce(
      (acc, policy) => {
        if (!acc[policy.tablename]) {
          acc[policy.tablename] = []
        }
        acc[policy.tablename].push(policy)
        return acc
      },
      {} as Record<string, RLSPolicy[]>
    )

    for (const [table, tablePolicies] of Object.entries(policiesByTable)) {
      console.log(`📊 ${table}:`)
      for (const policy of tablePolicies) {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      }
      console.log()
    }

    // 3. Policy Coverage Kontrolü
    const coverageResults = await checkPolicyCoverage(policies)
    allResults.push(...coverageResults)

    // 4. Test Senaryoları
    const scenarioResults = await runTestScenarios()
    allResults.push(...scenarioResults)

    // 5. Eksik Policies Tespiti
    const missingResults = await detectMissingPolicies(policies)
    allResults.push(...missingResults)

    // Sonuçları Özetle
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SONUÇLARI ÖZETİ\n')

    const passed = allResults.filter((r) => r.passed).length
    const failed = allResults.filter((r) => !r.passed).length
    const warnings = allResults.filter((r) => r.details?.includes('⚠️')).length

    console.log(`✅ Başarılı: ${passed}`)
    console.log(`❌ Başarısız: ${failed}`)
    console.log(`⚠️  Uyarı: ${warnings}`)
    console.log(`📊 Toplam: ${allResults.length}\n`)

    // Detaylı Sonuçlar
    console.log('📋 DETAYLI SONUÇLAR:\n')
    for (const result of allResults) {
      const icon = result.passed ? '✅' : result.details?.includes('⚠️') ? '⚠️' : '❌'
      console.log(`${icon} ${result.testName}`)
      if (result.details) {
        console.log(`   ${result.details}`)
      }
      if (result.error) {
        console.log(`   Hata: ${result.error}`)
      }
      console.log()
    }

    // Öneriler
    if (failed > 0 || warnings > 0) {
      console.log('\n💡 ÖNERİLER:\n')
      console.log("1. Eksik policies'leri eklemek için RLS_SECURE_FIXED.sql dosyasını kontrol edin")
      console.log('2. Manuel test senaryolarını çalıştırın')
      console.log('3. Farklı rollerle (owner, admin, doctor, nurse, observer) test yapın')
      console.log('4. Workspace isolation testini yapın')
      console.log('5. Organization isolation testini yapın\n')
    }

    // Exit code
    process.exit(failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Test sırasında hata oluştu:', error)
    process.exit(1)
  }
}

// Script'i çalıştır
main()
