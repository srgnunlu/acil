-- =====================================================
-- PHASE 10: PROTOCOL LIBRARY & CLINICAL TOOLS MIGRATION
-- =====================================================
-- Created: 2025-11-16
-- Description: Protocol management, clinical calculators, and decision support tools
-- Dependencies: Phase 1 (Multi-tenant infrastructure)
-- =====================================================

-- =====================================================
-- 1. PROTOCOL CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS protocol_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Category details
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT,

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- System vs Custom
  is_system BOOLEAN DEFAULT false, -- System categories cannot be deleted

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(workspace_id, slug)
);

-- Indexes
CREATE INDEX idx_protocol_categories_workspace ON protocol_categories(workspace_id);
CREATE INDEX idx_protocol_categories_active ON protocol_categories(workspace_id)
  WHERE deleted_at IS NULL;

-- =====================================================
-- 2. PROTOCOLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES protocol_categories(id) ON DELETE SET NULL,

  -- Protocol details
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL, -- Rich text content (HTML or Markdown)
  content_type TEXT DEFAULT 'markdown', -- 'markdown', 'html'

  -- Classification
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}', -- For search

  -- Version info
  version TEXT DEFAULT '1.0',
  version_number INTEGER DEFAULT 1,
  parent_version_id UUID REFERENCES protocols(id), -- Link to previous version

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Search optimization
  search_vector tsvector,

  UNIQUE(workspace_id, slug, version_number)
);

-- Indexes
CREATE INDEX idx_protocols_workspace ON protocols(workspace_id);
CREATE INDEX idx_protocols_category ON protocols(category_id);
CREATE INDEX idx_protocols_status ON protocols(workspace_id, status, is_active);
CREATE INDEX idx_protocols_created_by ON protocols(created_by);
CREATE INDEX idx_protocols_active ON protocols(workspace_id, is_active)
  WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_protocols_search ON protocols USING GIN(search_vector);

-- Update search_vector on insert/update
CREATE OR REPLACE FUNCTION update_protocol_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_protocol_search_vector
  BEFORE INSERT OR UPDATE OF title, description, content, keywords
  ON protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_protocol_search_vector();

-- =====================================================
-- 3. PROTOCOL ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS protocol_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,

  -- File details
  file_name TEXT NOT NULL,
  file_type TEXT, -- 'pdf', 'image', 'doc'
  file_size INTEGER, -- bytes
  file_url TEXT NOT NULL, -- Supabase Storage URL

  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_protocol_attachments_protocol ON protocol_attachments(protocol_id);

-- =====================================================
-- 4. PROTOCOL FAVORITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS protocol_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(protocol_id, user_id)
);

-- Indexes
CREATE INDEX idx_protocol_favorites_user ON protocol_favorites(user_id, workspace_id);
CREATE INDEX idx_protocol_favorites_protocol ON protocol_favorites(protocol_id);

-- =====================================================
-- 5. PROTOCOL VIEWS TABLE (Analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS protocol_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- View details
  view_duration INTEGER, -- seconds

  -- Context
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

  -- Metadata
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_protocol_views_protocol ON protocol_views(protocol_id, viewed_at DESC);
CREATE INDEX idx_protocol_views_user ON protocol_views(user_id, viewed_at DESC);

-- =====================================================
-- 6. CLINICAL CALCULATOR RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_calculator_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Calculator details
  calculator_type TEXT NOT NULL, -- 'gcs', 'apache_ii', 'sofa', 'qsofa', 'wells', 'chads2vasc', 'hasbled'

  -- Input data
  input_data JSONB NOT NULL,

  -- Results
  score INTEGER,
  score_interpretation TEXT,
  risk_category TEXT, -- 'low', 'medium', 'high', 'critical'
  recommendations TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calculator_results_patient ON clinical_calculator_results(patient_id, created_at DESC);
CREATE INDEX idx_calculator_results_workspace ON clinical_calculator_results(workspace_id, calculator_type);
CREATE INDEX idx_calculator_results_user ON clinical_calculator_results(user_id, created_at DESC);

-- =====================================================
-- 7. PROTOCOL AI SUGGESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS protocol_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- AI suggestion details
  relevance_score NUMERIC(3, 2), -- 0.00 to 1.00
  reasoning TEXT,
  ai_model TEXT, -- 'gpt-4', 'gemini-pro'

  -- User interaction
  was_viewed BOOLEAN DEFAULT false,
  was_helpful BOOLEAN,
  user_feedback TEXT,

  -- Metadata
  suggested_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  feedback_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_protocol_ai_suggestions_patient ON protocol_ai_suggestions(patient_id, relevance_score DESC);
CREATE INDEX idx_protocol_ai_suggestions_protocol ON protocol_ai_suggestions(protocol_id);

-- =====================================================
-- 8. INSERT DEFAULT PROTOCOL CATEGORIES
-- =====================================================

-- Function to create default categories for a workspace
CREATE OR REPLACE FUNCTION create_default_protocol_categories(p_workspace_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO protocol_categories (workspace_id, name, slug, description, color, icon, is_system, sort_order)
  VALUES
    (p_workspace_id, 'Acil Tıp', 'emergency', 'Acil servis protokolleri', '#ef4444', '🚨', true, 1),
    (p_workspace_id, 'Kardiyoloji', 'cardiology', 'Kardiyak aciller ve protokoller', '#ec4899', '❤️', true, 2),
    (p_workspace_id, 'Nöroloji', 'neurology', 'Nörolojik aciller ve protokoller', '#8b5cf6', '🧠', true, 3),
    (p_workspace_id, 'Solunum', 'respiratory', 'Solunum sistemi protokolleri', '#06b6d4', '🫁', true, 4),
    (p_workspace_id, 'Travma', 'trauma', 'Travma yönetim protokolleri', '#f59e0b', '⚠️', true, 5),
    (p_workspace_id, 'Pediatri', 'pediatrics', 'Pediatrik aciller', '#10b981', '👶', true, 6),
    (p_workspace_id, 'Toksikoloji', 'toxicology', 'Zehirlenme protokolleri', '#6366f1', '☠️', true, 7),
    (p_workspace_id, 'Genel', 'general', 'Genel klinik protokoller', '#6b7280', '📋', true, 8)
  ON CONFLICT (workspace_id, slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Protocol Categories RLS
ALTER TABLE protocol_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view protocol categories in their workspace"
  ON protocol_categories FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can insert protocol categories"
  ON protocol_categories FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  );

CREATE POLICY "Admins can update protocol categories"
  ON protocol_categories FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
    AND NOT is_system -- Cannot update system categories
  );

CREATE POLICY "Admins can delete protocol categories"
  ON protocol_categories FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
    AND NOT is_system -- Cannot delete system categories
  );

-- Protocols RLS
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view published protocols in their workspace"
  ON protocols FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND (status = 'published' OR created_by = auth.uid())
  );

CREATE POLICY "Authorized users can insert protocols"
  ON protocols FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor', 'doctor')
    )
  );

CREATE POLICY "Authors and admins can update protocols"
  ON protocols FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND (
          wm.role IN ('owner', 'admin', 'senior_doctor')
          OR (created_by = auth.uid() AND status = 'draft')
        )
    )
  );

CREATE POLICY "Admins can delete protocols"
  ON protocols FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- Protocol Attachments RLS
ALTER TABLE protocol_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments for visible protocols"
  ON protocol_attachments FOR SELECT
  USING (
    protocol_id IN (
      SELECT id FROM protocols
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Authorized users can insert attachments"
  ON protocol_attachments FOR INSERT
  WITH CHECK (
    protocol_id IN (
      SELECT p.id FROM protocols p
      JOIN workspace_members wm ON p.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'senior_doctor', 'doctor')
    )
  );

-- Protocol Favorites RLS
ALTER TABLE protocol_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON protocol_favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own favorites"
  ON protocol_favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own favorites"
  ON protocol_favorites FOR DELETE
  USING (user_id = auth.uid());

-- Protocol Views RLS
ALTER TABLE protocol_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view protocol analytics in their workspace"
  ON protocol_views FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert protocol views"
  ON protocol_views FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Clinical Calculator Results RLS
ALTER TABLE clinical_calculator_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calculator results in their workspace"
  ON clinical_calculator_results FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert calculator results"
  ON clinical_calculator_results FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Protocol AI Suggestions RLS
ALTER TABLE protocol_ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI suggestions in their workspace"
  ON protocol_ai_suggestions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "System can insert AI suggestions"
  ON protocol_ai_suggestions FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update AI suggestion feedback"
  ON protocol_ai_suggestions FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Function to get popular protocols
CREATE OR REPLACE FUNCTION get_popular_protocols(
  p_workspace_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  protocol_id UUID,
  title TEXT,
  view_count BIGINT,
  favorite_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    COUNT(DISTINCT pv.id)::BIGINT as view_count,
    COUNT(DISTINCT pf.id)::BIGINT as favorite_count
  FROM protocols p
  LEFT JOIN protocol_views pv ON p.id = pv.protocol_id
  LEFT JOIN protocol_favorites pf ON p.id = pf.protocol_id
  WHERE p.workspace_id = p_workspace_id
    AND p.status = 'published'
    AND p.is_active = true
    AND p.deleted_at IS NULL
  GROUP BY p.id, p.title
  ORDER BY view_count DESC, favorite_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search protocols
CREATE OR REPLACE FUNCTION search_protocols(
  p_workspace_id UUID,
  p_search_query TEXT,
  p_category_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category_id UUID,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.category_id,
    ts_rank(p.search_vector, plainto_tsquery('english', p_search_query)) as rank
  FROM protocols p
  WHERE p.workspace_id = p_workspace_id
    AND p.status = 'published'
    AND p.is_active = true
    AND p.deleted_at IS NULL
    AND p.search_vector @@ plainto_tsquery('english', p_search_query)
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_protocol_categories_updated_at
  BEFORE UPDATE ON protocol_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protocols_updated_at
  BEFORE UPDATE ON protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF PHASE 10 MIGRATION
-- =====================================================

-- Verification queries
-- SELECT COUNT(*) FROM protocol_categories;
-- SELECT COUNT(*) FROM protocols;
-- SELECT * FROM get_popular_protocols('workspace-uuid-here', 10);
-- SELECT * FROM search_protocols('workspace-uuid-here', 'sepsis', NULL, 10);
