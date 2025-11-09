-- ============================================
-- RLS COMPLETE POLICIES - Eksik Policies'leri Ekle
-- ============================================
-- Bu script, RLS test sonuçlarına göre eksik policies'leri ekler
-- Tarih: 9 Kasım 2025
-- ============================================

-- ============================================
-- 1. WORKSPACE_MEMBERS - Eksik Policies
-- ============================================

-- UPDATE Policy: Admin/Owner üyeleri güncelleyebilir
DROP POLICY IF EXISTS "wm_update_admin" ON workspace_members;
CREATE POLICY "wm_update_admin"
ON workspace_members FOR UPDATE
USING (
  -- Güncelleme yapan kişi admin veya owner olmalı
  EXISTS (
    SELECT 1 FROM workspace_members wm_check
    WHERE wm_check.workspace_id = workspace_members.workspace_id
      AND wm_check.user_id = auth.uid()
      AND wm_check.role IN ('owner', 'admin')
      AND wm_check.status = 'active'
  )
)
WITH CHECK (
  -- Güncelleme sonrası da aynı kontrol
  EXISTS (
    SELECT 1 FROM workspace_members wm_check
    WHERE wm_check.workspace_id = workspace_members.workspace_id
      AND wm_check.user_id = auth.uid()
      AND wm_check.role IN ('owner', 'admin')
      AND wm_check.status = 'active'
  )
);

-- DELETE Policy: Sadece Owner silebilir (admin bile silemez, sadece owner)
DROP POLICY IF EXISTS "wm_delete_owner" ON workspace_members;
CREATE POLICY "wm_delete_owner"
ON workspace_members FOR DELETE
USING (
  -- Silme yapan kişi owner olmalı
  EXISTS (
    SELECT 1 FROM workspace_members wm_check
    WHERE wm_check.workspace_id = workspace_members.workspace_id
      AND wm_check.user_id = auth.uid()
      AND wm_check.role = 'owner'
      AND wm_check.status = 'active'
  )
  -- Kendi üyeliğini silemez (en az bir owner kalmalı)
  AND NOT (
    workspace_members.user_id = auth.uid()
    AND workspace_members.role = 'owner'
    AND (
      SELECT COUNT(*) FROM workspace_members wm_count
      WHERE wm_count.workspace_id = workspace_members.workspace_id
        AND wm_count.role = 'owner'
        AND wm_count.status = 'active'
    ) <= 1
  )
);

-- INSERT Policy zaten var (wm_insert_admin), kontrol edelim
-- Eğer yoksa ekleyelim
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workspace_members'
    AND policyname = 'wm_insert_admin'
    AND cmd = 'INSERT'
  ) THEN
    CREATE POLICY "wm_insert_admin"
    ON workspace_members FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM workspace_members wm2
        WHERE wm2.workspace_id = workspace_members.workspace_id
          AND wm2.user_id = auth.uid()
          AND wm2.role IN ('owner', 'admin')
          AND wm2.status = 'active'
      )
    );
  END IF;
END $$;

-- ============================================
-- 2. WORKSPACES - Eksik DELETE Policy
-- ============================================

-- DELETE Policy: Sadece Owner workspace'i silebilir
DROP POLICY IF EXISTS "ws_delete_owner" ON workspaces;
CREATE POLICY "ws_delete_owner"
ON workspaces FOR DELETE
USING (
  -- Silme yapan kişi owner olmalı
  EXISTS (
    SELECT 1 FROM workspace_members wm_check
    WHERE wm_check.workspace_id = workspaces.id
      AND wm_check.user_id = auth.uid()
      AND wm_check.role = 'owner'
      AND wm_check.status = 'active'
  )
  -- Workspace'te aktif hasta olmamalı (soft delete kullanılıyor, bu kontrol opsiyonel)
  AND NOT EXISTS (
    SELECT 1 FROM patients p
    WHERE p.workspace_id = workspaces.id
      AND p.deleted_at IS NULL
  )
);

-- ============================================
-- 3. PATIENT_CATEGORIES - Eksik Policies
-- ============================================

-- pc_manage policy'si ALL için var ama ayrı ayrı da ekleyelim (daha açık olması için)
-- INSERT Policy: Admin/Senior Doctor kategori ekleyebilir
DROP POLICY IF EXISTS "pc_insert_admin" ON patient_categories;
CREATE POLICY "pc_insert_admin"
ON patient_categories FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'senior_doctor')
      AND status = 'active'
  )
);

-- UPDATE Policy: Admin/Senior Doctor kategori güncelleyebilir
DROP POLICY IF EXISTS "pc_update_admin" ON patient_categories;
CREATE POLICY "pc_update_admin"
ON patient_categories FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'senior_doctor')
      AND status = 'active'
  )
  -- Sistem kategorileri güncellenemez
  AND is_system = false
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'senior_doctor')
      AND status = 'active'
  )
  -- Sistem kategorileri güncellenemez
  AND is_system = false
);

-- DELETE Policy: Admin/Senior Doctor kategori silebilir
DROP POLICY IF EXISTS "pc_delete_admin" ON patient_categories;
CREATE POLICY "pc_delete_admin"
ON patient_categories FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'senior_doctor')
      AND status = 'active'
  )
  -- Sistem kategorileri silinemez
  AND is_system = false
  -- Kategoriye ait hasta olmamalı
  AND NOT EXISTS (
    SELECT 1 FROM patients p
    WHERE p.category_id = patient_categories.id
      AND p.deleted_at IS NULL
  )
);

-- ============================================
-- 4. ORGANIZATIONS - DELETE Policy (Opsiyonel)
-- ============================================

-- DELETE Policy: Sadece Owner silebilir
-- Not: Organizations genelde silinmez, soft delete kullanılır
-- Ama güvenlik için policy ekleyelim
DROP POLICY IF EXISTS "org_delete_owner" ON organizations;
CREATE POLICY "org_delete_owner"
ON organizations FOR DELETE
USING (
  -- Organization'ın owner'ı olmalı (workspace owner'larından biri)
  EXISTS (
    SELECT 1 FROM workspaces w
    INNER JOIN workspace_members wm ON wm.workspace_id = w.id
    WHERE w.organization_id = organizations.id
      AND wm.user_id = auth.uid()
      AND wm.role = 'owner'
      AND wm.status = 'active'
  )
  -- Organization'da aktif workspace olmamalı
  AND NOT EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.organization_id = organizations.id
      AND w.deleted_at IS NULL
  )
);

-- ============================================
-- 5. VIEW POLICIES (Görünürlük için)
-- ============================================

-- Workspace_members için admin görünürlüğü (zaten var ama kontrol edelim)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workspace_members'
    AND policyname = 'wm_view_if_admin'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "wm_view_if_admin"
    ON workspace_members FOR SELECT
    USING (
      workspace_id IN (
        SELECT workspace_id
        FROM workspace_members wm_check
        WHERE wm_check.user_id = auth.uid()
          AND wm_check.role IN ('owner', 'admin')
          AND wm_check.status = 'active'
      )
    );
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ RLS COMPLETE POLICIES EKLENDİ!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Eklenen Policies:';
    RAISE NOTICE '✓ workspace_members.UPDATE (admin/owner)';
    RAISE NOTICE '✓ workspace_members.DELETE (owner only)';
    RAISE NOTICE '✓ workspaces.DELETE (owner only)';
    RAISE NOTICE '✓ patient_categories.INSERT (admin/senior_doctor)';
    RAISE NOTICE '✓ patient_categories.UPDATE (admin/senior_doctor)';
    RAISE NOTICE '✓ patient_categories.DELETE (admin/senior_doctor)';
    RAISE NOTICE '✓ organizations.DELETE (owner only)';
    RAISE NOTICE '';
    RAISE NOTICE 'Test edin:';
    RAISE NOTICE '1. Admin workspace member güncelleyebiliyor mu?';
    RAISE NOTICE '2. Owner workspace silebiliyor mu?';
    RAISE NOTICE '3. Admin patient category ekleyebiliyor mu?';
END $$;

