-- =====================================================
-- PHASE 11: HANDOFF & COMMUNICATION SYSTEM MIGRATION
-- =====================================================
-- Created: 2025-11-16
-- Description: Shift handoff system, AI-generated summaries, shift management
-- Dependencies: Phase 1 (Multi-tenant), Phase 5 (Patient management), Phase 9 (Tasks)
-- =====================================================

-- =====================================================
-- 1. SHIFT DEFINITIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Shift details
  name TEXT NOT NULL, -- 'Morning Shift', 'Night Shift', 'On-call'
  short_name TEXT, -- 'M', 'N', 'OC'
  description TEXT,

  -- Timing
  start_time TIME NOT NULL, -- e.g., '08:00:00'
  end_time TIME NOT NULL, -- e.g., '16:00:00'
  duration_hours DECIMAL(4,2), -- Auto-calculated

  -- Configuration
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  requires_handoff BOOLEAN DEFAULT true,

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(workspace_id, name)
);

-- Indexes
CREATE INDEX idx_shift_definitions_workspace ON shift_definitions(workspace_id);
CREATE INDEX idx_shift_definitions_active ON shift_definitions(workspace_id, is_active)
  WHERE deleted_at IS NULL;

-- =====================================================
-- 2. SHIFT SCHEDULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  shift_definition_id UUID REFERENCES shift_definitions(id) ON DELETE CASCADE,

  -- Assignment
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Schedule details
  shift_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  -- Status
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'cancelled'

  -- Check-in/out
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, user_id, shift_date, shift_definition_id)
);

-- Indexes
CREATE INDEX idx_shift_schedules_workspace ON shift_schedules(workspace_id);
CREATE INDEX idx_shift_schedules_user ON shift_schedules(user_id);
CREATE INDEX idx_shift_schedules_date ON shift_schedules(workspace_id, shift_date);
CREATE INDEX idx_shift_schedules_status ON shift_schedules(workspace_id, status);
CREATE INDEX idx_shift_schedules_active_shifts ON shift_schedules(workspace_id, start_time, end_time)
  WHERE status IN ('scheduled', 'active');

-- =====================================================
-- 3. HANDOFF TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS handoff_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Template details
  name TEXT NOT NULL,
  description TEXT,

  -- Template structure (JSON)
  sections JSONB DEFAULT '[]', -- Array of sections with fields
  -- Example: [
  --   { "title": "Patient Overview", "fields": ["demographics", "diagnosis", "vitals"] },
  --   { "title": "Pending Tasks", "fields": ["tasks", "pending_labs"] },
  --   { "title": "Important Notes", "fields": ["critical_alerts", "special_instructions"] }
  -- ]

  -- Configuration
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false, -- System templates cannot be deleted

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(workspace_id, name)
);

-- Indexes
CREATE INDEX idx_handoff_templates_workspace ON handoff_templates(workspace_id);
CREATE INDEX idx_handoff_templates_active ON handoff_templates(workspace_id, is_active)
  WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_handoff_templates_default ON handoff_templates(workspace_id)
  WHERE is_default = true AND deleted_at IS NULL;

-- =====================================================
-- 4. HANDOFFS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Shift information
  shift_id UUID REFERENCES shift_schedules(id) ON DELETE SET NULL,
  from_user_id UUID REFERENCES auth.users(id), -- Outgoing doctor
  to_user_id UUID REFERENCES auth.users(id), -- Incoming doctor

  -- Timing
  handoff_date DATE NOT NULL,
  handoff_time TIMESTAMPTZ NOT NULL,

  -- Template used
  template_id UUID REFERENCES handoff_templates(id) ON DELETE SET NULL,

  -- Content
  summary TEXT, -- Overall summary
  content JSONB DEFAULT '{}', -- Structured content based on template
  -- Example: {
  --   "patient_summary": "5 active patients, 2 critical...",
  --   "pending_tasks": [...],
  --   "critical_alerts": [...],
  --   "medications_due": [...],
  --   "special_instructions": "Patient in room 3 needs BP check q1h"
  -- }

  -- AI-generated fields
  is_ai_generated BOOLEAN DEFAULT false,
  ai_model TEXT, -- 'gpt-4', etc.
  ai_generation_time TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'pending_review', 'completed', 'archived'

  -- Acknowledgment
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),

  -- Notes and feedback
  receiver_notes TEXT,

  -- Print/Email tracking
  printed_at TIMESTAMPTZ,
  emailed_at TIMESTAMPTZ,
  email_recipients TEXT[],

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_handoffs_workspace ON handoffs(workspace_id);
CREATE INDEX idx_handoffs_from_user ON handoffs(from_user_id);
CREATE INDEX idx_handoffs_to_user ON handoffs(to_user_id);
CREATE INDEX idx_handoffs_shift ON handoffs(shift_id);
CREATE INDEX idx_handoffs_date ON handoffs(workspace_id, handoff_date DESC);
CREATE INDEX idx_handoffs_status ON handoffs(workspace_id, status);
CREATE INDEX idx_handoffs_pending ON handoffs(to_user_id, status)
  WHERE status IN ('pending_review', 'draft');

-- =====================================================
-- 5. HANDOFF PATIENTS TABLE (Link patients to handoff)
-- =====================================================
CREATE TABLE IF NOT EXISTS handoff_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handoff_id UUID REFERENCES handoffs(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Patient-specific handoff data
  patient_summary TEXT,
  critical_items TEXT[], -- Array of critical points
  pending_tasks TEXT[],
  recent_changes TEXT,

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(handoff_id, patient_id)
);

-- Indexes
CREATE INDEX idx_handoff_patients_handoff ON handoff_patients(handoff_id);
CREATE INDEX idx_handoff_patients_patient ON handoff_patients(patient_id);

-- =====================================================
-- 6. HANDOFF CHECKLIST ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS handoff_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handoff_id UUID REFERENCES handoffs(id) ON DELETE CASCADE,

  -- Item details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'patient_care', 'medication', 'procedure', 'follow_up'

  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),

  -- Priority
  priority TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_handoff_checklist_handoff ON handoff_checklist_items(handoff_id);
CREATE INDEX idx_handoff_checklist_incomplete ON handoff_checklist_items(handoff_id, is_completed)
  WHERE is_completed = false;

-- =====================================================
-- 7. DEFAULT DATA FUNCTIONS
-- =====================================================

-- Function to create default shift definitions for a workspace
CREATE OR REPLACE FUNCTION create_default_shift_definitions(p_workspace_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO shift_definitions (workspace_id, name, short_name, start_time, end_time, color, sort_order, is_active, requires_handoff)
  VALUES
    (p_workspace_id, 'Morning Shift', 'M', '08:00:00', '16:00:00', '#fbbf24', 1, true, true),
    (p_workspace_id, 'Evening Shift', 'E', '16:00:00', '00:00:00', '#f97316', 2, true, true),
    (p_workspace_id, 'Night Shift', 'N', '00:00:00', '08:00:00', '#6366f1', 3, true, true),
    (p_workspace_id, 'On-call', 'OC', '00:00:00', '23:59:59', '#8b5cf6', 4, true, false)
  ON CONFLICT (workspace_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to create default handoff template
CREATE OR REPLACE FUNCTION create_default_handoff_template(p_workspace_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO handoff_templates (workspace_id, name, description, sections, is_default, is_system)
  VALUES (
    p_workspace_id,
    'Standard Handoff',
    'Default handoff template for patient transitions',
    '[
      {
        "title": "Patient Overview",
        "fields": ["patient_count", "critical_patients", "new_admissions"]
      },
      {
        "title": "Critical Alerts",
        "fields": ["critical_vitals", "pending_labs", "imaging_results"]
      },
      {
        "title": "Pending Tasks",
        "fields": ["medication_orders", "procedures", "consultations"]
      },
      {
        "title": "Important Notes",
        "fields": ["code_status", "family_communication", "special_instructions"]
      },
      {
        "title": "Follow-up Items",
        "fields": ["next_day_tasks", "scheduled_procedures", "discharge_planning"]
      }
    ]'::jsonb,
    true,
    true
  )
  ON CONFLICT (workspace_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to get active shift for a user
CREATE OR REPLACE FUNCTION get_active_shift(p_user_id UUID, p_workspace_id UUID)
RETURNS TABLE (
  shift_id UUID,
  shift_name TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ss.id,
    sd.name,
    ss.start_time,
    ss.end_time
  FROM shift_schedules ss
  JOIN shift_definitions sd ON ss.shift_definition_id = sd.id
  WHERE ss.user_id = p_user_id
    AND ss.workspace_id = p_workspace_id
    AND ss.status = 'active'
    AND NOW() BETWEEN ss.start_time AND ss.end_time
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending handoffs for a user
CREATE OR REPLACE FUNCTION get_pending_handoffs(p_user_id UUID, p_workspace_id UUID)
RETURNS TABLE (
  handoff_id UUID,
  from_user_name TEXT,
  handoff_date DATE,
  patient_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    p.full_name,
    h.handoff_date,
    COUNT(hp.id) as patient_count
  FROM handoffs h
  LEFT JOIN profiles p ON h.from_user_id = p.user_id
  LEFT JOIN handoff_patients hp ON h.id = hp.handoff_id
  WHERE h.to_user_id = p_user_id
    AND h.workspace_id = p_workspace_id
    AND h.status IN ('pending_review', 'draft')
    AND h.deleted_at IS NULL
  GROUP BY h.id, p.full_name, h.handoff_date
  ORDER BY h.handoff_date DESC, h.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shift_definitions_updated_at
  BEFORE UPDATE ON shift_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_schedules_updated_at
  BEFORE UPDATE ON shift_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_handoff_templates_updated_at
  BEFORE UPDATE ON handoff_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_handoffs_updated_at
  BEFORE UPDATE ON handoffs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE shift_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_checklist_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Shift Definitions Policies
-- =====================================================

CREATE POLICY "Users can view shift definitions in their workspace"
  ON shift_definitions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can insert shift definitions"
  ON shift_definitions FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  );

CREATE POLICY "Admins can update shift definitions"
  ON shift_definitions FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  );

CREATE POLICY "Admins can delete shift definitions"
  ON shift_definitions FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- Shift Schedules Policies
-- =====================================================

CREATE POLICY "Users can view shift schedules in their workspace"
  ON shift_schedules FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins and users can create shift schedules"
  ON shift_schedules FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor', 'doctor')
    )
  );

CREATE POLICY "Users can update their own shift schedules"
  ON shift_schedules FOR UPDATE
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  );

-- =====================================================
-- Handoff Templates Policies
-- =====================================================

CREATE POLICY "Users can view handoff templates in their workspace"
  ON handoff_templates FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage handoff templates"
  ON handoff_templates FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  );

CREATE POLICY "Admins can update handoff templates"
  ON handoff_templates FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  );

-- =====================================================
-- Handoffs Policies
-- =====================================================

CREATE POLICY "Users can view handoffs they created or received"
  ON handoffs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR from_user_id = auth.uid()
    OR to_user_id = auth.uid()
  );

CREATE POLICY "Users can create handoffs in their workspace"
  ON handoffs FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

CREATE POLICY "Users can update their own handoffs"
  ON handoffs FOR UPDATE
  USING (
    from_user_id = auth.uid() OR
    to_user_id = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete their own handoffs"
  ON handoffs FOR DELETE
  USING (
    from_user_id = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- Handoff Patients Policies
-- =====================================================

CREATE POLICY "Users can view handoff patients if they can view the handoff"
  ON handoff_patients FOR SELECT
  USING (
    handoff_id IN (
      SELECT id FROM handoffs
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
      OR from_user_id = auth.uid()
      OR to_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage handoff patients for their handoffs"
  ON handoff_patients FOR ALL
  USING (
    handoff_id IN (
      SELECT id FROM handoffs
      WHERE from_user_id = auth.uid() OR to_user_id = auth.uid()
    )
  );

-- =====================================================
-- Handoff Checklist Items Policies
-- =====================================================

CREATE POLICY "Users can view checklist items for their handoffs"
  ON handoff_checklist_items FOR SELECT
  USING (
    handoff_id IN (
      SELECT id FROM handoffs
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
      OR from_user_id = auth.uid()
      OR to_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage checklist items for their handoffs"
  ON handoff_checklist_items FOR ALL
  USING (
    handoff_id IN (
      SELECT id FROM handoffs
      WHERE from_user_id = auth.uid() OR to_user_id = auth.uid()
    )
  );

-- =====================================================
-- 11. COMMENTS
-- =====================================================

COMMENT ON TABLE shift_definitions IS 'Defines shift types for a workspace (morning, evening, night, on-call)';
COMMENT ON TABLE shift_schedules IS 'Scheduled shifts for users with check-in/out tracking';
COMMENT ON TABLE handoff_templates IS 'Reusable templates for structured handoffs';
COMMENT ON TABLE handoffs IS 'Shift handoff records with AI-generated summaries';
COMMENT ON TABLE handoff_patients IS 'Links patients to specific handoffs with patient-specific notes';
COMMENT ON TABLE handoff_checklist_items IS 'Checklist items for handoffs to ensure completeness';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
