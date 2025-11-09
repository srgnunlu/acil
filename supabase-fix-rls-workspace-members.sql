-- ============================================
-- WORKSPACE_MEMBERS RLS POLICY DÜZELTMESİ
-- ============================================
-- Bu script workspace_members için doğru RLS policy oluşturur
-- ============================================

-- Önce eski policy'leri sil
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can manage members" ON workspace_members;

-- Yeni basit policy: Kullanıcı kendi kayıtlarını görebilir
CREATE POLICY "Users can view their own memberships"
ON workspace_members FOR SELECT
USING (user_id = auth.uid());

-- Kullanıcı kendi workspace'indeki diğer member'ları da görebilir
CREATE POLICY "Users can view members in their workspaces"
ON workspace_members FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
  )
);

-- Owner/admin member ekleyebilir
CREATE POLICY "Owners and admins can insert members"
ON workspace_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
      AND wm.status = 'active'
  )
);

-- Owner/admin member güncelleyebilir
CREATE POLICY "Owners and admins can update members"
ON workspace_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
      AND wm.status = 'active'
  )
);

-- Owner/admin member silebilir
CREATE POLICY "Owners and admins can delete members"
ON workspace_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
      AND wm.status = 'active'
  )
);

-- ============================================
-- TEST
-- ============================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ WORKSPACE_MEMBERS RLS POLİCY''LERİ GÜNCELLENDİ';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Test ediliyor...';

    -- Test: Kullanıcının workspace'lerini görüp göremediğini kontrol et
    SELECT COUNT(*) INTO v_count
    FROM workspace_members
    WHERE user_id = auth.uid();

    IF v_count > 0 THEN
        RAISE NOTICE '✅ Kullanıcının % workspace üyeliği bulundu', v_count;
    ELSE
        RAISE NOTICE '⚠️  Kullanıcının workspace üyeliği bulunamadı (RLS çalışıyor olabilir)';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '👉 Şimdi uygulamanızı yenileyin!';
END $$;
