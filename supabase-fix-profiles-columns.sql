-- ============================================
-- FIX: PROFILES TABLE - MISSING COLUMNS
-- ============================================
-- Açıklama: profiles tablosuna multi-tenant için gerekli eksik kolonları ekler
-- Bu dosyayı supabase-migration-phase1-data-migration.sql öncesinde çalıştırın
-- ============================================

-- Current organization ID
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'current_organization_id'
    ) THEN
        ALTER TABLE profiles
        ADD COLUMN current_organization_id UUID REFERENCES organizations(id);

        RAISE NOTICE '✅ current_organization_id column added to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️  current_organization_id column already exists';
    END IF;
END $$;

-- Avatar URL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✅ avatar_url column added';
    ELSE
        RAISE NOTICE 'ℹ️  avatar_url column already exists';
    END IF;
END $$;

-- Title (Dr., Prof. Dr., Uzm. Dr.)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'title'
    ) THEN
        ALTER TABLE profiles ADD COLUMN title TEXT;
        RAISE NOTICE '✅ title column added';
    ELSE
        RAISE NOTICE 'ℹ️  title column already exists';
    END IF;
END $$;

-- Phone
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
        RAISE NOTICE '✅ phone column added';
    ELSE
        RAISE NOTICE 'ℹ️  phone column already exists';
    END IF;
END $$;

-- Notification preferences
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'notification_preferences'
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
        RAISE NOTICE '✅ notification_preferences column added';
    ELSE
        RAISE NOTICE 'ℹ️  notification_preferences column already exists';
    END IF;
END $$;

-- Last seen at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'last_seen_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_seen_at TIMESTAMPTZ;
        RAISE NOTICE '✅ last_seen_at column added';
    ELSE
        RAISE NOTICE 'ℹ️  last_seen_at column already exists';
    END IF;
END $$;

-- Create index on current_organization_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'profiles'
        AND indexname = 'idx_profiles_org'
    ) THEN
        CREATE INDEX idx_profiles_org ON profiles(current_organization_id);
        RAISE NOTICE '✅ Index idx_profiles_org created';
    ELSE
        RAISE NOTICE 'ℹ️  Index idx_profiles_org already exists';
    END IF;
END $$;

-- Verification summary
DO $$
DECLARE
    column_count INTEGER;
    new_columns TEXT[];
BEGIN
    -- Check which new columns exist
    new_columns := ARRAY(
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name IN (
            'current_organization_id',
            'avatar_url',
            'title',
            'phone',
            'notification_preferences',
            'last_seen_at'
        )
        ORDER BY column_name
    );

    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'profiles';

    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PROFILES TABLE FIX SUMMARY';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total columns in profiles table: %', column_count;
    RAISE NOTICE 'Multi-tenant columns present: %', array_length(new_columns, 1);
    RAISE NOTICE 'Columns: %', array_to_string(new_columns, ', ');
    RAISE NOTICE '✅ Fix completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run supabase-migration-phase1-data-migration.sql';
    RAISE NOTICE '============================================';
END $$;
