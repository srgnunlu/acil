-- ============================================
-- FAZ 7: AI ENHANCEMENT & MONITORING
-- ============================================
-- ACIL - Proactive AI & Auto Monitoring System
-- Tarih: 2025-11-12
-- Açıklama: AI alerts, trends, scheduled monitoring, auto re-analysis
-- ⚠️ Bu dosya TAMAMEN GÜVENLİ - Mevcut veriyi bozmaz
-- ============================================

-- ============================================
-- BÖLÜM 1: AI ALERTS TABLOSU
-- ============================================
-- AI tarafından oluşturulan kritik uyarılar

CREATE TABLE IF NOT EXISTS ai_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- İlişkiler
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  triggered_by_analysis_id UUID REFERENCES ai_analyses(id) ON DELETE SET NULL,

  -- Alert detayları
  alert_type TEXT NOT NULL,
  -- 'critical_value', 'deterioration', 'red_flag', 'trend_warning', 'sepsis_risk', etc.

  severity TEXT NOT NULL DEFAULT 'medium',
  -- 'critical', 'high', 'medium', 'low'

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Alert verisi
  trigger_data JSONB DEFAULT '{}',
  -- Uyarıyı tetikleyen veri (vital signs, lab values, etc.)

  -- AI analiz detayları
  ai_reasoning TEXT,
  confidence_score DECIMAL(3,2), -- 0.00 - 1.00

  -- Öncelik ve aciliyet
  urgency_level INTEGER DEFAULT 5, -- 1-10 skala
  requires_immediate_action BOOLEAN DEFAULT false,

  -- Durum
  status TEXT DEFAULT 'active',
  -- 'active', 'acknowledged', 'resolved', 'dismissed'

  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,

  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  dismissed_by UUID REFERENCES auth.users(id),
  dismissed_at TIMESTAMPTZ,
  dismissal_reason TEXT,

  -- Bildirim durumu
  notification_sent BOOLEAN DEFAULT false,
  notification_channels JSONB DEFAULT '[]', -- ['push', 'email', 'sms']

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_severity CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_alerts_patient ON ai_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_workspace ON ai_alerts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_severity ON ai_alerts(severity, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_active ON ai_alerts(workspace_id, status, severity)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ai_alerts_critical ON ai_alerts(patient_id, severity, created_at DESC)
  WHERE severity IN ('critical', 'high');

-- RLS
ALTER TABLE ai_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts in their workspaces"
  ON ai_alerts FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update alerts in their workspaces"
  ON ai_alerts FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- BÖLÜM 2: AI TRENDS TABLOSU
-- ============================================
-- Hasta verilerinin trend analizi

CREATE TABLE IF NOT EXISTS ai_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- İlişkiler
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Trend bilgisi
  metric_type TEXT NOT NULL,
  -- 'vital_signs', 'lab_values', 'clinical_scores', 'overall_condition'

  metric_name TEXT NOT NULL,
  -- 'heart_rate', 'temperature', 'wbc', 'sofa_score', etc.

  -- Trend data
  data_points JSONB NOT NULL DEFAULT '[]',
  -- [{ "timestamp": "...", "value": 120, "unit": "bpm" }, ...]

  -- Trend analizi
  trend_direction TEXT,
  -- 'improving', 'stable', 'worsening', 'fluctuating'

  trend_velocity DECIMAL(10,4),
  -- Değişim hızı (unit per hour/day)

  statistical_analysis JSONB DEFAULT '{}',
  -- { "mean": 98.5, "std_dev": 1.2, "min": 96, "max": 101, "slope": -0.5 }

  -- AI insights
  ai_interpretation TEXT,
  clinical_significance TEXT,
  alert_triggered BOOLEAN DEFAULT false,

  -- Zaman aralığı
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  data_point_count INTEGER DEFAULT 0,

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_trend_direction CHECK (
    trend_direction IN ('improving', 'stable', 'worsening', 'fluctuating', 'insufficient_data')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_trends_patient ON ai_trends(patient_id, metric_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_trends_workspace ON ai_trends(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_trends_metric ON ai_trends(metric_type, metric_name, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_trends_period ON ai_trends(period_start, period_end);

-- RLS
ALTER TABLE ai_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view trends in their workspaces"
  ON ai_trends FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert trends in their workspaces"
  ON ai_trends FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- BÖLÜM 3: AI MONITORING CONFIGS
-- ============================================
-- Hasta bazlı monitoring ayarları

CREATE TABLE IF NOT EXISTS ai_monitoring_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- İlişkiler
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Monitoring ayarları
  auto_analysis_enabled BOOLEAN DEFAULT true,
  analysis_frequency_minutes INTEGER DEFAULT 60, -- Her 60 dakikada bir kontrol

  -- Hangi metrikler izlenecek
  monitored_metrics JSONB DEFAULT '[]',
  -- ['vital_signs', 'lab_values', 'clinical_scores']

  -- Alert thresholds (özelleştirilebilir)
  alert_thresholds JSONB DEFAULT '{}',
  -- { "heart_rate": { "min": 50, "max": 120, "critical_min": 40, "critical_max": 140 } }

  -- Trend monitoring
  trend_analysis_enabled BOOLEAN DEFAULT true,
  trend_window_hours INTEGER DEFAULT 24, -- Son 24 saati analiz et

  -- AI comparison
  comparison_enabled BOOLEAN DEFAULT true,
  compare_with_baseline BOOLEAN DEFAULT true,
  compare_with_previous BOOLEAN DEFAULT true,

  -- Notification preferences
  notify_on_critical BOOLEAN DEFAULT true,
  notify_on_deterioration BOOLEAN DEFAULT true,
  notify_on_improvement BOOLEAN DEFAULT false,

  notification_recipients JSONB DEFAULT '[]',
  -- [{"user_id": "...", "channels": ["push", "email"]}]

  -- Durum
  is_active BOOLEAN DEFAULT true,

  -- Last monitoring
  last_analysis_at TIMESTAMPTZ,
  last_alert_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Her hasta için bir config
  UNIQUE(patient_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_monitoring_patient ON ai_monitoring_configs(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_monitoring_workspace ON ai_monitoring_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_monitoring_active ON ai_monitoring_configs(workspace_id, is_active)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_monitoring_due ON ai_monitoring_configs(last_analysis_at)
  WHERE is_active = true;

-- RLS
ALTER TABLE ai_monitoring_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view monitoring configs in their workspaces"
  ON ai_monitoring_configs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can manage monitoring configs in their workspaces"
  ON ai_monitoring_configs FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- BÖLÜM 4: SCHEDULED MONITORING JOBS
-- ============================================
-- Background job tracking

CREATE TABLE IF NOT EXISTS ai_monitoring_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job detayları
  job_type TEXT NOT NULL,
  -- 'auto_reanalysis', 'trend_calculation', 'periodic_check', 'alert_generation'

  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Job status
  status TEXT DEFAULT 'pending',
  -- 'pending', 'running', 'completed', 'failed', 'cancelled'

  priority INTEGER DEFAULT 5, -- 1-10

  -- Execution
  scheduled_for TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Results
  result_data JSONB DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_job_status CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'cancelled')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_jobs_status ON ai_monitoring_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_monitoring_jobs_patient ON ai_monitoring_jobs(patient_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_jobs_pending ON ai_monitoring_jobs(status, priority DESC, scheduled_for)
  WHERE status = 'pending';

-- RLS
ALTER TABLE ai_monitoring_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jobs in their workspaces"
  ON ai_monitoring_jobs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- BÖLÜM 5: AI COMPARISONS TABLE
-- ============================================
-- AI analiz karşılaştırmaları

CREATE TABLE IF NOT EXISTS ai_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- İlişkiler
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Karşılaştırılan analizler
  baseline_analysis_id UUID REFERENCES ai_analyses(id) ON DELETE SET NULL,
  current_analysis_id UUID REFERENCES ai_analyses(id) ON DELETE SET NULL,

  -- Comparison results
  comparison_type TEXT NOT NULL,
  -- 'baseline_vs_current', 'sequential', 'temporal'

  changes_detected JSONB DEFAULT '{}',
  -- {
  --   "improved": [...],
  --   "worsened": [...],
  --   "new_findings": [...],
  --   "resolved": [...]
  -- }

  overall_trend TEXT,
  -- 'improving', 'stable', 'worsening'

  significance_score DECIMAL(3,2), -- 0.00 - 1.00

  -- AI interpretation
  ai_summary TEXT,
  clinical_implications TEXT,
  recommendations TEXT[],

  -- Time interval
  time_interval_hours DECIMAL(10,2),

  -- Metadata
  compared_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_comparison_type CHECK (
    comparison_type IN ('baseline_vs_current', 'sequential', 'temporal')
  ),
  CONSTRAINT valid_overall_trend CHECK (
    overall_trend IN ('improving', 'stable', 'worsening', 'mixed', 'insufficient_data')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_comparisons_patient ON ai_comparisons(patient_id, compared_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_comparisons_workspace ON ai_comparisons(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_comparisons_analyses ON ai_comparisons(baseline_analysis_id, current_analysis_id);

-- RLS
ALTER TABLE ai_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comparisons in their workspaces"
  ON ai_comparisons FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert comparisons in their workspaces"
  ON ai_comparisons FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- BÖLÜM 6: CLINICAL SCORES TABLE
-- ============================================
-- Klinik skorlar (SOFA, qSOFA, NEWS, etc.)

CREATE TABLE IF NOT EXISTS clinical_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- İlişkiler
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Score bilgisi
  score_type TEXT NOT NULL,
  -- 'sofa', 'qsofa', 'news', 'apache_ii', 'glasgow_coma_scale', 'nihss', etc.

  score_value DECIMAL(10,2) NOT NULL,
  max_score DECIMAL(10,2),

  -- Score bileşenleri
  score_components JSONB DEFAULT '{}',
  -- { "respiratory": 2, "coagulation": 1, "liver": 0, ... }

  -- Interpretation
  interpretation TEXT,
  risk_category TEXT,
  -- 'low', 'medium', 'high', 'very_high'

  clinical_significance TEXT,

  -- Calculation
  calculated_by UUID REFERENCES auth.users(id),
  calculation_method TEXT DEFAULT 'manual', -- 'manual', 'auto', 'ai_assisted'

  source_data JSONB DEFAULT '{}',
  -- Skoru hesaplamak için kullanılan ham veri

  -- Metadata
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_risk_category CHECK (
    risk_category IN ('low', 'medium', 'high', 'very_high', 'unknown')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clinical_scores_patient ON clinical_scores(patient_id, score_type, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_scores_workspace ON clinical_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_clinical_scores_type ON clinical_scores(score_type, measured_at DESC);

-- RLS
ALTER TABLE clinical_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores in their workspaces"
  ON clinical_scores FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert scores in their workspaces"
  ON clinical_scores FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================
-- BÖLÜM 7: TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_ai_alerts_updated_at
  BEFORE UPDATE ON ai_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_monitoring_configs_updated_at
  BEFORE UPDATE ON ai_monitoring_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_monitoring_jobs_updated_at
  BEFORE UPDATE ON ai_monitoring_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-create monitoring config for new patients
CREATE OR REPLACE FUNCTION create_default_monitoring_config()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_monitoring_configs (
    patient_id,
    workspace_id,
    auto_analysis_enabled,
    analysis_frequency_minutes,
    monitored_metrics,
    trend_analysis_enabled,
    is_active,
    created_by
  ) VALUES (
    NEW.id,
    NEW.workspace_id,
    true,
    60,
    '["vital_signs", "lab_values", "clinical_scores"]'::jsonb,
    true,
    true,
    NEW.created_by
  )
  ON CONFLICT (patient_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create monitoring config when patient is created
DROP TRIGGER IF EXISTS trigger_create_monitoring_config ON patients;
CREATE TRIGGER trigger_create_monitoring_config
  AFTER INSERT ON patients
  FOR EACH ROW EXECUTE FUNCTION create_default_monitoring_config();

-- Function: Check for critical values and create alerts
CREATE OR REPLACE FUNCTION check_critical_values_and_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id UUID;
  v_patient_id UUID;
  v_alert_title TEXT;
  v_alert_description TEXT;
BEGIN
  -- AI analysis için
  IF TG_TABLE_NAME = 'ai_analyses' THEN
    v_patient_id := NEW.patient_id;

    -- Get workspace_id from patient
    SELECT workspace_id INTO v_workspace_id
    FROM patients
    WHERE id = v_patient_id;

    -- Check for red flags in AI response
    IF NEW.ai_response ? 'red_flags' AND
       jsonb_array_length(NEW.ai_response->'red_flags') > 0 THEN

      INSERT INTO ai_alerts (
        patient_id,
        workspace_id,
        triggered_by_analysis_id,
        alert_type,
        severity,
        title,
        description,
        trigger_data,
        ai_reasoning,
        confidence_score,
        requires_immediate_action,
        status
      ) VALUES (
        v_patient_id,
        v_workspace_id,
        NEW.id,
        'red_flag',
        'high',
        'Critical Findings Detected',
        format('AI analysis detected %s critical findings',
               jsonb_array_length(NEW.ai_response->'red_flags')),
        jsonb_build_object('red_flags', NEW.ai_response->'red_flags'),
        NEW.ai_response->>'summary',
        0.85,
        true,
        'active'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create alerts from AI analyses
DROP TRIGGER IF EXISTS trigger_ai_analysis_alert ON ai_analyses;
CREATE TRIGGER trigger_ai_analysis_alert
  AFTER INSERT ON ai_analyses
  FOR EACH ROW EXECUTE FUNCTION check_critical_values_and_alert();

-- ============================================
-- BÖLÜM 8: HELPER FUNCTIONS
-- ============================================

-- Function: Get active alerts for a patient
CREATE OR REPLACE FUNCTION get_active_alerts_for_patient(p_patient_id UUID)
RETURNS TABLE (
  alert_id UUID,
  severity TEXT,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    ai_alerts.severity,
    ai_alerts.title,
    ai_alerts.description,
    ai_alerts.created_at
  FROM ai_alerts
  WHERE patient_id = p_patient_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY
    CASE severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get latest trends for a patient
CREATE OR REPLACE FUNCTION get_patient_trends(
  p_patient_id UUID,
  p_metric_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  trend_id UUID,
  metric_type TEXT,
  metric_name TEXT,
  trend_direction TEXT,
  ai_interpretation TEXT,
  calculated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    ai_trends.metric_type,
    ai_trends.metric_name,
    ai_trends.trend_direction,
    ai_trends.ai_interpretation,
    ai_trends.calculated_at
  FROM ai_trends
  WHERE patient_id = p_patient_id
    AND (p_metric_type IS NULL OR ai_trends.metric_type = p_metric_type)
  ORDER BY calculated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate patient deterioration score
CREATE OR REPLACE FUNCTION calculate_deterioration_score(p_patient_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL := 0;
  v_alert_count INTEGER;
  v_worsening_trends INTEGER;
  v_critical_flags INTEGER;
BEGIN
  -- Count active critical alerts
  SELECT COUNT(*) INTO v_alert_count
  FROM ai_alerts
  WHERE patient_id = p_patient_id
    AND status = 'active'
    AND severity IN ('critical', 'high');

  -- Count worsening trends
  SELECT COUNT(*) INTO v_worsening_trends
  FROM ai_trends
  WHERE patient_id = p_patient_id
    AND trend_direction = 'worsening'
    AND calculated_at > NOW() - INTERVAL '24 hours';

  -- Calculate score (0-10)
  v_score := LEAST(10, (v_alert_count * 2) + v_worsening_trends);

  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BÖLÜM 9: INITIAL DATA
-- ============================================

-- Add default monitoring configs for existing patients
INSERT INTO ai_monitoring_configs (
  patient_id,
  workspace_id,
  auto_analysis_enabled,
  analysis_frequency_minutes,
  monitored_metrics,
  trend_analysis_enabled,
  is_active
)
SELECT
  p.id,
  p.workspace_id,
  true,
  60,
  '["vital_signs", "lab_values", "clinical_scores"]'::jsonb,
  true,
  true
FROM patients p
WHERE NOT EXISTS (
  SELECT 1 FROM ai_monitoring_configs
  WHERE patient_id = p.id
)
ON CONFLICT (patient_id) DO NOTHING;

-- ============================================
-- BÖLÜM 10: VIEWS (Optional but useful)
-- ============================================

-- View: Patient monitoring dashboard
CREATE OR REPLACE VIEW patient_monitoring_dashboard AS
SELECT
  p.id as patient_id,
  p.name as patient_name,
  p.workspace_id,

  -- Active alerts
  COUNT(DISTINCT aa.id) FILTER (WHERE aa.status = 'active') as active_alerts,
  COUNT(DISTINCT aa.id) FILTER (WHERE aa.status = 'active' AND aa.severity = 'critical') as critical_alerts,

  -- Latest analysis
  MAX(ana.created_at) as last_analysis_at,

  -- Monitoring config
  amc.auto_analysis_enabled,
  amc.last_analysis_at as last_auto_analysis,

  -- Deterioration score
  calculate_deterioration_score(p.id) as deterioration_score

FROM patients p
LEFT JOIN ai_alerts aa ON p.id = aa.patient_id
LEFT JOIN ai_analyses ana ON p.id = ana.patient_id
LEFT JOIN ai_monitoring_configs amc ON p.id = amc.patient_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.workspace_id, amc.auto_analysis_enabled, amc.last_analysis_at;

-- Grant permissions on view
GRANT SELECT ON patient_monitoring_dashboard TO authenticated;

-- ============================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- ============================================
-- Faz 7 migration tamamlandı!
--
-- Oluşturulan tablolar:
-- ✅ ai_alerts - AI uyarıları
-- ✅ ai_trends - Trend analizleri
-- ✅ ai_monitoring_configs - Monitoring ayarları
-- ✅ ai_monitoring_jobs - Background jobs
-- ✅ ai_comparisons - AI karşılaştırmaları
-- ✅ clinical_scores - Klinik skorlar
--
-- ✅ RLS policies aktif
-- ✅ Indexes oluşturuldu
-- ✅ Triggers yapılandırıldı
-- ✅ Helper functions eklendi
-- ============================================
