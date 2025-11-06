-- ACIL - Database Schema Updates
-- Bu dosya mevcut veritabanına eklenecek güncellemeleri içerir
-- Soft delete, audit logs ve performans optimizasyonları

-- ============================================
-- SOFT DELETE: deleted_at sütunları ekle
-- ============================================

-- Patients tablosuna soft delete
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Patient data tablosuna soft delete
ALTER TABLE patient_data
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Patient tests tablosuna soft delete
ALTER TABLE patient_tests
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- AI analyses tablosuna soft delete
ALTER TABLE ai_analyses
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Reminders tablosuna soft delete
ALTER TABLE reminders
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================
-- AUDIT LOGS: Tüm değişiklikleri takip et
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')),
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs indexleri
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_data_patient_type
ON patient_data(patient_id, data_type) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_patient_tests_patient_created
ON patient_tests(patient_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_analyses_patient_type_created
ON ai_analyses(patient_id, analysis_type, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_patient_created
ON chat_messages(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reminders_user_status_scheduled
ON reminders(user_id, status, scheduled_time) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_patients_user_status
ON patients(user_id, status) WHERE deleted_at IS NULL;

-- ============================================
-- UPDATED RLS POLICIES (with soft delete)
-- ============================================

-- Drop old policies and create new ones with deleted_at check

-- Patients policies (updated)
DROP POLICY IF EXISTS "Users can view own patients" ON patients;
CREATE POLICY "Users can view own patients" ON patients
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update own patients" ON patients;
CREATE POLICY "Users can update own patients" ON patients
  FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Patient data policies (updated)
DROP POLICY IF EXISTS "Users can view own patient data" ON patient_data;
CREATE POLICY "Users can view own patient data" ON patient_data
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_data.patient_id
      AND patients.user_id = auth.uid()
      AND patients.deleted_at IS NULL
    )
  );

-- Patient tests policies (updated)
DROP POLICY IF EXISTS "Users can view own patient tests" ON patient_tests;
CREATE POLICY "Users can view own patient tests" ON patient_tests
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_tests.patient_id
      AND patients.user_id = auth.uid()
      AND patients.deleted_at IS NULL
    )
  );

-- AI analyses policies (updated)
DROP POLICY IF EXISTS "Users can view own AI analyses" ON ai_analyses;
CREATE POLICY "Users can view own AI analyses" ON ai_analyses
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = ai_analyses.patient_id
      AND patients.user_id = auth.uid()
      AND patients.deleted_at IS NULL
    )
  );

-- Reminders policies (updated)
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

-- ============================================
-- AUDIT LOG TRIGGER FUNCTIONS
-- ============================================

-- Generic audit log function
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
  user_id_val UUID;
BEGIN
  -- Get current user ID (if available)
  user_id_val := auth.uid();

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (user_id_val, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (user_id_val, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (user_id_val, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers to important tables
DROP TRIGGER IF EXISTS audit_patients ON patients;
CREATE TRIGGER audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS audit_patient_data ON patient_data;
CREATE TRIGGER audit_patient_data
  AFTER INSERT OR UPDATE OR DELETE ON patient_data
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS audit_patient_tests ON patient_tests;
CREATE TRIGGER audit_patient_tests
  AFTER INSERT OR UPDATE OR DELETE ON patient_tests
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS audit_ai_analyses ON ai_analyses;
CREATE TRIGGER audit_ai_analyses
  AFTER INSERT OR UPDATE OR DELETE ON ai_analyses
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete_patient(patient_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update patient
  UPDATE patients
  SET deleted_at = NOW()
  WHERE id = patient_id_param AND user_id = auth.uid();

  -- Update related data
  UPDATE patient_data
  SET deleted_at = NOW()
  WHERE patient_id = patient_id_param;

  UPDATE patient_tests
  SET deleted_at = NOW()
  WHERE patient_id = patient_id_param;

  UPDATE ai_analyses
  SET deleted_at = NOW()
  WHERE patient_id = patient_id_param;

  UPDATE reminders
  SET deleted_at = NOW()
  WHERE patient_id = patient_id_param;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore soft deleted patient
CREATE OR REPLACE FUNCTION restore_patient(patient_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Restore patient
  UPDATE patients
  SET deleted_at = NULL
  WHERE id = patient_id_param AND user_id = auth.uid();

  -- Restore related data
  UPDATE patient_data
  SET deleted_at = NULL
  WHERE patient_id = patient_id_param;

  UPDATE patient_tests
  SET deleted_at = NULL
  WHERE patient_id = patient_id_param;

  UPDATE ai_analyses
  SET deleted_at = NULL
  WHERE patient_id = patient_id_param;

  UPDATE reminders
  SET deleted_at = NULL
  WHERE patient_id = patient_id_param;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get patient count for user
CREATE OR REPLACE FUNCTION get_user_patient_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM patients
  WHERE user_id = user_id_param AND deleted_at IS NULL;

  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE audit_logs IS 'Tracks all database changes for compliance and debugging';
COMMENT ON COLUMN patients.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON FUNCTION soft_delete_patient IS 'Soft deletes a patient and all related data';
COMMENT ON FUNCTION restore_patient IS 'Restores a soft deleted patient';
