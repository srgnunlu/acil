-- ============================================
-- PHASE 4: STICKY NOTES & COMMUNICATION SYSTEM
-- Migration for sticky notes, mentions, and reactions
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. STICKY NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sticky_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context: where this note belongs
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'info' CHECK (note_type IN ('urgent', 'important', 'info', 'routine', 'question')),
  color TEXT DEFAULT '#fbbf24',

  -- Position for UI (optional - for drag & drop positioning)
  position_x INTEGER,
  position_y INTEGER,
  sort_order INTEGER DEFAULT 0,

  -- Status
  is_pinned BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  -- Thread support (for replies)
  parent_id UUID REFERENCES sticky_notes(id) ON DELETE CASCADE,

  -- Metadata
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_position CHECK (
    (position_x IS NULL AND position_y IS NULL) OR
    (position_x IS NOT NULL AND position_y IS NOT NULL)
  )
);

-- Indexes for sticky_notes
CREATE INDEX IF NOT EXISTS idx_sticky_notes_workspace ON sticky_notes(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sticky_notes_patient ON sticky_notes(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sticky_notes_author ON sticky_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_parent ON sticky_notes(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sticky_notes_active ON sticky_notes(workspace_id, patient_id)
  WHERE deleted_at IS NULL AND is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_sticky_notes_created ON sticky_notes(created_at DESC);

-- ============================================
-- 2. NOTE MENTIONS TABLE (@mention system)
-- ============================================
CREATE TABLE IF NOT EXISTS note_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES sticky_notes(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one mention per user per note
  UNIQUE(note_id, mentioned_user_id)
);

-- Indexes for note_mentions
CREATE INDEX IF NOT EXISTS idx_note_mentions_note ON note_mentions(note_id);
CREATE INDEX IF NOT EXISTS idx_note_mentions_user_unread ON note_mentions(mentioned_user_id, is_read)
  WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_note_mentions_user ON note_mentions(mentioned_user_id);

-- ============================================
-- 3. NOTE REACTIONS TABLE (emoji reactions)
-- ============================================
CREATE TABLE IF NOT EXISTS note_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES sticky_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reaction emoji
  emoji TEXT NOT NULL CHECK (length(emoji) <= 10), -- '👍', '❤️', '🔥', etc.

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one reaction type per user per note
  UNIQUE(note_id, user_id, emoji)
);

-- Indexes for note_reactions
CREATE INDEX IF NOT EXISTS idx_note_reactions_note ON note_reactions(note_id);
CREATE INDEX IF NOT EXISTS idx_note_reactions_user ON note_reactions(user_id);

-- ============================================
-- 4. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for sticky_notes
DROP TRIGGER IF EXISTS update_sticky_notes_updated_at ON sticky_notes;
CREATE TRIGGER update_sticky_notes_updated_at
  BEFORE UPDATE ON sticky_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_reactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STICKY NOTES POLICIES
-- ============================================

-- Users can view sticky notes in their workspace
DROP POLICY IF EXISTS "Users can view workspace sticky notes" ON sticky_notes;
CREATE POLICY "Users can view workspace sticky notes"
  ON sticky_notes FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

-- Users can create sticky notes in their workspace
DROP POLICY IF EXISTS "Users can create workspace sticky notes" ON sticky_notes;
CREATE POLICY "Users can create workspace sticky notes"
  ON sticky_notes FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND author_id = auth.uid()
  );

-- Users can update their own sticky notes
DROP POLICY IF EXISTS "Users can update own sticky notes" ON sticky_notes;
CREATE POLICY "Users can update own sticky notes"
  ON sticky_notes FOR UPDATE
  USING (
    author_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Users can delete their own sticky notes (soft delete)
DROP POLICY IF EXISTS "Users can delete own sticky notes" ON sticky_notes;
CREATE POLICY "Users can delete own sticky notes"
  ON sticky_notes FOR DELETE
  USING (
    author_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'senior_doctor')
    )
  );

-- ============================================
-- NOTE MENTIONS POLICIES
-- ============================================

-- Users can view mentions where they are mentioned or are the note author
DROP POLICY IF EXISTS "Users can view relevant mentions" ON note_mentions;
CREATE POLICY "Users can view relevant mentions"
  ON note_mentions FOR SELECT
  USING (
    mentioned_user_id = auth.uid()
    OR note_id IN (
      SELECT id FROM sticky_notes WHERE author_id = auth.uid()
    )
  );

-- System can create mentions (via trigger or API)
DROP POLICY IF EXISTS "Users can create mentions" ON note_mentions;
CREATE POLICY "Users can create mentions"
  ON note_mentions FOR INSERT
  WITH CHECK (
    note_id IN (
      SELECT id FROM sticky_notes
      WHERE author_id = auth.uid()
    )
  );

-- Users can update their own mention read status
DROP POLICY IF EXISTS "Users can update own mentions" ON note_mentions;
CREATE POLICY "Users can update own mentions"
  ON note_mentions FOR UPDATE
  USING (mentioned_user_id = auth.uid())
  WITH CHECK (mentioned_user_id = auth.uid());

-- Users can delete mentions from their own notes
DROP POLICY IF EXISTS "Users can delete mentions from own notes" ON note_mentions;
CREATE POLICY "Users can delete mentions from own notes"
  ON note_mentions FOR DELETE
  USING (
    note_id IN (
      SELECT id FROM sticky_notes WHERE author_id = auth.uid()
    )
  );

-- ============================================
-- NOTE REACTIONS POLICIES
-- ============================================

-- Users can view reactions on notes they can view
DROP POLICY IF EXISTS "Users can view note reactions" ON note_reactions;
CREATE POLICY "Users can view note reactions"
  ON note_reactions FOR SELECT
  USING (
    note_id IN (
      SELECT id FROM sticky_notes
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
      AND deleted_at IS NULL
    )
  );

-- Users can add reactions to notes they can view
DROP POLICY IF EXISTS "Users can create reactions" ON note_reactions;
CREATE POLICY "Users can create reactions"
  ON note_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND note_id IN (
      SELECT id FROM sticky_notes
      WHERE workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
      AND deleted_at IS NULL
    )
  );

-- Users can remove their own reactions
DROP POLICY IF EXISTS "Users can delete own reactions" ON note_reactions;
CREATE POLICY "Users can delete own reactions"
  ON note_reactions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 6. ENABLE REALTIME FOR SUPABASE
-- ============================================

-- Enable realtime for sticky notes
ALTER PUBLICATION supabase_realtime ADD TABLE sticky_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE note_mentions;
ALTER PUBLICATION supabase_realtime ADD TABLE note_reactions;

-- ============================================
-- 7. NOTIFICATION TRIGGER FOR MENTIONS
-- ============================================

-- Function to create notification when user is mentioned
CREATE OR REPLACE FUNCTION create_mention_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_note sticky_notes%ROWTYPE;
  v_author profiles%ROWTYPE;
  v_patient patients%ROWTYPE;
BEGIN
  -- Get note details
  SELECT * INTO v_note FROM sticky_notes WHERE id = NEW.note_id;

  -- Get author details
  SELECT * INTO v_author FROM profiles WHERE id = v_note.author_id;

  -- Get patient details if applicable
  IF v_note.patient_id IS NOT NULL THEN
    SELECT * INTO v_patient FROM patients WHERE id = v_note.patient_id;
  END IF;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    severity,
    related_patient_id,
    related_workspace_id,
    related_note_id,
    data
  ) VALUES (
    NEW.mentioned_user_id,
    'mention',
    COALESCE(v_author.full_name, 'A user') || ' mentioned you in a note',
    substring(v_note.content from 1 for 200),
    CASE v_note.note_type
      WHEN 'urgent' THEN 'high'
      WHEN 'important' THEN 'medium'
      ELSE 'info'
    END,
    v_note.patient_id,
    v_note.workspace_id,
    v_note.id,
    jsonb_build_object(
      'note_type', v_note.note_type,
      'author_name', COALESCE(v_author.full_name, 'Unknown'),
      'patient_name', COALESCE(v_patient.full_name, NULL)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for mention notifications
DROP TRIGGER IF EXISTS on_mention_create_notification ON note_mentions;
CREATE TRIGGER on_mention_create_notification
  AFTER INSERT ON note_mentions
  FOR EACH ROW
  EXECUTE FUNCTION create_mention_notification();

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to get note with replies count
CREATE OR REPLACE FUNCTION get_note_with_stats(note_id UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  note_type TEXT,
  color TEXT,
  is_pinned BOOLEAN,
  is_resolved BOOLEAN,
  author_id UUID,
  author_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  replies_count BIGINT,
  reactions_count BIGINT,
  mentions_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sn.id,
    sn.content,
    sn.note_type,
    sn.color,
    sn.is_pinned,
    sn.is_resolved,
    sn.author_id,
    p.full_name as author_name,
    sn.created_at,
    sn.updated_at,
    (SELECT COUNT(*) FROM sticky_notes WHERE parent_id = sn.id AND deleted_at IS NULL) as replies_count,
    (SELECT COUNT(*) FROM note_reactions WHERE note_id = sn.id) as reactions_count,
    (SELECT COUNT(*) FROM note_mentions WHERE note_id = sn.id) as mentions_count
  FROM sticky_notes sn
  LEFT JOIN profiles p ON p.id = sn.author_id
  WHERE sn.id = note_id AND sn.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================

-- Comment out this section in production

/*
-- Insert sample sticky notes
INSERT INTO sticky_notes (workspace_id, patient_id, content, note_type, color, author_id)
SELECT
  w.id as workspace_id,
  p.id as patient_id,
  'Sample note: Patient needs follow-up for blood test results',
  'important',
  '#fbbf24',
  u.id as author_id
FROM workspaces w
CROSS JOIN patients p
CROSS JOIN auth.users u
WHERE w.is_active = true
  AND p.workspace_id = w.id
LIMIT 1;
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Phase 4 Migration Complete!';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - sticky_notes';
  RAISE NOTICE '  - note_mentions';
  RAISE NOTICE '  - note_reactions';
  RAISE NOTICE 'RLS policies enabled';
  RAISE NOTICE 'Realtime enabled';
  RAISE NOTICE 'Notification triggers created';
END $$;
