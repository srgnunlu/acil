-- ACIL - AI Destekli Hasta Takip Sistemi
-- TAM VERİTABANI ŞEMASI (Temel + Güncellemeler)
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştırın
-- ⚠️ ÖNEMLİ: Bu dosya hem temel şemayı hem de tüm güncellemeleri içerir

-- ============================================
-- BÖLÜM 1: TEMEL TABLOLAR
-- ============================================

-- Profiles tablosu
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  specialty TEXT,
  institution TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  patient_limit INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients tablosu
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'consultation')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient data tablosu
CREATE TABLE IF NOT EXISTS patient_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('demographics', 'anamnesis', 'medications', 'vital_signs', 'history')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient tests tablosu
CREATE TABLE IF NOT EXISTS patient_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  test_type TEXT NOT NULL,
  results JSONB NOT NULL,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI analyses tablosu
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('initial', 'updated')),
  input_data JSONB NOT NULL,
  ai_response JSONB NOT NULL,
  "references" JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages tablosu
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders tablosu
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BÖLÜM 2: SOFT DELETE SÜTUNLARI EKLE
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
-- BÖLÜM 3: AUDIT LOGS TABLOSU
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

-- ============================================
-- BÖLÜM 4: TEMEL İNDEKSLER
-- ============================================

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patient_data_patient_id ON patient_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_tests_patient_id ON patient_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_patient_id ON ai_analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_patient_id ON chat_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_time ON reminders(scheduled_time);

-- ============================================
-- BÖLÜM 5: PERFORMANS İNDEKSLERİ (Güncellemeler)
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

-- Audit logs indexleri
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- BÖLÜM 6: ROW LEVEL SECURITY (RLS) ETKİNLEŞTİR
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BÖLÜM 7: RLS POLİTİKALARI (Soft Delete Desteği ile)
-- ============================================

-- Profiles politikaları
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Patients politikaları (soft delete desteği ile)
DROP POLICY IF EXISTS "Users can view own patients" ON patients;
CREATE POLICY "Users can view own patients" ON patients
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own patients" ON patients;
CREATE POLICY "Users can insert own patients" ON patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own patients" ON patients;
CREATE POLICY "Users can update own patients" ON patients
  FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete own patients" ON patients;
CREATE POLICY "Users can delete own patients" ON patients
  FOR DELETE USING (auth.uid() = user_id);

-- Patient data politikaları (soft delete desteği ile)
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

DROP POLICY IF EXISTS "Users can insert own patient data" ON patient_data;
CREATE POLICY "Users can insert own patient data" ON patient_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_data.patient_id
      AND patients.user_id = auth.uid()
      AND patients.deleted_at IS NULL
    )
  );

-- Patient tests politikaları (soft delete desteği ile)
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

DROP POLICY IF EXISTS "Users can insert own patient tests" ON patient_tests;
CREATE POLICY "Users can insert own patient tests" ON patient_tests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_tests.patient_id
      AND patients.user_id = auth.uid()
      AND patients.deleted_at IS NULL
    )
  );

-- AI analyses politikaları (soft delete desteği ile)
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

DROP POLICY IF EXISTS "Users can insert own AI analyses" ON ai_analyses;
CREATE POLICY "Users can insert own AI analyses" ON ai_analyses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = ai_analyses.patient_id
      AND patients.user_id = auth.uid()
      AND patients.deleted_at IS NULL
    )
  );

-- Chat messages politikaları
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;
CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reminders politikaları (soft delete desteği ile)
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own reminders" ON reminders;
CREATE POLICY "Users can insert own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;
CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- BÖLÜM 8: TRIGGER FONKSİYONLARI
-- ============================================

-- Updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger'ları
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Yeni kullanıcı kaydolduğunda profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, patient_limit, subscription_tier)
  VALUES (NEW.id, 3, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- BÖLÜM 9: AUDIT LOG TRIGGER FONKSİYONLARI
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

-- Audit trigger'ları önemli tablolara ekle
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
-- BÖLÜM 10: UTILITY FONKSİYONLARI
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
-- BÖLÜM 11: DOKÜMANTASYON YORUMLARI
-- ============================================

COMMENT ON TABLE audit_logs IS 'Tracks all database changes for compliance and debugging';
COMMENT ON COLUMN patients.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON FUNCTION soft_delete_patient IS 'Soft deletes a patient and all related data';
COMMENT ON FUNCTION restore_patient IS 'Restores a soft deleted patient';

-- ============================================
-- ✅ ŞEMA KURULUMU TAMAMLANDI!
-- ============================================
-- 
-- Oluşturulan tablolar:
-- - profiles
-- - patients (soft delete desteği ile)
-- - patient_data (soft delete desteği ile)
-- - patient_tests (soft delete desteği ile)
-- - ai_analyses (soft delete desteği ile)
-- - chat_messages
-- - reminders (soft delete desteği ile)
-- - audit_logs
--
-- Özellikler:
-- ✅ Row Level Security (RLS) aktif
-- ✅ Soft delete desteği
-- ✅ Audit logging
-- ✅ Performans optimizasyonları
-- ✅ Otomatik trigger'lar
-- ✅ Utility fonksiyonları
--
-- ============================================

