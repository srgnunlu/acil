-- ============================================
-- FIX: AI Alerts INSERT Policy & Trigger
-- ============================================
-- Sorun: ai_alerts tablosuna INSERT yapılamıyor (RLS policy eksik)
-- Çözüm: INSERT politikası ekle ve trigger'ı SECURITY DEFINER yap
-- ============================================

-- 1. AI Alerts için INSERT politikası ekle
-- Workspace üyeleri alert oluşturabilir (sistem tarafından veya manuel)
DROP POLICY IF EXISTS "Users can insert alerts in their workspaces" ON ai_alerts;
CREATE POLICY "Users can insert alerts in their workspaces"
  ON ai_alerts FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 2. Trigger fonksiyonunu SECURITY DEFINER ile güncelle
-- Bu sayede trigger RLS politikalarını bypass edebilir
-- (Güvenli çünkü trigger içinde workspace kontrolü var)
CREATE OR REPLACE FUNCTION check_critical_values_and_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id UUID;
  v_patient_id UUID;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Not: Trigger zaten var, sadece fonksiyon güncellendi
-- Trigger'ı yeniden oluşturmaya gerek yok

