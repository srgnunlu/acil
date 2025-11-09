-- ============================================
-- FAZ 1: MULTI-TENANT ALTYAPI - KOMPRESİF VERSİYON
-- ============================================
-- ACIL - Enterprise Multi-Tenant Architecture
-- Tarih: 2025-11-09 (Güncellenmiş)
-- Açıklama: Tüm tabloları ve kolonları kontrol edip oluşturur
-- ⚠️ Bu dosya TAMAMEN GÜVENLİ - Mevcut veriyi bozmaz
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '🚀 MULTI-TENANT ALTYAPI KURULUMU BAŞLIYOR';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';

    -- ============================================
    -- BÖLÜM 1: ORGANIZATIONS TABLOSU
    -- ============================================

    RAISE NOTICE '1️⃣  Organizations tablosu kontrol ediliyor...';

    -- Tablo yoksa oluştur
    CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL
    );

    -- Tüm gerekli kolonları ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='type') THEN
        ALTER TABLE organizations ADD COLUMN type TEXT DEFAULT 'clinic' CHECK (type IN ('hospital', 'clinic', 'health_center', 'private_practice'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='logo_url') THEN
        ALTER TABLE organizations ADD COLUMN logo_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='settings') THEN
        ALTER TABLE organizations ADD COLUMN settings JSONB DEFAULT '{"timezone": "Europe/Istanbul", "language": "tr", "date_format": "DD/MM/YYYY", "time_format": "24h"}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='subscription_tier') THEN
        ALTER TABLE organizations ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='subscription_status') THEN
        ALTER TABLE organizations ADD COLUMN subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'cancelled'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='trial_ends_at') THEN
        ALTER TABLE organizations ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='max_users') THEN
        ALTER TABLE organizations ADD COLUMN max_users INTEGER DEFAULT 10;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='max_workspaces') THEN
        ALTER TABLE organizations ADD COLUMN max_workspaces INTEGER DEFAULT 3;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='max_patients_per_workspace') THEN
        ALTER TABLE organizations ADD COLUMN max_patients_per_workspace INTEGER DEFAULT 50;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='contact_email') THEN
        ALTER TABLE organizations ADD COLUMN contact_email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='contact_phone') THEN
        ALTER TABLE organizations ADD COLUMN contact_phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='address') THEN
        ALTER TABLE organizations ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='deleted_at') THEN
        ALTER TABLE organizations ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='created_at') THEN
        ALTER TABLE organizations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='updated_at') THEN
        ALTER TABLE organizations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    RAISE NOTICE '   ✅ Organizations tablosu hazır';

    -- ============================================
    -- BÖLÜM 2: WORKSPACES TABLOSU
    -- ============================================

    RAISE NOTICE '2️⃣  Workspaces tablosu kontrol ediliyor...';

    -- Tablo yoksa oluştur
    CREATE TABLE IF NOT EXISTS workspaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL
    );

    -- Tüm gerekli kolonları ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='description') THEN
        ALTER TABLE workspaces ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='type') THEN
        ALTER TABLE workspaces ADD COLUMN type TEXT DEFAULT 'general' CHECK (type IN ('emergency', 'icu', 'cardiology', 'surgery', 'internal_medicine', 'pediatrics', 'neurology', 'orthopedics', 'oncology', 'general', 'custom'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='color') THEN
        ALTER TABLE workspaces ADD COLUMN color TEXT DEFAULT '#3b82f6';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='icon') THEN
        ALTER TABLE workspaces ADD COLUMN icon TEXT DEFAULT '🏥';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='settings') THEN
        ALTER TABLE workspaces ADD COLUMN settings JSONB DEFAULT '{"patient_limit": 50, "require_approval_for_new_patients": false, "enable_auto_analysis": true, "enable_notifications": true}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='is_active') THEN
        ALTER TABLE workspaces ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='created_by') THEN
        ALTER TABLE workspaces ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='created_at') THEN
        ALTER TABLE workspaces ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='updated_at') THEN
        ALTER TABLE workspaces ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='deleted_at') THEN
        ALTER TABLE workspaces ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    -- Unique constraint ekle
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'workspaces_organization_id_slug_key'
    ) THEN
        ALTER TABLE workspaces ADD CONSTRAINT workspaces_organization_id_slug_key UNIQUE(organization_id, slug);
    END IF;

    RAISE NOTICE '   ✅ Workspaces tablosu hazır';

    -- ============================================
    -- BÖLÜM 3: WORKSPACE_MEMBERS TABLOSU
    -- ============================================

    RAISE NOTICE '3️⃣  Workspace_members tablosu kontrol ediliyor...';

    CREATE TABLE IF NOT EXISTS workspace_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
    );

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspace_members' AND column_name='role') THEN
        ALTER TABLE workspace_members ADD COLUMN role TEXT NOT NULL DEFAULT 'doctor' CHECK (role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident', 'nurse', 'observer'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspace_members' AND column_name='permissions') THEN
        ALTER TABLE workspace_members ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspace_members' AND column_name='status') THEN
        ALTER TABLE workspace_members ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspace_members' AND column_name='invited_by') THEN
        ALTER TABLE workspace_members ADD COLUMN invited_by UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspace_members' AND column_name='invited_at') THEN
        ALTER TABLE workspace_members ADD COLUMN invited_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspace_members' AND column_name='joined_at') THEN
        ALTER TABLE workspace_members ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspace_members' AND column_name='created_at') THEN
        ALTER TABLE workspace_members ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspace_members' AND column_name='updated_at') THEN
        ALTER TABLE workspace_members ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'workspace_members_workspace_id_user_id_key'
    ) THEN
        ALTER TABLE workspace_members ADD CONSTRAINT workspace_members_workspace_id_user_id_key UNIQUE(workspace_id, user_id);
    END IF;

    RAISE NOTICE '   ✅ Workspace_members tablosu hazır';

    -- ============================================
    -- BÖLÜM 4: PATIENT_CATEGORIES TABLOSU
    -- ============================================

    RAISE NOTICE '4️⃣  Patient_categories tablosu kontrol ediliyor...';

    CREATE TABLE IF NOT EXISTS patient_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL
    );

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_categories' AND column_name='color') THEN
        ALTER TABLE patient_categories ADD COLUMN color TEXT DEFAULT '#6b7280';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_categories' AND column_name='icon') THEN
        ALTER TABLE patient_categories ADD COLUMN icon TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_categories' AND column_name='description') THEN
        ALTER TABLE patient_categories ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_categories' AND column_name='sort_order') THEN
        ALTER TABLE patient_categories ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_categories' AND column_name='is_default') THEN
        ALTER TABLE patient_categories ADD COLUMN is_default BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_categories' AND column_name='is_system') THEN
        ALTER TABLE patient_categories ADD COLUMN is_system BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_categories' AND column_name='created_by') THEN
        ALTER TABLE patient_categories ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_categories' AND column_name='created_at') THEN
        ALTER TABLE patient_categories ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_categories' AND column_name='updated_at') THEN
        ALTER TABLE patient_categories ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_categories' AND column_name='deleted_at') THEN
        ALTER TABLE patient_categories ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'patient_categories_workspace_id_slug_key'
    ) THEN
        ALTER TABLE patient_categories ADD CONSTRAINT patient_categories_workspace_id_slug_key UNIQUE(workspace_id, slug);
    END IF;

    RAISE NOTICE '   ✅ Patient_categories tablosu hazır';

    -- ============================================
    -- BÖLÜM 5: PATIENT_ASSIGNMENTS TABLOSU
    -- ============================================

    RAISE NOTICE '5️⃣  Patient_assignments tablosu kontrol ediliyor...';

    CREATE TABLE IF NOT EXISTS patient_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
    );

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_assignments' AND column_name='assignment_type') THEN
        ALTER TABLE patient_assignments ADD COLUMN assignment_type TEXT NOT NULL DEFAULT 'secondary' CHECK (assignment_type IN ('primary', 'secondary', 'consultant', 'nurse', 'observer'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_assignments' AND column_name='is_active') THEN
        ALTER TABLE patient_assignments ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_assignments' AND column_name='assigned_by') THEN
        ALTER TABLE patient_assignments ADD COLUMN assigned_by UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_assignments' AND column_name='assigned_at') THEN
        ALTER TABLE patient_assignments ADD COLUMN assigned_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_assignments' AND column_name='removed_at') THEN
        ALTER TABLE patient_assignments ADD COLUMN removed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_assignments' AND column_name='created_at') THEN
        ALTER TABLE patient_assignments ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'patient_assignments_patient_id_user_id_assignment_type_key'
    ) THEN
        ALTER TABLE patient_assignments ADD CONSTRAINT patient_assignments_patient_id_user_id_assignment_type_key UNIQUE(patient_id, user_id, assignment_type);
    END IF;

    RAISE NOTICE '   ✅ Patient_assignments tablosu hazır';

    -- ============================================
    -- BÖLÜM 6: PROFILES TABLOSU - YENİ KOLONLAR
    -- ============================================

    RAISE NOTICE '6️⃣  Profiles tablosu güncelleniyor...';

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='current_organization_id') THEN
        ALTER TABLE profiles ADD COLUMN current_organization_id UUID REFERENCES organizations(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='title') THEN
        ALTER TABLE profiles ADD COLUMN title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='notification_preferences') THEN
        ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false, "mention": true, "assignment": true, "critical_alerts": true, "patient_updates": true, "daily_digest": false}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_seen_at') THEN
        ALTER TABLE profiles ADD COLUMN last_seen_at TIMESTAMPTZ;
    END IF;

    RAISE NOTICE '   ✅ Profiles tablosu güncellendi';

    -- ============================================
    -- BÖLÜM 7: PATIENTS TABLOSU - YENİ KOLONLAR
    -- ============================================

    RAISE NOTICE '7️⃣  Patients tablosu güncelleniyor...';

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='workspace_id') THEN
        ALTER TABLE patients ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='organization_id') THEN
        ALTER TABLE patients ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='category_id') THEN
        ALTER TABLE patients ADD COLUMN category_id UUID REFERENCES patient_categories(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='assigned_to') THEN
        ALTER TABLE patients ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='admission_date') THEN
        ALTER TABLE patients ADD COLUMN admission_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='discharge_date') THEN
        ALTER TABLE patients ADD COLUMN discharge_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='workflow_state') THEN
        ALTER TABLE patients ADD COLUMN workflow_state TEXT DEFAULT 'admission' CHECK (workflow_state IN ('admission', 'assessment', 'diagnosis', 'treatment', 'observation', 'discharge_planning', 'discharged'));
    END IF;

    RAISE NOTICE '   ✅ Patients tablosu güncellendi';

    RAISE NOTICE '';
    RAISE NOTICE '✅ TÜM TABLOLAR HAZIR!';
    RAISE NOTICE '';

END $$;

-- ============================================
-- İNDEKSLER
-- ============================================

-- Organizations indeksleri
CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_active ON organizations(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_org_subscription ON organizations(subscription_tier, subscription_status);

-- Workspaces indeksleri
CREATE INDEX IF NOT EXISTS idx_workspace_org ON workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspace_active ON workspaces(organization_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workspace_type ON workspaces(type);

-- Workspace_members indeksleri
CREATE INDEX IF NOT EXISTS idx_wm_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_wm_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_wm_active ON workspace_members(workspace_id, user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_wm_role ON workspace_members(workspace_id, role);

-- Patient_categories indeksleri
CREATE INDEX IF NOT EXISTS idx_pc_workspace ON patient_categories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pc_active ON patient_categories(workspace_id, sort_order) WHERE deleted_at IS NULL;

-- Patient_assignments indeksleri
CREATE INDEX IF NOT EXISTS idx_pa_patient ON patient_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_pa_user ON patient_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_pa_active ON patient_assignments(patient_id, is_active);

-- Profiles indeksleri
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(current_organization_id);

-- Patients indeksleri
CREATE INDEX IF NOT EXISTS idx_patients_workspace ON patients(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_organization ON patients(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_category ON patients(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_assigned ON patients(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_workflow ON patients(workflow_state) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_admission ON patients(admission_date DESC) WHERE deleted_at IS NULL;

-- ============================================
-- RLS POLİCİES
-- ============================================

-- Organizations RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    INNER JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE w.organization_id = organizations.id
    AND wm.user_id = auth.uid()
    AND wm.status = 'active'
  )
);

DROP POLICY IF EXISTS "Organization admins can update" ON organizations;
CREATE POLICY "Organization admins can update"
ON organizations FOR UPDATE TO authenticated
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

-- Workspaces RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
CREATE POLICY "Users can view their workspaces"
ON workspaces FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = workspaces.id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.status = 'active'
  )
);

DROP POLICY IF EXISTS "Admins can insert workspaces" ON workspaces;
CREATE POLICY "Admins can insert workspaces"
ON workspaces FOR INSERT TO authenticated
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

DROP POLICY IF EXISTS "Workspace admins can update" ON workspaces;
CREATE POLICY "Workspace admins can update"
ON workspaces FOR UPDATE TO authenticated
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

-- Workspace_members RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
CREATE POLICY "Members can view workspace members"
ON workspace_members FOR SELECT TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

DROP POLICY IF EXISTS "Admins can insert members" ON workspace_members;
CREATE POLICY "Admins can insert members"
ON workspace_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
    AND wm.status = 'active'
  )
);

DROP POLICY IF EXISTS "Admins can update members" ON workspace_members;
CREATE POLICY "Admins can update members"
ON workspace_members FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
    AND wm.status = 'active'
  )
);

DROP POLICY IF EXISTS "Admins can delete members" ON workspace_members;
CREATE POLICY "Admins can delete members"
ON workspace_members FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
    AND wm.status = 'active'
  )
);

-- Patient_categories RLS
ALTER TABLE patient_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view categories" ON patient_categories;
CREATE POLICY "Members can view categories"
ON patient_categories FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

DROP POLICY IF EXISTS "Admins can insert categories" ON patient_categories;
CREATE POLICY "Admins can insert categories"
ON patient_categories FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'senior_doctor')
    AND status = 'active'
  )
);

DROP POLICY IF EXISTS "Admins can update categories" ON patient_categories;
CREATE POLICY "Admins can update categories"
ON patient_categories FOR UPDATE TO authenticated
USING (
  deleted_at IS NULL AND
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'senior_doctor')
    AND status = 'active'
  )
);

-- Patient_assignments RLS
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view assignments" ON patient_assignments;
CREATE POLICY "Members can view assignments"
ON patient_assignments FOR SELECT TO authenticated
USING (
  patient_id IN (
    SELECT p.id FROM patients p
    INNER JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid() AND wm.status = 'active'
  )
);

-- Patients RLS güncelleme
DROP POLICY IF EXISTS "Users can view own patients" ON patients;
DROP POLICY IF EXISTS "Users can view workspace patients" ON patients;
CREATE POLICY "Users can view workspace patients" ON patients
FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND
  (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR assigned_to = auth.uid()
    OR id IN (
      SELECT patient_id FROM patient_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

DROP POLICY IF EXISTS "Users can insert own patients" ON patients;
DROP POLICY IF EXISTS "Users can insert workspace patients" ON patients;
CREATE POLICY "Users can insert workspace patients" ON patients
FOR INSERT TO authenticated
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.status = 'active'
    AND wm.role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident')
  )
);

DROP POLICY IF EXISTS "Users can update own patients" ON patients;
DROP POLICY IF EXISTS "Users can update workspace patients" ON patients;
CREATE POLICY "Users can update workspace patients" ON patients
FOR UPDATE TO authenticated
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
DROP POLICY IF EXISTS "Admins can delete workspace patients" ON patients;
CREATE POLICY "Admins can delete workspace patients" ON patients
FOR DELETE TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.status = 'active'
    AND wm.role IN ('owner', 'admin', 'senior_doctor')
  )
);

-- ============================================
-- TRIGGER FONKSİYONLARI
-- ============================================

-- Updated_at trigger fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspace_members_updated_at ON workspace_members;
CREATE TRIGGER update_workspace_members_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_categories_updated_at ON patient_categories;
CREATE TRIGGER update_patient_categories_updated_at
  BEFORE UPDATE ON patient_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Default kategorileri oluştur
CREATE OR REPLACE FUNCTION create_default_categories(workspace_id_param UUID, workspace_type_param TEXT)
RETURNS VOID AS $$
BEGIN
  IF workspace_type_param = 'emergency' THEN
    INSERT INTO patient_categories (workspace_id, name, slug, color, icon, sort_order, is_system, is_default)
    VALUES
      (workspace_id_param, 'Kırmızı Alan', 'red', '#dc2626', '🔴', 1, true, true),
      (workspace_id_param, 'Sarı Alan', 'yellow', '#fbbf24', '🟡', 2, true, false),
      (workspace_id_param, 'Yeşil Alan', 'green', '#10b981', '🟢', 3, true, false),
      (workspace_id_param, 'Travma', 'trauma', '#7c2d12', '🚑', 4, true, false),
      (workspace_id_param, 'Gözlem', 'observation', '#3b82f6', '👁️', 5, true, false);
  ELSIF workspace_type_param = 'icu' THEN
    INSERT INTO patient_categories (workspace_id, name, slug, color, icon, sort_order, is_system, is_default)
    VALUES
      (workspace_id_param, 'Kritik', 'critical', '#dc2626', '🚨', 1, true, true),
      (workspace_id_param, 'Stabil', 'stable', '#10b981', '✅', 2, true, false),
      (workspace_id_param, 'Taburcu Planlama', 'discharge-planning', '#3b82f6', '📋', 3, true, false);
  ELSE
    INSERT INTO patient_categories (workspace_id, name, slug, color, icon, sort_order, is_system, is_default)
    VALUES
      (workspace_id_param, 'Aktif Yatan', 'active', '#3b82f6', '🏥', 1, true, true),
      (workspace_id_param, 'Konsülte', 'consultation', '#f59e0b', '💬', 2, true, false),
      (workspace_id_param, 'Taburcu', 'discharged', '#10b981', '✅', 3, true, false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yeni workspace için otomatik işlemler
CREATE OR REPLACE FUNCTION handle_new_workspace()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_categories(NEW.id, NEW.type);

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

-- Kullanıcının workspace'lerini getir
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

-- Yetki kontrolü
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
  SELECT role, permissions INTO user_role, custom_permissions
  FROM workspace_members
  WHERE user_id = user_id_param
    AND workspace_id = workspace_id_param
    AND status = 'active';

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  IF custom_permissions ? permission_param THEN
    RETURN true;
  END IF;

  CASE permission_param
    WHEN 'patients.create' THEN
      has_permission := user_role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident');
    WHEN 'patients.read' THEN
      has_permission := true;
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
-- ✅ MULTI-TENANT ALTYAPI KURULDU!
-- ============================================
