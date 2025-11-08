# FAZ 1: Multi-Tenant Migration Guide

**Tarih:** 8 Kasım 2025
**Süre:** ~10-15 dakika
**Risk:** Orta (Backup alınması önerilir)

---

## 📋 Ön Hazırlık

### 1. Backup Oluştur (Önerilen)
Supabase Dashboard > Database > Backups bölümünden mevcut veritabanınızın backup'ını alın.

### 2. Gerekli Dosyalar
✅ `supabase-migration-phase1-multi-tenant.sql` (Ana migration)
✅ `supabase-migration-phase1-data-migration.sql` (Data migration)

---

## 🚀 Migration Adımları

### ADIM 1: Ana Migration'ı Çalıştır

1. **Supabase Dashboard'a git:**
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **SQL Editor'ı aç:**
   - Sol menüden "SQL Editor" seçin
   - "New query" butonuna tıklayın

3. **Migration script'ini yapıştır:**
   - `supabase-migration-phase1-multi-tenant.sql` dosyasını açın
   - **TÜM** içeriği kopyalayın (Ctrl+A, Ctrl+C)
   - SQL Editor'a yapıştırın

4. **Çalıştır:**
   - "Run" butonuna tıklayın (veya Ctrl+Enter)
   - ⏳ İşlemin bitmesini bekleyin (~30-60 saniye)

5. **Sonucu kontrol et:**
   ```
   ✅ Success (en altta görmelisiniz)
   ```

   Eğer hata varsa:
   - Hata mesajını not edin
   - Aşağıdaki "Sorun Giderme" bölümüne bakın

---

### ADIM 2: Data Migration'ı Çalıştır

1. **Yeni bir SQL sorgusu açın:**
   - SQL Editor'da "New query" tıklayın

2. **Data migration script'ini yapıştır:**
   - `supabase-migration-phase1-data-migration.sql` dosyasını açın
   - TÜM içeriği kopyalayın
   - SQL Editor'a yapıştırın

3. **Çalıştır:**
   - "Run" butonuna tıklayın
   - ⏳ İşlemin bitmesini bekleyin (~1-2 dakika)

4. **Sonuçları kontrol et:**

   Sorgu sonunda şu gibi bir özet göreceksiniz:
   ```
   NOTICE:  Processing user: Dr. Ali Yılmaz (ID: xxx...)
   NOTICE:    ✅ Organization created: ...
   NOTICE:    ✅ Profile updated with organization
   NOTICE:    ✅ Workspace created: ...
   NOTICE:    ✅ Default category: ...
   NOTICE:    ✅ Patients migrated to workspace
   NOTICE:    ✅ Patient assignments created

   ...

   NOTICE:  🎉 Data migration completed successfully!

   ============================================
   MIGRATION SUMMARY
   ============================================
   Organizations created: 3
   Workspaces created: 3
   Workspace members: 3
   Patient categories: 9
   Migrated patients: 15
   Patient assignments: 15
   ============================================
   ```

5. **İstatistik tablosunu kontrol et:**

   Sorgunun en sonunda bir tablo göreceksiniz:
   ```
   organization_name | workspace_name     | workspace_type | member_count | patient_count | category_count
   -----------------|-------------------|---------------|-------------|--------------|---------------
   Klinik           | Acil Servis       | emergency     | 1           | 5            | 5
   ...
   ```

---

### ADIM 3: Verification (Doğrulama)

Migration sonrasında verilerin doğru taşındığını kontrol edin:

1. **Organizations tablosunu kontrol et:**
   ```sql
   SELECT id, name, slug, subscription_tier, max_users
   FROM organizations
   WHERE deleted_at IS NULL
   ORDER BY created_at DESC;
   ```

   Beklenen: Her kullanıcı için bir organization

2. **Workspaces tablosunu kontrol et:**
   ```sql
   SELECT w.name, w.type, o.name as org_name, w.is_active
   FROM workspaces w
   JOIN organizations o ON w.organization_id = o.id
   WHERE w.deleted_at IS NULL
   ORDER BY w.created_at DESC;
   ```

   Beklenen: Her organization için en az bir workspace

3. **Patient Categories kontrol et:**
   ```sql
   SELECT w.name as workspace, pc.name as category, pc.color, pc.is_system
   FROM patient_categories pc
   JOIN workspaces w ON pc.workspace_id = w.id
   WHERE pc.deleted_at IS NULL
   ORDER BY w.name, pc.sort_order;
   ```

   Beklenen: Her workspace için default kategoriler (3-5 adet)

4. **Patients migration kontrol et:**
   ```sql
   SELECT
     COUNT(*) as total,
     COUNT(workspace_id) as with_workspace,
     COUNT(category_id) as with_category,
     COUNT(assigned_to) as with_assignment
   FROM patients
   WHERE deleted_at IS NULL;
   ```

   Beklenen: Tüm sütunlar eşit sayıda (tüm hastalar migration olmuş)

5. **Workspace Members kontrol et:**
   ```sql
   SELECT
     w.name as workspace,
     p.full_name as member,
     wm.role,
     wm.status
   FROM workspace_members wm
   JOIN workspaces w ON wm.workspace_id = w.id
   JOIN profiles p ON wm.user_id = p.user_id
   WHERE wm.status = 'active'
   ORDER BY w.name;
   ```

   Beklenen: Her workspace için en az bir 'owner'

---

## ✅ Başarı Kriterleri

Migration başarılıysa:

- ✅ Tüm script'ler hatasız çalıştı
- ✅ Organizations sayısı = Kullanıcı sayısı
- ✅ Workspaces sayısı >= Kullanıcı sayısı
- ✅ Her workspace'de en az 3 kategori var
- ✅ Tüm hastalar workspace_id'ye sahip
- ✅ Tüm hastalar category_id'ye sahip
- ✅ Tüm hastalar assigned_to'ya sahip
- ✅ Her workspace'de en az 1 owner var

---

## 🔧 Sorun Giderme

### Hata: "relation already exists"

**Neden:** Migration daha önce çalıştırılmış
**Çözüm:** Migration zaten tamamlanmış, ADIM 2'ye geçin

---

### Hata: "duplicate key value violates unique constraint"

**Neden:** Slug çakışması
**Çözüm:**
```sql
-- Mevcut organization'ları kontrol et
SELECT slug FROM organizations;

-- Gerekirse slug'ları güncelle
UPDATE organizations
SET slug = slug || '-' || substring(id::text, 1, 8)
WHERE slug IN (SELECT slug FROM organizations GROUP BY slug HAVING COUNT(*) > 1);
```

---

### Hata: "permission denied for table"

**Neden:** Yetersiz veritabanı yetkileri
**Çözüm:** Supabase Dashboard'da admin hesabıyla giriş yaptığınızdan emin olun

---

### Migration'ı Geri Alma (Rollback)

⚠️ **Dikkat:** Bu işlem GERİ ALINAMAZ!

Eğer migration'ı geri almak isterseniz:

1. `supabase-migration-phase1-data-migration.sql` dosyasını açın
2. En alttaki "ROLLBACK" bölümünü bulun
3. Yorum satırlarını kaldırın (/* ve */ işaretlerini silin)
4. SQL Editor'da çalıştırın

---

## 📊 Migration Sonrası

### Uygulama Davranışı

Migration sonrasında:

1. **Mevcut hastaları görmeye devam edeceksiniz**
   - Ancak artık workspace bazlı

2. **Yeni alanlar:**
   - Hasta kategorileri görünecek
   - Atanan doktorlar görünecek
   - Workflow durumları görünecek

3. **Eski "status" alanı:**
   - Hala çalışacak (geriye uyumluluk)
   - Ancak artık "category" kullanılıyor

### API Değişiklikleri

Migration sonrasında API'ler şu yeni parametreleri destekler:

```typescript
// Hasta oluştururken
POST /api/patients
{
  "workspace_id": "xxx",      // Zorunlu
  "category_id": "xxx",        // Zorunlu
  "assigned_to": "user_id",   // Opsiyonel
  "workflow_state": "admission"
}

// Workspace'leri listeleme
GET /api/workspaces
GET /api/workspaces?organization_id=xxx

// Kategorileri listeleme
GET /api/workspaces/{workspace_id}/categories
```

---

## 🎉 Tamamlandı!

Migration başarıyla tamamlandıysa:

1. ✅ Veritabanı multi-tenant yapıya dönüştü
2. ✅ Mevcut datalar migrate oldu
3. ✅ Backend API'ler hazır
4. ✅ Frontend geliştirmeye hazır

**Sonraki Adım:**
- Frontend components geliştirme
- Workspace seçici UI
- Organization settings
- Member management

---

## 📞 Destek

Sorun yaşarsanız:
1. Hata mesajını kaydedin
2. Verification sorgularını çalıştırın
3. Sonuçları paylaşın

---

**Not:** Migration işlemi production veritabanında yapılıyorsa, önce staging/test ortamında test etmeniz şiddetle önerilir!
