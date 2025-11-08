# Supabase Storage Kurulum Rehberi

## Sorun
EKG görseli yüklenirken şu hata alınıyor:
```
new row violates row-level security policy
```

## Çözüm

### 1. Adım: Supabase Dashboard'a Gidin
https://supabase.com/dashboard → Projenizi seçin

### 2. Adım: Storage Bucket Oluşturun (Eğer yoksa)
1. Sol menüden **Storage** → **Buckets** seçin
2. **New Bucket** butonuna tıklayın
3. Bucket adı: `medical-images`
4. **Public bucket** seçeneğini işaretleyin (görsellere public URL ile erişim için)
5. **Create Bucket** butonuna tıklayın

### 3. Adım: Storage Politikalarını Ayarlayın

Bucket oluşturulduktan sonra, aşağıdaki politikaları eklemeniz gerekiyor:

#### Yöntem 1: SQL Editor ile (Önerilen)

Sol menüden **SQL Editor** seçin ve aşağıdaki SQL kodunu çalıştırın:

```sql
-- Authenticated kullanıcıların kendi klasörlerine dosya yüklemesine izin ver
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated kullanıcıların kendi dosyalarını okuyabilmesine izin ver
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated kullanıcıların kendi dosyalarını silebilmesine izin ver
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public okuma erişimi (eğer bucket public ise)
CREATE POLICY "Public can read files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'medical-images');
```

#### Yöntem 2: Dashboard'dan Manuel Oluşturma

1. **Storage** → **Policies** → `medical-images` bucket'ını seçin
2. **New Policy** butonuna tıklayın
3. Her politika için:

**INSERT Policy (Upload):**
- Policy name: `Users can upload to their own folder`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression:
  ```sql
  bucket_id = 'medical-images' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

**SELECT Policy (Read):**
- Policy name: `Users can read their own files`
- Allowed operation: `SELECT`
- Target roles: `authenticated`
- USING expression:
  ```sql
  bucket_id = 'medical-images' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

**DELETE Policy:**
- Policy name: `Users can delete their own files`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression:
  ```sql
  bucket_id = 'medical-images' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

**Public SELECT Policy (İsteğe bağlı):**
- Policy name: `Public can read files`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression:
  ```sql
  bucket_id = 'medical-images'
  ```

### 4. Adım: Test Edin
Politikalar oluşturulduktan sonra, uygulamanıza geri dönün ve EKG görseli yüklemeyi tekrar deneyin.

## Alternatif: Geliştirme İçin RLS'i Geçici Olarak Devre Dışı Bırakma (ÖNERİLMEZ)

**UYARI: Bu sadece geliştirme ortamı için geçici bir çözümdür. Production'da ASLA kullanmayın!**

1. Storage → Policies → `medical-images` bucket
2. "RLS enabled" seçeneğini kapatın

## Güvenlik Notları

- Politikalar, her kullanıcının sadece kendi klasörüne (`user_id/patient_id/`) dosya yüklemesini sağlar
- Dosya yolları şu formatta: `{user_id}/{patient_id}/{timestamp}.{extension}`
- Bu, hasta verilerinin gizliliğini korur ve kullanıcılar birbirlerinin dosyalarına erişemez
