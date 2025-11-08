-- ============================================
-- FAZ 1: MULTI-TENANT ALTYAPI MIGRATION
-- ============================================
-- ACIL - Enterprise Multi-Tenant Architecture
-- Tarih: 2025-11-08
-- Açıklama: Organizations, Workspaces, Members, Categories sistemi
-- ⚠️ Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştırın
-- ============================================

-- ============================================
-- BÖLÜM 1: ORGANIZATIONS (Hastaneler/Kurumlar)
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Temel Bilgiler
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'hospital' CHECK (type IN ('hospital', 'clinic', 'health_center', 'private_practice')),

  -- Görsel
  logo_url TEXT,

  -- Ayarlar
  settings JSONB DEFAULT '{
    "timezone": "Europe/Istanbul",
    "language": "tr",
    "date_format": "DD/MM/YYYY",
    "time_format": "24h"
  }'::jsonb,

  -- Abonelik
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,

  -- Limitler
  max_users INTEGER DEFAULT 10,
  max_workspaces INTEGER DEFAULT 3,
  max_patients_per_workspace INTEGER DEFAULT 50,

  -- İletişim (Opsiyonel)
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Organizations için indeksler
CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_active ON organizations(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_org_subscription ON organizations(subscription_tier, subscription_status);

-- Organizations için RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Organizations RLS Policies (Kullanıcılar sadece üye oldukları organizasyonları görebilir)
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    INNER JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE w.organization_id = organizations.id
    AND wm.user_id = auth.uid()
    AND wm.status = 'active'
  )
);

-- Sadece organization admin'leri güncelleyebilir (şimdilik tüm workspace owner'lar)
DROP POLICY IF EXISTS "Organization admins can update" ON organizations;
CREATE POLICY "Organization admins can update"
ON organizations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    INNER JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE w.organization_id = organizations.id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
    AND wm.status = 'active'
  )
);

-- ============================================
-- BÖLÜM 2: WORKSPACES (Servisler/Bölümler)
-- ============================================

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Kimlik
  name TEXT NOT NULL, -- 'Kardiyoloji Servisi', 'Acil Kırmızı Alan'
  slug TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'general' CHECK (type IN (
    'emergency', 'icu', 'cardiology', 'surgery', 'internal_medicine',
    'pediatrics', 'neurology', 'orthopedics', 'oncology', 'general', 'custom'
  )),

  -- Görünüm
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT '🏥',

  -- Ayarlar
  settings JSONB DEFAULT '{
    "patient_limit": 50,
    "require_approval_for_new_patients": false,
    "enable_auto_analysis": true,
    "enable_notifications": true
  }'::jsonb,

  -- Durum
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(organization_id, slug)
);

-- Workspaces için indeksler
CREATE INDEX IF NOT EXISTS idx_workspace_org ON workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspace_active ON workspaces(organization_id, is_active)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workspace_type ON workspaces(type);

-- Workspaces için RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Workspaces RLS Policies
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
CREATE POLICY "Users can view their workspaces"
ON workspaces FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL AND
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = workspaces.id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.status = 'active'
  )
);

-- Sadece owner/admin workspace oluşturabilir (şimdilik herkes kendi workspace'ine ekleyebilir)
DROP POLICY IF EXISTS "Admins can insert workspaces" ON workspaces;
CREATE POLICY "Admins can insert workspaces"
ON workspaces FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM workspaces w
    INNER JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE w.organization_id = workspaces.organization_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
    AND wm.status = 'active'
  )
);

-- Owner/Admin workspace güncelleyebilir
DROP POLICY IF EXISTS "Workspace admins can update" ON workspaces;
CREATE POLICY "Workspace admins can update"
ON workspaces FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL AND
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = workspaces.id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('owner', 'admin')
    AND workspace_members.status = 'active'
  )
);

-- ============================================
-- BÖLÜM 3: WORKSPACE MEMBERS (Üyelikler)
-- ============================================

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Rol (Workspace içindeki rolü)
  role TEXT NOT NULL DEFAULT 'doctor' CHECK (role IN (
    'owner',           -- Workspace sahibi (tüm yetkiler)
    'admin',           -- Yönetici (kullanıcı yönetimi + tüm hasta yetkileri)
    'senior_doctor',   -- Kıdemli doktor (tüm hastaları görebilir, düzenleyebilir)
    'doctor',          -- Doktor (atanan hastaları yönetir)
    'resident',        -- Asistan (sınırlı düzenleme)
    'nurse',           -- Hemşire (vital signs, notlar)
    'observer'         -- Gözlemci (sadece okuma)
  )),

  -- Özel yetki override (JSONB array: ['patients.delete', 'ai.analyze'])
  permissions JSONB DEFAULT '[]'::jsonb,

  -- Durum
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),

  -- Davet bilgileri
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, user_id)
);

-- Workspace members için indeksler
CREATE INDEX IF NOT EXISTS idx_wm_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_wm_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_wm_active ON workspace_members(workspace_id, user_id, status)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_wm_role ON workspace_members(workspace_id, role);

-- Workspace members için RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Members RLS Policies
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
CREATE POLICY "Members can view workspace members"
ON workspace_members FOR SELECT
TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Owner/Admin üye ekleyebilir
DROP POLICY IF EXISTS "Admins can insert members" ON workspace_members;
CREATE POLICY "Admins can insert members"
ON workspace_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = workspace_members.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('owner', 'admin')
    AND workspace_members.status = 'active'
  )
);

-- Owner/Admin üye güncelleyebilir
DROP POLICY IF EXISTS "Admins can update members" ON workspace_members;
CREATE POLICY "Admins can update members"
ON workspace_members FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
    AND wm.status = 'active'
  )
);

-- Owner/Admin üye silebilir
DROP POLICY IF EXISTS "Admins can delete members" ON workspace_members;
CREATE POLICY "Admins can delete members"
ON workspace_members FOR DELETE
TO authenticated
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
-- BÖLÜM 4: PATIENT CATEGORIES (Dinamik Kategoriler)
-- ============================================

CREATE TABLE IF NOT EXISTS patient_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Kategori detayları
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  icon TEXT,
  description TEXT,

  -- Sıralama
  sort_order INTEGER DEFAULT 0,

  -- Davranış
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false, -- Sistem kategorileri silinemez

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(workspace_id, slug)
);

-- Patient categories için indeksler
CREATE INDEX IF NOT EXISTS idx_pc_workspace ON patient_categories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pc_active ON patient_categories(workspace_id, sort_order)
  WHERE deleted_at IS NULL;

-- Patient categories için RLS
ALTER TABLE patient_categories ENABLE ROW LEVEL SECURITY;

-- Categories RLS Policies
DROP POLICY IF EXISTS "Members can view categories" ON patient_categories;
CREATE POLICY "Members can view categories"
ON patient_categories FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL AND
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Admin/Senior categoriler ekleyebilir
DROP POLICY IF EXISTS "Admins can insert categories" ON patient_categories;
CREATE POLICY "Admins can insert categories"
ON patient_categories FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'senior_doctor')
    AND status = 'active'
  )
);

-- Admin/Senior categoriler güncelleyebilir
DROP POLICY IF EXISTS "Admins can update categories" ON patient_categories;
CREATE POLICY "Admins can update categories"
ON patient_categories FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL AND
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'senior_doctor')
    AND status = 'active'
  )
);

-- ============================================
-- BÖLÜM 5: PATIENT ASSIGNMENTS (Çoklu Atama)
-- ============================================

CREATE TABLE IF NOT EXISTS patient_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Atama tipi
  assignment_type TEXT NOT NULL DEFAULT 'secondary' CHECK (assignment_type IN (
    'primary',      -- Birincil sorumlu
    'secondary',    -- İkincil sorumlu
    'consultant',   -- Konsültan
    'nurse',        -- Hemşire
    'observer'      -- Gözlemci
  )),

  -- Durum
  is_active BOOLEAN DEFAULT true,

  -- Atama bilgileri
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(patient_id, user_id, assignment_type)
);

-- Patient assignments için indeksler
CREATE INDEX IF NOT EXISTS idx_pa_patient ON patient_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_pa_user ON patient_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_pa_active ON patient_assignments(patient_id, is_active);

-- Patient assignments için RLS
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;

-- Assignments RLS Policies (workspace üyeleri görebilir)
DROP POLICY IF EXISTS "Members can view assignments" ON patient_assignments;
CREATE POLICY "Members can view assignments"
ON patient_assignments FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT p.id FROM patients p
    INNER JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid() AND wm.status = 'active'
  )
);

-- ============================================
-- BÖLÜM 6: PROFILES TABLOSU GÜNCELLEMELERİ
-- ============================================

-- Profiles tablosuna yeni sütunlar ekle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT, -- 'Dr.', 'Prof. Dr.', 'Uzm. Dr.'
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "email": true,
    "push": true,
    "sms": false,
    "mention": true,
    "assignment": true,
    "critical_alerts": true,
    "patient_updates": true,
    "daily_digest": false
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Profiles için indeks
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(current_organization_id);

-- ============================================
-- BÖLÜM 7: PATIENTS TABLOSU GÜNCELLEMELERİ
-- ============================================

-- Patients tablosuna yeni sütunlar ekle
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id),
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES patient_categories(id),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id), -- Primary doctor
  ADD COLUMN IF NOT EXISTS admission_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discharge_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS workflow_state TEXT DEFAULT 'admission' CHECK (workflow_state IN (
    'admission',           -- Kabul
    'assessment',          -- Değerlendirme
    'diagnosis',           -- Tanı
    'treatment',           -- Tedavi
    'observation',         -- Gözlem
    'discharge_planning',  -- Taburcu planlama
    'discharged'          -- Taburcu
  ));

-- Patients için yeni indeksler
CREATE INDEX IF NOT EXISTS idx_patients_workspace ON patients(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_organization ON patients(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_category ON patients(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_assigned ON patients(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_workflow ON patients(workflow_state) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_admission ON patients(admission_date DESC) WHERE deleted_at IS NULL;

-- Patients için mevcut RLS politikalarını güncelle (workspace bazlı)
DROP POLICY IF EXISTS "Users can view own patients" ON patients;
CREATE POLICY "Users can view workspace patients" ON patients
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL AND
  (
    -- Workspace üyesi
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR
    -- Veya atanmış doktor
    assigned_to = auth.uid()
    OR
    -- Veya assignment'ı var
    id IN (
      SELECT patient_id FROM patient_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

DROP POLICY IF EXISTS "Users can insert own patients" ON patients;
CREATE POLICY "Users can insert workspace patients" ON patients
FOR INSERT
TO authenticated
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.status = 'active'
    AND wm.role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident')
  )
);

DROP POLICY IF EXISTS "Users can update own patients" ON patients;
CREATE POLICY "Users can update workspace patients" ON patients
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL AND
  workspace_id IN (
    SELECT workspace_id FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.status = 'active'
    AND wm.role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident')
  )
);

DROP POLICY IF EXISTS "Users can delete own patients" ON patients;
CREATE POLICY "Admins can delete workspace patients" ON patients
FOR DELETE
TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.status = 'active'
    AND wm.role IN ('owner', 'admin', 'senior_doctor')
  )
);

-- ============================================
-- BÖLÜM 8: TRIGGER FONKSİYONLARI
-- ============================================

-- Updated_at trigger for organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for workspaces
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for workspace_members
DROP TRIGGER IF EXISTS update_workspace_members_updated_at ON workspace_members;
CREATE TRIGGER update_workspace_members_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for patient_categories
DROP TRIGGER IF EXISTS update_patient_categories_updated_at ON patient_categories;
CREATE TRIGGER update_patient_categories_updated_at
  BEFORE UPDATE ON patient_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- BÖLÜM 9: UTILITY FUNCTIONS
-- ============================================

-- Default kategorileri oluştur (workspace oluşturulduğunda)
CREATE OR REPLACE FUNCTION create_default_categories(workspace_id_param UUID, workspace_type_param TEXT)
RETURNS VOID AS $$
BEGIN
  -- Workspace tipine göre default kategoriler
  IF workspace_type_param = 'emergency' THEN
    -- Acil servis kategorileri
    INSERT INTO patient_categories (workspace_id, name, slug, color, icon, sort_order, is_system, is_default)
    VALUES
      (workspace_id_param, 'Kırmızı Alan', 'red', '#dc2626', '🔴', 1, true, true),
      (workspace_id_param, 'Sarı Alan', 'yellow', '#fbbf24', '🟡', 2, true, false),
      (workspace_id_param, 'Yeşil Alan', 'green', '#10b981', '🟢', 3, true, false),
      (workspace_id_param, 'Travma', 'trauma', '#7c2d12', '🚑', 4, true, false),
      (workspace_id_param, 'Gözlem', 'observation', '#3b82f6', '👁️', 5, true, false);
  ELSIF workspace_type_param = 'icu' THEN
    -- YBÜ kategorileri
    INSERT INTO patient_categories (workspace_id, name, slug, color, icon, sort_order, is_system, is_default)
    VALUES
      (workspace_id_param, 'Kritik', 'critical', '#dc2626', '🚨', 1, true, true),
      (workspace_id_param, 'Stabil', 'stable', '#10b981', '✅', 2, true, false),
      (workspace_id_param, 'Taburcu Planlama', 'discharge-planning', '#3b82f6', '📋', 3, true, false);
  ELSE
    -- Genel kategoriler (diğer tüm servisler için)
    INSERT INTO patient_categories (workspace_id, name, slug, color, icon, sort_order, is_system, is_default)
    VALUES
      (workspace_id_param, 'Aktif Yatan', 'active', '#3b82f6', '🏥', 1, true, true),
      (workspace_id_param, 'Konsülte', 'consultation', '#f59e0b', '💬', 2, true, false),
      (workspace_id_param, 'Taburcu', 'discharged', '#10b981', '✅', 3, true, false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Workspace oluşturulduğunda otomatik kategoriler ekle
CREATE OR REPLACE FUNCTION handle_new_workspace()
RETURNS TRIGGER AS $$
BEGIN
  -- Default kategorileri oluştur
  PERFORM create_default_categories(NEW.id, NEW.type);

  -- Workspace oluşturanı otomatik olarak owner yap
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO workspace_members (workspace_id, user_id, role, status)
    VALUES (NEW.id, NEW.created_by, 'owner', 'active');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_workspace_created ON workspaces;
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION handle_new_workspace();

-- Get user's workspaces
CREATE OR REPLACE FUNCTION get_user_workspaces(user_id_param UUID)
RETURNS TABLE (
  workspace_id UUID,
  workspace_name TEXT,
  workspace_type TEXT,
  workspace_color TEXT,
  workspace_icon TEXT,
  user_role TEXT,
  organization_id UUID,
  organization_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.name,
    w.type,
    w.color,
    w.icon,
    wm.role,
    w.organization_id,
    o.name
  FROM workspaces w
  INNER JOIN workspace_members wm ON w.id = wm.workspace_id
  INNER JOIN organizations o ON w.organization_id = o.id
  WHERE wm.user_id = user_id_param
    AND wm.status = 'active'
    AND w.deleted_at IS NULL
    AND w.is_active = true
  ORDER BY o.name, w.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check user permission in workspace
CREATE OR REPLACE FUNCTION user_has_permission(
  user_id_param UUID,
  workspace_id_param UUID,
  permission_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  custom_permissions JSONB;
  has_permission BOOLEAN := false;
BEGIN
  -- Get user role and custom permissions
  SELECT role, permissions INTO user_role, custom_permissions
  FROM workspace_members
  WHERE user_id = user_id_param
    AND workspace_id = workspace_id_param
    AND status = 'active';

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Check custom permissions first
  IF custom_permissions ? permission_param THEN
    RETURN true;
  END IF;

  -- Role-based permissions
  CASE permission_param
    WHEN 'patients.create' THEN
      has_permission := user_role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident');
    WHEN 'patients.read' THEN
      has_permission := true; -- Tüm üyeler okuyabilir
    WHEN 'patients.update' THEN
      has_permission := user_role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident');
    WHEN 'patients.delete' THEN
      has_permission := user_role IN ('owner', 'admin', 'senior_doctor');
    WHEN 'workspace.manage' THEN
      has_permission := user_role IN ('owner', 'admin');
    WHEN 'users.invite' THEN
      has_permission := user_role IN ('owner', 'admin');
    WHEN 'ai.analyze' THEN
      has_permission := user_role IN ('owner', 'admin', 'senior_doctor', 'doctor');
    ELSE
      has_permission := false;
  END CASE;

  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BÖLÜM 10: DOKÜMANTASYON
-- ============================================

COMMENT ON TABLE organizations IS 'Hastaneler ve sağlık kuruluşları';
COMMENT ON TABLE workspaces IS 'Servisler, bölümler ve çalışma alanları';
COMMENT ON TABLE workspace_members IS 'Workspace üyelikleri ve rolleri';
COMMENT ON TABLE patient_categories IS 'Dinamik hasta kategorileri (workspace bazlı)';
COMMENT ON TABLE patient_assignments IS 'Çoklu doktor-hasta atamaları';

COMMENT ON COLUMN workspaces.type IS 'Workspace tipi: emergency, icu, cardiology, surgery, vb.';
COMMENT ON COLUMN workspace_members.role IS 'Kullanıcı rolü: owner, admin, senior_doctor, doctor, resident, nurse, observer';
COMMENT ON COLUMN patient_categories.is_system IS 'Sistem kategorileri silinemez';
COMMENT ON COLUMN patients.workflow_state IS 'Hasta iş akış durumu';

-- ============================================
-- ✅ FAZ 1 MIGRATION TAMAMLANDI!
-- ============================================
--
-- Oluşturulan tablolar:
-- ✅ organizations - Hastaneler/kurumlar
-- ✅ workspaces - Servisler/bölümler
-- ✅ workspace_members - Üyelikler ve roller
-- ✅ patient_categories - Dinamik kategoriler
-- ✅ patient_assignments - Çoklu atamalar
--
-- Güncellenen tablolar:
-- ✅ profiles - Organization ve kullanıcı bilgileri
-- ✅ patients - Workspace, category, assignment alanları
--
-- Özellikler:
-- ✅ Multi-tenant architecture
-- ✅ Role-based access control (RBAC)
-- ✅ Workspace bazlı izolasyon
-- ✅ Dinamik hasta kategorileri
-- ✅ Çoklu doktor ataması
-- ✅ Otomatik default kategoriler
-- ✅ RLS policies (güvenlik)
-- ✅ Utility functions
--
-- Sonraki adım:
-- - Mevcut dataların migration'ı (migration script)
-- - Backend API endpoints
-- - Frontend UI components
-- ============================================
