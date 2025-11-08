-- Performance Optimization SQL Script
-- ACIL Hasta Takip Sistemi için index'ler ve optimizasyonlar

-- ============================================
-- 0. GEREKLI EXTENSION'LARI AKTIF ET
-- ============================================

-- Text arama için pg_trgm extension'ı
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Query monitoring için (opsiyonel - Supabase'de olmayabilir)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================
-- 1. PATIENTS TABLOSU OPTIMIZASYONLARI
-- ============================================

-- Composite index for user queries with status and date filtering
CREATE INDEX IF NOT EXISTS idx_patients_user_status_created 
ON patients(user_id, status, created_at DESC);

-- Index for name searches
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm 
ON patients USING gin(name gin_trgm_ops);

-- Partial index for active patients only
CREATE INDEX IF NOT EXISTS idx_patients_active_user 
ON patients(user_id, created_at DESC) 
WHERE status = 'active' AND deleted_at IS NULL;

-- ============================================
-- 2. PATIENT_DATA TABLOSU OPTIMIZASYONLARI
-- ============================================

-- Composite index for patient data queries
CREATE INDEX IF NOT EXISTS idx_patient_data_patient_type_created 
ON patient_data(patient_id, data_type, created_at DESC);

-- Index for JSONB content searches (jsonb_path_ops daha performanslı)
CREATE INDEX IF NOT EXISTS idx_patient_data_content_gin 
ON patient_data USING gin(content jsonb_path_ops);

-- ============================================
-- 3. PATIENT_TESTS TABLOSU OPTIMIZASYONLARI
-- ============================================

-- Composite index for test queries
CREATE INDEX IF NOT EXISTS idx_patient_tests_patient_type_created 
ON patient_tests(patient_id, test_type, created_at DESC);

-- Index for test type filtering
CREATE INDEX IF NOT EXISTS idx_patient_tests_type 
ON patient_tests(test_type);

-- ============================================
-- 4. AI_ANALYSES TABLOSU OPTIMIZASYONLARI
-- ============================================

-- Composite index for AI analysis queries
CREATE INDEX IF NOT EXISTS idx_ai_analyses_patient_type_created 
ON ai_analyses(patient_id, analysis_type, created_at DESC);

-- ============================================
-- 5. REMINDERS TABLOSU OPTIMIZASYONLARI
-- ============================================

-- Composite index for reminder queries
CREATE INDEX IF NOT EXISTS idx_reminders_user_status_time 
ON reminders(user_id, status, scheduled_time ASC);

-- Index for pending reminders
CREATE INDEX IF NOT EXISTS idx_reminders_pending 
ON reminders(user_id, scheduled_time) 
WHERE status = 'pending';

-- ============================================
-- 6. CHAT_MESSAGES TABLOSU OPTIMIZASYONLARI
-- ============================================

-- Composite index for chat queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_patient_created 
ON chat_messages(patient_id, created_at ASC);

-- ============================================
-- 7. PROFILES TABLOSU OPTIMIZASYONLARI
-- ============================================

-- Index for user profile queries
CREATE INDEX IF NOT EXISTS idx_profiles_user 
ON profiles(user_id);

-- ============================================
-- 8. PARTITIONING STRATEJİSİ (Büyük veriler için)
-- ============================================

-- Eğer patient_data tablosu çok büyürse, partitioning düşünülebilir
-- CREATE TABLE patient_data_y2024m01 PARTITION OF patient_data
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ============================================
-- 9. VIEWS FOR COMMON QUERIES
-- ============================================

-- Patient summary view
CREATE OR REPLACE VIEW patient_summary AS
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.age,
    p.gender,
    p.status,
    p.created_at,
    p.updated_at,
    COUNT(DISTINCT pd.id) as data_count,
    COUNT(DISTINCT pt.id) as test_count,
    COUNT(DISTINCT aa.id) as analysis_count,
    MAX(pd.created_at) as last_data_entry,
    MAX(pt.created_at) as last_test,
    MAX(aa.created_at) as last_analysis
FROM patients p
LEFT JOIN patient_data pd ON p.id = pd.patient_id AND pd.deleted_at IS NULL
LEFT JOIN patient_tests pt ON p.id = pt.patient_id AND pt.deleted_at IS NULL
LEFT JOIN ai_analyses aa ON p.id = aa.patient_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.user_id, p.name, p.age, p.gender, p.status, p.created_at, p.updated_at;

-- ============================================
-- 10. PERFORMANCE MONITORING
-- ============================================

-- Query performance monitoring function
CREATE OR REPLACE FUNCTION log_slow_queries()
RETURNS void AS $$
DECLARE
    query_record RECORD;
BEGIN
    FOR query_record IN 
        SELECT 
            query,
            calls,
            total_time,
            mean_time,
            rows
        FROM pg_stat_statements 
        WHERE mean_time > 100 -- 100ms'den uzun süren sorgular
        ORDER BY mean_time DESC
        LIMIT 10
    LOOP
        RAISE NOTICE 'Slow Query: %ms, Calls: %, Query: %', 
            query_record.mean_time, 
            query_record.calls, 
            LEFT(query_record.query, 200);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. AUTO-VACUUM SETTINGS
-- ============================================

-- Auto-vacuum ayarları (değerler milisaniye cinsinden)
ALTER TABLE patients SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_cost_delay = 10
);

ALTER TABLE patient_data SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_cost_delay = 10
);

ALTER TABLE patient_tests SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_cost_delay = 10
);

-- ============================================
-- 12. STATISTICS UPDATE
-- ============================================

-- Update table statistics for better query planning
ANALYZE patients;
ANALYZE patient_data;
ANALYZE patient_tests;
ANALYZE ai_analyses;
ANALYZE reminders;
ANALYZE chat_messages;
ANALYZE profiles;

-- ============================================
-- 13. TRIGGER FOR CACHE INVALIDATION
-- ============================================

-- Function to invalidate cache on data changes
CREATE OR REPLACE FUNCTION invalidate_cache_trigger()
RETURNS trigger AS $$
BEGIN
    -- Cache invalidation logic buraya eklenecek
    -- Örnek: Redis veya application cache temizleme
    PERFORM pg_notify('cache_invalidate', 
        json_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'id', COALESCE(NEW.id, OLD.id)
        )::text
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add triggers for cache invalidation
CREATE TRIGGER trigger_patients_cache_invalidate
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION invalidate_cache_trigger();

CREATE TRIGGER trigger_patient_data_cache_invalidate
    AFTER INSERT OR UPDATE OR DELETE ON patient_data
    FOR EACH ROW EXECUTE FUNCTION invalidate_cache_trigger();

CREATE TRIGGER trigger_patient_tests_cache_invalidate
    AFTER INSERT OR UPDATE OR DELETE ON patient_tests
    FOR EACH ROW EXECUTE FUNCTION invalidate_cache_trigger();

-- ============================================
-- 14. SECURITY POLICY OPTIMIZATIONS
-- ============================================

-- RLS policies with better performance
DROP POLICY IF EXISTS "Users can view own patients" ON patients;
CREATE POLICY "Users can view own patients" ON patients
    FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own patients" ON patients;
CREATE POLICY "Users can insert own patients" ON patients
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own patients" ON patients;
CREATE POLICY "Users can update own patients" ON patients
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- 15. CLEANUP FUNCTIONS
-- ============================================

-- Function to clean up old data (örnek: 1 yıllık veri)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- 1 yıldan eski chat mesajlarını temizle
    DELETE FROM chat_messages 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- 2 yıldan eski logları temizle
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    RAISE NOTICE 'Old data cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (pg_cron extension gerekli)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT cleanup_old_data();');

-- ============================================
-- 16. PERFORMANCE QUERIES FOR MONITORING
-- ============================================
-- NOT: Bu sorgular bilgi amaçlıdır. Manuel olarak ayrı çalıştırın.

-- Table sizes
-- SELECT 
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
--     pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan,
--     idx_tup_read,
--     idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Slow queries (pg_stat_statements extension gerekli)
-- SELECT 
--     query,
--     calls,
--     total_time,
--     mean_time,
--     rows
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 10;

-- ============================================
-- DEPLOYMENT NOTLARI
-- ============================================

-- 1. Bu script production'da çalıştırılmadan önce test edilmeli
-- 2. CONCURRENTLY keyword'ü Supabase SQL Editor'da çalışmaz (transaction block içinde)
-- 3. Index'ler oluşturulduktan sonra VACUUM ANALYZE çalıştır
-- 4. pg_trgm extension'ı text aramaları için gerekli:
--    CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- 5. pg_stat_statements extension'ı query monitoring için gerekli:
--    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- 6. Memory ayarları PostgreSQL.conf'da optimize edilebilir:
--    work_mem = 256MB
--    shared_buffers = 25% of RAM
--    effective_cache_size = 75% of RAM
-- 7. Monitoring sorguları (satır 262-293) bilgi amaçlıdır, ayrı çalıştırılmalıdır