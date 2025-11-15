-- Fix: Add INSERT policy for ai_comparisons table
-- This was missing and causing 500 errors when trying to create comparisons

CREATE POLICY IF NOT EXISTS "Users can insert comparisons in their workspaces"
  ON ai_comparisons FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

