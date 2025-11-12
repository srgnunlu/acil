-- ============================================
-- FAZ 6: KAPSAMLI BİLDİRİM SİSTEMİ
-- ============================================
-- ACIL - Multi-Channel Notification System
-- Tarih: 2025-11-12
-- Açıklama: Notification preferences, email, push, triggers
-- ⚠️ Bu dosya TAMAMEN GÜVENLİ - Mevcut veriyi bozmaz
-- ============================================

-- ============================================
-- BÖLÜM 1: PROFILES TABLOSUNA NOTIFICATION_PREFERENCES EKLE
-- ============================================

-- notification_preferences kolonunu ekle (eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='profiles' AND column_name='notification_preferences'
    ) THEN
        ALTER TABLE profiles
        ADD COLUMN notification_preferences JSONB DEFAULT jsonb_build_object(
            'email', true,
            'push', true,
            'sms', false,
            'mention', true,
            'assignment', true,
            'critical_alerts', true,
            'patient_updates', true,
            'ai_alerts', true,
            'quiet_hours_enabled', false,
            'quiet_hours_start', '22:00',
            'quiet_hours_end', '08:00'
        );
    END IF;
END $$;

-- Mevcut kullanıcılar için default değerleri ayarla
UPDATE profiles
SET notification_preferences = jsonb_build_object(
    'email', true,
    'push', true,
    'sms', false,
    'mention', true,
    'assignment', true,
    'critical_alerts', true,
    'patient_updates', true,
    'ai_alerts', true,
    'quiet_hours_enabled', false,
    'quiet_hours_start', '22:00',
    'quiet_hours_end', '08:00'
)
WHERE notification_preferences IS NULL;

-- ============================================
-- BÖLÜM 2: NOTIFICATIONS TABLOSUNA EK KOLONLAR EKLE
-- ============================================

-- Eksik kolonları ekle
DO $$
BEGIN
    -- related_note_id kolonu (sticky notes için)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='notifications' AND column_name='related_note_id'
    ) THEN
        ALTER TABLE notifications
        ADD COLUMN related_note_id UUID REFERENCES sticky_notes(id) ON DELETE CASCADE;
    END IF;

    -- sent_push kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='notifications' AND column_name='sent_push'
    ) THEN
        ALTER TABLE notifications
        ADD COLUMN sent_push BOOLEAN DEFAULT FALSE;
    END IF;

    -- sent_email kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='notifications' AND column_name='sent_email'
    ) THEN
        ALTER TABLE notifications
        ADD COLUMN sent_email BOOLEAN DEFAULT FALSE;
    END IF;

    -- sent_sms kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='notifications' AND column_name='sent_sms'
    ) THEN
        ALTER TABLE notifications
        ADD COLUMN sent_sms BOOLEAN DEFAULT FALSE;
    END IF;

    -- expires_at kolonu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='notifications' AND column_name='expires_at'
    ) THEN
        ALTER TABLE notifications
        ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;

    -- action_url kolonu (notification'a tıklandığında nereye gideceği)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='notifications' AND column_name='action_url'
    ) THEN
        ALTER TABLE notifications
        ADD COLUMN action_url TEXT;
    END IF;
END $$;

-- Yeni indeksler
DROP INDEX IF EXISTS idx_notifications_note;
CREATE INDEX IF NOT EXISTS idx_notifications_note ON notifications(related_note_id)
    WHERE related_note_id IS NOT NULL;

DROP INDEX IF EXISTS idx_notifications_expires;
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at)
    WHERE expires_at IS NOT NULL;

DROP INDEX IF EXISTS idx_notifications_unread;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read)
    WHERE is_read = FALSE;

-- ============================================
-- BÖLÜM 3: PUSH SUBSCRIPTIONS TABLOSU
-- ============================================

-- Push notification subscriptions için tablo
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Push subscription details (Web Push API)
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,

    -- Device info
    user_agent TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,

    UNIQUE(user_id, endpoint)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions(endpoint);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions"
    ON push_subscriptions
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- BÖLÜM 4: EMAIL QUEUE TABLOSU
-- ============================================

-- Email kuyruğu için tablo (async email gönderimi)
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Recipient
    to_email TEXT NOT NULL,
    to_name TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Email content
    subject TEXT NOT NULL,
    template_name TEXT NOT NULL, -- 'mention', 'assignment', 'critical_alert', etc.
    template_data JSONB DEFAULT '{}',

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,

    -- Error tracking
    last_error TEXT,

    -- Timing
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(scheduled_for)
    WHERE status = 'pending';

-- RLS Policies (admin/system only)
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage email queue" ON email_queue;
CREATE POLICY "Service role can manage email queue"
    ON email_queue
    FOR ALL
    USING (auth.role() = 'service_role');

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_email_queue_updated_at ON email_queue;
CREATE TRIGGER update_email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- BÖLÜM 5: NOTIFICATION HELPER FUNCTIONS
-- ============================================

-- Bildirim oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'info',
    p_related_patient_id UUID DEFAULT NULL,
    p_related_workspace_id UUID DEFAULT NULL,
    p_related_note_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT '{}',
    p_action_url TEXT DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS notifications AS $$
DECLARE
    v_notification notifications;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        severity,
        related_patient_id,
        related_workspace_id,
        related_note_id,
        data,
        action_url,
        expires_at,
        is_read,
        created_at
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_severity,
        p_related_patient_id,
        p_related_workspace_id,
        p_related_note_id,
        p_data,
        p_action_url,
        p_expires_at,
        FALSE,
        NOW()
    )
    RETURNING * INTO v_notification;

    RETURN v_notification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Workspace üyelerine toplu bildirim gönder
CREATE OR REPLACE FUNCTION notify_workspace_members(
    p_workspace_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'info',
    p_related_patient_id UUID DEFAULT NULL,
    p_related_note_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT '{}',
    p_action_url TEXT DEFAULT NULL,
    p_exclude_user_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_member RECORD;
BEGIN
    -- Workspace'teki tüm aktif üyeleri bul
    FOR v_member IN
        SELECT wm.user_id
        FROM workspace_members wm
        WHERE wm.workspace_id = p_workspace_id
          AND wm.status = 'active'
          AND (p_exclude_user_id IS NULL OR wm.user_id != p_exclude_user_id)
    LOOP
        -- Her üye için bildirim oluştur
        PERFORM create_notification(
            v_member.user_id,
            p_type,
            p_title,
            p_message,
            p_severity,
            p_related_patient_id,
            p_workspace_id,
            p_related_note_id,
            p_data,
            p_action_url,
            NULL
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının notification tercihlerini kontrol et
CREATE OR REPLACE FUNCTION check_notification_preferences(
    p_user_id UUID,
    p_notification_type TEXT,
    p_severity TEXT DEFAULT 'info'
) RETURNS BOOLEAN AS $$
DECLARE
    v_prefs JSONB;
    v_quiet_hours_enabled BOOLEAN;
    v_quiet_hours_start TIME;
    v_quiet_hours_end TIME;
    v_current_time TIME;
BEGIN
    -- Kullanıcının tercihlerini al
    SELECT notification_preferences INTO v_prefs
    FROM profiles
    WHERE user_id = p_user_id;

    -- Tercih yoksa varsayılan olarak true dön
    IF v_prefs IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Critical alerts her zaman gönderilir
    IF p_severity = 'critical' THEN
        RETURN COALESCE((v_prefs->>'critical_alerts')::boolean, TRUE);
    END IF;

    -- Quiet hours kontrolü
    v_quiet_hours_enabled := COALESCE((v_prefs->>'quiet_hours_enabled')::boolean, FALSE);

    IF v_quiet_hours_enabled THEN
        v_quiet_hours_start := (v_prefs->>'quiet_hours_start')::TIME;
        v_quiet_hours_end := (v_prefs->>'quiet_hours_end')::TIME;
        v_current_time := LOCALTIME;

        -- Quiet hours içinde mi?
        IF v_quiet_hours_start <= v_quiet_hours_end THEN
            -- Normal range (örn: 22:00 - 08:00 ertesi gün)
            IF v_current_time >= v_quiet_hours_start AND v_current_time <= v_quiet_hours_end THEN
                RETURN FALSE;
            END IF;
        ELSE
            -- Midnight geçiyor (örn: 22:00 - 02:00)
            IF v_current_time >= v_quiet_hours_start OR v_current_time <= v_quiet_hours_end THEN
                RETURN FALSE;
            END IF;
        END IF;
    END IF;

    -- Notification type'a göre kontrol
    CASE p_notification_type
        WHEN 'mention' THEN
            RETURN COALESCE((v_prefs->>'mention')::boolean, TRUE);
        WHEN 'assignment' THEN
            RETURN COALESCE((v_prefs->>'assignment')::boolean, TRUE);
        WHEN 'patient_update' THEN
            RETURN COALESCE((v_prefs->>'patient_updates')::boolean, TRUE);
        WHEN 'ai_alert' THEN
            RETURN COALESCE((v_prefs->>'ai_alerts')::boolean, TRUE);
        ELSE
            RETURN TRUE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eski bildirimleri temizle (30 günden eski)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days'
       OR (expires_at IS NOT NULL AND expires_at < NOW());

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BÖLÜM 6: AUTO TRIGGERS - PATIENT EVENTS
-- ============================================

-- Yeni hasta eklendiğinde bildirim gönder
CREATE OR REPLACE FUNCTION notify_on_patient_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Workspace üyelerine bildirim gönder
    PERFORM notify_workspace_members(
        NEW.workspace_id,
        'patient_created',
        'Yeni Hasta Eklendi',
        'Hasta: ' || NEW.name,
        'info',
        NEW.id,
        NULL,
        jsonb_build_object(
            'patient_id', NEW.id,
            'patient_name', NEW.name
        ),
        '/dashboard/patients/' || NEW.id,
        NEW.created_by -- Ekleyen kullanıcıyı hariç tut
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_patient_created ON patients;
CREATE TRIGGER trigger_notify_on_patient_created
    AFTER INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_patient_created();

-- Hasta bilgileri güncellendiğinde bildirim gönder (önemli değişiklikler için)
CREATE OR REPLACE FUNCTION notify_on_patient_updated()
RETURNS TRIGGER AS $$
BEGIN
    -- Sadece önemli alanlar değiştiyse bildirim gönder
    IF OLD.category_id IS DISTINCT FROM NEW.category_id
       OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to
       OR OLD.workflow_state IS DISTINCT FROM NEW.workflow_state THEN

        -- Atanan doktora bildirim gönder
        IF NEW.assigned_to IS NOT NULL AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
            PERFORM create_notification(
                NEW.assigned_to,
                'patient_assigned',
                'Hasta Atandı',
                'Size yeni bir hasta atandı: ' || NEW.name,
                'medium',
                NEW.id,
                NEW.workspace_id,
                NULL,
                jsonb_build_object(
                    'patient_id', NEW.id,
                    'patient_name', NEW.name
                ),
                '/dashboard/patients/' || NEW.id,
                NULL
            );
        END IF;

        -- Kategori değiştiyse workspace'e bildirim
        IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
            PERFORM notify_workspace_members(
                NEW.workspace_id,
                'patient_updated',
                'Hasta Kategorisi Değişti',
                'Hasta: ' || NEW.name,
                'info',
                NEW.id,
                NULL,
                jsonb_build_object(
                    'patient_id', NEW.id,
                    'patient_name', NEW.name,
                    'change_type', 'category'
                ),
                '/dashboard/patients/' || NEW.id,
                auth.uid() -- Güncelleyen kullanıcıyı hariç tut
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_patient_updated ON patients;
CREATE TRIGGER trigger_notify_on_patient_updated
    AFTER UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_patient_updated();

-- ============================================
-- BÖLÜM 7: AUTO TRIGGERS - STICKY NOTES EVENTS
-- ============================================

-- Yeni sticky note eklendiğinde bildirim gönder
CREATE OR REPLACE FUNCTION notify_on_note_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Hasta ile ilgili notsa, atanan doktora bildirim gönder
    IF NEW.patient_id IS NOT NULL THEN
        -- Hastanın atandığı doktorlara bildirim
        INSERT INTO notifications (user_id, type, title, message, severity, related_patient_id, related_workspace_id, related_note_id, data, action_url)
        SELECT
            pa.user_id,
            'note_added',
            'Yeni Not Eklendi',
            SUBSTRING(NEW.content FROM 1 FOR 100),
            CASE NEW.note_type
                WHEN 'urgent' THEN 'high'
                WHEN 'important' THEN 'medium'
                ELSE 'info'
            END,
            NEW.patient_id,
            NEW.workspace_id,
            NEW.id,
            jsonb_build_object(
                'note_id', NEW.id,
                'note_type', NEW.note_type,
                'patient_id', NEW.patient_id
            ),
            '/dashboard/patients/' || NEW.patient_id || '?tab=notes'
        FROM patient_assignments pa
        WHERE pa.patient_id = NEW.patient_id
          AND pa.is_active = TRUE
          AND pa.user_id != NEW.author_id; -- Not yazanı hariç tut
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_note_created ON sticky_notes;
CREATE TRIGGER trigger_notify_on_note_created
    AFTER INSERT ON sticky_notes
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_note_created();

-- ============================================
-- BÖLÜM 8: AUTO TRIGGERS - MENTIONS
-- ============================================

-- Mention eklendiğinde bildirim gönder
CREATE OR REPLACE FUNCTION notify_on_mention_created()
RETURNS TRIGGER AS $$
DECLARE
    v_note sticky_notes;
    v_author profiles;
BEGIN
    -- Note bilgilerini al
    SELECT * INTO v_note
    FROM sticky_notes
    WHERE id = NEW.note_id;

    -- Yazar bilgilerini al
    SELECT * INTO v_author
    FROM profiles
    WHERE user_id = v_note.author_id;

    -- Mention edilen kullanıcıya bildirim gönder
    PERFORM create_notification(
        NEW.mentioned_user_id,
        'mention',
        COALESCE(v_author.full_name, 'Bir kullanıcı') || ' sizi etiketledi',
        SUBSTRING(v_note.content FROM 1 FOR 100),
        CASE v_note.note_type
            WHEN 'urgent' THEN 'high'
            WHEN 'important' THEN 'medium'
            ELSE 'info'
        END,
        v_note.patient_id,
        v_note.workspace_id,
        v_note.id,
        jsonb_build_object(
            'note_id', v_note.id,
            'author_id', v_note.author_id,
            'author_name', COALESCE(v_author.full_name, 'Unknown')
        ),
        CASE
            WHEN v_note.patient_id IS NOT NULL
            THEN '/dashboard/patients/' || v_note.patient_id || '?tab=notes'
            ELSE '/dashboard/workspace/' || v_note.workspace_id || '?tab=notes'
        END,
        NULL
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_mention_created ON note_mentions;
CREATE TRIGGER trigger_notify_on_mention_created
    AFTER INSERT ON note_mentions
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_mention_created();

-- ============================================
-- BÖLÜM 9: REALTIME PUBLICATION - YENİ TABLOLAR
-- ============================================

-- Yeni tabloları realtime publication'a ekle
DO $$
BEGIN
    -- push_subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'push_subscriptions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE push_subscriptions;
    END IF;

    -- email_queue (admin için)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'email_queue'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE email_queue;
    END IF;
END $$;

-- ============================================
-- SON
-- ============================================

-- Migration başarılı mesajı
DO $$
BEGIN
    RAISE NOTICE '✅ Phase 6 Migration completed successfully!';
    RAISE NOTICE '   - notification_preferences added to profiles';
    RAISE NOTICE '   - Additional columns added to notifications';
    RAISE NOTICE '   - push_subscriptions table created';
    RAISE NOTICE '   - email_queue table created';
    RAISE NOTICE '   - Helper functions created';
    RAISE NOTICE '   - Auto-triggers configured';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Notification System is ready!';
END $$;
