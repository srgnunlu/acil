-- ============================================
-- RLS POLİCY'LERİNİ ETKİNLEŞTİR VE OLUŞTUR
-- ============================================
-- Bu script workspace sistemi için gerekli RLS policy'lerini oluşturur
-- ============================================

-- 1. ORGANIZATIONS TABLOSU RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Organizations: Kullanıcının üye olduğu workspace'lerin organizasyonlarını görebilir
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    INNER JOIN workspace_members wm ON wm.workspace_id = w.id
    WHERE w.organization_id = organizations.id
      AND wm.user_id = auth.uid()
      AND wm.status = 'active'
  )
);

-- 2. WORKSPACES TABLOSU RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Workspaces: Kullanıcının üye olduğu workspace'leri görebilir
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
CREATE POLICY "Users can view their workspaces"
ON workspaces FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.status = 'active'
  )
);

-- Workspaces: Owner veya admin olan kullanıcılar workspace oluşturabilir
DROP POLICY IF EXISTS "Admins can create workspaces" ON workspaces;
CREATE POLICY "Admins can create workspaces"
ON workspaces FOR INSERT
WITH CHECK (
  -- İlk workspace ise herkes oluşturabilir
  NOT EXISTS (
    SELECT 1 FROM workspaces
    WHERE organization_id = workspaces.organization_id
  )
  OR
  -- Veya aynı organizasyonda owner/admin ise
  EXISTS (
    SELECT 1 FROM workspace_members wm
    INNER JOIN workspaces w ON w.id = wm.workspace_id
    WHERE w.organization_id = workspaces.organization_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
      AND wm.status = 'active'
  )
);

-- 3. WORKSPACE_MEMBERS TABLOSU RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace members: Kullanıcının üye olduğu workspace'lerin member'larını görebilir
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
CREATE POLICY "Users can view workspace members"
ON workspace_members FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
  )
);

-- Workspace members: Owner/admin olanlar member ekleyebilir
DROP POLICY IF EXISTS "Admins can manage members" ON workspace_members;
CREATE POLICY "Admins can manage members"
ON workspace_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = workspace_members.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
      AND workspace_members.status = 'active'
  )
);

-- 4. PATIENTS TABLOSU RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Patients: Kullanıcının workspace'indeki hastaları görebilir
DROP POLICY IF EXISTS "Users can view workspace patients" ON patients;
CREATE POLICY "Users can view workspace patients"
ON patients FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
  )
  AND deleted_at IS NULL
);

-- Patients: Kullanıcılar kendi workspace'ine hasta ekleyebilir
DROP POLICY IF EXISTS "Users can create patients" ON patients;
CREATE POLICY "Users can create patients"
ON patients FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident')
  )
);

-- Patients: Kullanıcılar workspace'lerindeki hastaları güncelleyebilir
DROP POLICY IF EXISTS "Users can update patients" ON patients;
CREATE POLICY "Users can update patients"
ON patients FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident')
  )
);

-- Patients: Sadece owner/admin hastayı silebilir
DROP POLICY IF EXISTS "Admins can delete patients" ON patients;
CREATE POLICY "Admins can delete patients"
ON patients FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
);

-- 5. PATIENT_CATEGORIES TABLOSU RLS
ALTER TABLE patient_categories ENABLE ROW LEVEL SECURITY;

-- Categories: Workspace üyeleri kategorileri görebilir
DROP POLICY IF EXISTS "Users can view categories" ON patient_categories;
CREATE POLICY "Users can view categories"
ON patient_categories FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
  )
);

-- Categories: Owner/admin kategorileri yönetebilir
DROP POLICY IF EXISTS "Admins can manage categories" ON patient_categories;
CREATE POLICY "Admins can manage categories"
ON patient_categories FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- BAŞARI MESAJI
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ TÜM RLS POLICY''LERİ BAŞARIYLA OLUŞTURULDU!';
    RAISE NOTICE '';
    RAISE NOTICE 'Artık kullanıcılar sadece kendi workspace''lerindeki verileri görebilir.';
END $$;
