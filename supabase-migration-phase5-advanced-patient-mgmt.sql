-- ============================================
-- PHASE 5: ADVANCED PATIENT MANAGEMENT
-- Migration for dynamic categories, assignments, and workflows
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PATIENT CATEGORIES TABLE (Dynamic Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS patient_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Category details
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  icon TEXT,
  description TEXT,

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Behavior
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false, -- System categories cannot be deleted

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Unique constraint
  UNIQUE(workspace_id, slug)
);

-- Indexes for patient_categories
CREATE INDEX IF NOT EXISTS idx_patient_categories_workspace ON patient_categories(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patient_categories_sort ON patient_categories(workspace_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patient_categories_default ON patient_categories(workspace_id, is_default) WHERE deleted_at IS NULL AND is_default = true;

-- ============================================
-- 2. PATIENT ASSIGNMENTS TABLE (Multi-Doctor Assignment)
-- ============================================
CREATE TABLE IF NOT EXISTS patient_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Assignment type
  assignment_type TEXT NOT NULL DEFAULT 'secondary' CHECK (assignment_type IN ('primary', 'secondary', 'consultant', 'nurse', 'observer')),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one primary per patient
  CONSTRAINT unique_primary_assignment UNIQUE NULLS NOT DISTINCT (patient_id, assignment_type, is_active)
    DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for patient_assignments
CREATE INDEX IF NOT EXISTS idx_patient_assignments_patient ON patient_assignments(patient_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_patient_assignments_user ON patient_assignments(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_patient_assignments_type ON patient_assignments(patient_id, assignment_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_patient_assignments_active ON patient_assignments(patient_id, is_active);

-- ============================================
-- 3. UPDATE PATIENTS TABLE
-- ============================================

-- Add new columns to patients table
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES patient_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admission_date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS discharge_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS workflow_state TEXT DEFAULT 'admission' CHECK (workflow_state IN ('admission', 'assessment', 'diagnosis', 'treatment', 'observation', 'discharge_planning', 'discharged'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_patients_category ON patients(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_assigned ON patients(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_workflow ON patients(workflow_state) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_admission_date ON patients(admission_date DESC) WHERE deleted_at IS NULL;

-- ============================================
-- 4. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Create or replace the update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for patient_categories
DROP TRIGGER IF EXISTS update_patient_categories_updated_at ON patient_categories;
CREATE TRIGGER update_patient_categories_updated_at
  BEFORE UPDATE ON patient_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for patient_assignments
DROP TRIGGER IF EXISTS update_patient_assignments_updated_at ON patient_assignments;
CREATE TRIGGER update_patient_assignments_updated_at
  BEFORE UPDATE ON patient_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE patient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PATIENT CATEGORIES POLICIES
-- ============================================

-- Users can view categories in their workspace
DROP POLICY IF EXISTS "Users can view workspace categories" ON patient_categories;
CREATE POLICY "Users can view workspace categories"
  ON patient_categories FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

-- Workspace admins can create categories
DROP POLICY IF EXISTS "Admins can create categories" ON patient_categories;
CREATE POLICY "Admins can create categories"
  ON patient_categories FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
    AND created_by = auth.uid()
  );

-- Workspace admins can update categories
DROP POLICY IF EXISTS "Admins can update categories" ON patient_categories;
CREATE POLICY "Admins can update categories"
  ON patient_categories FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  );

-- Workspace admins can delete non-system categories
DROP POLICY IF EXISTS "Admins can delete non-system categories" ON patient_categories;
CREATE POLICY "Admins can delete non-system categories"
  ON patient_categories FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
    AND is_system = false
  );

-- ============================================
-- PATIENT ASSIGNMENTS POLICIES
-- ============================================

-- Users can view assignments for patients they can access
DROP POLICY IF EXISTS "Users can view patient assignments" ON patient_assignments;
CREATE POLICY "Users can view patient assignments"
  ON patient_assignments FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
      AND deleted_at IS NULL
    )
  );

-- Doctors and admins can create assignments
DROP POLICY IF EXISTS "Doctors can create assignments" ON patient_assignments;
CREATE POLICY "Doctors can create assignments"
  ON patient_assignments FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT p.id FROM patients p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'senior_doctor', 'doctor')
    )
    AND assigned_by = auth.uid()
  );

-- Assigned doctors and admins can update assignments
DROP POLICY IF EXISTS "Users can update assignments" ON patient_assignments;
CREATE POLICY "Users can update assignments"
  ON patient_assignments FOR UPDATE
  USING (
    assigned_by = auth.uid()
    OR patient_id IN (
      SELECT p.id FROM patients p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'senior_doctor')
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT p.id FROM patients p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );

-- Assigned doctors and admins can delete assignments
DROP POLICY IF EXISTS "Users can delete assignments" ON patient_assignments;
CREATE POLICY "Users can delete assignments"
  ON patient_assignments FOR DELETE
  USING (
    assigned_by = auth.uid()
    OR patient_id IN (
      SELECT p.id FROM patients p
      JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'senior_doctor')
    )
  );

-- ============================================
-- 6. ENABLE REALTIME FOR SUPABASE
-- ============================================

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE patient_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE patient_assignments;

-- ============================================
-- 7. DEFAULT CATEGORIES FOR EXISTING WORKSPACES
-- ============================================

-- Create default categories for all existing workspaces
DO $$
DECLARE
  workspace_record RECORD;
BEGIN
  FOR workspace_record IN SELECT id FROM workspaces WHERE deleted_at IS NULL
  LOOP
    -- Insert default categories if they don't exist
    INSERT INTO patient_categories (workspace_id, name, slug, color, icon, description, sort_order, is_default, is_system, created_by)
    VALUES
      (workspace_record.id, 'Aktif Yatan', 'active-inpatient', '#10b981', '🏥', 'Aktif yatan hastalar', 1, true, true, NULL),
      (workspace_record.id, 'Acil - Kırmızı Alan', 'emergency-red', '#ef4444', '🔴', 'Acil müdahale gerektiren hastalar', 2, false, true, NULL),
      (workspace_record.id, 'Acil - Sarı Alan', 'emergency-yellow', '#f59e0b', '🟡', 'Acil alan - orta öncelikli', 3, false, true, NULL),
      (workspace_record.id, 'Acil - Yeşil Alan', 'emergency-green', '#22c55e', '🟢', 'Acil alan - düşük öncelikli', 4, false, true, NULL),
      (workspace_record.id, 'Yoğun Bakım', 'intensive-care', '#8b5cf6', '🏨', 'Yoğun bakım hastaları', 5, false, true, NULL),
      (workspace_record.id, 'Konsültasyon', 'consultation', '#f59e0b', '💬', 'Konsültasyon bekleyen hastalar', 6, false, true, NULL),
      (workspace_record.id, 'Taburcu Planlama', 'discharge-planning', '#06b6d4', '📋', 'Taburcu planlanıyor', 7, false, true, NULL),
      (workspace_record.id, 'Taburcu', 'discharged', '#6b7280', '✅', 'Taburcu edilmiş hastalar', 8, false, true, NULL)
    ON CONFLICT (workspace_id, slug) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to get patient with all assignments
CREATE OR REPLACE FUNCTION get_patient_with_assignments(patient_uuid UUID)
RETURNS TABLE (
  patient_id UUID,
  patient_name TEXT,
  category_name TEXT,
  category_color TEXT,
  workflow_state TEXT,
  primary_doctor_id UUID,
  primary_doctor_name TEXT,
  assignments JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as patient_id,
    p.full_name as patient_name,
    pc.name as category_name,
    pc.color as category_color,
    p.workflow_state,
    pa_primary.user_id as primary_doctor_id,
    prof_primary.full_name as primary_doctor_name,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'assignment_type', pa.assignment_type,
          'user_id', pa.user_id,
          'user_name', prof.full_name,
          'assigned_at', pa.assigned_at
        )
      )
      FROM patient_assignments pa
      LEFT JOIN profiles prof ON prof.id = pa.user_id
      WHERE pa.patient_id = p.id AND pa.is_active = true
    ) as assignments
  FROM patients p
  LEFT JOIN patient_categories pc ON pc.id = p.category_id
  LEFT JOIN patient_assignments pa_primary ON pa_primary.patient_id = p.id
    AND pa_primary.assignment_type = 'primary'
    AND pa_primary.is_active = true
  LEFT JOIN profiles prof_primary ON prof_primary.id = pa_primary.user_id
  WHERE p.id = patient_uuid AND p.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reassign patient to new category
CREATE OR REPLACE FUNCTION reassign_patient_category(
  patient_uuid UUID,
  new_category_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE patients
  SET
    category_id = new_category_uuid,
    updated_at = NOW()
  WHERE id = patient_uuid AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update workflow state
CREATE OR REPLACE FUNCTION update_patient_workflow(
  patient_uuid UUID,
  new_state TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate state
  IF new_state NOT IN ('admission', 'assessment', 'diagnosis', 'treatment', 'observation', 'discharge_planning', 'discharged') THEN
    RAISE EXCEPTION 'Invalid workflow state: %', new_state;
  END IF;

  UPDATE patients
  SET
    workflow_state = new_state,
    updated_at = NOW(),
    discharge_date = CASE WHEN new_state = 'discharged' THEN NOW() ELSE discharge_date END
  WHERE id = patient_uuid AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. STATISTICS VIEWS
-- ============================================

-- View for category statistics
CREATE OR REPLACE VIEW patient_category_stats AS
SELECT
  pc.workspace_id,
  pc.id as category_id,
  pc.name as category_name,
  pc.color as category_color,
  COUNT(p.id) as patient_count,
  COUNT(CASE WHEN p.workflow_state = 'discharged' THEN 1 END) as discharged_count,
  COUNT(CASE WHEN p.workflow_state != 'discharged' THEN 1 END) as active_count
FROM patient_categories pc
LEFT JOIN patients p ON p.category_id = pc.id AND p.deleted_at IS NULL
WHERE pc.deleted_at IS NULL
GROUP BY pc.workspace_id, pc.id, pc.name, pc.color, pc.sort_order
ORDER BY pc.sort_order;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Phase 5 Migration Complete!';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - patient_categories';
  RAISE NOTICE '  - patient_assignments';
  RAISE NOTICE 'Updated patients table with:';
  RAISE NOTICE '  - category_id';
  RAISE NOTICE '  - assigned_to';
  RAISE NOTICE '  - workflow_state';
  RAISE NOTICE '  - admission_date';
  RAISE NOTICE '  - discharge_date';
  RAISE NOTICE 'RLS policies enabled';
  RAISE NOTICE 'Realtime enabled';
  RAISE NOTICE 'Default categories created for all workspaces';
  RAISE NOTICE 'Helper functions created';
END $$;
