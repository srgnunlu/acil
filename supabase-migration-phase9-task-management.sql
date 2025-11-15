-- =====================================================
-- ACIL Platform - Phase 9: Task & Workflow Management
-- =====================================================
-- Description: Görev yönetimi, checklist, templates ve reminder sistemi
-- Version: 1.0
-- Date: 2025-11-15
-- Dependencies: Phase 1-8 migrations must be completed
-- =====================================================

-- =====================================================
-- 1. TASKS TABLE
-- =====================================================
-- Ana görev tablosu

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Task Details
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')),

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timing
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Task Organization
  category TEXT, -- 'clinical', 'administrative', 'lab', 'imaging', 'medication', 'consultation', 'discharge'
  tags TEXT[], -- Array of tags for flexible categorization

  -- Template Reference
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,

  -- Reminder Settings
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_before_minutes INTEGER, -- Minutes before due_date to send reminder
  reminder_sent_at TIMESTAMPTZ,

  -- Dependencies
  blocked_by UUID REFERENCES tasks(id) ON DELETE SET NULL, -- Task that must be completed first

  -- Progress Tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for tasks
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_patient ON tasks(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_priority ON tasks(workspace_id, priority, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE status NOT IN ('completed', 'cancelled') AND deleted_at IS NULL;
CREATE INDEX idx_tasks_overdue ON tasks(workspace_id, due_date) WHERE status NOT IN ('completed', 'cancelled') AND due_date < NOW() AND deleted_at IS NULL;
CREATE INDEX idx_tasks_category ON tasks(workspace_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_template ON tasks(template_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_reminder ON tasks(reminder_enabled, reminder_sent_at, due_date) WHERE status NOT IN ('completed', 'cancelled') AND deleted_at IS NULL;

-- Comments
COMMENT ON TABLE tasks IS 'Hasta ve workspace bazlı görev yönetimi';
COMMENT ON COLUMN tasks.priority IS 'Görev önceliği: urgent, high, medium, low';
COMMENT ON COLUMN tasks.status IS 'Görev durumu: pending, in_progress, completed, cancelled, on_hold';
COMMENT ON COLUMN tasks.category IS 'Görev kategorisi: clinical, administrative, lab, imaging, medication, consultation, discharge';
COMMENT ON COLUMN tasks.blocked_by IS 'Bu görevin başlayabilmesi için tamamlanması gereken başka bir görev';
COMMENT ON COLUMN tasks.reminder_before_minutes IS 'Due date öncesi kaç dakika önce hatırlatma gönderilecek';

-- =====================================================
-- 2. TASK TEMPLATES TABLE
-- =====================================================
-- Sık kullanılan görev şablonları

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template Details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'clinical', 'administrative', etc.

  -- Default Values
  default_priority TEXT DEFAULT 'medium' CHECK (default_priority IN ('urgent', 'high', 'medium', 'low')),
  default_duration_minutes INTEGER, -- Estimated task duration
  default_reminder_before_minutes INTEGER,

  -- Template Content
  title_template TEXT NOT NULL, -- Can include variables like {patient_name}
  description_template TEXT,

  -- Checklist Items (stored as JSONB)
  checklist_items JSONB DEFAULT '[]', -- Array of checklist items

  -- Tags
  default_tags TEXT[],

  -- Visibility
  is_system BOOLEAN DEFAULT false, -- System templates can't be deleted
  is_active BOOLEAN DEFAULT true,

  -- Usage Stats
  usage_count INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for task_templates
CREATE INDEX idx_task_templates_workspace ON task_templates(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_templates_org ON task_templates(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_templates_category ON task_templates(category) WHERE deleted_at IS NULL AND is_active = true;
CREATE INDEX idx_task_templates_active ON task_templates(workspace_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_templates_usage ON task_templates(workspace_id, usage_count DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE task_templates IS 'Görev şablonları - tekrar eden görevler için kullanılır';
COMMENT ON COLUMN task_templates.title_template IS 'Değişkenler içerebilir: {patient_name}, {workspace_name}';
COMMENT ON COLUMN task_templates.checklist_items IS 'JSON array of checklist items: [{title: "...", order: 1}, ...]';
COMMENT ON COLUMN task_templates.is_system IS 'Sistem şablonları kullanıcılar tarafından silinemez';

-- =====================================================
-- 3. TASK CHECKLIST ITEMS TABLE
-- =====================================================
-- Görev içindeki checklist öğeleri

CREATE TABLE IF NOT EXISTS task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- Item Details
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Optional Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for task_checklist_items
CREATE INDEX idx_checklist_task ON task_checklist_items(task_id, order_index);
CREATE INDEX idx_checklist_assigned ON task_checklist_items(assigned_to, is_completed);
CREATE INDEX idx_checklist_status ON task_checklist_items(task_id, is_completed);

COMMENT ON TABLE task_checklist_items IS 'Görev içindeki checklist maddeleri';
COMMENT ON COLUMN task_checklist_items.order_index IS 'Checklist içindeki sıralama';

-- =====================================================
-- 4. TASK COMMENTS TABLE
-- =====================================================
-- Görevler üzerindeki yorumlar

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- Comment
  content TEXT NOT NULL,

  -- Mentions
  mentions JSONB DEFAULT '[]', -- Array of mentioned user objects

  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for task_comments
CREATE INDEX idx_task_comments_task ON task_comments(task_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_comments_author ON task_comments(created_by) WHERE deleted_at IS NULL;

COMMENT ON TABLE task_comments IS 'Görev yorumları ve tartışmalar';
COMMENT ON COLUMN task_comments.mentions IS 'Mention edilen kullanıcılar: [{user_id: "...", full_name: "..."}]';

-- =====================================================
-- 5. TASK ATTACHMENTS TABLE
-- =====================================================
-- Görevlere eklenen dosyalar

CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- File Details
  file_name TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  file_type TEXT, -- MIME type
  file_url TEXT NOT NULL, -- Supabase Storage URL or external URL
  storage_path TEXT, -- Path in Supabase Storage

  -- Metadata
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for task_attachments
CREATE INDEX idx_task_attachments_task ON task_attachments(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_attachments_uploader ON task_attachments(uploaded_by) WHERE deleted_at IS NULL;

COMMENT ON TABLE task_attachments IS 'Görevlere eklenen dosyalar';

-- =====================================================
-- 6. TASK ACTIVITY LOG TABLE
-- =====================================================
-- Görev değişiklik geçmişi

CREATE TABLE IF NOT EXISTS task_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- Activity
  activity_type TEXT NOT NULL, -- 'created', 'updated', 'assigned', 'completed', 'commented', 'status_changed', etc.
  field_name TEXT, -- Which field was changed
  old_value TEXT,
  new_value TEXT,

  -- Additional Data
  metadata JSONB DEFAULT '{}',

  -- Actor
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for task_activity_log
CREATE INDEX idx_task_activity_task ON task_activity_log(task_id, performed_at DESC);
CREATE INDEX idx_task_activity_user ON task_activity_log(performed_by, performed_at DESC);
CREATE INDEX idx_task_activity_type ON task_activity_log(task_id, activity_type);

COMMENT ON TABLE task_activity_log IS 'Görev değişiklik geçmişi ve audit log';
COMMENT ON COLUMN task_activity_log.activity_type IS 'created, updated, assigned, completed, commented, status_changed, priority_changed';

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

CREATE TRIGGER task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

CREATE TRIGGER task_checklist_items_updated_at
  BEFORE UPDATE ON task_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- Auto-calculate task progress based on checklist completion
CREATE OR REPLACE FUNCTION update_task_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_items INTEGER;
  completed_items INTEGER;
  new_progress INTEGER;
BEGIN
  -- Count total and completed checklist items
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE is_completed = true)
  INTO total_items, completed_items
  FROM task_checklist_items
  WHERE task_id = COALESCE(NEW.task_id, OLD.task_id);

  -- Calculate progress percentage
  IF total_items > 0 THEN
    new_progress := (completed_items * 100) / total_items;
  ELSE
    new_progress := 0;
  END IF;

  -- Update task progress
  UPDATE tasks
  SET progress_percentage = new_progress,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_progress_on_checklist_change
  AFTER INSERT OR UPDATE OR DELETE ON task_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_task_progress();

-- Log task status changes
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO task_activity_log (
      task_id,
      activity_type,
      field_name,
      old_value,
      new_value,
      performed_by
    ) VALUES (
      NEW.id,
      'status_changed',
      'status',
      OLD.status,
      NEW.status,
      NEW.assigned_by -- or could be current user from auth.uid()
    );

    -- If task is completed, set completed_at
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      NEW.completed_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_task_status_change_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_status_change();

-- Increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL THEN
    UPDATE task_templates
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = NEW.template_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_template_usage_trigger
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_usage();

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TASKS POLICIES
-- =====================================================

-- Users can view tasks in their workspace
CREATE POLICY "Users can view workspace tasks"
  ON tasks FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Users can create tasks in their workspace (with appropriate role)
CREATE POLICY "Users can create tasks in workspace"
  ON tasks FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident')
    )
  );

-- Users can update tasks they created or are assigned to
CREATE POLICY "Users can update their tasks"
  ON tasks FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND (
      created_by = auth.uid()
      OR assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = tasks.workspace_id
          AND user_id = auth.uid()
          AND role IN ('owner', 'admin', 'senior_doctor')
      )
    )
  );

-- Only owners/admins can delete tasks
CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  );

-- =====================================================
-- TASK TEMPLATES POLICIES
-- =====================================================

-- Users can view templates in their workspace/organization
CREATE POLICY "Users can view workspace templates"
  ON task_templates FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR organization_id IN (
      SELECT DISTINCT w.organization_id
      FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

-- Admins can create templates
CREATE POLICY "Admins can create templates"
  ON task_templates FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  );

-- Admins can update templates (except system templates)
CREATE POLICY "Admins can update templates"
  ON task_templates FOR UPDATE
  USING (
    is_system = false
    AND workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  );

-- Admins can delete templates (except system templates)
CREATE POLICY "Admins can delete templates"
  ON task_templates FOR DELETE
  USING (
    is_system = false
    AND workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- TASK CHECKLIST ITEMS POLICIES
-- =====================================================

-- Users can view checklist items for tasks they can see
CREATE POLICY "Users can view task checklist items"
  ON task_checklist_items FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Users can manage checklist items for tasks they can update
CREATE POLICY "Users can manage task checklist items"
  ON task_checklist_items FOR ALL
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      WHERE t.workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
      AND (
        t.created_by = auth.uid()
        OR t.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_id = t.workspace_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin', 'senior_doctor')
        )
      )
    )
  );

-- =====================================================
-- TASK COMMENTS POLICIES
-- =====================================================

-- Users can view comments on tasks they can see
CREATE POLICY "Users can view task comments"
  ON task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Users can add comments to tasks they can see
CREATE POLICY "Users can add task comments"
  ON task_comments FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
    AND created_by = auth.uid()
  );

-- Users can update/delete their own comments
CREATE POLICY "Users can manage their comments"
  ON task_comments FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their comments"
  ON task_comments FOR DELETE
  USING (created_by = auth.uid());

-- =====================================================
-- TASK ATTACHMENTS POLICIES
-- =====================================================

-- Users can view attachments for tasks they can see
CREATE POLICY "Users can view task attachments"
  ON task_attachments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Users can add attachments to tasks they can update
CREATE POLICY "Users can add task attachments"
  ON task_attachments FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT t.id FROM tasks t
      WHERE t.workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
      AND (
        t.created_by = auth.uid()
        OR t.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_id = t.workspace_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin', 'senior_doctor')
        )
      )
    )
    AND uploaded_by = auth.uid()
  );

-- Users can delete attachments they uploaded
CREATE POLICY "Users can delete their attachments"
  ON task_attachments FOR DELETE
  USING (uploaded_by = auth.uid());

-- =====================================================
-- TASK ACTIVITY LOG POLICIES
-- =====================================================

-- Users can view activity log for tasks they can see
CREATE POLICY "Users can view task activity"
  ON task_activity_log FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- System can insert activity logs
CREATE POLICY "System can insert activity logs"
  ON task_activity_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 9. DEFAULT TASK TEMPLATES
-- =====================================================

-- Note: These will be inserted via API or separate seed script
-- Example templates are shown in comments for reference

/*
-- Clinical Task Templates
INSERT INTO task_templates (name, category, title_template, description_template, default_priority, checklist_items, is_system) VALUES
('Hasta Kabul', 'clinical', 'Hasta Kabul - {patient_name}', 'Yeni hasta kabul işlemleri', 'high',
  '[{"title": "Vital signs ölç", "order": 1}, {"title": "Anamnez al", "order": 2}, {"title": "Fizik muayene", "order": 3}, {"title": "Başlangıç tetkiklerini iste", "order": 4}]'::jsonb,
  true),
('Lab İstem', 'lab', 'Lab Tetkik İsteği - {patient_name}', 'Laboratuvar tetkik istemi', 'medium',
  '[{"title": "Tetkikleri belirle", "order": 1}, {"title": "İstem yap", "order": 2}, {"title": "Sonuçları takip et", "order": 3}]'::jsonb,
  true);
*/

-- =====================================================
-- 10. FUNCTIONS FOR TASK MANAGEMENT
-- =====================================================

-- Function to get overdue tasks
CREATE OR REPLACE FUNCTION get_overdue_tasks(p_workspace_id UUID)
RETURNS TABLE (
  task_id UUID,
  title TEXT,
  due_date TIMESTAMPTZ,
  assigned_to UUID,
  priority TEXT,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.due_date,
    t.assigned_to,
    t.priority,
    EXTRACT(DAY FROM NOW() - t.due_date)::INTEGER as days_overdue
  FROM tasks t
  WHERE t.workspace_id = p_workspace_id
    AND t.status NOT IN ('completed', 'cancelled')
    AND t.due_date < NOW()
    AND t.deleted_at IS NULL
  ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's task summary
CREATE OR REPLACE FUNCTION get_user_task_summary(p_user_id UUID, p_workspace_id UUID)
RETURNS TABLE (
  total_tasks BIGINT,
  pending_tasks BIGINT,
  in_progress_tasks BIGINT,
  completed_today BIGINT,
  overdue_tasks BIGINT,
  high_priority_tasks BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'pending' AND deleted_at IS NULL) as pending_tasks,
    COUNT(*) FILTER (WHERE status = 'in_progress' AND deleted_at IS NULL) as in_progress_tasks,
    COUNT(*) FILTER (WHERE status = 'completed' AND completed_at::date = CURRENT_DATE) as completed_today,
    COUNT(*) FILTER (WHERE status NOT IN ('completed', 'cancelled') AND due_date < NOW() AND deleted_at IS NULL) as overdue_tasks,
    COUNT(*) FILTER (WHERE priority IN ('urgent', 'high') AND status NOT IN ('completed', 'cancelled') AND deleted_at IS NULL) as high_priority_tasks
  FROM tasks
  WHERE workspace_id = p_workspace_id
    AND assigned_to = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('tasks', 'task_templates', 'task_checklist_items', 'task_comments', 'task_attachments', 'task_activity_log');

  IF table_count = 6 THEN
    RAISE NOTICE 'Phase 9 Migration Successful: All 6 tables created';
  ELSE
    RAISE WARNING 'Phase 9 Migration Warning: Expected 6 tables, found %', table_count;
  END IF;
END $$;

-- Success message
SELECT 'Phase 9: Task & Workflow Management - Migration completed successfully!' as status;
