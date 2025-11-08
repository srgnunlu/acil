-- Chat Sessions and Message History
-- Bu migration chat geçmişi ve oturum yönetimi için gerekli tabloları ekler

-- Chat sessions tablosu
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Yeni Konuşma',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages tablosunu güncelle (session_id ekle)
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_chat_sessions_patient_id ON chat_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON chat_sessions(patient_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- RLS Policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
CREATE POLICY "Users can update own chat sessions" ON chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update last_message_at
CREATE OR REPLACE FUNCTION update_chat_session_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_session_last_message ON chat_messages;
CREATE TRIGGER trigger_update_chat_session_last_message
AFTER INSERT ON chat_messages
FOR EACH ROW
WHEN (NEW.session_id IS NOT NULL)
EXECUTE FUNCTION update_chat_session_last_message();

-- Function to auto-generate session titles based on first message
CREATE OR REPLACE FUNCTION generate_chat_session_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' AND (SELECT COUNT(*) FROM chat_messages WHERE session_id = NEW.session_id) = 1 THEN
    UPDATE chat_sessions
    SET title = LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_chat_session_title ON chat_messages;
CREATE TRIGGER trigger_generate_chat_session_title
AFTER INSERT ON chat_messages
FOR EACH ROW
WHEN (NEW.session_id IS NOT NULL)
EXECUTE FUNCTION generate_chat_session_title();
