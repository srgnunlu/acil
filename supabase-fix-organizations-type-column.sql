-- ============================================
-- FIX: ORGANIZATIONS TABLE - TYPE COLUMN
-- ============================================
-- Açıklama: organizations tablosuna eksik olan 'type' kolonunu ekler
-- Bu dosyayı supabase-migration-phase1-data-migration.sql öncesinde çalıştırın
-- ============================================

-- Type kolonunu ekle (eğer yoksa)
DO $$
BEGIN
    -- Type kolonu var mı kontrol et
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'type'
    ) THEN
        -- Type kolonunu ekle
        ALTER TABLE organizations
        ADD COLUMN type TEXT DEFAULT 'clinic'
        CHECK (type IN ('hospital', 'clinic', 'health_center', 'private_practice'));

        RAISE NOTICE '✅ Type column added to organizations table';
    ELSE
        RAISE NOTICE 'ℹ️  Type column already exists';
    END IF;
END $$;

-- Diğer potansiyel eksik kolonları da kontrol et ve ekle

-- Logo URL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE organizations ADD COLUMN logo_url TEXT;
        RAISE NOTICE '✅ logo_url column added';
    END IF;
END $$;

-- Settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'settings'
    ) THEN
        ALTER TABLE organizations
        ADD COLUMN settings JSONB DEFAULT '{
          "timezone": "Europe/Istanbul",
          "language": "tr",
          "date_format": "DD/MM/YYYY",
          "time_format": "24h"
        }'::jsonb;
        RAISE NOTICE '✅ settings column added';
    END IF;
END $$;

-- Subscription tier
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE organizations
        ADD COLUMN subscription_tier TEXT DEFAULT 'free'
        CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));
        RAISE NOTICE '✅ subscription_tier column added';
    END IF;
END $$;

-- Subscription status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE organizations
        ADD COLUMN subscription_status TEXT DEFAULT 'active'
        CHECK (subscription_status IN ('active', 'inactive', 'trial', 'cancelled'));
        RAISE NOTICE '✅ subscription_status column added';
    END IF;
END $$;

-- Trial ends at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'trial_ends_at'
    ) THEN
        ALTER TABLE organizations ADD COLUMN trial_ends_at TIMESTAMPTZ;
        RAISE NOTICE '✅ trial_ends_at column added';
    END IF;
END $$;

-- Max users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'max_users'
    ) THEN
        ALTER TABLE organizations ADD COLUMN max_users INTEGER DEFAULT 10;
        RAISE NOTICE '✅ max_users column added';
    END IF;
END $$;

-- Max workspaces
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'max_workspaces'
    ) THEN
        ALTER TABLE organizations ADD COLUMN max_workspaces INTEGER DEFAULT 3;
        RAISE NOTICE '✅ max_workspaces column added';
    END IF;
END $$;

-- Max patients per workspace
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'max_patients_per_workspace'
    ) THEN
        ALTER TABLE organizations ADD COLUMN max_patients_per_workspace INTEGER DEFAULT 50;
        RAISE NOTICE '✅ max_patients_per_workspace column added';
    END IF;
END $$;

-- Contact email
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE organizations ADD COLUMN contact_email TEXT;
        RAISE NOTICE '✅ contact_email column added';
    END IF;
END $$;

-- Contact phone
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'contact_phone'
    ) THEN
        ALTER TABLE organizations ADD COLUMN contact_phone TEXT;
        RAISE NOTICE '✅ contact_phone column added';
    END IF;
END $$;

-- Address
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        AND column_name = 'address'
    ) THEN
        ALTER TABLE organizations ADD COLUMN address TEXT;
        RAISE NOTICE '✅ address column added';
    END IF;
END $$;

-- Verification summary
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'organizations';

    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ORGANIZATIONS TABLE FIX SUMMARY';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total columns in organizations table: %', column_count;
    RAISE NOTICE '✅ Fix completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run supabase-migration-phase1-data-migration.sql';
    RAISE NOTICE '============================================';
END $$;
