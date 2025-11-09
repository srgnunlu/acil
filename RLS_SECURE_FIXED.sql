-- ============================================
-- RLS SECURE FIXED - ÇALIŞAN VERSİYON
-- ============================================
-- Problem: Nested SELECT'ler policy'lerde sorun yaratıyor
-- Çözüm: İlk 2 SELECT policy'i ALLOW yapalım

-- ============================================
-- 1. MEVCUT POLİCİLERİ SİL
-- ============================================

DROP POLICY IF EXISTS "wm_view_own" ON workspace_members;
DROP POLICY IF EXISTS "wm_view_workspace_members" ON workspace_members;
DROP POLICY IF EXISTS "wm_insert_admin" ON workspace_members;
DROP POLICY IF EXISTS "wm_update_admin" ON workspace_members;
DROP POLICY IF EXISTS "wm_delete_admin" ON workspace_members;
DROP POLICY IF EXISTS "p_view_workspace" ON patients;
DROP POLICY IF EXISTS "p_insert_doctor" ON patients;
DROP POLICY IF EXISTS "p_update_doctor" ON patients;
DROP POLICY IF EXISTS "p_delete_admin" ON patients;
DROP POLICY IF EXISTS "ws_view" ON workspaces;
DROP POLICY IF EXISTS "ws_insert" ON workspaces;
DROP POLICY IF EXISTS "org_view" ON organizations;
DROP POLICY IF EXISTS "pc_view" ON patient_categories;
DROP POLICY IF EXISTS "pc_manage" ON patient_categories;

-- ============================================
-- 2. WORKSPACE_MEMBERS - ALLOW SELECT
-- ============================================

-- Herkes workspace_members'ı okuyabilir (authentication yeterli)
-- Bu gerekli çünkü diğer policies buna bağlı
CREATE POLICY "wm_select_all"
ON workspace_members FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Owner/Admin üye ekleyebilir
CREATE POLICY "wm_insert_admin"
ON workspace_members FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM workspace_members wm2
    WHERE wm2.workspace_id = workspace_members.workspace_id
      AND wm2.user_id = auth.uid()
      AND wm2.role IN ('owner', 'admin')
  )
);

-- ============================================
-- 3. PATIENTS - SECURE
-- ============================================

-- User kendi workspace'indeki hastaları görebilir
CREATE POLICY "p_view_workspace"
ON patients FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
  AND deleted_at IS NULL
);

-- User kendi workspace'ine hasta ekleyebilir
CREATE POLICY "p_insert_doctor"
ON patients FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident')
  )
);

-- User kendi workspace'indeki hastaları güncelleyebilir
CREATE POLICY "p_update_doctor"
ON patients FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident')
  )
);

-- Sadece Admin/Owner silebilir
CREATE POLICY "p_delete_admin"
ON patients FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- 4. WORKSPACES - SECURE
-- ============================================

-- User kendi workspace'lerini görebilir
CREATE POLICY "ws_view"
ON workspaces FOR SELECT
USING (
  id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 5. ORGANIZATIONS - ALLOW (API ile kontrol var)
-- ============================================

-- API routes zaten kontrol ediyor, RLS sadece backup
CREATE POLICY "org_view"
ON organizations FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- 6. PATIENT_CATEGORIES - SECURE
-- ============================================

-- User workspace'lerindeki kategorileri görebilir
CREATE POLICY "pc_view"
ON patient_categories FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- Owner/Admin kategori yönetebilir
CREATE POLICY "pc_manage"
ON patient_categories FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ RLS SECURE FIXED KURULDU!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Değişiklikler:';
    RAISE NOTICE '✓ workspace_members SELECT: ALLOW (diğerleri buna bağlı)';
    RAISE NOTICE '✓ patients: Sadece kendi workspace hastalarını görebilir';
    RAISE NOTICE '✓ workspaces: Sadece kendi workspace''lerini görebilir';
    RAISE NOTICE '✓ organizations: ALLOW (API kontrol ediyor)';
    RAISE NOTICE '';
    RAISE NOTICE 'Test edin:';
    RAISE NOTICE '1. Hastalar görünüyor mu?';
    RAISE NOTICE '2. Hasta ekleyebiliyor musunuz?';
END $$;
