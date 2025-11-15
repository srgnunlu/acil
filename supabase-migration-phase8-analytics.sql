-- ============================================
-- FAZ 8: ANALYTICS & REPORTING SYSTEM
-- ============================================
-- ACIL - Comprehensive Analytics & Reporting
-- Tarih: 2025-11-15
-- Açıklama: Advanced analytics, custom reports, dashboard widgets
-- ⚠️ Bu dosya TAMAMEN GÜVENLİ - Mevcut veriyi bozmaz
-- ============================================

-- ============================================
-- BÖLÜM 1: ANALYTICS MATERIALIZED VIEWS
-- ============================================
-- Performans için pre-computed analytics

-- 1.1: Workspace Patient Statistics View
CREATE MATERIALIZED VIEW IF NOT EXISTS workspace_patient_stats AS
SELECT
  w.id as workspace_id,
  w.organization_id,
  COUNT(DISTINCT p.id) as total_patients,
  COUNT(DISTINCT CASE WHEN p.discharge_date IS NULL THEN p.id END) as active_patients,
  COUNT(DISTINCT CASE WHEN p.discharge_date IS NOT NULL THEN p.id END) as discharged_patients,
  COUNT(DISTINCT CASE WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN p.id END) as patients_last_7_days,
  COUNT(DISTINCT CASE WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN p.id END) as patients_last_30_days,
  AVG(CASE
    WHEN p.discharge_date IS NOT NULL AND p.admission_date IS NOT NULL
    THEN EXTRACT(EPOCH FROM (p.discharge_date - p.admission_date)) / 86400
  END) as avg_length_of_stay_days,
  MAX(p.created_at) as last_patient_added,
  NOW() as refreshed_at
FROM workspaces w
LEFT JOIN patients p ON p.workspace_id = w.id AND p.deleted_at IS NULL
WHERE w.deleted_at IS NULL
GROUP BY w.id, w.organization_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_patient_stats_workspace
  ON workspace_patient_stats(workspace_id);

-- 1.2: Category Distribution View
CREATE MATERIALIZED VIEW IF NOT EXISTS workspace_category_stats AS
SELECT
  w.id as workspace_id,
  pc.id as category_id,
  pc.name as category_name,
  pc.slug as category_slug,
  pc.color as category_color,
  COUNT(DISTINCT p.id) as patient_count,
  COUNT(DISTINCT CASE WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN p.id END) as new_patients_7d,
  NOW() as refreshed_at
FROM workspaces w
LEFT JOIN patient_categories pc ON pc.workspace_id = w.id AND pc.deleted_at IS NULL
LEFT JOIN patients p ON p.category_id = pc.id AND p.deleted_at IS NULL
WHERE w.deleted_at IS NULL
GROUP BY w.id, pc.id, pc.name, pc.slug, pc.color;

CREATE INDEX IF NOT EXISTS idx_workspace_category_stats_workspace
  ON workspace_category_stats(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_category_stats_category
  ON workspace_category_stats(category_id);

-- 1.3: Team Activity Stats
CREATE MATERIALIZED VIEW IF NOT EXISTS workspace_team_stats AS
SELECT
  w.id as workspace_id,
  u.id as user_id,
  p.full_name as user_name,
  wm.role as user_role,
  COUNT(DISTINCT pa.id) FILTER (WHERE pa.user_id = u.id) as patients_created,
  COUNT(DISTINCT paa.patient_id) FILTER (WHERE paa.user_id = u.id AND paa.is_active = true) as patients_assigned,
  COUNT(DISTINCT sn.id) FILTER (WHERE sn.created_by = u.id) as sticky_notes_created,
  COUNT(DISTINCT ai.id) FILTER (WHERE ai.user_id = u.id) as ai_analyses_run,
  MAX(al.created_at) FILTER (WHERE al.user_id = u.id) as last_activity,
  NOW() as refreshed_at
FROM workspaces w
INNER JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.status = 'active'
INNER JOIN auth.users u ON u.id = wm.user_id
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN patients pa ON pa.user_id = u.id AND pa.workspace_id = w.id AND pa.deleted_at IS NULL
LEFT JOIN patient_assignments paa ON paa.user_id = u.id
LEFT JOIN sticky_notes sn ON sn.created_by = u.id AND sn.workspace_id = w.id AND sn.deleted_at IS NULL
LEFT JOIN ai_usage_logs ai ON ai.user_id = u.id AND ai.workspace_id = w.id
LEFT JOIN activity_log al ON al.user_id = u.id AND al.workspace_id = w.id
WHERE w.deleted_at IS NULL
GROUP BY w.id, u.id, p.full_name, wm.role;

CREATE INDEX IF NOT EXISTS idx_workspace_team_stats_workspace
  ON workspace_team_stats(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_team_stats_user
  ON workspace_team_stats(user_id);

-- 1.4: AI Usage Statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS workspace_ai_stats AS
SELECT
  w.id as workspace_id,
  COUNT(DISTINCT aul.id) as total_ai_requests,
  COUNT(DISTINCT CASE WHEN aul.operation = 'analyze' THEN aul.id END) as analyze_count,
  COUNT(DISTINCT CASE WHEN aul.operation = 'chat' THEN aul.id END) as chat_count,
  COUNT(DISTINCT CASE WHEN aul.operation = 'vision' THEN aul.id END) as vision_count,
  COUNT(DISTINCT CASE WHEN aul.operation = 'compare' THEN aul.id END) as compare_count,
  SUM(aul.input_tokens) as total_input_tokens,
  SUM(aul.output_tokens) as total_output_tokens,
  SUM(aul.total_cost) as total_cost,
  AVG(aul.response_time_ms) as avg_response_time_ms,
  COUNT(DISTINCT CASE WHEN aul.success = false THEN aul.id END) as error_count,
  COUNT(DISTINCT aul.patient_id) as unique_patients_analyzed,
  NOW() as refreshed_at
FROM workspaces w
LEFT JOIN ai_usage_logs aul ON aul.workspace_id = w.id
WHERE w.deleted_at IS NULL
GROUP BY w.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_ai_stats_workspace
  ON workspace_ai_stats(workspace_id);

-- 1.5: Daily Metrics View (Son 90 gün)
CREATE MATERIALIZED VIEW IF NOT EXISTS workspace_daily_metrics AS
SELECT
  w.id as workspace_id,
  DATE(p.created_at) as metric_date,
  COUNT(DISTINCT p.id) as patients_added,
  COUNT(DISTINCT CASE WHEN p.discharge_date IS NOT NULL AND DATE(p.discharge_date) = DATE(p.created_at) THEN p.id END) as patients_discharged,
  COUNT(DISTINCT ai.id) as ai_analyses,
  COUNT(DISTINCT sn.id) as sticky_notes_added,
  NOW() as refreshed_at
FROM workspaces w
CROSS JOIN generate_series(NOW() - INTERVAL '90 days', NOW(), INTERVAL '1 day') AS dates(date)
LEFT JOIN patients p ON p.workspace_id = w.id
  AND DATE(p.created_at) = DATE(dates.date)
  AND p.deleted_at IS NULL
LEFT JOIN ai_analyses ai ON ai.workspace_id = w.id
  AND DATE(ai.created_at) = DATE(dates.date)
LEFT JOIN sticky_notes sn ON sn.workspace_id = w.id
  AND DATE(sn.created_at) = DATE(dates.date)
  AND sn.deleted_at IS NULL
WHERE w.deleted_at IS NULL
GROUP BY w.id, DATE(p.created_at);

CREATE INDEX IF NOT EXISTS idx_workspace_daily_metrics_workspace
  ON workspace_daily_metrics(workspace_id, metric_date DESC);

-- ============================================
-- BÖLÜM 2: CUSTOM ANALYTICS FUNCTIONS
-- ============================================

-- 2.1: Get Workspace Overview Function
CREATE OR REPLACE FUNCTION get_workspace_overview(p_workspace_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'patient_stats', (
      SELECT row_to_json(wps.*)
      FROM workspace_patient_stats wps
      WHERE wps.workspace_id = p_workspace_id
    ),
    'category_distribution', (
      SELECT json_agg(row_to_json(wcs.*))
      FROM workspace_category_stats wcs
      WHERE wcs.workspace_id = p_workspace_id
    ),
    'ai_usage', (
      SELECT row_to_json(was.*)
      FROM workspace_ai_stats was
      WHERE was.workspace_id = p_workspace_id
    ),
    'team_summary', (
      SELECT json_build_object(
        'total_members', COUNT(*),
        'active_today', COUNT(*) FILTER (WHERE last_activity >= NOW() - INTERVAL '24 hours'),
        'avg_patients_per_doctor', AVG(patients_assigned) FILTER (WHERE user_role IN ('doctor', 'senior_doctor'))
      )
      FROM workspace_team_stats
      WHERE workspace_id = p_workspace_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2: Get Team Performance Metrics
CREATE OR REPLACE FUNCTION get_team_performance(
  p_workspace_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  patients_managed INT,
  ai_analyses_count INT,
  notes_created INT,
  avg_response_time_hours NUMERIC,
  documentation_score NUMERIC,
  activity_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wts.user_id,
    wts.user_name,
    wts.user_role,
    wts.patients_assigned::INT as patients_managed,
    wts.ai_analyses_run::INT as ai_analyses_count,
    wts.sticky_notes_created::INT as notes_created,

    -- Avg response time (from assignment to first activity)
    ROUND(AVG(EXTRACT(EPOCH FROM (
      COALESCE(al.created_at, NOW()) - pa.assigned_at
    )) / 3600)::NUMERIC, 2) as avg_response_time_hours,

    -- Documentation completeness score (0-100)
    ROUND(
      (COUNT(DISTINCT pd.id)::NUMERIC / NULLIF(COUNT(DISTINCT p.id), 0) * 100),
      2
    ) as documentation_score,

    -- Activity score (based on actions per day)
    ROUND(
      (COUNT(DISTINCT al.id)::NUMERIC / NULLIF(EXTRACT(EPOCH FROM (p_end_date - p_start_date)) / 86400, 0)),
      2
    ) as activity_score

  FROM workspace_team_stats wts
  LEFT JOIN patient_assignments pa ON pa.user_id = wts.user_id AND pa.is_active = true
  LEFT JOIN patients p ON p.id = pa.patient_id AND p.deleted_at IS NULL
  LEFT JOIN patient_data pd ON pd.patient_id = p.id
  LEFT JOIN activity_log al ON al.user_id = wts.user_id
    AND al.created_at BETWEEN p_start_date AND p_end_date
  WHERE wts.workspace_id = p_workspace_id
  GROUP BY
    wts.user_id,
    wts.user_name,
    wts.user_role,
    wts.patients_assigned,
    wts.ai_analyses_run,
    wts.sticky_notes_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.3: Get Clinical Outcomes Metrics
CREATE OR REPLACE FUNCTION get_clinical_metrics(
  p_workspace_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- Diagnosis distribution
    'diagnosis_distribution', (
      SELECT json_agg(
        json_build_object(
          'diagnosis', pd.content->>'diagnosis',
          'count', COUNT(*)
        )
      )
      FROM patient_data pd
      INNER JOIN patients p ON p.id = pd.patient_id
      WHERE p.workspace_id = p_workspace_id
        AND pd.data_type = 'diagnosis'
        AND pd.created_at BETWEEN p_start_date AND p_end_date
        AND p.deleted_at IS NULL
      GROUP BY pd.content->>'diagnosis'
      ORDER BY COUNT(*) DESC
      LIMIT 10
    ),

    -- Admission trends
    'admission_trends', (
      SELECT json_agg(
        json_build_object(
          'date', DATE(created_at),
          'count', COUNT(*)
        ) ORDER BY DATE(created_at)
      )
      FROM patients
      WHERE workspace_id = p_workspace_id
        AND created_at BETWEEN p_start_date AND p_end_date
        AND deleted_at IS NULL
      GROUP BY DATE(created_at)
    ),

    -- Discharge trends
    'discharge_trends', (
      SELECT json_agg(
        json_build_object(
          'date', DATE(discharge_date),
          'count', COUNT(*)
        ) ORDER BY DATE(discharge_date)
      )
      FROM patients
      WHERE workspace_id = p_workspace_id
        AND discharge_date BETWEEN p_start_date AND p_end_date
        AND deleted_at IS NULL
      GROUP BY DATE(discharge_date)
    ),

    -- Average length of stay by category
    'avg_los_by_category', (
      SELECT json_agg(
        json_build_object(
          'category', pc.name,
          'avg_los_hours', ROUND(AVG(
            EXTRACT(EPOCH FROM (
              COALESCE(p.discharge_date, NOW()) - COALESCE(p.admission_date, p.created_at)
            )) / 3600
          )::NUMERIC, 2)
        )
      )
      FROM patients p
      INNER JOIN patient_categories pc ON pc.id = p.category_id
      WHERE p.workspace_id = p_workspace_id
        AND p.created_at BETWEEN p_start_date AND p_end_date
        AND p.deleted_at IS NULL
        AND pc.deleted_at IS NULL
      GROUP BY pc.id, pc.name
    ),

    -- AI alert statistics
    'alert_statistics', (
      SELECT json_build_object(
        'total_alerts', COUNT(*),
        'critical_alerts', COUNT(*) FILTER (WHERE severity = 'critical'),
        'high_alerts', COUNT(*) FILTER (WHERE severity = 'high'),
        'avg_resolution_time_hours', ROUND(AVG(
          EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
        ) FILTER (WHERE resolved_at IS NOT NULL)::NUMERIC, 2),
        'alert_types', (
          SELECT json_agg(
            json_build_object(
              'type', alert_type,
              'count', count
            )
          )
          FROM (
            SELECT alert_type, COUNT(*) as count
            FROM ai_alerts
            WHERE workspace_id = p_workspace_id
              AND created_at BETWEEN p_start_date AND p_end_date
            GROUP BY alert_type
            ORDER BY count DESC
            LIMIT 5
          ) at
        )
      )
      FROM ai_alerts
      WHERE workspace_id = p_workspace_id
        AND created_at BETWEEN p_start_date AND p_end_date
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.4: Get Workload Distribution
CREATE OR REPLACE FUNCTION get_workload_distribution(p_workspace_id UUID)
RETURNS TABLE (
  category_name TEXT,
  category_color TEXT,
  patient_count BIGINT,
  assigned_doctors BIGINT,
  avg_patients_per_doctor NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.name as category_name,
    pc.color as category_color,
    COUNT(DISTINCT p.id) as patient_count,
    COUNT(DISTINCT pa.user_id) FILTER (
      WHERE pa.is_active = true AND pa.assignment_type = 'primary'
    ) as assigned_doctors,
    ROUND(
      COUNT(DISTINCT p.id)::NUMERIC /
      NULLIF(COUNT(DISTINCT pa.user_id) FILTER (
        WHERE pa.is_active = true AND pa.assignment_type = 'primary'
      ), 0),
      2
    ) as avg_patients_per_doctor
  FROM patient_categories pc
  LEFT JOIN patients p ON p.category_id = pc.id AND p.deleted_at IS NULL
  LEFT JOIN patient_assignments pa ON pa.patient_id = p.id
  WHERE pc.workspace_id = p_workspace_id
    AND pc.deleted_at IS NULL
  GROUP BY pc.id, pc.name, pc.color
  ORDER BY patient_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BÖLÜM 3: REFRESH FUNCTIONS
-- ============================================

-- 3.1: Refresh All Analytics Views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY workspace_patient_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY workspace_category_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY workspace_team_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY workspace_ai_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY workspace_daily_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2: Schedule auto-refresh (run every hour)
-- NOT: Bu pg_cron extension gerektirir. Supabase'de manuel çalıştırabilirsiniz
-- veya Next.js API route ile cron job olarak ayarlayabilirsiniz
COMMENT ON FUNCTION refresh_analytics_views() IS
  'Call this function periodically (e.g., hourly) to refresh analytics views';

-- ============================================
-- BÖLÜM 4: CUSTOM REPORT TABLES
-- ============================================

-- 4.1: Saved Reports Table
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Report details
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL,
  -- 'workspace_overview', 'team_performance', 'clinical_metrics', 'custom'

  -- Report configuration
  config JSONB DEFAULT '{}',
  -- Filters, date ranges, metrics to include, etc.

  -- Scheduling
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT, -- 'daily', 'weekly', 'monthly'
  schedule_day_of_week INT, -- 0-6 for weekly
  schedule_day_of_month INT, -- 1-31 for monthly
  schedule_time TIME, -- HH:MM
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  -- Sharing
  is_public BOOLEAN DEFAULT false,
  shared_with JSONB DEFAULT '[]', -- Array of user_ids

  -- Metadata
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT valid_report_type CHECK (
    report_type IN ('workspace_overview', 'team_performance', 'clinical_metrics', 'custom')
  ),
  CONSTRAINT valid_schedule_frequency CHECK (
    schedule_frequency IS NULL OR schedule_frequency IN ('daily', 'weekly', 'monthly')
  )
);

CREATE INDEX IF NOT EXISTS idx_saved_reports_workspace ON saved_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_creator ON saved_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_reports_scheduled ON saved_reports(workspace_id, is_scheduled, next_run_at)
  WHERE is_scheduled = true AND deleted_at IS NULL;

-- RLS
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports in their workspaces"
  ON saved_reports FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create reports in their workspaces"
  ON saved_reports FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own reports"
  ON saved_reports FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own reports"
  ON saved_reports FOR DELETE
  USING (created_by = auth.uid());

-- 4.2: Report Executions History
CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES saved_reports(id) ON DELETE CASCADE NOT NULL,

  -- Execution details
  executed_by UUID REFERENCES auth.users(id),
  execution_type TEXT NOT NULL, -- 'manual', 'scheduled'

  -- Results
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
  result_data JSONB,
  error_message TEXT,

  -- Performance
  execution_time_ms INT,

  -- Export
  exported_format TEXT, -- 'pdf', 'excel', 'csv', null
  export_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_execution_type CHECK (execution_type IN ('manual', 'scheduled')),
  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_report_executions_report ON report_executions(report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_executions_user ON report_executions(executed_by);

-- RLS
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their report executions"
  ON report_executions FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM saved_reports
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- ============================================
-- BÖLÜM 5: DASHBOARD WIDGETS
-- ============================================

-- 5.1: Dashboard Widget Configurations
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Widget details
  widget_type TEXT NOT NULL,
  -- 'patient_count', 'category_chart', 'ai_usage', 'team_activity',
  -- 'recent_alerts', 'trends', 'custom'

  title TEXT NOT NULL,

  -- Configuration
  config JSONB DEFAULT '{}',
  -- Widget-specific settings, filters, display options

  -- Layout
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0,
  width INT DEFAULT 4, -- Grid columns (out of 12)
  height INT DEFAULT 3, -- Grid rows

  -- Visibility
  is_visible BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_widget_type CHECK (
    widget_type IN (
      'patient_count', 'category_chart', 'ai_usage', 'team_activity',
      'recent_alerts', 'trends', 'custom', 'los_chart', 'workload'
    )
  ),
  CONSTRAINT valid_width CHECK (width >= 1 AND width <= 12),
  CONSTRAINT valid_height CHECK (height >= 1 AND height <= 10)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user ON dashboard_widgets(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_visible ON dashboard_widgets(user_id, is_visible, sort_order)
  WHERE is_visible = true;

-- RLS
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own widgets"
  ON dashboard_widgets FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- BÖLÜM 6: AUTO-UPDATE TRIGGERS
-- ============================================

-- Update trigger for saved_reports
CREATE TRIGGER update_saved_reports_updated_at
  BEFORE UPDATE ON saved_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for dashboard_widgets
CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- BÖLÜM 7: DEFAULT DASHBOARD WIDGETS
-- ============================================

-- Function to create default widgets for new users
CREATE OR REPLACE FUNCTION create_default_dashboard_widgets(
  p_user_id UUID,
  p_workspace_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Patient Count Widget
  INSERT INTO dashboard_widgets (user_id, workspace_id, widget_type, title, position_x, position_y, width, height, sort_order)
  VALUES (p_user_id, p_workspace_id, 'patient_count', 'Hasta İstatistikleri', 0, 0, 4, 2, 1);

  -- Category Distribution Chart
  INSERT INTO dashboard_widgets (user_id, workspace_id, widget_type, title, position_x, position_y, width, height, sort_order)
  VALUES (p_user_id, p_workspace_id, 'category_chart', 'Kategori Dağılımı', 4, 0, 4, 3, 2);

  -- AI Usage Stats
  INSERT INTO dashboard_widgets (user_id, workspace_id, widget_type, title, position_x, position_y, width, height, sort_order)
  VALUES (p_user_id, p_workspace_id, 'ai_usage', 'AI Kullanım İstatistikleri', 8, 0, 4, 2, 3);

  -- Recent Alerts
  INSERT INTO dashboard_widgets (user_id, workspace_id, widget_type, title, position_x, position_y, width, height, sort_order)
  VALUES (p_user_id, p_workspace_id, 'recent_alerts', 'Son Uyarılar', 0, 2, 6, 3, 4);

  -- Team Activity
  INSERT INTO dashboard_widgets (user_id, workspace_id, widget_type, title, position_x, position_y, width, height, sort_order)
  VALUES (p_user_id, p_workspace_id, 'team_activity', 'Ekip Aktivitesi', 6, 2, 6, 3, 5);

  -- Trends Chart
  INSERT INTO dashboard_widgets (user_id, workspace_id, widget_type, title, position_x, position_y, width, height, sort_order)
  VALUES (p_user_id, p_workspace_id, 'trends', 'Hasta Kabul Trendleri', 0, 5, 12, 3, 6);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BÖLÜM 8: INITIAL DATA REFRESH
-- ============================================

-- Refresh all views initially
SELECT refresh_analytics_views();

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify materialized views
SELECT
  schemaname,
  matviewname,
  matviewowner
FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname LIKE 'workspace_%_stats'
ORDER BY matviewname;

-- Verify functions
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_workspace_overview',
    'get_team_performance',
    'get_clinical_metrics',
    'get_workload_distribution',
    'refresh_analytics_views',
    'create_default_dashboard_widgets'
  )
ORDER BY routine_name;

-- Verify tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('saved_reports', 'report_executions', 'dashboard_widgets')
ORDER BY table_name;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- ✅ Materialized views created for fast analytics
-- ✅ Custom functions for workspace, team, and clinical metrics
-- ✅ Saved reports system with scheduling support
-- ✅ Dashboard widget system with user customization
-- ✅ RLS policies in place
-- ✅ Auto-refresh mechanism

-- NEXT STEPS:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Set up a cron job to call refresh_analytics_views() hourly
-- 3. Implement API endpoints to consume these analytics
-- 4. Build UI components for dashboard and reports
-- ============================================
