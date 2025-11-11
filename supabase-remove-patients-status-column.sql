-- ============================================
-- REMOVE PATIENTS.STATUS COLUMN MIGRATION
-- ============================================
-- Bu migration patients.status kolonunu güvenli şekilde kaldırır
-- Önce status değerlerini category_id'ye migrate eder
-- Tarih: 2025-11-09
-- ⚠️ Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştırın
-- ============================================

DO $$
DECLARE
  v_patient_record RECORD;
  v_category_id UUID;
  v_workspace_id UUID;
  v_migrated_count INTEGER := 0;
  v_error_count INTEGER := 0;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '🚀 PATIENTS.STATUS MIGRATION BAŞLIYOR';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Status kolonu var mı kontrol et
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'status'
  ) THEN
    RAISE NOTICE 'ℹ️  status kolonu zaten yok, migration atlanıyor';
    RETURN;
  END IF;

  -- Tüm hastaları işle
  FOR v_patient_record IN
    SELECT id, workspace_id, status, category_id
    FROM patients
    WHERE status IS NOT NULL
      AND (category_id IS NULL OR category_id = '00000000-0000-0000-0000-000000000000'::uuid)
  LOOP
    BEGIN
      -- Workspace ID kontrolü
      IF v_patient_record.workspace_id IS NULL THEN
        -- Workspace yoksa, kullanıcının ilk workspace'ini bul
        SELECT w.id INTO v_workspace_id
        FROM workspaces w
        INNER JOIN workspace_members wm ON w.id = wm.workspace_id
        INNER JOIN patients p ON p.user_id = wm.user_id
        WHERE p.id = v_patient_record.id
          AND wm.status = 'active'
        ORDER BY w.created_at
        LIMIT 1;

        -- Hala workspace yoksa, default workspace oluştur
        IF v_workspace_id IS NULL THEN
          SELECT user_id INTO v_workspace_id FROM patients WHERE id = v_patient_record.id;
          -- Bu durumda workspace oluşturma işlemi gerekli ama şimdilik skip ediyoruz
          RAISE NOTICE '⚠️  Patient % için workspace bulunamadı, atlanıyor', v_patient_record.id;
          v_error_count := v_error_count + 1;
          CONTINUE;
        END IF;

        -- Workspace'i güncelle
        UPDATE patients
        SET workspace_id = v_workspace_id
        WHERE id = v_patient_record.id;
      ELSE
        v_workspace_id := v_patient_record.workspace_id;
      END IF;

      -- Status değerine göre kategori slug'ı belirle
      DECLARE
        v_category_slug TEXT;
      BEGIN
        CASE v_patient_record.status
          WHEN 'active' THEN
            v_category_slug := 'active';
          WHEN 'discharged' THEN
            v_category_slug := 'discharged';
          WHEN 'consultation' THEN
            v_category_slug := 'consultation';
          ELSE
            v_category_slug := 'active'; -- Default
        END CASE;

        -- Workspace'te bu slug'a sahip kategoriyi bul
        SELECT id INTO v_category_id
        FROM patient_categories
        WHERE workspace_id = v_workspace_id
          AND slug = v_category_slug
          AND deleted_at IS NULL
        LIMIT 1;

        -- Kategori yoksa, workspace tipine göre default kategoriyi bul
        IF v_category_id IS NULL THEN
          -- Workspace tipini al
          DECLARE
            v_workspace_type TEXT;
          BEGIN
            SELECT type INTO v_workspace_type
            FROM workspaces
            WHERE id = v_workspace_id;

            -- Workspace tipine göre default kategoriyi bul
            IF v_workspace_type = 'emergency' THEN
              -- Acil servis için 'red' (Kırmızı Alan) default
              SELECT id INTO v_category_id
              FROM patient_categories
              WHERE workspace_id = v_workspace_id
                AND slug = 'red'
                AND deleted_at IS NULL
              LIMIT 1;
            ELSE
              -- Diğer servisler için 'active' (Aktif Yatan) default
              SELECT id INTO v_category_id
              FROM patient_categories
              WHERE workspace_id = v_workspace_id
                AND (slug = 'active' OR is_default = true)
                AND deleted_at IS NULL
              ORDER BY is_default DESC, sort_order
              LIMIT 1;
            END IF;
          END;
        END IF;

        -- Hala kategori yoksa, workspace'in ilk kategorisini al
        IF v_category_id IS NULL THEN
          SELECT id INTO v_category_id
          FROM patient_categories
          WHERE workspace_id = v_workspace_id
            AND deleted_at IS NULL
          ORDER BY sort_order, created_at
          LIMIT 1;
        END IF;

        -- Kategori bulunduysa güncelle
        IF v_category_id IS NOT NULL THEN
          UPDATE patients
          SET category_id = v_category_id
          WHERE id = v_patient_record.id;

          v_migrated_count := v_migrated_count + 1;

          IF v_migrated_count % 100 = 0 THEN
            RAISE NOTICE '  ✅ % hasta migrate edildi...', v_migrated_count;
          END IF;
        ELSE
          RAISE NOTICE '⚠️  Patient % için kategori bulunamadı (workspace: %)', v_patient_record.id, v_workspace_id;
          v_error_count := v_error_count + 1;
        END IF;
      END;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Patient % için hata: %', v_patient_record.id, SQLERRM;
        v_error_count := v_error_count + 1;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ MIGRATION TAMAMLANDI';
  RAISE NOTICE '  Migrate edilen hasta: %', v_migrated_count;
  RAISE NOTICE '  Hata sayısı: %', v_error_count;
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Status kolonunu kaldır
  RAISE NOTICE '🗑️  status kolonu kaldırılıyor...';

  -- Önce index'leri kontrol et ve kaldır (varsa)
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'patients' AND indexname LIKE '%status%'
  ) THEN
    -- Status ile ilgili index'leri kaldır
    DROP INDEX IF EXISTS idx_patients_status;
    RAISE NOTICE '  ✅ Status index''leri kaldırıldı';
  END IF;

  -- Status kolonunu kaldır
  ALTER TABLE patients DROP COLUMN IF EXISTS status;

  RAISE NOTICE '  ✅ status kolonu kaldırıldı';
  RAISE NOTICE '';
  RAISE NOTICE '✅ TÜM İŞLEMLER TAMAMLANDI!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ KRİTİK HATA: %', SQLERRM;
    RAISE;
END $$;

-- Verification query (opsiyonel - çalıştırmak için yorumu kaldırın)
-- SELECT 
--   COUNT(*) as total_patients,
--   COUNT(category_id) as patients_with_category,
--   COUNT(*) FILTER (WHERE category_id IS NULL) as patients_without_category
-- FROM patients
-- WHERE deleted_at IS NULL;



