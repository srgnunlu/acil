-- ACIL - AI Analiz Özellikleri için Database Schema
-- AI Analiz sayfası için not ekleme ve favori işaretleme
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştırın

-- ============================================
-- Analiz Notları Tablosu
-- ============================================

CREATE TABLE IF NOT EXISTS analysis_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES ai_analyses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_analysis_notes_analysis_id ON analysis_notes(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_notes_user_id ON analysis_notes(user_id);

-- RLS Policies
ALTER TABLE analysis_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis notes"
  ON analysis_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis notes"
  ON analysis_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis notes"
  ON analysis_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis notes"
  ON analysis_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Favori Analizler Tablosu
-- ============================================

CREATE TABLE IF NOT EXISTS analysis_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES ai_analyses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(analysis_id, user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_analysis_favorites_analysis_id ON analysis_favorites(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_favorites_user_id ON analysis_favorites(user_id);

-- RLS Policies
ALTER TABLE analysis_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON analysis_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
  ON analysis_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON analysis_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Fonksiyonlar ve Triggerlar
-- ============================================

-- Updated_at trigger fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for analysis_notes updated_at
DROP TRIGGER IF EXISTS update_analysis_notes_updated_at ON analysis_notes;
CREATE TRIGGER update_analysis_notes_updated_at
  BEFORE UPDATE ON analysis_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Test Verileri (Opsiyonel - Development için)
-- ============================================

-- Not eklemek için:
-- INSERT INTO analysis_notes (analysis_id, user_id, note)
-- VALUES ('your-analysis-id', auth.uid(), 'Örnek not');

-- Favori eklemek için:
-- INSERT INTO analysis_favorites (analysis_id, user_id)
-- VALUES ('your-analysis-id', auth.uid());
