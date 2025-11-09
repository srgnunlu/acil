/**
 * Workspace verilerini kontrol eden script
 *
 * Bu script şunları kontrol eder:
 * 1. Kullanıcı profili var mı?
 * 2. Organizations var mı?
 * 3. Workspaces var mı?
 * 4. Workspace_members kayıtları var mı?
 * 5. Patients workspace'e atanmış mı?
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkWorkspaceData() {
  console.log('🔍 Workspace Veri Kontrolü\n')
  console.log('=' .repeat(80))

  try {
    // 1. Get user by email
    const userEmail = 'srgnunlu@icloud.com'
    console.log(`\n1️⃣  Kullanıcı: ${userEmail}`)
    console.log('-'.repeat(80))

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Auth kullanıcıları listelenemedi:', authError)
      return
    }

    const user = authUsers.users.find((u) => u.email === userEmail)

    if (!user) {
      console.error(`❌ Kullanıcı bulunamadı: ${userEmail}`)
      return
    }

    console.log(`✅ Kullanıcı bulundu: ${user.id}`)

    // 2. Check profile
    console.log(`\n2️⃣  Profil Kontrolü`)
    console.log('-'.repeat(80))

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Profil bulunamadı:', profileError.message)
    } else {
      console.log(`✅ Profil bulundu:`)
      console.log(`   - Ad Soyad: ${profile.full_name}`)
      console.log(`   - Rol: ${profile.role}`)
    }

    // 3. Check organizations
    console.log(`\n3️⃣  Organizations`)
    console.log('-'.repeat(80))

    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', user.id)

    if (orgError) {
      console.error('❌ Organizations sorgulanamadı:', orgError.message)
    } else {
      console.log(`✅ ${organizations.length} organization bulundu:`)
      organizations.forEach((org) => {
        console.log(`   - ${org.name} (${org.id})`)
      })
    }

    // 4. Check workspaces
    console.log(`\n4️⃣  Workspaces`)
    console.log('-'.repeat(80))

    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('created_by', user.id)

    if (workspaceError) {
      console.error('❌ Workspaces sorgulanamadı:', workspaceError.message)
    } else {
      console.log(`✅ ${workspaces.length} workspace bulundu:`)
      workspaces.forEach((ws) => {
        console.log(`   - ${ws.name} (${ws.id})`)
        console.log(`     Organization: ${ws.organization_id}`)
        console.log(`     Type: ${ws.type}`)
      })
    }

    // 5. Check workspace_members
    console.log(`\n5️⃣  Workspace Members (KRİTİK!)`)
    console.log('-'.repeat(80))

    const { data: members, error: memberError } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('user_id', user.id)

    if (memberError) {
      console.error('❌ Workspace members sorgulanamadı:', memberError.message)
      console.error('   Detay:', memberError)
    } else {
      console.log(`${members.length > 0 ? '✅' : '❌'} ${members.length} workspace_member kaydı bulundu`)

      if (members.length === 0) {
        console.log('\n⚠️  SORUN: Kullanıcının hiç workspace_member kaydı yok!')
        console.log('   Bu, migration sırasında workspace_members oluşturulmadığı anlamına gelir.')
        console.log('   Trigger çalışmamış olabilir.')
      } else {
        members.forEach((member) => {
          console.log(`   - Workspace: ${member.workspace_id}`)
          console.log(`     Role: ${member.role}`)
          console.log(`     Status: ${member.status}`)
          console.log(`     Joined: ${member.joined_at}`)
        })
      }
    }

    // 6. Check patients
    console.log(`\n6️⃣  Patients`)
    console.log('-'.repeat(80))

    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, tc_kimlik, ad_soyad, workspace_id, organization_id')
      .limit(10)

    if (patientError) {
      console.error('❌ Patients sorgulanamadı:', patientError.message)
    } else {
      console.log(`✅ ${patients.length} hasta bulundu:`)
      patients.forEach((patient) => {
        console.log(`   - ${patient.ad_soyad} (${patient.tc_kimlik})`)
        console.log(`     Workspace: ${patient.workspace_id || 'YOK!'}`)
        console.log(`     Organization: ${patient.organization_id || 'YOK!'}`)
      })
    }

    // 7. Check if workspace_members RLS policies exist
    console.log(`\n7️⃣  RLS Policies Kontrolü`)
    console.log('-'.repeat(80))

    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'workspace_members')

    if (policyError) {
      console.log('⚠️  RLS policies kontrol edilemedi (bu normal olabilir)')
    } else {
      console.log(`✅ ${policies?.length || 0} RLS policy bulundu`)
      policies?.forEach((policy: any) => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`)
      })
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Kontrol tamamlandı\n')
  } catch (error) {
    console.error('\n❌ Beklenmeyen hata:', error)
  }
}

checkWorkspaceData()
