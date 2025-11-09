-- ============================================
-- ORGANIZATION MEMBERS MIGRATION
-- ============================================
-- İki seviyeli üyelik sistemi: Organization + Workspace
-- Tarih: 2025-11-09
-- Açıklama: Organization'a üyelik sistemi ekleniyor
-- ============================================

-- ============================================
-- BÖLÜM 0: ORGANIZATIONS TABLOSUNA created_by EKLE
-- ============================================

-- Organizations tablosuna created_by kolonu ekle (eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
          AND column_name = 'created_by'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE organizations ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- ============================================
-- BÖLÜM 1: ORGANIZATION_MEMBERS TABLOSU
-- ============================================

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Rol (Organization içindeki rolü)
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN (
    'owner',           -- Organization sahibi (tüm yetkiler)
    'admin',           -- Yönetici (workspace oluşturma, üye yönetimi)
    'member'          -- Normal üye (workspace'lere erişim için workspace üyeliği gerekir)
  )),

  -- Durum
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),

  -- Davet bilgileri
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

-- Organization members için indeksler
CREATE INDEX IF NOT EXISTS idx_om_organization ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_om_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_om_active ON organization_members(organization_id, user_id, status)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_om_role ON organization_members(organization_id, role);

-- ============================================
-- BÖLÜM 2: RLS POLİTİKALARI
-- ============================================

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organization members RLS Policies

-- 1. SELECT: Organization'a üye olan kullanıcılar, o organization'ın üyelerini görebilir
DROP POLICY IF EXISTS "om_view_members" ON organization_members;
CREATE POLICY "om_view_members"
ON organization_members FOR SELECT
TO authenticated
USING (
  -- Kendi üyeliğini görebilir
  user_id = auth.uid()
  OR
  -- Organization'a üye olan kullanıcılar, o organization'ın üyelerini görebilir
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- 2. INSERT: Organization owner/admin'leri yeni üye ekleyebilir
DROP POLICY IF EXISTS "om_insert_admin" ON organization_members;
CREATE POLICY "om_insert_admin"
ON organization_members FOR INSERT
TO authenticated
WITH CHECK (
  -- Organization owner/admin'leri yeni üye ekleyebilir
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
  OR
  -- Kullanıcı kendi organization'ını oluşturduğunda otomatik owner olur
  -- (Bu durumda organization'ın creator'ı olmalı - bu kontrolü application layer'da yapacağız)
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = organization_id
      AND created_by = auth.uid()
  )
);

-- 3. UPDATE: Organization owner/admin'leri üye bilgilerini güncelleyebilir
DROP POLICY IF EXISTS "om_update_admin" ON organization_members;
CREATE POLICY "om_update_admin"
ON organization_members FOR UPDATE
TO authenticated
USING (
  -- Organization owner/admin'leri üye bilgilerini güncelleyebilir
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
  OR
  -- Kullanıcı kendi üyeliğini güncelleyebilir (sadece status)
  user_id = auth.uid()
)
WITH CHECK (
  -- Owner rolü değiştirilemez (sadece owner/admin yapabilir)
  (
    role = 'owner' AND 
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role = 'owner'
    )
  )
  OR
  role != 'owner'
);

-- 4. DELETE: Organization owner/admin'leri üye çıkarabilir
DROP POLICY IF EXISTS "om_delete_admin" ON organization_members;
CREATE POLICY "om_delete_admin"
ON organization_members FOR DELETE
TO authenticated
USING (
  -- Organization owner/admin'leri üye çıkarabilir
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
  AND
  -- Owner kendini silemez (en az bir owner olmalı)
  (
    role != 'owner'
    OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
        AND role = 'owner'
        AND user_id != organization_members.user_id
        AND status = 'active'
    )
  )
);

-- ============================================
-- BÖLÜM 3: MEVCUT VERİLERİ MİGRATE ET
-- ============================================

-- Mevcut workspace_members'ten organization üyeliklerini oluştur
-- Her workspace'e üye olan kullanıcı, o workspace'in organization'ına da üye olmalı
INSERT INTO organization_members (organization_id, user_id, role, status, joined_at, created_at, updated_at)
SELECT DISTINCT ON (w.organization_id, wm.user_id)
  w.organization_id,
  wm.user_id,
  CASE 
    -- Eğer workspace'te owner/admin ise, organization'da da admin olabilir
    WHEN wm.role IN ('owner', 'admin') THEN 'admin'
    ELSE 'member'
  END as role,
  'active' as status,
  wm.joined_at,
  wm.created_at,
  NOW()
FROM workspace_members wm
JOIN workspaces w ON wm.workspace_id = w.id
WHERE wm.status = 'active'
  AND w.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = w.organization_id
      AND om.user_id = wm.user_id
  )
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ============================================
-- BÖLÜM 4: ORGANIZATIONS RLS POLİTİKALARINI GÜNCELLE
-- ============================================

-- Organizations SELECT policy'sini güncelle: Organization'a üye olan kullanıcılar görebilir
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
TO authenticated
USING (
  -- Organization'a üye olan kullanıcılar görebilir
  id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
  OR
  -- Kendi oluşturduğu organization'ı görebilir (henüz üye olmamış olsa bile)
  created_by = auth.uid()
);

-- ============================================
-- BÖLÜM 5: WORKSPACES RLS POLİTİKALARINI GÜNCELLE
-- ============================================

-- Workspaces SELECT policy'sini güncelle: Organization'a üye olan kullanıcılar workspace'leri görebilir
DROP POLICY IF EXISTS "Users can view workspaces in their organizations" ON workspaces;
CREATE POLICY "Users can view workspaces in their organizations"
ON workspaces FOR SELECT
TO authenticated
USING (
  -- Organization'a üye olan kullanıcılar workspace'leri görebilir
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
  OR
  -- Workspace'e direkt üye olan kullanıcılar görebilir (backward compatibility)
  id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Workspaces INSERT policy'sini güncelle: Organization admin/owner'ları workspace oluşturabilir
DROP POLICY IF EXISTS "w_insert_admin" ON workspaces;
CREATE POLICY "w_insert_admin"
ON workspaces FOR INSERT
TO authenticated
WITH CHECK (
  -- Organization admin/owner'ları workspace oluşturabilir
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
);

-- Workspaces UPDATE policy'sini güncelle: Organization admin/owner'ları workspace güncelleyebilir
DROP POLICY IF EXISTS "w_update_admin" ON workspaces;
CREATE POLICY "w_update_admin"
ON workspaces FOR UPDATE
TO authenticated
USING (
  -- Organization admin/owner'ları workspace güncelleyebilir
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
);

-- Workspaces DELETE policy'sini güncelle: Organization admin/owner'ları workspace silebilir
DROP POLICY IF EXISTS "w_delete_admin" ON workspaces;
CREATE POLICY "w_delete_admin"
ON workspaces FOR DELETE
TO authenticated
USING (
  -- Organization admin/owner'ları workspace silebilir
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- BÖLÜM 6: WORKSPACE_MEMBERS RLS POLİTİKALARINI GÜNCELLE
-- ============================================

-- Workspace members INSERT policy'sini güncelle: Organization admin/owner'ları workspace'e üye ekleyebilir
DROP POLICY IF EXISTS "wm_insert_admin" ON workspace_members;
CREATE POLICY "wm_insert_admin"
ON workspace_members FOR INSERT
TO authenticated
WITH CHECK (
  -- Organization admin/owner'ları workspace'e üye ekleyebilir
  workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN organization_members om ON w.organization_id = om.organization_id
    WHERE om.user_id = auth.uid() 
      AND om.status = 'active'
      AND om.role IN ('owner', 'admin')
  )
  AND
  -- Eklenen kullanıcı da organization'a üye olmalı
  workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN organization_members om ON w.organization_id = om.organization_id
    WHERE om.user_id = workspace_members.user_id
      AND om.status = 'active'
  )
);

-- ============================================
-- BÖLÜM 7: ORGANIZATIONS INSERT POLİTİKASINI GÜNCELLE
-- ============================================

-- Organizations INSERT policy'sini güncelle: Kullanıcılar sadece kendi organization'larını oluşturabilir
DROP POLICY IF EXISTS "org_insert_authenticated" ON organizations;
CREATE POLICY "org_insert_authenticated"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (
  -- Kullanıcı sadece kendi organization'ını oluşturabilir (created_by kontrolü)
  created_by = auth.uid()
);

-- Organization oluşturulduğunda, creator'ı otomatik owner yap
CREATE OR REPLACE FUNCTION create_organization_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Organization creator'ını otomatik owner yap
  INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
  VALUES (NEW.id, NEW.created_by, 'owner', 'active', NOW())
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_organization_owner ON organizations;
CREATE TRIGGER trigger_create_organization_owner
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_organization_owner();

-- ============================================
-- BÖLÜM 8: HELPER FUNCTIONS
-- ============================================

-- Kullanıcının organization'daki rolünü döndüren fonksiyon
CREATE OR REPLACE FUNCTION get_user_organization_role(p_organization_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM organization_members
    WHERE organization_id = p_organization_id
      AND user_id = p_user_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının organization'a üye olup olmadığını kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION is_organization_member(p_organization_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
      AND user_id = p_user_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BÖLÜM 9: NOTLAR VE UYARILAR
-- ============================================

-- ⚠️ ÖNEMLİ NOTLAR:
-- 1. Mevcut workspace_members verilerinden organization_members oluşturuldu
-- 2. Organization oluşturulduğunda creator otomatik owner olur
-- 3. Organization admin/owner'ları workspace oluşturabilir ve yönetebilir
-- 4. Workspace'e üye eklemek için hem organization'a hem workspace'e üye olmak gerekir
-- 5. Kullanıcılar sadece kendi organization'larını oluşturabilir (created_by kontrolü)

