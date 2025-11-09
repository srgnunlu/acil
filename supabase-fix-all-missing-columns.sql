-- ============================================
-- FIX: KOMPRESİF KOLON VE FONKSİYON DÜZELTMESİ
-- ============================================
-- Açıklama: Tüm tabloları kontrol edip eksik kolonları ekler
-- Bu dosyayı supabase-migration-phase1-data-migration.sql ÖNCE çalıştırın
-- ============================================

DO $$
DECLARE
    org_cols INTEGER;
    profile_cols INTEGER;
    patient_cols INTEGER;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STARTING COMPREHENSIVE FIX';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';

    -- ============================================
    -- BÖLÜM 1: ORGANIZATIONS TABLE
    -- ============================================

    RAISE NOTICE '1️⃣  Fixing ORGANIZATIONS table...';

    -- Type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'type'
    ) THEN
        ALTER TABLE organizations
        ADD COLUMN type TEXT DEFAULT 'clinic'
        CHECK (type IN ('hospital', 'clinic', 'health_center', 'private_practice'));
        RAISE NOTICE '   ✅ type column added';
    END IF;

    -- Logo URL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE organizations ADD COLUMN logo_url TEXT;
        RAISE NOTICE '   ✅ logo_url column added';
    END IF;

    -- Settings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'settings'
    ) THEN
        ALTER TABLE organizations
        ADD COLUMN settings JSONB DEFAULT '{
          "timezone": "Europe/Istanbul",
          "language": "tr",
          "date_format": "DD/MM/YYYY",
          "time_format": "24h"
        }'::jsonb;
        RAISE NOTICE '   ✅ settings column added';
    END IF;

    -- Subscription tier
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE organizations
        ADD COLUMN subscription_tier TEXT DEFAULT 'free'
        CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));
        RAISE NOTICE '   ✅ subscription_tier column added';
    END IF;

    -- Subscription status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE organizations
        ADD COLUMN subscription_status TEXT DEFAULT 'active'
        CHECK (subscription_status IN ('active', 'inactive', 'trial', 'cancelled'));
        RAISE NOTICE '   ✅ subscription_status column added';
    END IF;

    -- Trial ends at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'trial_ends_at'
    ) THEN
        ALTER TABLE organizations ADD COLUMN trial_ends_at TIMESTAMPTZ;
        RAISE NOTICE '   ✅ trial_ends_at column added';
    END IF;

    -- Max users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'max_users'
    ) THEN
        ALTER TABLE organizations ADD COLUMN max_users INTEGER DEFAULT 10;
        RAISE NOTICE '   ✅ max_users column added';
    END IF;

    -- Max workspaces
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'max_workspaces'
    ) THEN
        ALTER TABLE organizations ADD COLUMN max_workspaces INTEGER DEFAULT 3;
        RAISE NOTICE '   ✅ max_workspaces column added';
    END IF;

    -- Max patients per workspace
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'max_patients_per_workspace'
    ) THEN
        ALTER TABLE organizations ADD COLUMN max_patients_per_workspace INTEGER DEFAULT 50;
        RAISE NOTICE '   ✅ max_patients_per_workspace column added';
    END IF;

    -- Contact email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE organizations ADD COLUMN contact_email TEXT;
        RAISE NOTICE '   ✅ contact_email column added';
    END IF;

    -- Contact phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'contact_phone'
    ) THEN
        ALTER TABLE organizations ADD COLUMN contact_phone TEXT;
        RAISE NOTICE '   ✅ contact_phone column added';
    END IF;

    -- Address
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'address'
    ) THEN
        ALTER TABLE organizations ADD COLUMN address TEXT;
        RAISE NOTICE '   ✅ address column added';
    END IF;

    RAISE NOTICE '   ✅ Organizations table fixed';
    RAISE NOTICE '';

    -- ============================================
    -- BÖLÜM 2: PROFILES TABLE
    -- ============================================

    RAISE NOTICE '2️⃣  Fixing PROFILES table...';

    -- Current organization ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'current_organization_id'
    ) THEN
        ALTER TABLE profiles
        ADD COLUMN current_organization_id UUID REFERENCES organizations(id);
        RAISE NOTICE '   ✅ current_organization_id column added';
    END IF;

    -- Avatar URL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '   ✅ avatar_url column added';
    END IF;

    -- Title
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'title'
    ) THEN
        ALTER TABLE profiles ADD COLUMN title TEXT;
        RAISE NOTICE '   ✅ title column added';
    END IF;

    -- Phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
        RAISE NOTICE '   ✅ phone column added';
    END IF;

    -- Notification preferences
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'notification_preferences'
    ) THEN
        ALTER TABLE profiles
        ADD COLUMN notification_preferences JSONB DEFAULT '{
          "email": true,
          "push": true,
          "sms": false,
          "mention": true,
          "assignment": true,
          "critical_alerts": true,
          "patient_updates": true,
          "daily_digest": false
        }'::jsonb;
        RAISE NOTICE '   ✅ notification_preferences column added';
    END IF;

    -- Last seen at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'last_seen_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_seen_at TIMESTAMPTZ;
        RAISE NOTICE '   ✅ last_seen_at column added';
    END IF;

    -- Index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'profiles' AND indexname = 'idx_profiles_org'
    ) THEN
        CREATE INDEX idx_profiles_org ON profiles(current_organization_id);
        RAISE NOTICE '   ✅ Index idx_profiles_org created';
    END IF;

    RAISE NOTICE '   ✅ Profiles table fixed';
    RAISE NOTICE '';

    -- ============================================
    -- BÖLÜM 3: PATIENTS TABLE
    -- ============================================

    RAISE NOTICE '3️⃣  Fixing PATIENTS table...';

    -- Workspace ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'workspace_id'
    ) THEN
        ALTER TABLE patients
        ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
        RAISE NOTICE '   ✅ workspace_id column added';
    END IF;

    -- Organization ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE patients
        ADD COLUMN organization_id UUID REFERENCES organizations(id);
        RAISE NOTICE '   ✅ organization_id column added';
    END IF;

    -- Category ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE patients
        ADD COLUMN category_id UUID REFERENCES patient_categories(id);
        RAISE NOTICE '   ✅ category_id column added';
    END IF;

    -- Assigned to
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE patients
        ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
        RAISE NOTICE '   ✅ assigned_to column added';
    END IF;

    -- Admission date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'admission_date'
    ) THEN
        ALTER TABLE patients ADD COLUMN admission_date TIMESTAMPTZ;
        RAISE NOTICE '   ✅ admission_date column added';
    END IF;

    -- Discharge date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'discharge_date'
    ) THEN
        ALTER TABLE patients ADD COLUMN discharge_date TIMESTAMPTZ;
        RAISE NOTICE '   ✅ discharge_date column added';
    END IF;

    -- Workflow state
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'workflow_state'
    ) THEN
        ALTER TABLE patients
        ADD COLUMN workflow_state TEXT DEFAULT 'admission'
        CHECK (workflow_state IN (
            'admission', 'assessment', 'diagnosis', 'treatment',
            'observation', 'discharge_planning', 'discharged'
        ));
        RAISE NOTICE '   ✅ workflow_state column added';
    END IF;

    -- Indexes for patients
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'patients' AND indexname = 'idx_patients_workspace'
    ) THEN
        CREATE INDEX idx_patients_workspace ON patients(workspace_id) WHERE deleted_at IS NULL;
        RAISE NOTICE '   ✅ idx_patients_workspace created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'patients' AND indexname = 'idx_patients_organization'
    ) THEN
        CREATE INDEX idx_patients_organization ON patients(organization_id) WHERE deleted_at IS NULL;
        RAISE NOTICE '   ✅ idx_patients_organization created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'patients' AND indexname = 'idx_patients_category'
    ) THEN
        CREATE INDEX idx_patients_category ON patients(category_id) WHERE deleted_at IS NULL;
        RAISE NOTICE '   ✅ idx_patients_category created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'patients' AND indexname = 'idx_patients_assigned'
    ) THEN
        CREATE INDEX idx_patients_assigned ON patients(assigned_to) WHERE deleted_at IS NULL;
        RAISE NOTICE '   ✅ idx_patients_assigned created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'patients' AND indexname = 'idx_patients_workflow'
    ) THEN
        CREATE INDEX idx_patients_workflow ON patients(workflow_state) WHERE deleted_at IS NULL;
        RAISE NOTICE '   ✅ idx_patients_workflow created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'patients' AND indexname = 'idx_patients_admission'
    ) THEN
        CREATE INDEX idx_patients_admission ON patients(admission_date DESC) WHERE deleted_at IS NULL;
        RAISE NOTICE '   ✅ idx_patients_admission created';
    END IF;

    RAISE NOTICE '   ✅ Patients table fixed';
    RAISE NOTICE '';

    -- ============================================
    -- VERIFICATION SUMMARY
    -- ============================================

    SELECT COUNT(*) INTO org_cols
    FROM information_schema.columns
    WHERE table_name = 'organizations';

    SELECT COUNT(*) INTO profile_cols
    FROM information_schema.columns
    WHERE table_name = 'profiles';

    SELECT COUNT(*) INTO patient_cols
    FROM information_schema.columns
    WHERE table_name = 'patients';

    RAISE NOTICE '============================================';
    RAISE NOTICE 'COMPREHENSIVE FIX SUMMARY';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Organizations table columns: %', org_cols;
    RAISE NOTICE 'Profiles table columns: %', profile_cols;
    RAISE NOTICE 'Patients table columns: %', patient_cols;
    RAISE NOTICE '';
    RAISE NOTICE '✅ ALL FIXES COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run supabase-migration-phase1-data-migration.sql';
    RAISE NOTICE '============================================';
END $$;
