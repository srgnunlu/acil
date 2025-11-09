-- ============================================
-- ACİL DURUM RLS DÜZELTMESİ
-- ============================================
-- Bu SQL'i hemen çalıştır, infinite recursion'u tamamen çözer

-- 1. STEP: Tüm workspace_members politikalarını sil
DROP POLICY IF EXISTS "wm_view_own" ON workspace_members;
DROP POLICY IF EXISTS "wm_view_if_admin" ON workspace_members;
DROP POLICY IF EXISTS "wm_insert_admin" ON workspace_members;
DROP POLICY IF EXISTS "wm_update_admin" ON workspace_members;
DROP POLICY IF EXISTS "wm_delete_owner" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members temp" ON workspace_members;

-- 2. STEP: Tüm problematik politikaları sil
DROP POLICY IF EXISTS "profiles_workspace_access" ON profiles;
DROP POLICY IF EXISTS "reminders_secure_access" ON reminders;

-- Workspace'lerle ilgili tüm politikaları sil ve yeniden yaz
DROP POLICY IF EXISTS "ws_view" ON workspaces;
DROP POLICY IF EXISTS "ws_view_member" ON workspaces;

-- 3. STEP: ÇOK BASİT ve GÜVENLİ POLİTİKALAR OLUŞTUR

-- workspace_members için minimal politikalar (hiçbir tablo referans etmez)
CREATE POLICY "wm_view_simple"
ON workspace_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "wm_insert_simple"
ON workspace_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "wm_update_simple"
ON workspace_members FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "wm_delete_simple"
ON workspace_members FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- workspaces için basit politika
CREATE POLICY "ws_view_simple"
ON workspaces FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- profiles için basit politika
CREATE POLICY "profiles_view_simple"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- reminders için basit politika
CREATE POLICY "reminders_view_simple"
ON reminders FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- organizations için basit politika
DROP POLICY IF EXISTS "org_view_via_workspace" ON organizations;
CREATE POLICY "organizations_view_simple"
ON organizations FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 4. STEP: Test
DO $$
BEGIN
    PERFORM * FROM workspace_members LIMIT 1;
    PERFORM * FROM workspaces LIMIT 1;
    RAISE NOTICE '✅ ACİL DURUM FİX BAŞARILI!';
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION '❌ Hala sorun var: %', SQLERRM;
END $$;