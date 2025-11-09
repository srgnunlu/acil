-- ============================================
-- PHASE 2: WORKSPACE INVITATIONS & USER MANAGEMENT
-- ============================================
-- Migration for invitation system and enhanced permissions

-- ============================================
-- 1. WORKSPACE INVITATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Invitee information
  email TEXT NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Role & Permissions
  role TEXT NOT NULL,
  -- 'owner', 'admin', 'senior_doctor', 'doctor', 'resident', 'nurse', 'observer'
  custom_permissions JSONB DEFAULT '[]',

  -- Invitation details
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending', 'accepted', 'declined', 'expired', 'cancelled'

  -- Acceptance
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,

  -- Message
  message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident', 'nurse', 'observer')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for workspace_invitations
CREATE INDEX idx_workspace_invitations_workspace ON workspace_invitations(workspace_id);
CREATE INDEX idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX idx_workspace_invitations_token ON workspace_invitations(invitation_token);
CREATE INDEX idx_workspace_invitations_status ON workspace_invitations(workspace_id, status);
CREATE INDEX idx_workspace_invitations_pending ON workspace_invitations(workspace_id, email)
  WHERE status = 'pending';
CREATE INDEX idx_workspace_invitations_expires ON workspace_invitations(expires_at)
  WHERE status = 'pending';

-- Comments
COMMENT ON TABLE workspace_invitations IS 'Workspace invitation management';
COMMENT ON COLUMN workspace_invitations.invitation_token IS 'Unique token for invitation link';
COMMENT ON COLUMN workspace_invitations.expires_at IS 'Invitation expiration time (default 7 days)';

-- ============================================
-- 2. USER ACTIVITY LOG
-- ============================================

CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Activity
  activity_type TEXT NOT NULL,
  -- 'patient_created', 'patient_updated', 'patient_deleted', 'invitation_sent', etc.
  entity_type TEXT,
  -- 'patient', 'workspace', 'invitation', 'member', etc.
  entity_id UUID,

  -- Details
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Request info
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for user_activity_log
CREATE INDEX idx_activity_log_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_workspace ON user_activity_log(workspace_id, created_at DESC);
CREATE INDEX idx_activity_log_organization ON user_activity_log(organization_id, created_at DESC);
CREATE INDEX idx_activity_log_entity ON user_activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_type ON user_activity_log(activity_type, created_at DESC);

-- Partition by month for performance (optional, for large scale)
-- CREATE TABLE user_activity_log_y2024m11 PARTITION OF user_activity_log
--   FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

COMMENT ON TABLE user_activity_log IS 'User activity and audit log';

-- ============================================
-- 3. UPDATE workspace_members TABLE
-- ============================================

-- Add invitation reference to workspace_members
ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES workspace_invitations(id) ON DELETE SET NULL;

-- Add last activity tracking
ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Index for invitation reference
CREATE INDEX IF NOT EXISTS idx_workspace_members_invitation ON workspace_members(invitation_id);

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Auto-update updated_at trigger for workspace_invitations
CREATE OR REPLACE FUNCTION update_workspace_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workspace_invitations_updated_at
  BEFORE UPDATE ON workspace_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_invitations_updated_at();

-- Auto-expire invitations trigger
CREATE OR REPLACE FUNCTION auto_expire_invitations()
RETURNS void AS $$
BEGIN
  UPDATE workspace_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run this periodically via pg_cron or external scheduler
-- SELECT cron.schedule('expire-invitations', '0 * * * *', 'SELECT auto_expire_invitations()');

-- ============================================
-- 5. RLS POLICIES FOR INVITATIONS
-- ============================================

-- Enable RLS
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for workspace_invitations

-- 1. Users can view invitations for workspaces they are members of (admin/owner only)
CREATE POLICY "Workspace admins can view invitations"
  ON workspace_invitations FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- 2. Users can view their own invitations by email
CREATE POLICY "Users can view their own invitations"
  ON workspace_invitations FOR SELECT
  USING (
    email IN (
      SELECT email
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- 3. Admins can create invitations
CREATE POLICY "Workspace admins can create invitations"
  ON workspace_invitations FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- 4. Users can update their own invitations (accept/decline)
CREATE POLICY "Users can update their own invitations"
  ON workspace_invitations FOR UPDATE
  USING (
    email IN (
      SELECT email
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- 5. Admins can update invitations
CREATE POLICY "Workspace admins can update invitations"
  ON workspace_invitations FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- 6. Admins can delete invitations
CREATE POLICY "Workspace admins can delete invitations"
  ON workspace_invitations FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- Policies for user_activity_log

-- 1. Users can view their own activity
CREATE POLICY "Users can view their own activity"
  ON user_activity_log FOR SELECT
  USING (user_id = auth.uid());

-- 2. Workspace admins can view workspace activity
CREATE POLICY "Workspace admins can view workspace activity"
  ON user_activity_log FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- 3. Only system can insert activity logs (handled by API)
CREATE POLICY "System can insert activity logs"
  ON user_activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 6. FUNCTIONS FOR INVITATION MANAGEMENT
-- ============================================

-- Function to accept invitation
CREATE OR REPLACE FUNCTION accept_workspace_invitation(
  p_invitation_token UUID
)
RETURNS JSONB AS $$
DECLARE
  v_invitation workspace_invitations%ROWTYPE;
  v_user_id UUID;
  v_member_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get invitation
  SELECT * INTO v_invitation
  FROM workspace_invitations
  WHERE invitation_token = p_invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check if user email matches
  IF v_invitation.email != (SELECT email FROM auth.users WHERE id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email mismatch');
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = v_invitation.workspace_id
      AND user_id = v_user_id
      AND status = 'active'
  ) THEN
    -- Update invitation status
    UPDATE workspace_invitations
    SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object('success', true, 'message', 'Already a member');
  END IF;

  -- Create workspace membership
  INSERT INTO workspace_members (
    workspace_id,
    user_id,
    role,
    permissions,
    status,
    invited_by,
    invited_at,
    joined_at,
    invitation_id
  ) VALUES (
    v_invitation.workspace_id,
    v_user_id,
    v_invitation.role,
    v_invitation.custom_permissions,
    'active',
    v_invitation.invited_by,
    v_invitation.invited_at,
    NOW(),
    v_invitation.id
  )
  RETURNING id INTO v_member_id;

  -- Update invitation status
  UPDATE workspace_invitations
  SET
    status = 'accepted',
    accepted_at = NOW(),
    invited_user_id = v_user_id,
    updated_at = NOW()
  WHERE id = v_invitation.id;

  -- Log activity
  INSERT INTO user_activity_log (
    user_id,
    workspace_id,
    activity_type,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    v_user_id,
    v_invitation.workspace_id,
    'invitation_accepted',
    'invitation',
    v_invitation.id,
    'User accepted workspace invitation',
    jsonb_build_object('role', v_invitation.role, 'invitation_id', v_invitation.id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'workspace_id', v_invitation.workspace_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decline invitation
CREATE OR REPLACE FUNCTION decline_workspace_invitation(
  p_invitation_token UUID
)
RETURNS JSONB AS $$
DECLARE
  v_invitation workspace_invitations%ROWTYPE;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get invitation
  SELECT * INTO v_invitation
  FROM workspace_invitations
  WHERE invitation_token = p_invitation_token
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation');
  END IF;

  -- Check if user email matches
  IF v_invitation.email != (SELECT email FROM auth.users WHERE id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email mismatch');
  END IF;

  -- Update invitation status
  UPDATE workspace_invitations
  SET
    status = 'declined',
    declined_at = NOW(),
    updated_at = NOW()
  WHERE id = v_invitation.id;

  -- Log activity
  INSERT INTO user_activity_log (
    user_id,
    workspace_id,
    activity_type,
    entity_type,
    entity_id,
    description
  ) VALUES (
    v_user_id,
    v_invitation.workspace_id,
    'invitation_declined',
    'invitation',
    v_invitation.id,
    'User declined workspace invitation'
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. VALIDATION
-- ============================================

-- Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspace_invitations') THEN
    RAISE EXCEPTION 'workspace_invitations table not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_log') THEN
    RAISE EXCEPTION 'user_activity_log table not created';
  END IF;

  RAISE NOTICE 'Phase 2 migration completed successfully!';
END $$;
