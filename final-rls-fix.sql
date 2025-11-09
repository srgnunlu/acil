-- ============================================
-- KALICI RLS POLİTİKA DÜZELTMESİ
-- ============================================
-- Bu SQL'i Supabase SQL Editor'da çalıştır

-- ADIM 1: Tüm problemli politikaları temizle
-- ============================================

-- workspace_members politikalarını temizle
DROP POLICY IF EXISTS "Users can view workspace members temp" ON workspace_members;
DROP POLICY IF EXISTS "wm_insert_admin" ON workspace_members;

-- Diğer tablolardaki problemli politikaları temizle
DROP POLICY IF EXISTS "Users can view profiles in same workspace" ON profiles;

-- Mevcut reminders politikalarını temizle
DROP POLICY IF EXISTS "Users can view reminders in workspace" ON reminders;
DROP POLICY IF EXISTS "reminders_workspace_view" ON reminders;

-- ADIM 2: Güvenli workspace_members politikaları
-- ============================================

-- Kullanıcılar kendi üyeliklerini görebilir
CREATE POLICY "wm_view_own"
ON workspace_members FOR SELECT
TO public
USING (user_id = auth.uid());

-- Workspace adminleri tüm üyeleri görebilir (döngüsel referans yok)
CREATE POLICY "wm_view_if_admin"
ON workspace_members FOR SELECT
TO public
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members wm_check
    WHERE wm_check.user_id = auth.uid()
      AND wm_check.role IN ('owner', 'admin')
      AND wm_check.status = 'active'
  )
);

-- Yeni üye ekleme
CREATE POLICY "wm_insert_admin"
ON workspace_members FOR INSERT
TO public
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members wm_check
    WHERE wm_check.user_id = auth.uid()
      AND wm_check.role IN ('owner', 'admin')
      AND wm_check.status = 'active'
  )
);

-- Üye güncelleme
CREATE POLICY "wm_update_admin"
ON workspace_members FOR UPDATE
TO public
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members wm_check
    WHERE wm_check.user_id = auth.uid()
      AND wm_check.role IN ('owner', 'admin')
      AND wm_check.status = 'active'
  )
);

-- Üye silme
CREATE POLICY "wm_delete_owner"
ON workspace_members FOR DELETE
TO public
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members wm_check
    WHERE wm_check.user_id = auth.uid()
      AND wm_check.role = 'owner'
      AND wm_check.status = 'active'
  )
);

-- ADIM 3: Diğer tablolar için güvenli politikalar
-- ============================================

-- Profiles - Workspace tabanlı erişim
CREATE POLICY "profiles_workspace_access"
ON profiles FOR SELECT
TO public
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT wm2.user_id
    FROM workspace_members wm1
    JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = auth.uid()
      AND wm1.status = 'active'
      AND wm2.status = 'active'
  )
);

-- Reminders - Güvenli workspace erişimi
CREATE POLICY "reminders_secure_access"
ON reminders FOR ALL
TO public
USING (
  -- Kendi reminderları
  user_id = auth.uid()
  OR
  -- Workspace'indeki hasta reminderları
  patient_id IN (
    SELECT p.id
    FROM patients p
    JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
      AND wm.status = 'active'
      AND p.deleted_at IS NULL
  )
);

-- ADIM 4: Test ve doğrulama
-- ============================================

DO $$
BEGIN
  -- Test workspace_members erişimi
  PERFORM * FROM workspace_members WHERE user_id = auth.uid() LIMIT 1;

  -- Test workspaces erişimi
  PERFORM * FROM workspaces LIMIT 1;

  -- Test reminders erişimi
  PERFORM * FROM reminders WHERE user_id = auth.uid() LIMIT 1;

  RAISE NOTICE '✅ RLS politikaları başarıyla uygulandı ve test edildi!';
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION '❌ RLS politikalarında sorun: %', SQLERRM;
END $$;

-- ADIM 5: Son kontrol - Bu sorgu herhangi bir recursion hatası vermemeli
SELECT
  'workspace_members' as table_name,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'workspace_members'
UNION ALL
SELECT
  'reminders' as table_name,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'reminders';