-- ============================================
-- ORGANIZATIONS INSERT POLICY FIX
-- ============================================
-- Organizations tablosu için INSERT policy eksikliğini düzeltir
-- Tarih: 9 Kasım 2025
-- ============================================

-- Organizations tablosunda RLS aktif mi kontrol et
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'organizations'
  ) THEN
    RAISE EXCEPTION 'Organizations tablosu bulunamadı!';
  END IF;
END $$;

-- RLS'i aktif et (eğer değilse)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Mevcut INSERT policy'yi kontrol et ve yoksa ekle
DO $$
BEGIN
  -- Eğer INSERT policy yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'org_insert_authenticated'
      AND cmd = 'INSERT'
  ) THEN
    -- Authenticated kullanıcılar organization oluşturabilir
    -- (İlk organization'ları için gerekli)
    CREATE POLICY "org_insert_authenticated"
    ON organizations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
    
    RAISE NOTICE '✅ Organizations INSERT policy eklendi: org_insert_authenticated';
  ELSE
    RAISE NOTICE 'ℹ️  Organizations INSERT policy zaten mevcut';
  END IF;
END $$;

-- Mevcut SELECT policy'yi kontrol et ve yoksa ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'org_view_authenticated'
      AND cmd = 'SELECT'
  ) THEN
    -- Authenticated kullanıcılar organization görebilir
    CREATE POLICY "org_view_authenticated"
    ON organizations FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);
    
    RAISE NOTICE '✅ Organizations SELECT policy eklendi: org_view_authenticated';
  ELSE
    RAISE NOTICE 'ℹ️  Organizations SELECT policy zaten mevcut';
  END IF;
END $$;

-- UPDATE policy kontrolü (varsa güncelle, yoksa ekle)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'org_update_owner'
      AND cmd = 'UPDATE'
  ) THEN
    -- Organization owner'ları güncelleyebilir
    CREATE POLICY "org_update_owner"
    ON organizations FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM workspaces w
        INNER JOIN workspace_members wm ON wm.workspace_id = w.id
        WHERE w.organization_id = organizations.id
          AND wm.user_id = auth.uid()
          AND wm.role IN ('owner', 'admin')
          AND wm.status = 'active'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM workspaces w
        INNER JOIN workspace_members wm ON wm.workspace_id = w.id
        WHERE w.organization_id = organizations.id
          AND wm.user_id = auth.uid()
          AND wm.role IN ('owner', 'admin')
          AND wm.status = 'active'
      )
    );
    
    RAISE NOTICE '✅ Organizations UPDATE policy eklendi: org_update_owner';
  ELSE
    RAISE NOTICE 'ℹ️  Organizations UPDATE policy zaten mevcut';
  END IF;
END $$;

-- Sonuç mesajı
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ORGANIZATIONS RLS POLICIES KONTROL EDİLDİ';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Mevcut Policies:';
  RAISE NOTICE '  - SELECT: org_view_authenticated';
  RAISE NOTICE '  - INSERT: org_insert_authenticated';
  RAISE NOTICE '  - UPDATE: org_update_owner';
  RAISE NOTICE '';
  RAISE NOTICE 'Test: Organization oluşturmayı deneyin';
  RAISE NOTICE '============================================';
END $$;

