-- Patient Tests RLS Policies
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- 1. Önce mevcut politikaları kontrol et
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'patient_tests';

-- 2. Mevcut DELETE politikasını sil (eğer varsa)
DROP POLICY IF EXISTS "Users can delete their own patient tests" ON patient_tests;

-- 3. DELETE politikasını oluştur
CREATE POLICY "Users can delete their own patient tests"
ON patient_tests
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_tests.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- 4. Diğer politikaları da kontrol et ve oluştur

-- SELECT (okuma) politikası
DROP POLICY IF EXISTS "Users can view their own patient tests" ON patient_tests;
CREATE POLICY "Users can view their own patient tests"
ON patient_tests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_tests.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- INSERT (ekleme) politikası
DROP POLICY IF EXISTS "Users can insert their own patient tests" ON patient_tests;
CREATE POLICY "Users can insert their own patient tests"
ON patient_tests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_tests.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- UPDATE (güncelleme) politikası
DROP POLICY IF EXISTS "Users can update their own patient tests" ON patient_tests;
CREATE POLICY "Users can update their own patient tests"
ON patient_tests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_tests.patient_id
    AND patients.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_tests.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- 5. Sonuçları kontrol et
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'patient_tests'
ORDER BY cmd;
