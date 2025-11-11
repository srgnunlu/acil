#!/usr/bin/env tsx
/**
 * Phase 3 Migration Runner
 *
 * Bu script Phase 3 migration SQL dosyasını Supabase'e çalıştırır.
 *
 * Kullanım:
 *   npx tsx scripts/run-phase3-migration.ts
 *
 * Gereksinimler:
 *   - NEXT_PUBLIC_SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Environment variables eksik!')
  console.error('Gerekli: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  console.error('\n💡 Alternatif: Supabase Dashboard > SQL Editor üzerinden çalıştırın')
  process.exit(1)
}

async function runMigration() {
  console.log('🚀 Phase 3 Migration başlatılıyor...\n')

  // SQL dosyasını oku
  const sqlFile = join(process.cwd(), 'supabase-migration-phase3-realtime.sql')
  const sql = readFileSync(sqlFile, 'utf-8')

  console.log(`📄 SQL dosyası okundu: ${sql.split('\n').length} satır\n`)

  try {
    // Supabase'de doğrudan SQL çalıştırma endpoint'i yok
    // Bu yüzden kullanıcıya Dashboard üzerinden çalıştırmasını söylemeliyiz
    console.log('⚠️  Supabase JavaScript client ile doğrudan SQL çalıştırma desteklenmiyor.')
    console.log('📋 Lütfen aşağıdaki adımları takip edin:\n')
    console.log("1. Supabase Dashboard'a gidin: https://supabase.com/dashboard")
    console.log('2. Projenizi seçin')
    console.log('3. Sol menüden "SQL Editor"a gidin')
    console.log('4. "New Query" butonuna tıklayın')
    console.log('5. Aşağıdaki SQL dosyasını kopyalayıp yapıştırın:')
    console.log(`   ${sqlFile}\n`)
    console.log('6. "Run" butonuna tıklayın\n')

    console.log('📝 SQL dosyası hazır. Supabase Dashboard üzerinden çalıştırın.')
  } catch (error) {
    console.error('❌ Hata:', error)
    console.error('\n💡 Alternatif: Supabase Dashboard > SQL Editor üzerinden çalıştırın')
    process.exit(1)
  }
}

runMigration()
