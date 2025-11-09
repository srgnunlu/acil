-- ============================================
-- MEVCUT KULLANICILAR İÇİN DEFAULT WORKSPACE OLUŞTURMA
-- ============================================
-- Bu script, workspace'i olmayan her kullanıcı için:
-- 1. Bir organization oluşturur
-- 2. Bir default workspace oluşturur
-- 3. Kullanıcıyı workspace'e owner olarak ekler
-- 4. Mevcut hastaları bu workspace'e taşır
-- ============================================

DO $$
DECLARE
    v_user RECORD;
    v_org_id UUID;
    v_workspace_id UUID;
    v_patient_count INTEGER;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '🏥 DEFAULT WORKSPACE OLUŞTURMA BAŞLIYOR';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';

    -- Workspace'i olmayan kullanıcıları bul
    FOR v_user IN
        SELECT DISTINCT u.id, u.email, p.full_name
        FROM auth.users u
        LEFT JOIN profiles p ON p.id = u.id
        WHERE NOT EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.user_id = u.id
        )
    LOOP
        RAISE NOTICE '👤 Kullanıcı işleniyor: % (%)', v_user.full_name, v_user.email;

        -- 1. Organization oluştur
        INSERT INTO organizations (
            name,
            slug,
            type,
            settings,
            subscription_tier,
            subscription_status,
            max_users,
            max_workspaces,
            max_patients_per_workspace
        ) VALUES (
            COALESCE(v_user.full_name, split_part(v_user.email, '@', 1)) || '''s Clinic',
            'org-' || substring(v_user.id::text, 1, 8),
            'clinic',
            '{"timezone": "Europe/Istanbul", "language": "tr", "date_format": "DD/MM/YYYY", "time_format": "24h"}'::jsonb,
            'free',
            'trial',
            10,
            3,
            50
        )
        RETURNING id INTO v_org_id;

        RAISE NOTICE '   ✅ Organization oluşturuldu: %', v_org_id;

        -- 2. Default workspace oluştur
        INSERT INTO workspaces (
            organization_id,
            name,
            slug,
            description,
            type,
            color,
            icon,
            settings,
            is_active,
            created_by
        ) VALUES (
            v_org_id,
            'Acil Servis',
            'acil-servis',
            'Ana çalışma alanı',
            'emergency_department',
            '#ef4444',
            '🚑',
            '{"patient_limit": 50, "require_approval_for_new_patients": false, "enable_auto_analysis": true, "enable_notifications": true}'::jsonb,
            true,
            v_user.id
        )
        RETURNING id INTO v_workspace_id;

        RAISE NOTICE '   ✅ Workspace oluşturuldu: %', v_workspace_id;

        -- 3. Kullanıcıyı workspace'e owner olarak ekle
        INSERT INTO workspace_members (
            workspace_id,
            user_id,
            role,
            status,
            invited_by,
            joined_at
        ) VALUES (
            v_workspace_id,
            v_user.id,
            'owner',
            'active',
            v_user.id,
            NOW()
        );

        RAISE NOTICE '   ✅ Kullanıcı workspace''e owner olarak eklendi';

        -- 4. Default kategorileri oluştur
        INSERT INTO patient_categories (workspace_id, name, color, icon, is_default)
        VALUES
            (v_workspace_id, 'Acil', '#ef4444', '🚨', true),
            (v_workspace_id, 'Yatan', '#f59e0b', '🏥', true),
            (v_workspace_id, 'Ayaktan', '#3b82f6', '🚶', true),
            (v_workspace_id, 'Taburcu', '#10b981', '✅', true),
            (v_workspace_id, 'Sevk', '#8b5cf6', '↗️', true);

        RAISE NOTICE '   ✅ Default kategoriler oluşturuldu';

        -- 5. Kullanıcının mevcut hastalarını bu workspace'e taşı
        UPDATE patients
        SET workspace_id = v_workspace_id
        WHERE user_id = v_user.id
          AND workspace_id IS NULL;

        GET DIAGNOSTICS v_patient_count = ROW_COUNT;

        IF v_patient_count > 0 THEN
            RAISE NOTICE '   ✅ % hasta workspace''e taşındı', v_patient_count;
        ELSE
            RAISE NOTICE '   ℹ️  Taşınacak hasta bulunamadı';
        END IF;

        RAISE NOTICE '';
    END LOOP;

    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ TÜM KULLANICILAR İÇİN WORKSPACE OLUŞTURULDU';
    RAISE NOTICE '============================================';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ HATA: %', SQLERRM;
        RAISE;
END $$;
