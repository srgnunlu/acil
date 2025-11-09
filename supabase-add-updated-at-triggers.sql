-- ============================================
-- ADD UPDATED_AT TRIGGERS FOR ALL MULTI-TENANT TABLES
-- ============================================
-- Bu migration tüm multi-tenant tabloları için updated_at trigger'larını ekler
-- Tarih: 2025-11-09
-- ⚠️ Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştırın
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '🚀 UPDATED_AT TRIGGERS KURULUMU BAŞLIYOR';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- ============================================
  -- UPDATE_UPDATED_AT_COLUMN FUNCTION
  -- ============================================

  RAISE NOTICE '1️⃣  update_updated_at_column fonksiyonu kontrol ediliyor...';

  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  RAISE NOTICE '   ✅ update_updated_at_column fonksiyonu hazır';

  -- ============================================
  -- ORGANIZATIONS TRIGGER
  -- ============================================

  RAISE NOTICE '2️⃣  Organizations trigger kontrol ediliyor...';

  DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
  CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  RAISE NOTICE '   ✅ Organizations trigger hazır';

  -- ============================================
  -- WORKSPACES TRIGGER
  -- ============================================

  RAISE NOTICE '3️⃣  Workspaces trigger kontrol ediliyor...';

  DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
  CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  RAISE NOTICE '   ✅ Workspaces trigger hazır';

  -- ============================================
  -- WORKSPACE_MEMBERS TRIGGER
  -- ============================================

  RAISE NOTICE '4️⃣  Workspace_members trigger kontrol ediliyor...';

  DROP TRIGGER IF EXISTS update_workspace_members_updated_at ON workspace_members;
  CREATE TRIGGER update_workspace_members_updated_at
    BEFORE UPDATE ON workspace_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  RAISE NOTICE '   ✅ Workspace_members trigger hazır';

  -- ============================================
  -- PATIENT_CATEGORIES TRIGGER
  -- ============================================

  RAISE NOTICE '5️⃣  Patient_categories trigger kontrol ediliyor...';

  DROP TRIGGER IF EXISTS update_patient_categories_updated_at ON patient_categories;
  CREATE TRIGGER update_patient_categories_updated_at
    BEFORE UPDATE ON patient_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  RAISE NOTICE '   ✅ Patient_categories trigger hazır';

  -- ============================================
  -- PATIENT_ASSIGNMENTS TRIGGER
  -- ============================================

  RAISE NOTICE '6️⃣  Patient_assignments trigger kontrol ediliyor...';

  -- Patient_assignments tablosunda updated_at kolonu var mı kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_assignments' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_patient_assignments_updated_at ON patient_assignments;
    CREATE TRIGGER update_patient_assignments_updated_at
      BEFORE UPDATE ON patient_assignments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE '   ✅ Patient_assignments trigger hazır';
  ELSE
    RAISE NOTICE '   ℹ️  Patient_assignments tablosunda updated_at kolonu yok, trigger eklenmedi';
  END IF;

  -- ============================================
  -- WORKSPACE_INVITATIONS TRIGGER
  -- ============================================

  RAISE NOTICE '7️⃣  Workspace_invitations trigger kontrol ediliyor...';

  -- Workspace_invitations tablosu var mı kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'workspace_invitations'
  ) THEN
    -- Mevcut trigger'ı kontrol et (migration-phase2'de eklenmiş olabilir)
    DROP TRIGGER IF EXISTS trigger_workspace_invitations_updated_at ON workspace_invitations;
    DROP TRIGGER IF EXISTS update_workspace_invitations_updated_at ON workspace_invitations;
    
    CREATE TRIGGER update_workspace_invitations_updated_at
      BEFORE UPDATE ON workspace_invitations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE '   ✅ Workspace_invitations trigger hazır';
  ELSE
    RAISE NOTICE '   ℹ️  Workspace_invitations tablosu yok, trigger eklenmedi';
  END IF;

  -- ============================================
  -- PATIENTS TRIGGER (eğer updated_at kolonu varsa)
  -- ============================================

  RAISE NOTICE '8️⃣  Patients trigger kontrol ediliyor...';

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
    CREATE TRIGGER update_patients_updated_at
      BEFORE UPDATE ON patients
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE '   ✅ Patients trigger hazır';
  ELSE
    RAISE NOTICE '   ℹ️  Patients tablosunda updated_at kolonu yok, trigger eklenmedi';
  END IF;

  -- ============================================
  -- PROFILES TRIGGER (eğer updated_at kolonu varsa)
  -- ============================================

  RAISE NOTICE '9️⃣  Profiles trigger kontrol ediliyor...';

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE '   ✅ Profiles trigger hazır';
  ELSE
    RAISE NOTICE '   ℹ️  Profiles tablosunda updated_at kolonu yok, trigger eklenmedi';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ TÜM TRIGGER''LAR HAZIR!';
  RAISE NOTICE '============================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ HATA: %', SQLERRM;
    RAISE;
END $$;

