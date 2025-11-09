-- ============================================
-- MEVCUT DURUM KONTROLÜ
-- ============================================
-- Bu script veritabanınızın şu anki durumunu kontrol eder
-- ve hangi adımları atmanız gerektiğini söyler
-- ============================================

DO $$
DECLARE
    has_organizations BOOLEAN;
    has_workspaces BOOLEAN;
    has_workspace_members BOOLEAN;
    has_patient_categories BOOLEAN;
    has_patient_assignments BOOLEAN;
    org_columns TEXT[];
    profile_columns TEXT[];
    patient_columns TEXT[];
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '🔍 VERITABANI DURUM KONTROLÜ';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';

    -- Tabloların varlığını kontrol et
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'organizations'
    ) INTO has_organizations;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'workspaces'
    ) INTO has_workspaces;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'workspace_members'
    ) INTO has_workspace_members;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'patient_categories'
    ) INTO has_patient_categories;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'patient_assignments'
    ) INTO has_patient_assignments;

    -- Tablolar raporu
    RAISE NOTICE '📊 TABLOLAR:';
    RAISE NOTICE '   Organizations: %', CASE WHEN has_organizations THEN '✅ VAR' ELSE '❌ YOK' END;
    RAISE NOTICE '   Workspaces: %', CASE WHEN has_workspaces THEN '✅ VAR' ELSE '❌ YOK' END;
    RAISE NOTICE '   Workspace Members: %', CASE WHEN has_workspace_members THEN '✅ VAR' ELSE '❌ YOK' END;
    RAISE NOTICE '   Patient Categories: %', CASE WHEN has_patient_categories THEN '✅ VAR' ELSE '❌ YOK' END;
    RAISE NOTICE '   Patient Assignments: %', CASE WHEN has_patient_assignments THEN '✅ VAR' ELSE '❌ YOK' END;
    RAISE NOTICE '';

    -- Eğer organizations varsa, kolonlarını kontrol et
    IF has_organizations THEN
        SELECT ARRAY_AGG(column_name::TEXT)
        INTO org_columns
        FROM information_schema.columns
        WHERE table_name = 'organizations'
          AND column_name IN ('type', 'logo_url', 'settings', 'subscription_tier', 'subscription_status');

        RAISE NOTICE '📋 ORGANIZATIONS KOLONLARI:';
        RAISE NOTICE '   Mevcut önemli kolonlar: %', COALESCE(array_to_string(org_columns, ', '), 'HİÇBİRİ');

        IF 'type' = ANY(org_columns) THEN
            RAISE NOTICE '   ✅ type kolonu var';
        ELSE
            RAISE NOTICE '   ❌ type kolonu eksik';
        END IF;
        RAISE NOTICE '';
    END IF;

    -- Profiles kolonlarını kontrol et
    SELECT ARRAY_AGG(column_name::TEXT)
    INTO profile_columns
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name IN ('current_organization_id', 'avatar_url', 'title', 'phone');

    RAISE NOTICE '📋 PROFILES KOLONLARI:';
    RAISE NOTICE '   Multi-tenant kolonlar: %', COALESCE(array_to_string(profile_columns, ', '), 'HİÇBİRİ');

    IF 'current_organization_id' = ANY(profile_columns) THEN
        RAISE NOTICE '   ✅ current_organization_id kolonu var';
    ELSE
        RAISE NOTICE '   ❌ current_organization_id kolonu eksik';
    END IF;
    RAISE NOTICE '';

    -- Patients kolonlarını kontrol et
    SELECT ARRAY_AGG(column_name::TEXT)
    INTO patient_columns
    FROM information_schema.columns
    WHERE table_name = 'patients'
      AND column_name IN ('workspace_id', 'organization_id', 'category_id', 'assigned_to', 'workflow_state');

    RAISE NOTICE '📋 PATIENTS KOLONLARI:';
    RAISE NOTICE '   Multi-tenant kolonlar: %', COALESCE(array_to_string(patient_columns, ', '), 'HİÇBİRİ');

    IF 'workspace_id' = ANY(patient_columns) THEN
        RAISE NOTICE '   ✅ workspace_id kolonu var';
    ELSE
        RAISE NOTICE '   ❌ workspace_id kolonu eksik';
    END IF;
    RAISE NOTICE '';

    -- Tavsiye
    RAISE NOTICE '============================================';
    RAISE NOTICE '💡 TAVSİYE:';
    RAISE NOTICE '============================================';

    IF NOT has_workspaces THEN
        RAISE NOTICE '❌ WORKSPACES tablosu yok!';
        RAISE NOTICE '';
        RAISE NOTICE '👉 YAPMANIZ GEREKEN:';
        RAISE NOTICE '   1. supabase-migration-phase1-multi-tenant.sql dosyasını çalıştırın';
        RAISE NOTICE '   2. supabase-migration-phase1-data-migration.sql dosyasını çalıştırın';
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Fix dosyalarını (supabase-fix-*.sql) KULLANMAYIN!';
        RAISE NOTICE '   Multi-tenant migration zaten tüm kolonları ekler.';
    ELSIF NOT ('workspace_id' = ANY(patient_columns)) THEN
        RAISE NOTICE '⚠️  Tablolar var ama kolonlar eksik!';
        RAISE NOTICE '';
        RAISE NOTICE '👉 YAPMANIZ GEREKEN:';
        RAISE NOTICE '   1. supabase-migration-phase1-multi-tenant.sql dosyasını tekrar çalıştırın';
        RAISE NOTICE '      (IF NOT EXISTS kullanır, güvenlidir)';
        RAISE NOTICE '   2. supabase-migration-phase1-data-migration.sql dosyasını çalıştırın';
    ELSE
        RAISE NOTICE '✅ Multi-tenant altyapı kurulu görünüyor!';
        RAISE NOTICE '';
        RAISE NOTICE '👉 SON ADIM:';
        RAISE NOTICE '   supabase-migration-phase1-data-migration.sql dosyasını çalıştırın';
        RAISE NOTICE '   (Mevcut verileri taşımak için)';
    END IF;

    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📖 Detaylı bilgi için MIGRATION-README.md dosyasına bakın';
    RAISE NOTICE '============================================';
END $$;
