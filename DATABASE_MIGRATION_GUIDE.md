# Database Migration Guide

## Güncellemelerin Uygulanması

Bu dosya, mevcut ACIL veritabanınıza yapılması gereken güncellemeleri içerir.

### Adım 1: Yedekleme (ÖNEMLİ!)

Güncellemeleri uygulamadan önce **mutlaka** veritabanınızın yedeğini alın:

1. Supabase Dashboard'a gidin
2. Database > Backups bölümüne gidin
3. Manual backup oluşturun

### Adım 2: Güncellemeleri Uygulama

1. Supabase Dashboard'da **SQL Editor** bölümüne gidin
2. `supabase-schema-updates.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'a yapıştırın
4. **Run** butonuna tıklayın

### Adım 3: Doğrulama

Güncellemelerin başarıyla uygulandığını doğrulamak için:

```sql
-- Yeni sütunları kontrol et
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'patients' AND column_name = 'deleted_at';

-- Audit logs tablosunu kontrol et
SELECT * FROM audit_logs LIMIT 1;

-- Index'leri kontrol et
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('patients', 'patient_data', 'patient_tests');
```

## Yeni Özellikler

### 1. Soft Delete

Artık hastalar silindiğinde veritabanından kalıcı olarak kaldırılmaz, sadece `deleted_at` sütunu güncellenir.

**Kullanım:**
```sql
-- Hasta silme
SELECT soft_delete_patient('patient-uuid-here');

-- Hasta geri yükleme
SELECT restore_patient('patient-uuid-here');
```

### 2. Audit Logs

Tüm veritabanı değişiklikleri otomatik olarak `audit_logs` tablosuna kaydedilir.

**Sorgulama:**
```sql
-- Belirli bir hastadaki değişiklikleri görüntüleme
SELECT * FROM audit_logs
WHERE record_id = 'patient-uuid-here'
ORDER BY created_at DESC;

-- Son 24 saatteki tüm değişiklikler
SELECT * FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 3. Performance Optimizations

Yeni composite index'ler eklendi. Sorgular artık daha hızlı çalışacak.

### 4. Updated RLS Policies

Güvenlik politikaları soft delete'i dikkate alacak şekilde güncellendi.

## Geri Alma (Rollback)

Eğer bir sorun oluşursa, yedekten geri yükleyebilirsiniz:

1. Supabase Dashboard > Database > Backups
2. İlgili backup'ı seçin
3. "Restore" butonuna tıklayın

## Notlar

- Bu güncellemeler mevcut verileri etkilemez
- Tüm mevcut veriler korunur
- Güncellemeler geri dönüşlüdür (rollback edilebilir)
- Production ortamında uygulamadan önce staging/test ortamında test edin

## Destek

Sorun yaşarsanız:
1. Hata mesajlarını not edin
2. Supabase logs'ları kontrol edin (Dashboard > Logs)
3. Veritabanı yedeğinizden geri yükleyin
