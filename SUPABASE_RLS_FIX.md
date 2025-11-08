# Supabase RLS Policy Fix - Patient Tests Silme Sorunu

## Sorun
`patient_tests` tablosundan kayıt silinemiyor. Kayıt görünüyor ama DELETE işlemi çalışmıyor.

## Çözüm

Supabase Dashboard'a gidin:
https://supabase.com/dashboard → Projenizi seçin → SQL Editor

Aşağıdaki SQL komutlarını çalıştırın:

```sql
-- Önce mevcut DELETE politikasını kontrol et
SELECT * FROM pg_policies WHERE tablename = 'patient_tests' AND cmd = 'DELETE';

-- Eğer DELETE politikası yoksa, oluştur:
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

-- Eğer DELETE politikası varsa ama çalışmıyorsa, önce sil sonra yeniden oluştur:
DROP POLICY IF EXISTS "Users can delete their own patient tests" ON patient_tests;

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
```

## Kontrol

Politikaların doğru oluşturulduğunu kontrol edin:

```sql
-- Tüm patient_tests politikalarını listele
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'patient_tests';
```

Şu politikalar olmalı:
- SELECT (okuma)
- INSERT (ekleme)
- UPDATE (güncelleme)
- DELETE (silme)

## Test

Politika oluşturduktan sonra, uygulamada silme işlemini tekrar deneyin.
Console'da artık şu mesajı göreceksiniz:
- "Kayıt kontrolü: { id: '...' } null"
- "Silme başarılı, silinen kayıt: [...]"
