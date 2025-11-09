# 🔧 Supabase Migration Kılavuzu

## ⚠️ ÖNEMLİ: Doğru Sıralama

Migration dosyalarını **aşağıdaki sırayla** çalıştırmalısınız:

---

## 📝 Adım 1: Multi-Tenant Altyapısı Kur

**Dosya:** `supabase-migration-phase1-multi-tenant.sql`

**Ne Yapar:**
- ✅ Organizations tablosunu oluşturur (tüm kolonlarıyla)
- ✅ Workspaces tablosunu oluşturur
- ✅ Workspace_members tablosunu oluşturur
- ✅ Patient_categories tablosunu oluşturur
- ✅ Patient_assignments tablosunu oluşturur
- ✅ Profiles ve patients tablolarına yeni kolonları ekler
- ✅ RLS policies oluşturur
- ✅ Trigger fonksiyonlarını oluşturur
- ✅ Utility fonksiyonlarını oluşturur

**Nasıl Çalıştırılır:**
1. Supabase Dashboard > SQL Editor
2. Dosya içeriğini yapıştır
3. Run tuşuna bas

**Güvenlik Özellikleri:**
- ✅ `CREATE TABLE IF NOT EXISTS` kullanır - Tablo varsa hata vermez
- ✅ `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` kullanır - Kolon varsa hata vermez
- ✅ **YENİ:** Tablo zaten varsa, eksik kolonları otomatik ekler!

**Önemli:** Bu dosya artık mevcut tablolarla uyumlu çalışır. Organizations tablosu eksik kolonlarla bile olsa, tüm gerekli kolonları ekler.

---

## 📝 Adım 2: Mevcut Verileri Taşı

**Dosya:** `supabase-migration-phase1-data-migration.sql`

**Ne Yapar:**
- ✅ Her kullanıcı için default organization oluşturur
- ✅ Her organization için default workspace oluşturur
- ✅ Default kategorileri oluşturur
- ✅ Mevcut hastaları yeni yapıya taşır
- ✅ Patient assignments oluşturur
- ✅ Verification raporları gösterir

**Nasıl Çalıştırılır:**
1. Supabase Dashboard > SQL Editor
2. Dosya içeriğini yapıştır
3. Run tuşuna bas

---

## ❌ NE YAPMAYIN

### ~~supabase-fix-organizations-type-column.sql~~
### ~~supabase-fix-profiles-columns.sql~~
### ~~supabase-fix-all-missing-columns.sql~~

**Bu dosyalara ARTIK GEREK YOK!**

**Güncelleme (2025-11-09):** `supabase-migration-phase1-multi-tenant.sql` dosyası artık:
- ✅ Tabloları oluşturur (yoksa)
- ✅ Eksik kolonları ekler (tablo varsa)
- ✅ Her durumda güvenli çalışır

Fix dosyaları yalnızca geçici bir çözümdü. Güncellenmiş multi-tenant migration dosyası artık tüm senaryoları kapsıyor.

---

## 🎯 Özet

1. ✅ **İlk:** `supabase-migration-phase1-multi-tenant.sql`
2. ✅ **Sonra:** `supabase-migration-phase1-data-migration.sql`
3. ❌ **Fix dosyalarını kullanmayın**

---

## 🔍 Sorun Giderme

### Organizations tablosu zaten var ve eksik kolonları var mı?

Sorun yok! `supabase-migration-phase1-multi-tenant.sql` dosyası:
- `CREATE TABLE IF NOT EXISTS` kullanır (zaten varsa hata vermez)
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` kullanır (kolon varsa hata vermez)

### Bir hata alırsanız?

1. Hata mesajını kontrol edin
2. Hangi adımda olduğunuzu not edin
3. Gerekirse tabloları DROP edip baştan başlayın (ÖNEMLİ: Verilerinizi yedekleyin!)

---

## 📊 Migration Sonrası Kontrol

Migration tamamlandıktan sonra şunları kontrol edin:

```sql
-- Tabloları kontrol et
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'organizations',
    'workspaces',
    'workspace_members',
    'patient_categories',
    'patient_assignments'
  );

-- Toplam kayıtları kontrol et
SELECT
  (SELECT COUNT(*) FROM organizations) as orgs,
  (SELECT COUNT(*) FROM workspaces) as workspaces,
  (SELECT COUNT(*) FROM workspace_members) as members,
  (SELECT COUNT(*) FROM patient_categories) as categories,
  (SELECT COUNT(*) FROM patients WHERE workspace_id IS NOT NULL) as migrated_patients;
```

---

## 🎉 Başarılı Migration

Eğer her şey yolunda gittiyse:
- ✅ Tüm tablolar oluşturuldu
- ✅ Tüm kolonlar mevcut
- ✅ RLS policies aktif
- ✅ Mevcut veriler taşındı
- ✅ Her kullanıcının bir organization'ı var
- ✅ Her kullanıcının bir workspace'i var

Artık backend API ve frontend UI geliştirmeye başlayabilirsiniz! 🚀
