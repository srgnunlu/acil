-- ============================================
-- FAZ 3: REAL-TIME COLLABORATION ALTYAPI
-- ============================================
-- ACIL - Real-time Data Sync & Presence System
-- Tarih: 2025-11-10
-- Açıklama: Real-time collaboration için gerekli tablolar ve konfigürasyon
-- ⚠️ Bu dosya TAMAMEN GÜVENLİ - Mevcut veriyi bozmaz
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '🚀 REAL-TIME COLLABORATION KURULUMU BAŞLIYOR';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';

    -- ============================================
    -- BÖLÜM 1: USER_PRESENCE TABLOSU
    -- ============================================

    RAISE NOTICE '1️⃣  User Presence tablosu kontrol ediliyor...';

    -- Tablo yoksa oluştur
    CREATE TABLE IF NOT EXISTS user_presence (
        user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

        -- Status
        status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),

        -- Current activity
        viewing_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
        last_activity_at TIMESTAMPTZ DEFAULT NOW(),

        -- Metadata
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Gerekli kolonları ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_presence' AND column_name='workspace_id') THEN
        ALTER TABLE user_presence ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_presence' AND column_name='status') THEN
        ALTER TABLE user_presence ADD COLUMN status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_presence' AND column_name='viewing_patient_id') THEN
        ALTER TABLE user_presence ADD COLUMN viewing_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_presence' AND column_name='last_activity_at') THEN
        ALTER TABLE user_presence ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_presence' AND column_name='updated_at') THEN
        ALTER TABLE user_presence ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- İndeksler
    DROP INDEX IF EXISTS idx_up_workspace;
    CREATE INDEX idx_up_workspace ON user_presence(workspace_id, status);

    DROP INDEX IF EXISTS idx_up_patient;
    CREATE INDEX idx_up_patient ON user_presence(viewing_patient_id);

    DROP INDEX IF EXISTS idx_up_activity;
    CREATE INDEX idx_up_activity ON user_presence(last_activity_at DESC);

    RAISE NOTICE '   ✅ User Presence tablosu hazır';

    -- ============================================
    -- BÖLÜM 2: ACTIVITY_LOG TABLOSU
    -- ============================================

    RAISE NOTICE '2️⃣  Activity Log tablosu kontrol ediliyor...';

    -- Tablo yoksa oluştur
    CREATE TABLE IF NOT EXISTS activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Context
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

        -- Activity
        activity_type TEXT NOT NULL,
        entity_type TEXT, -- 'patient', 'note', 'task', etc.
        entity_id UUID,

        -- Details
        description TEXT,
        data JSONB DEFAULT '{}',

        -- Metadata
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Gerekli kolonları ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='organization_id') THEN
        ALTER TABLE activity_log ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='workspace_id') THEN
        ALTER TABLE activity_log ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='user_id') THEN
        ALTER TABLE activity_log ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='activity_type') THEN
        ALTER TABLE activity_log ADD COLUMN activity_type TEXT NOT NULL DEFAULT 'unknown';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='entity_type') THEN
        ALTER TABLE activity_log ADD COLUMN entity_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='entity_id') THEN
        ALTER TABLE activity_log ADD COLUMN entity_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='description') THEN
        ALTER TABLE activity_log ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='data') THEN
        ALTER TABLE activity_log ADD COLUMN data JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='created_at') THEN
        ALTER TABLE activity_log ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- İndeksler
    DROP INDEX IF EXISTS idx_al_workspace;
    CREATE INDEX idx_al_workspace ON activity_log(workspace_id, created_at DESC);

    DROP INDEX IF EXISTS idx_al_user;
    CREATE INDEX idx_al_user ON activity_log(user_id, created_at DESC);

    DROP INDEX IF EXISTS idx_al_entity;
    CREATE INDEX idx_al_entity ON activity_log(entity_type, entity_id);

    DROP INDEX IF EXISTS idx_al_type;
    CREATE INDEX idx_al_type ON activity_log(activity_type, created_at DESC);

    RAISE NOTICE '   ✅ Activity Log tablosu hazır';

    -- ============================================
    -- BÖLÜM 3: RLS POLICIES - USER_PRESENCE
    -- ============================================

    RAISE NOTICE '3️⃣  User Presence RLS policies kuruluyor...';

    -- RLS aktifleştir
    ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

    -- Eski policy'leri temizle
    DROP POLICY IF EXISTS "Users can view workspace presence" ON user_presence;
    DROP POLICY IF EXISTS "Users can insert their own presence" ON user_presence;
    DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
    DROP POLICY IF EXISTS "Users can delete their own presence" ON user_presence;

    -- SELECT: Workspace üyeleri görebilir
    CREATE POLICY "Users can view workspace presence"
        ON user_presence FOR SELECT
        USING (
            workspace_id IN (
                SELECT workspace_id
                FROM workspace_members
                WHERE user_id = auth.uid() AND status = 'active'
            )
            OR user_id = auth.uid()
        );

    -- INSERT: Kendi presence'ını oluşturabilir
    CREATE POLICY "Users can insert their own presence"
        ON user_presence FOR INSERT
        WITH CHECK (user_id = auth.uid());

    -- UPDATE: Kendi presence'ını güncelleyebilir
    CREATE POLICY "Users can update their own presence"
        ON user_presence FOR UPDATE
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

    -- DELETE: Kendi presence'ını silebilir
    CREATE POLICY "Users can delete their own presence"
        ON user_presence FOR DELETE
        USING (user_id = auth.uid());

    RAISE NOTICE '   ✅ User Presence RLS policies hazır';

    -- ============================================
    -- BÖLÜM 4: RLS POLICIES - ACTIVITY_LOG
    -- ============================================

    RAISE NOTICE '4️⃣  Activity Log RLS policies kuruluyor...';

    -- RLS aktifleştir
    ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

    -- Eski policy'leri temizle
    DROP POLICY IF EXISTS "Users can view workspace activity" ON activity_log;
    DROP POLICY IF EXISTS "Users can insert activity" ON activity_log;

    -- SELECT: Workspace üyeleri görebilir
    CREATE POLICY "Users can view workspace activity"
        ON activity_log FOR SELECT
        USING (
            workspace_id IN (
                SELECT workspace_id
                FROM workspace_members
                WHERE user_id = auth.uid() AND status = 'active'
            )
        );

    -- INSERT: Authenticated users ekleyebilir
    CREATE POLICY "Users can insert activity"
        ON activity_log FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL);

    RAISE NOTICE '   ✅ Activity Log RLS policies hazır';

    -- ============================================
    -- BÖLÜM 5: TRIGGERS - AUTO UPDATE
    -- ============================================

    RAISE NOTICE '5️⃣  Triggers kuruluyor...';

    -- Update updated_at fonksiyonu (eğer yoksa)
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- User presence için auto update trigger
    DROP TRIGGER IF EXISTS update_user_presence_updated_at ON user_presence;
    CREATE TRIGGER update_user_presence_updated_at
        BEFORE UPDATE ON user_presence
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE '   ✅ Triggers hazır';

    -- ============================================
    -- BÖLÜM 6: SUPABASE REALTIME PUBLICATION
    -- ============================================

    RAISE NOTICE '6️⃣  Realtime publication ayarlanıyor...';

    -- Supabase Realtime için publication oluştur (eğer yoksa)
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
        ) THEN
            CREATE PUBLICATION supabase_realtime;
            RAISE NOTICE '   ℹ️  Realtime publication oluşturuldu';
        END IF;
    END $$;

    -- Tabloları publication'a ekle
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS patients;
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS user_presence;
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS activity_log;
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS workspace_members;

    RAISE NOTICE '   ✅ Realtime publication hazır';

    -- ============================================
    -- BÖLÜM 7: HELPER FUNCTIONS
    -- ============================================

    RAISE NOTICE '7️⃣  Helper functions oluşturuluyor...';

    -- Kullanıcının online durumunu güncelleyen fonksiyon
    CREATE OR REPLACE FUNCTION update_user_presence(
        p_workspace_id UUID,
        p_status TEXT DEFAULT 'online',
        p_viewing_patient_id UUID DEFAULT NULL
    ) RETURNS user_presence AS $$
    DECLARE
        v_result user_presence;
    BEGIN
        INSERT INTO user_presence (
            user_id,
            workspace_id,
            status,
            viewing_patient_id,
            last_activity_at,
            updated_at
        ) VALUES (
            auth.uid(),
            p_workspace_id,
            p_status,
            p_viewing_patient_id,
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
            workspace_id = EXCLUDED.workspace_id,
            status = EXCLUDED.status,
            viewing_patient_id = EXCLUDED.viewing_patient_id,
            last_activity_at = NOW(),
            updated_at = NOW()
        RETURNING * INTO v_result;

        RETURN v_result;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Activity log ekleyen fonksiyon
    CREATE OR REPLACE FUNCTION log_activity(
        p_workspace_id UUID,
        p_activity_type TEXT,
        p_entity_type TEXT DEFAULT NULL,
        p_entity_id UUID DEFAULT NULL,
        p_description TEXT DEFAULT NULL,
        p_data JSONB DEFAULT '{}'::jsonb
    ) RETURNS activity_log AS $$
    DECLARE
        v_result activity_log;
        v_org_id UUID;
    BEGIN
        -- Workspace'in organization_id'sini al
        SELECT organization_id INTO v_org_id
        FROM workspaces
        WHERE id = p_workspace_id;

        INSERT INTO activity_log (
            organization_id,
            workspace_id,
            user_id,
            activity_type,
            entity_type,
            entity_id,
            description,
            data,
            created_at
        ) VALUES (
            v_org_id,
            p_workspace_id,
            auth.uid(),
            p_activity_type,
            p_entity_type,
            p_entity_id,
            p_description,
            p_data,
            NOW()
        )
        RETURNING * INTO v_result;

        RETURN v_result;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Workspace'deki online kullanıcıları getiren fonksiyon
    CREATE OR REPLACE FUNCTION get_workspace_online_users(p_workspace_id UUID)
    RETURNS TABLE (
        user_id UUID,
        full_name TEXT,
        avatar_url TEXT,
        status TEXT,
        viewing_patient_id UUID,
        last_activity_at TIMESTAMPTZ
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT
            up.user_id,
            p.full_name,
            p.avatar_url,
            up.status,
            up.viewing_patient_id,
            up.last_activity_at
        FROM user_presence up
        JOIN profiles p ON up.user_id = p.user_id
        WHERE up.workspace_id = p_workspace_id
          AND up.status != 'offline'
          AND up.last_activity_at > NOW() - INTERVAL '5 minutes'
        ORDER BY up.last_activity_at DESC;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    RAISE NOTICE '   ✅ Helper functions hazır';

    -- ============================================
    -- BÖLÜM 8: AUTO CLEANUP - OFFLINE USERS
    -- ============================================

    RAISE NOTICE '8️⃣  Auto cleanup fonksiyonu oluşturuluyor...';

    -- 5 dakikadan uzun inaktif kullanıcıları offline yap
    CREATE OR REPLACE FUNCTION cleanup_inactive_presence()
    RETURNS INTEGER AS $$
    DECLARE
        v_count INTEGER;
    BEGIN
        UPDATE user_presence
        SET status = 'offline',
            updated_at = NOW()
        WHERE status != 'offline'
          AND last_activity_at < NOW() - INTERVAL '5 minutes';

        GET DIAGNOSTICS v_count = ROW_COUNT;
        RETURN v_count;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    RAISE NOTICE '   ✅ Auto cleanup fonksiyonu hazır';

    -- ============================================
    -- SONUÇ
    -- ============================================

    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ FAZ 3 KURULUMU TAMAMLANDI!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Sonraki Adımlar:';
    RAISE NOTICE '   1. Supabase Dashboard > Database > Replication';
    RAISE NOTICE '      - supabase_realtime publication''ı kontrol et';
    RAISE NOTICE '   2. Realtime Broadcast channel''ları aktifleştir';
    RAISE NOTICE '   3. Frontend hooks''ları implement et';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Kontrol:';
    RAISE NOTICE '   SELECT * FROM user_presence;';
    RAISE NOTICE '   SELECT * FROM activity_log LIMIT 10;';
    RAISE NOTICE '   SELECT * FROM pg_publication_tables WHERE pubname = ''supabase_realtime'';';
    RAISE NOTICE '';

END $$;
