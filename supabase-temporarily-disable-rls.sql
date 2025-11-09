-- ============================================
-- GEÇİCİ: RLS'İ KAPAT (SADECE DEVELOPMENT İÇİN!)
-- ============================================
-- ⚠️ UYARI: Bu script RLS'i kapatır.
-- Sadece development ortamında kullanın!
-- Production'da RLS mutlaka açık olmalı!
-- ============================================

-- workspace_members için RLS'i kapat
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;

-- workspaces için RLS'i kapat
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;

-- organizations için RLS'i kapat
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- patients için RLS'i kapat
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- patient_categories için RLS'i kapat
ALTER TABLE patient_categories DISABLE ROW LEVEL SECURITY;

RAISE NOTICE '⚠️  RLS GEÇİCİ OLARAK KAPATILDI!';
RAISE NOTICE 'Bu sadece development için kullanılmalı.';
RAISE NOTICE 'Production''da mutlaka RLS açık olmalı!';
