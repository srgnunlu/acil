-- ACIL - AI Destekli Hasta Takip Sistemi
-- Veritabanı Şeması
-- Bu SQL dosyasını Supabase Dashboard > SQL Editor'da çalıştırın

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

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patient_data_patient_id ON patient_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_tests_patient_id ON patient_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_patient_id ON ai_analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_patient_id ON chat_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_time ON reminders(scheduled_time);

-- Row Level Security (RLS) Politikaları
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Profiles politikaları
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Patients politikaları
CREATE POLICY "Users can view own patients" ON patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patients" ON patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients" ON patients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients" ON patients
  FOR DELETE USING (auth.uid() = user_id);

-- Patient data politikaları
CREATE POLICY "Users can view own patient data" ON patient_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_data.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own patient data" ON patient_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_data.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- Patient tests politikaları
CREATE POLICY "Users can view own patient tests" ON patient_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_tests.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own patient tests" ON patient_tests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_tests.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- AI analyses politikaları
CREATE POLICY "Users can view own AI analyses" ON ai_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = ai_analyses.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own AI analyses" ON ai_analyses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = ai_analyses.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- Chat messages politikaları
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reminders politikaları
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger fonksiyonu: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger'ları
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger fonksiyonu: Yeni kullanıcı kaydolduğunda profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, patient_limit, subscription_tier)
  VALUES (NEW.id, 3, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
