-- ============================================
-- TEST VERİLERİ OLUŞTURMA SCRIPTİ
-- ============================================
-- Bu script test için örnek organizations, workspaces, members ve patients oluşturur
-- Tarih: 9 Kasım 2025
-- ============================================

DO $$
DECLARE
  -- Mevcut kullanıcıları al
  current_user_id UUID;
  test_user_id UUID;
  
  -- Organizations
  org_hastane_id UUID;
  org_klinik_id UUID;
  org_saglik_merkezi_id UUID;
  org_ozel_muayenehane_id UUID;
  
  -- Workspaces
  ws_acil_id UUID;
  ws_kardiyoloji_id UUID;
  ws_cerrahi_id UUID;
  ws_pediatri_id UUID;
  ws_ortopedi_id UUID;
  ws_noroloji_id UUID;
  ws_dahiliye_id UUID;
  
BEGIN
  -- Mevcut kullanıcıları al
  SELECT id INTO current_user_id FROM auth.users WHERE email = 'srgnunlu@icloud.com' LIMIT 1;
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@test.com' LIMIT 1;
  
  IF current_user_id IS NULL OR test_user_id IS NULL THEN
    RAISE EXCEPTION 'Kullanıcılar bulunamadı!';
  END IF;
  
  RAISE NOTICE 'Test verileri oluşturuluyor...';
  RAISE NOTICE 'Current User ID: %', current_user_id;
  RAISE NOTICE 'Test User ID: %', test_user_id;
  
  -- ============================================
  -- 1. ORGANIZATIONS OLUŞTUR
  -- ============================================
  
  -- Acıbadem Hastanesi
  INSERT INTO organizations (
    name, slug, type, 
    subscription_tier, subscription_status,
    contact_email, contact_phone, address,
    settings
  ) VALUES (
    'Acıbadem Hastanesi', 'acibadem-hastanesi', 'hospital',
    'enterprise', 'active',
    'info@acibadem.com.tr', '+90 212 555 0101', 'İstanbul, Türkiye',
    '{"timezone": "Europe/Istanbul", "language": "tr", "date_format": "DD/MM/YYYY", "time_format": "24h"}'::jsonb
  ) ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO org_hastane_id;
  
  -- Memorial Klinik
  INSERT INTO organizations (
    name, slug, type,
    subscription_tier, subscription_status,
    contact_email, contact_phone, address,
    settings
  ) VALUES (
    'Memorial Klinik', 'memorial-klinik', 'clinic',
    'pro', 'active',
    'info@memorial.com.tr', '+90 212 555 0202', 'Ankara, Türkiye',
    '{"timezone": "Europe/Istanbul", "language": "tr", "date_format": "DD/MM/YYYY", "time_format": "24h"}'::jsonb
  ) ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO org_klinik_id;
  
  -- Şehir Sağlık Merkezi
  INSERT INTO organizations (
    name, slug, type,
    subscription_tier, subscription_status,
    contact_email, contact_phone, address,
    settings
  ) VALUES (
    'Şehir Sağlık Merkezi', 'sehir-saglik-merkezi', 'health_center',
    'free', 'active',
    'info@sehirsm.gov.tr', '+90 312 555 0303', 'İzmir, Türkiye',
    '{"timezone": "Europe/Istanbul", "language": "tr", "date_format": "DD/MM/YYYY", "time_format": "24h"}'::jsonb
  ) ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO org_saglik_merkezi_id;
  
  -- Dr. Ahmet Yılmaz Özel Muayenehane
  INSERT INTO organizations (
    name, slug, type,
    subscription_tier, subscription_status,
    contact_email, contact_phone, address,
    settings
  ) VALUES (
    'Dr. Ahmet Yılmaz Özel Muayenehane', 'dr-ahmet-yilmaz-muayenehane', 'private_practice',
    'free', 'active',
    'ahmet.yilmaz@example.com', '+90 555 123 4567', 'Bursa, Türkiye',
    '{"timezone": "Europe/Istanbul", "language": "tr", "date_format": "DD/MM/YYYY", "time_format": "24h"}'::jsonb
  ) ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO org_ozel_muayenehane_id;
  
  -- Eğer organization'lar zaten varsa ID'lerini al
  IF org_hastane_id IS NULL THEN
    SELECT id INTO org_hastane_id FROM organizations WHERE slug = 'acibadem-hastanesi';
  END IF;
  IF org_klinik_id IS NULL THEN
    SELECT id INTO org_klinik_id FROM organizations WHERE slug = 'memorial-klinik';
  END IF;
  IF org_saglik_merkezi_id IS NULL THEN
    SELECT id INTO org_saglik_merkezi_id FROM organizations WHERE slug = 'sehir-saglik-merkezi';
  END IF;
  IF org_ozel_muayenehane_id IS NULL THEN
    SELECT id INTO org_ozel_muayenehane_id FROM organizations WHERE slug = 'dr-ahmet-yilmaz-muayenehane';
  END IF;
  
  RAISE NOTICE 'Organizations oluşturuldu:';
  RAISE NOTICE '  - Acıbadem Hastanesi: %', org_hastane_id;
  RAISE NOTICE '  - Memorial Klinik: %', org_klinik_id;
  RAISE NOTICE '  - Şehir Sağlık Merkezi: %', org_saglik_merkezi_id;
  RAISE NOTICE '  - Dr. Ahmet Yılmaz: %', org_ozel_muayenehane_id;
  
  -- ============================================
  -- 2. WORKSPACES OLUŞTUR
  -- ============================================
  
  -- Acıbadem Hastanesi Workspaces
  INSERT INTO workspaces (
    organization_id, name, slug, type, description,
    color, icon, is_active, created_by
  ) VALUES (
    org_hastane_id, 'Acil Servis', 'acil-servis', 'emergency', 'Acil servis birimi',
    '#ef4444', '🚨', true, current_user_id
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO ws_acil_id;
  
  INSERT INTO workspaces (
    organization_id, name, slug, type, description,
    color, icon, is_active, created_by
  ) VALUES (
    org_hastane_id, 'Kardiyoloji Servisi', 'kardiyoloji', 'cardiology', 'Kardiyoloji servisi',
    '#3b82f6', '❤️', true, current_user_id
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO ws_kardiyoloji_id;
  
  INSERT INTO workspaces (
    organization_id, name, slug, type, description,
    color, icon, is_active, created_by
  ) VALUES (
    org_hastane_id, 'Cerrahi Servis', 'cerrahi', 'surgery', 'Genel cerrahi servisi',
    '#8b5cf6', '⚕️', true, current_user_id
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO ws_cerrahi_id;
  
  -- Memorial Klinik Workspaces
  INSERT INTO workspaces (
    organization_id, name, slug, type, description,
    color, icon, is_active, created_by
  ) VALUES (
    org_klinik_id, 'Pediatri', 'pediatri', 'custom', 'Çocuk sağlığı ve hastalıkları',
    '#10b981', '👶', true, current_user_id
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO ws_pediatri_id;
  
  INSERT INTO workspaces (
    organization_id, name, slug, type, description,
    color, icon, is_active, created_by
  ) VALUES (
    org_klinik_id, 'Ortopedi', 'ortopedi', 'custom', 'Ortopedi ve travmatoloji',
    '#f59e0b', '🦴', true, current_user_id
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO ws_ortopedi_id;
  
  -- Şehir Sağlık Merkezi Workspaces
  INSERT INTO workspaces (
    organization_id, name, slug, type, description,
    color, icon, is_active, created_by
  ) VALUES (
    org_saglik_merkezi_id, 'Nöroloji', 'noroloji', 'custom', 'Nöroloji birimi',
    '#6366f1', '🧠', true, current_user_id
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO ws_noroloji_id;
  
  INSERT INTO workspaces (
    organization_id, name, slug, type, description,
    color, icon, is_active, created_by
  ) VALUES (
    org_saglik_merkezi_id, 'Dahiliye', 'dahiliye', 'custom', 'İç hastalıkları',
    '#ec4899', '🫀', true, current_user_id
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO ws_dahiliye_id;
  
  -- ID'leri al (eğer zaten varsa)
  IF ws_acil_id IS NULL THEN
    SELECT id INTO ws_acil_id FROM workspaces WHERE slug = 'acil-servis' AND organization_id = org_hastane_id;
  END IF;
  IF ws_kardiyoloji_id IS NULL THEN
    SELECT id INTO ws_kardiyoloji_id FROM workspaces WHERE slug = 'kardiyoloji' AND organization_id = org_hastane_id;
  END IF;
  IF ws_cerrahi_id IS NULL THEN
    SELECT id INTO ws_cerrahi_id FROM workspaces WHERE slug = 'cerrahi' AND organization_id = org_hastane_id;
  END IF;
  IF ws_pediatri_id IS NULL THEN
    SELECT id INTO ws_pediatri_id FROM workspaces WHERE slug = 'pediatri' AND organization_id = org_klinik_id;
  END IF;
  IF ws_ortopedi_id IS NULL THEN
    SELECT id INTO ws_ortopedi_id FROM workspaces WHERE slug = 'ortopedi' AND organization_id = org_klinik_id;
  END IF;
  IF ws_noroloji_id IS NULL THEN
    SELECT id INTO ws_noroloji_id FROM workspaces WHERE slug = 'noroloji' AND organization_id = org_saglik_merkezi_id;
  END IF;
  IF ws_dahiliye_id IS NULL THEN
    SELECT id INTO ws_dahiliye_id FROM workspaces WHERE slug = 'dahiliye' AND organization_id = org_saglik_merkezi_id;
  END IF;
  
  RAISE NOTICE 'Workspaces oluşturuldu';
  
  -- ============================================
  -- 3. WORKSPACE MEMBERS OLUŞTUR
  -- ============================================
  
  -- Acil Servis - Current User (Owner)
  INSERT INTO workspace_members (
    workspace_id, user_id, role, status, permissions
  ) VALUES (
    ws_acil_id, current_user_id, 'owner', 'active', '[]'::jsonb
  ) ON CONFLICT DO NOTHING;
  
  -- Acil Servis - Test User (Admin)
  INSERT INTO workspace_members (
    workspace_id, user_id, role, status, permissions
  ) VALUES (
    ws_acil_id, test_user_id, 'admin', 'active', '[]'::jsonb
  ) ON CONFLICT DO NOTHING;
  
  -- Kardiyoloji - Current User (Senior Doctor)
  INSERT INTO workspace_members (
    workspace_id, user_id, role, status, permissions
  ) VALUES (
    ws_kardiyoloji_id, current_user_id, 'senior_doctor', 'active', '[]'::jsonb
  ) ON CONFLICT DO NOTHING;
  
  -- Kardiyoloji - Test User (Doctor)
  INSERT INTO workspace_members (
    workspace_id, user_id, role, status, permissions
  ) VALUES (
    ws_kardiyoloji_id, test_user_id, 'doctor', 'active', '[]'::jsonb
  ) ON CONFLICT DO NOTHING;
  
  -- Cerrahi - Current User (Owner)
  INSERT INTO workspace_members (
    workspace_id, user_id, role, status, permissions
  ) VALUES (
    ws_cerrahi_id, current_user_id, 'owner', 'active', '[]'::jsonb
  ) ON CONFLICT DO NOTHING;
  
  -- Pediatri - Current User (Admin)
  INSERT INTO workspace_members (
    workspace_id, user_id, role, status, permissions
  ) VALUES (
    ws_pediatri_id, current_user_id, 'admin', 'active', '[]'::jsonb
  ) ON CONFLICT DO NOTHING;
  
  -- Ortopedi - Test User (Owner)
  INSERT INTO workspace_members (
    workspace_id, user_id, role, status, permissions
  ) VALUES (
    ws_ortopedi_id, test_user_id, 'owner', 'active', '[]'::jsonb
  ) ON CONFLICT DO NOTHING;
  
  -- Nöroloji - Current User (Doctor)
  INSERT INTO workspace_members (
    workspace_id, user_id, role, status, permissions
  ) VALUES (
    ws_noroloji_id, current_user_id, 'doctor', 'active', '[]'::jsonb
  ) ON CONFLICT DO NOTHING;
  
  -- Dahiliye - Test User (Nurse)
  INSERT INTO workspace_members (
    workspace_id, user_id, role, status, permissions
  ) VALUES (
    ws_dahiliye_id, test_user_id, 'nurse', 'active', '[]'::jsonb
  ) ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Workspace members oluşturuldu';
  
  -- ============================================
  -- 4. PATIENT CATEGORIES OLUŞTUR
  -- ============================================
  
  -- Her workspace için standart kategoriler
  INSERT INTO patient_categories (workspace_id, name, color, icon, is_system, priority)
  SELECT ws_acil_id, 'Kırmızı Kod', '#ef4444', '🔴', true, 1
  ON CONFLICT DO NOTHING;
  
  INSERT INTO patient_categories (workspace_id, name, color, icon, is_system, priority)
  SELECT ws_acil_id, 'Sarı Kod', '#f59e0b', '🟡', true, 2
  ON CONFLICT DO NOTHING;
  
  INSERT INTO patient_categories (workspace_id, name, color, icon, is_system, priority)
  SELECT ws_acil_id, 'Yeşil Kod', '#10b981', '🟢', true, 3
  ON CONFLICT DO NOTHING;
  
  INSERT INTO patient_categories (workspace_id, name, color, icon, is_system, priority)
  SELECT ws_kardiyoloji_id, 'Acil', '#ef4444', '⚡', true, 1
  ON CONFLICT DO NOTHING;
  
  INSERT INTO patient_categories (workspace_id, name, color, icon, is_system, priority)
  SELECT ws_kardiyoloji_id, 'Rutin', '#3b82f6', '📋', true, 2
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Patient categories oluşturuldu';
  
  -- ============================================
  -- 5. PATIENTS OLUŞTUR
  -- ============================================
  
  -- Acil Servis Hastaları
  INSERT INTO patients (
    workspace_id, organization_id,
    name, age, gender, mrn,
    chief_complaint, admission_date, workflow_state,
    created_by
  ) VALUES (
    ws_acil_id, org_hastane_id,
    'Mehmet Yılmaz', 45, 'male', 'MRN-ACIL-001',
    'Göğüs ağrısı ve nefes darlığı', NOW() - INTERVAL '2 hours', 'admission',
    current_user_id
  ),
  (
    ws_acil_id, org_hastane_id,
    'Ayşe Demir', 32, 'female', 'MRN-ACIL-002',
    'Karın ağrısı ve bulantı', NOW() - INTERVAL '1 hour', 'admission',
    current_user_id
  ),
  (
    ws_acil_id, org_hastane_id,
    'Ali Kaya', 28, 'male', 'MRN-ACIL-003',
    'Trafik kazası - baş travması', NOW() - INTERVAL '30 minutes', 'admission',
    test_user_id
  );
  
  -- Kardiyoloji Hastaları
  INSERT INTO patients (
    workspace_id, organization_id,
    name, age, gender, mrn,
    chief_complaint, admission_date, workflow_state,
    created_by
  ) VALUES (
    ws_kardiyoloji_id, org_hastane_id,
    'Fatma Şahin', 67, 'female', 'MRN-KARD-001',
    'Kalp ritim bozukluğu', NOW() - INTERVAL '1 day', 'observation',
    current_user_id
  ),
  (
    ws_kardiyoloji_id, org_hastane_id,
    'Hasan Öz', 55, 'male', 'MRN-KARD-002',
    'Göğüs ağrısı - kontrol', NOW() - INTERVAL '3 days', 'discharge',
    test_user_id
  );
  
  -- Cerrahi Hastaları
  INSERT INTO patients (
    workspace_id, organization_id,
    name, age, gender, mrn,
    chief_complaint, admission_date, workflow_state,
    created_by
  ) VALUES (
    ws_cerrahi_id, org_hastane_id,
    'Zeynep Arslan', 42, 'female', 'MRN-CER-001',
    'Apendisit şüphesi', NOW() - INTERVAL '4 hours', 'admission',
    current_user_id
  );
  
  -- Pediatri Hastaları
  INSERT INTO patients (
    workspace_id, organization_id,
    name, age, gender, mrn,
    chief_complaint, admission_date, workflow_state,
    created_by
  ) VALUES (
    ws_pediatri_id, org_klinik_id,
    'Elif Yıldız', 8, 'female', 'MRN-PED-001',
    'Yüksek ateş ve öksürük', NOW() - INTERVAL '6 hours', 'admission',
    current_user_id
  ),
  (
    ws_pediatri_id, org_klinik_id,
    'Burak Çelik', 5, 'male', 'MRN-PED-002',
    'İshal ve kusma', NOW() - INTERVAL '2 days', 'observation',
    test_user_id
  );
  
  -- Ortopedi Hastaları
  INSERT INTO patients (
    workspace_id, organization_id,
    name, age, gender, mrn,
    chief_complaint, admission_date, workflow_state,
    created_by
  ) VALUES (
    ws_ortopedi_id, org_klinik_id,
    'Mustafa Doğan', 35, 'male', 'MRN-ORT-001',
    'Diz yaralanması', NOW() - INTERVAL '1 day', 'admission',
    test_user_id
  );
  
  -- Nöroloji Hastaları
  INSERT INTO patients (
    workspace_id, organization_id,
    name, age, gender, mrn,
    chief_complaint, admission_date, workflow_state,
    created_by
  ) VALUES (
    ws_noroloji_id, org_saglik_merkezi_id,
    'Emine Kılıç', 58, 'female', 'MRN-NOR-001',
    'Baş ağrısı ve baş dönmesi', NOW() - INTERVAL '5 hours', 'admission',
    current_user_id
  );
  
  -- Dahiliye Hastaları
  INSERT INTO patients (
    workspace_id, organization_id,
    name, age, gender, mrn,
    chief_complaint, admission_date, workflow_state,
    created_by
  ) VALUES (
    ws_dahiliye_id, org_saglik_merkezi_id,
    'İbrahim Yıldırım', 62, 'male', 'MRN-DAH-001',
    'Hipertansiyon kontrolü', NOW() - INTERVAL '2 days', 'observation',
    test_user_id
  ),
  (
    ws_dahiliye_id, org_saglik_merkezi_id,
    'Sema Aydın', 48, 'female', 'MRN-DAH-002',
    'Diyabet takibi', NOW() - INTERVAL '1 week', 'discharge',
    test_user_id
  );
  
  RAISE NOTICE 'Patients oluşturuldu';
  
  -- ============================================
  -- ÖZET
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ TEST VERİLERİ BAŞARIYLA OLUŞTURULDU!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Organizations: 4';
  RAISE NOTICE '  - Acıbadem Hastanesi (Hospital)';
  RAISE NOTICE '  - Memorial Klinik (Clinic)';
  RAISE NOTICE '  - Şehir Sağlık Merkezi (Health Center)';
  RAISE NOTICE '  - Dr. Ahmet Yılmaz (Private Practice)';
  RAISE NOTICE '';
  RAISE NOTICE 'Workspaces: 7';
  RAISE NOTICE '  - Acil Servis (Acil)';
  RAISE NOTICE '  - Kardiyoloji Servisi';
  RAISE NOTICE '  - Cerrahi Servis';
  RAISE NOTICE '  - Pediatri';
  RAISE NOTICE '  - Ortopedi';
  RAISE NOTICE '  - Nöroloji';
  RAISE NOTICE '  - Dahiliye';
  RAISE NOTICE '';
  RAISE NOTICE 'Workspace Members: 8';
  RAISE NOTICE 'Patients: 12';
  RAISE NOTICE '';
  RAISE NOTICE 'Test için kullanıcılar:';
  RAISE NOTICE '  - % (srgnunlu@icloud.com)', current_user_id;
  RAISE NOTICE '  - % (test@test.com)', test_user_id;
  RAISE NOTICE '';
  
END $$;

