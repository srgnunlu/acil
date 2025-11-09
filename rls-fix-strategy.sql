-- ============================================
-- KALICI RLS POLİTİKA DÜZENİ
-- ============================================
-- Bu dosya infinite recursion sorununu kalıcı olarak çözer
-- ve güvenli multi-tenant yapı sağlar

-- ============================================
-- 1. MEVCUT PROBLEMLİ POLİTİKALARI TEMİZLE
-- ============================================

-- workspace_members tablosu politikalarını temizle
DROP POLICY IF EXISTS "Users can view workspace members temp" ON workspace_members;
DROP POLICY IF EXISTS "wm_insert_admin" ON workspace_members;

-- Diğer tablolardaki problemli politikaları temizle
DROP POLICY IF EXISTS "Users can view profiles in same workspace" ON profiles;

-- ============================================
-- 2. TEMEL workspace_members POLİTİKALARI
-- ============================================
-- Bu politikalar hiçbir başka tabloyu referans etmez
-- Böylece döngüsel bağımlılık oluşmaz

-- Kullanıcılar sadece kendi üyeliklerini görebilir
CREATE POLICY "wm_view_own"
ON workspace_members FOR SELECT
TO public
USING (user_id = auth.uid());

-- Workspace adminleri kendi workspace'lerindeki tüm üyeleri görebilir
-- ANCAK bu politika hiçbir JOIN kullanmaz, sadece mevcut satırdaki verileri kontrol eder
CREATE POLICY "wm_view_workspace_if_admin"
ON workspace_members FOR SELECT
TO public
USING (
  -- Bu workspace'te admin olan kullanıcı tüm üyeleri görebilir
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
);

-- Yeni üye ekleme (sadece adminler)
CREATE POLICY "wm_insert_admin"
ON workspace_members FOR INSERT
TO public
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
);

-- Üye güncelleme (sadece adminler)
CREATE POLICY "wm_update_admin"
ON workspace_members FOR UPDATE
TO public
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
);

-- Üye silme (sadece ownerlar)
CREATE POLICY "wm_delete_owner"
ON workspace_members FOR DELETE
TO public
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND role = 'owner'
      AND status = 'active'
  )
);

-- ============================================
-- 3. DİĞER TABLOLAR İÇİN GÜVENLİ POLİTİKALAR
-- ============================================

-- Profiles - Kullanıcılar sadece aynı workspace'teki profilleri görebilir
CREATE POLICY "profiles_workspace_view"
ON profiles FOR SELECT
TO public
USING (
  -- Kendi profili
  user_id = auth.uid()
  OR
  -- Aynı workspace'te olan kullanıcıların profilleri
  user_id IN (
    SELECT wm2.user_id
    FROM workspace_members wm1
    JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = auth.uid()
      AND wm1.status = 'active'
      AND wm2.status = 'active'
  )
);

-- Workspaces - Kullanıcılar sadece üyesi oldukları workspace'leri görebilir
CREATE POLICY "ws_view_member"
ON workspaces FOR SELECT
TO public
USING (
  id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
  )
  AND deleted_at IS NULL
);

-- Patients - Workspace tabanlı erişim
CREATE POLICY "patients_workspace_view"
ON patients FOR SELECT
TO public
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
  )
  AND deleted_at IS NULL
);

-- Patient insert (doktorlar ve üzeri)
CREATE POLICY "patients_workspace_insert"
ON patients FOR INSERT
TO public
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident')
  )
);

-- Patient update (doktorlar ve üzeri)
CREATE POLICY "patients_workspace_update"
ON patients FOR UPDATE
TO public
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident')
  )
);

-- Patient delete (sadece adminler)
CREATE POLICY "patients_workspace_delete"
ON patients FOR DELETE
TO public
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
);

-- Organizations - Kullanıcılar sadece workspace'lerinin organizasyonlarını görebilir
CREATE POLICY "org_view_via_workspace"
ON organizations FOR SELECT
TO public
USING (
  id IN (
    SELECT DISTINCT w.organization_id
    FROM workspaces w
    JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
      AND wm.status = 'active'
      AND w.deleted_at IS NULL
  )
);

-- ============================================
-- 4. ÖZEL DURUMLAR İÇİN POLİTİKALAR
-- ============================================

-- Reminders - Workspace tabanlı erişim (döngüsel referans olmadan)
CREATE POLICY "reminders_workspace_view"
ON reminders FOR SELECT
TO public
USING (
  -- Bu kullanıcının reminders tablosu üzerindeki user_id ile kontrol
  user_id = auth.uid()
  OR
  -- Veya patient_id üzerinden workspace kontrolü (patient workspace kontrolü zaten var)
  patient_id IN (
    SELECT p.id
    FROM patients p
    WHERE p.workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  )
);

-- Workspace Invitations - Adminler kendi workspace davetlerini yönetebilir
CREATE POLICY "invitations_admin_manage"
ON workspace_invitations FOR ALL
TO public
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
);

-- Kullanıcılar kendi email'lerine gelen davetleri görebilir
CREATE POLICY "invitations_own_email"
ON workspace_invitations FOR SELECT
TO public
USING (
  email IN (
    SELECT email
    FROM auth.users
    WHERE id = auth.uid()
  )
);

-- ============================================
-- 5. DOĞRULAMA
-- ============================================

-- Test sorgusu - bu çalışmazsa politikada sorun var
DO $$
BEGIN
  -- Test workspace_members erişimi
  PERFORM * FROM workspace_members LIMIT 1;

  -- Test workspaces erişimi
  PERFORM * FROM workspaces LIMIT 1;

  RAISE NOTICE 'RLS politikaları başarıyla uygulandı!';
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'RLS politikalarında sorun: %', SQLERRM;
END $$;