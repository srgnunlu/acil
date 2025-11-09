-- ============================================
-- FAZ 1: MEVCUT DATA MIGRATION SCRIPT
-- ============================================
-- ACIL - Existing Data Migration to Multi-Tenant
-- Tarih: 2025-11-08
-- Açıklama: Mevcut kullanıcılar ve hastaları yeni multi-tenant yapıya taşır
-- ⚠️ Bu dosyayı "supabase-migration-phase1-multi-tenant.sql" SONRASINDA çalıştırın
-- ============================================

-- ============================================
-- BÖLÜM 1: HER KULLANICI İÇİN DEFAULT ORGANIZATION OLUŞTUR
-- ============================================

DO $$
DECLARE
  user_record RECORD;
  v_org_id UUID;
  v_workspace_id UUID;
  v_default_category_id UUID;
BEGIN
  -- Her benzersiz user için işlem yap
  FOR user_record IN
    SELECT DISTINCT
      p.user_id,
      p.full_name,
      p.specialty,
      p.institution
    FROM profiles p
    WHERE p.user_id IS NOT NULL
  LOOP
    RAISE NOTICE 'Processing user: % (ID: %)', user_record.full_name, user_record.user_id;

    -- 1. Default organization oluştur (eğer yoksa)
    SELECT id INTO v_org_id
    FROM organizations
    WHERE slug = 'org-' || user_record.user_id::text;

    IF v_org_id IS NULL THEN
      INSERT INTO organizations (
        name,
        slug,
        type,
        subscription_tier,
        subscription_status,
        max_users,
        max_workspaces,
        max_patients_per_workspace
      ) VALUES (
        COALESCE(user_record.institution, user_record.full_name || '''nın Kliniği', 'Klinik'),
        'org-' || user_record.user_id::text,
        'clinic',
        'free',
        'active',
        10,
        3,
        50
      ) RETURNING id INTO v_org_id;

      RAISE NOTICE '  ✅ Organization created: %', v_org_id;
    ELSE
      RAISE NOTICE '  ℹ️  Organization already exists: %', v_org_id;
    END IF;

    -- 2. Profiles tablosunda current_organization_id güncelle
    UPDATE profiles
    SET current_organization_id = v_org_id
    WHERE user_id = user_record.user_id;

    RAISE NOTICE '  ✅ Profile updated with organization';

    -- 3. Default workspace oluştur (eğer yoksa)
    SELECT w.id INTO v_workspace_id
    FROM workspaces w
    WHERE w.organization_id = v_org_id
      AND w.slug = 'default';

    IF v_workspace_id IS NULL THEN
      INSERT INTO workspaces (
        organization_id,
        name,
        slug,
        description,
        type,
        color,
        icon,
        is_active,
        created_by
      ) VALUES (
        v_org_id,
        CASE
          WHEN user_record.specialty = 'Acil Tıp' THEN 'Acil Servis'
          WHEN user_record.specialty = 'Kardiyoloji' THEN 'Kardiyoloji Servisi'
          WHEN user_record.specialty = 'Dahiliye' THEN 'Dahiliye Servisi'
          ELSE 'Genel Servis'
        END,
        'default',
        'Varsayılan çalışma alanı',
        CASE
          WHEN user_record.specialty = 'Acil Tıp' THEN 'emergency'
          WHEN user_record.specialty = 'Kardiyoloji' THEN 'cardiology'
          ELSE 'general'
        END,
        '#3b82f6',
        CASE
          WHEN user_record.specialty = 'Acil Tıp' THEN '🚑'
          WHEN user_record.specialty = 'Kardiyoloji' THEN '❤️'
          ELSE '🏥'
        END,
        true,
        user_record.user_id
      ) RETURNING id INTO v_workspace_id;

      RAISE NOTICE '  ✅ Workspace created: %', v_workspace_id;

      -- Not: handle_new_workspace trigger otomatik olarak:
      -- - Default kategorileri oluşturur
      -- - Workspace owner'ını workspace_members'a ekler
    ELSE
      RAISE NOTICE '  ℹ️  Workspace already exists: %', v_workspace_id;
    END IF;

    -- 4. Default kategoriyi bul (workspace için)
    SELECT pc.id INTO v_default_category_id
    FROM patient_categories pc
    WHERE pc.workspace_id = v_workspace_id
      AND pc.is_default = true
    LIMIT 1;

    IF v_default_category_id IS NULL THEN
      -- Eğer yoksa, ilk kategoriyi seç
      SELECT pc.id INTO v_default_category_id
      FROM patient_categories pc
      WHERE pc.workspace_id = v_workspace_id
      ORDER BY pc.sort_order
      LIMIT 1;
    END IF;

    RAISE NOTICE '  ✅ Default category: %', v_default_category_id;

    -- 5. Kullanıcının hastalarını yeni workspace'e taşı
    UPDATE patients p
    SET
      workspace_id = v_workspace_id,
      organization_id = v_org_id,
      category_id = v_default_category_id,
      assigned_to = user_record.user_id,
      admission_date = COALESCE(p.admission_date, p.created_at),
      workflow_state = CASE
        WHEN p.status = 'active' THEN 'treatment'
        WHEN p.status = 'discharged' THEN 'discharged'
        WHEN p.status = 'consultation' THEN 'assessment'
        ELSE 'admission'
      END
    WHERE p.user_id = user_record.user_id
      AND p.workspace_id IS NULL; -- Sadece henüz taşınmamış hastaları

    RAISE NOTICE '  ✅ Patients migrated to workspace';

    -- 6. Primary assignment oluştur (her hasta için)
    INSERT INTO patient_assignments (patient_id, user_id, assignment_type, assigned_by, is_active)
    SELECT
      p.id,
      p.assigned_to,
      'primary',
      p.assigned_to,
      true
    FROM patients p
    WHERE p.workspace_id = v_workspace_id
      AND p.assigned_to IS NOT NULL
    ON CONFLICT (patient_id, user_id, assignment_type) DO NOTHING;

    RAISE NOTICE '  ✅ Patient assignments created';
    RAISE NOTICE '';

  END LOOP;

  RAISE NOTICE '🎉 Data migration completed successfully!';
END $$;

-- ============================================
-- BÖLÜM 2: VERİFİKASYON
-- ============================================

-- Migration sonuçlarını kontrol et
DO $$
DECLARE
  org_count INTEGER;
  workspace_count INTEGER;
  member_count INTEGER;
  category_count INTEGER;
  migrated_patient_count INTEGER;
  assignment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO workspace_count FROM workspaces WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO member_count FROM workspace_members WHERE status = 'active';
  SELECT COUNT(*) INTO category_count FROM patient_categories WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO migrated_patient_count FROM patients WHERE workspace_id IS NOT NULL AND deleted_at IS NULL;
  SELECT COUNT(*) INTO assignment_count FROM patient_assignments WHERE is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Organizations created: %', org_count;
  RAISE NOTICE 'Workspaces created: %', workspace_count;
  RAISE NOTICE 'Workspace members: %', member_count;
  RAISE NOTICE 'Patient categories: %', category_count;
  RAISE NOTICE 'Migrated patients: %', migrated_patient_count;
  RAISE NOTICE 'Patient assignments: %', assignment_count;
  RAISE NOTICE '============================================';
END $$;

-- Detaylı istatistikler
SELECT
  o.name AS organization_name,
  w.name AS workspace_name,
  w.type AS workspace_type,
  COUNT(DISTINCT wm.user_id) AS member_count,
  COUNT(DISTINCT p.id) AS patient_count,
  COUNT(DISTINCT pc.id) AS category_count
FROM organizations o
LEFT JOIN workspaces w ON o.id = w.organization_id AND w.deleted_at IS NULL
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.status = 'active'
LEFT JOIN patients p ON w.id = p.workspace_id AND p.deleted_at IS NULL
LEFT JOIN patient_categories pc ON w.id = pc.workspace_id AND pc.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name, w.id, w.name, w.type
ORDER BY o.name, w.name;

-- ============================================
-- BÖLÜM 3: ROLLBACK (Gerekirse)
-- ============================================

-- ⚠️ Dikkat: Bu bölümü sadece migration'ı geri almak istiyorsanız çalıştırın

/*
-- Rollback script:

-- 1. Patient assignments'ları temizle
DELETE FROM patient_assignments;

-- 2. Patients tablosundaki yeni alanları temizle
UPDATE patients
SET
  workspace_id = NULL,
  organization_id = NULL,
  category_id = NULL,
  assigned_to = NULL,
  admission_date = NULL,
  discharge_date = NULL,
  workflow_state = 'admission';

-- 3. Profiles tablosundaki yeni alanları temizle
UPDATE profiles
SET
  current_organization_id = NULL,
  avatar_url = NULL,
  title = NULL,
  phone = NULL,
  notification_preferences = '{
    "email": true,
    "push": true,
    "sms": false,
    "mention": true,
    "assignment": true,
    "critical_alerts": true,
    "patient_updates": true,
    "daily_digest": false
  }'::jsonb,
  last_seen_at = NULL;

-- 4. Yeni tabloları sil (CASCADE ile ilişkili kayıtlar da silinir)
DROP TABLE IF EXISTS patient_assignments CASCADE;
DROP TABLE IF EXISTS patient_categories CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 5. Functions'ları sil
DROP FUNCTION IF EXISTS create_default_categories;
DROP FUNCTION IF EXISTS handle_new_workspace;
DROP FUNCTION IF EXISTS get_user_workspaces;
DROP FUNCTION IF EXISTS user_has_permission;

-- 6. Eski patients RLS policies'i geri yükle
DROP POLICY IF EXISTS "Users can view workspace patients" ON patients;
CREATE POLICY "Users can view own patients" ON patients
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert workspace patients" ON patients;
CREATE POLICY "Users can insert own patients" ON patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update workspace patients" ON patients;
CREATE POLICY "Users can update own patients" ON patients
  FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins can delete workspace patients" ON patients;
CREATE POLICY "Users can delete own patients" ON patients
  FOR DELETE USING (auth.uid() = user_id);

*/

-- ============================================
-- ✅ DATA MIGRATION TAMAMLANDI!
-- ============================================
--
-- Yapılanlar:
-- ✅ Her kullanıcı için default organization oluşturuldu
-- ✅ Her organization için default workspace oluşturuldu
-- ✅ Her workspace için default kategoriler oluşturuldu
-- ✅ Kullanıcılar workspace owner olarak eklendi
-- ✅ Mevcut hastalar workspace'lere taşındı
-- ✅ Hasta kategorileri atandı
-- ✅ Primary doctor assignments oluşturuldu
-- ✅ Workflow states güncellendi
--
-- Sonraki adım:
-- - Backend API endpoints oluşturma
-- - Frontend UI components
-- - Test etme
-- ============================================
