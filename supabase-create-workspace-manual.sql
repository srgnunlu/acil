-- ============================================
-- MANUEL WORKSPACE OLUŞTURMA
-- ============================================
-- KULLANIM: Aşağıdaki 'YOUR_EMAIL@EXAMPLE.COM' kısmını
-- kendi email adresinizle değiştirin ve çalıştırın
-- ============================================

DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT := 'YOUR_EMAIL@EXAMPLE.COM'; -- ← BU SATIRI DEĞİŞTİRİN!
    v_user_name TEXT;
    v_org_id UUID;
    v_workspace_id UUID;
    v_patient_count INTEGER;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '🏥 WORKSPACE OLUŞTURMA BAŞLIYOR';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';

    -- Kullanıcıyı email ile bul
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_user_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Email adresi % ile kullanıcı bulunamadı!', v_user_email;
    END IF;

    -- Kullanıcı adını al
    SELECT full_name INTO v_user_name
    FROM profiles
    WHERE id = v_user_id;

    RAISE NOTICE 'Kullanıcı bulundu:';
    RAISE NOTICE '  ID: %', v_user_id;
    RAISE NOTICE '  Email: %', v_user_email;
    RAISE NOTICE '  İsim: %', COALESCE(v_user_name, 'Belirtilmemiş');
    RAISE NOTICE '';

    -- Workspace var mı kontrol et
    IF EXISTS (
        SELECT 1 FROM workspace_members
        WHERE user_id = v_user_id
    ) THEN
        RAISE NOTICE '⚠️  Bu kullanıcının zaten bir workspace''i var!';
        RAISE NOTICE '';
        RAISE NOTICE 'Mevcut workspace bilgileri:';

        FOR v_workspace_id IN
            SELECT workspace_id FROM workspace_members WHERE user_id = v_user_id
        LOOP
            RAISE NOTICE '  - Workspace ID: %', v_workspace_id;
        END LOOP;

        RAISE NOTICE '';
        RAISE NOTICE 'Eğer yeni workspace oluşturmak istiyorsanız, önce mevcut workspace''i silin.';
        RETURN;
    END IF;

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
        COALESCE(v_user_name, split_part(v_user_email, '@', 1)) || '''s Clinic',
        'org-' || substring(v_user_id::text, 1, 8),
        'clinic',
        '{"timezone": "Europe/Istanbul", "language": "tr", "date_format": "DD/MM/YYYY", "time_format": "24h"}'::jsonb,
        'free',
        'trial',
        10,
        3,
        50
    )
    RETURNING id INTO v_org_id;

    RAISE NOTICE '✅ Organization oluşturuldu: %', v_org_id;

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
        v_user_id
    )
    RETURNING id INTO v_workspace_id;

    RAISE NOTICE '✅ Workspace oluşturuldu: %', v_workspace_id;

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
        v_user_id,
        'owner',
        'active',
        v_user_id,
        NOW()
    );

    RAISE NOTICE '✅ Kullanıcı workspace''e owner olarak eklendi';

    -- 4. Default kategorileri oluştur
    INSERT INTO patient_categories (workspace_id, name, color, icon, is_default)
    VALUES
        (v_workspace_id, 'Acil', '#ef4444', '🚨', true),
        (v_workspace_id, 'Yatan', '#f59e0b', '🏥', true),
        (v_workspace_id, 'Ayaktan', '#3b82f6', '🚶', true),
        (v_workspace_id, 'Taburcu', '#10b981', '✅', true),
        (v_workspace_id, 'Sevk', '#8b5cf6', '↗️', true);

    RAISE NOTICE '✅ Default kategoriler oluşturuldu';

    -- 5. Kullanıcının mevcut hastalarını bu workspace'e taşı
    UPDATE patients
    SET workspace_id = v_workspace_id
    WHERE user_id = v_user_id
      AND workspace_id IS NULL;

    GET DIAGNOSTICS v_patient_count = ROW_COUNT;

    IF v_patient_count > 0 THEN
        RAISE NOTICE '✅ % hasta workspace''e taşındı', v_patient_count;
    ELSE
        RAISE NOTICE 'ℹ️  Taşınacak hasta bulunamadı';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '🎉 WORKSPACE BAŞARIYLA OLUŞTURULDU!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Detaylar:';
    RAISE NOTICE '  Organization ID: %', v_org_id;
    RAISE NOTICE '  Workspace ID: %', v_workspace_id;
    RAISE NOTICE '  Workspace Adı: Acil Servis';
    RAISE NOTICE '  Kullanıcı Rolü: owner';
    RAISE NOTICE '';
    RAISE NOTICE '👉 Şimdi uygulamanızda sayfayı yenileyebilirsiniz!';
    RAISE NOTICE '';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ HATA: %', SQLERRM;
        RAISE;
END $$;
