# RLS (Row Level Security) Kurulum Talimatları

> **ÖNEMLİ**: Workspace sistemi production'a hazır hale getirmek için bu adımları mutlaka tamamlamanız gerekmektedir.

## Kurulum Adımları

### 1. Mevcut RLS Devre Dışı Bırakımını Kaldır

Supabase SQL Editor'de şu komutu çalıştırın:

```sql
-- supabase-temporarily-disable-rls.sql dosyasındaki kodu TERS ÇEVİR
-- Ya da manuel olarak aşağıdaki komutu çalıştırın:

-- Daha sonra yapacağız, şimdi salt okunur modda kalacak
```

### 2. RLS Policies Oluştur

Supabase SQL Editor'de `/supabase-enable-rls-policies.sql` dosyasının tüm içeriğini kopyalayın ve çalıştırın.

**Dosya yeri**: `supabase-enable-rls-policies.sql`

Bu script aşağıdakileri yapacak:

- ✅ Organizations tablosu için RLS enable et ve policies oluştur
- ✅ Workspaces tablosu için RLS enable et ve policies oluştur
- ✅ Workspace_members tablosu için RLS enable et ve policies oluştur
- ✅ Patients tablosu için RLS enable et ve policies oluştur
- ✅ Patient_categories tablosu için RLS enable et ve policies oluştur

### 3. Workspace Members RLS Düzelt

Supabase SQL Editor'de `/supabase-fix-rls-workspace-members.sql` dosyasının tüm içeriğini kopyalayın ve çalıştırın.

**Dosya yeri**: `supabase-fix-rls-workspace-members.sql`

Bu script:

- ✅ Workspace_members'daki eski/hatalı policies'i kaldırır
- ✅ Yeni, düzeltilmiş policies oluşturur

### 4. Devre Dışı RLS'i Aktif Hale Getir

```sql
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_categories ENABLE ROW LEVEL SECURITY;
```

## Kontrol Listesi

- [ ] Mevcut RLS devre dışı bırakımı kaldırıldı
- [ ] `supabase-enable-rls-policies.sql` uygulandı
- [ ] `supabase-fix-rls-workspace-members.sql` uygulandı
- [ ] Tüm tablolarda RLS aktif edildi
- [ ] Uygulamayı yeniledin
- [ ] Test: Yeni kullanıcı kaydı ve workspace oluşturma çalışıyor
- [ ] Test: Workspace seçimi ve patient ekleme çalışıyor

## Sonrası Ne Olur?

RLS aktif edildikten sonra:

1. **Kullanıcılar sadece kendi workspace'lerindeki verileri görebilir**
   - Diğer kullanıcıların hastalarını göremez
   - Diğer workspace'leri göremez

2. **Role-based access kontrol uygulanır**
   - Owner/Admin: Tüm işlemler
   - Senior Doctor: Hasta okuma/yazma
   - Doctor: Hasta okuma/yazma (silme yok)
   - Resident: Hasta okuma/yazma (silme yok)
   - Nurse: Sadece okuma
   - Observer: Sadece okuma

3. **Database seviyesinde güvenlik**
   - Supabase JWT ile otomatik kontrol
   - Client-side bypass'ı imkansız

## Sorun Giderme

### "Permission denied" hatası alıyorum

Kontrol edin:

1. RLS aktif mı? → `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. Policy'ler doğru mu? → SQL Editor'de policy'leri kontrol et
3. Workspace member mısınız? → `workspace_members` tablosunda kontrol et

### Hiçbir şey okuyamıyorum

RLS çok katı olabilir. Şu adımları uygulayın:

1. RLS'i geçici olarak devre dışı bırak
2. Verileri kontrol et
3. Policy'leri kontrol et ve düzelt
4. RLS'i tekrar aktif et

### API'den veri çekemiyorum

Emin olun ki:

1. User authenticated
2. Workspace member (workspace_members tablosunda active)
3. Role permissions doğru

## İlgili Dosyalar

- `app/api/workspaces/route.ts` - Workspace listesi (RLS ile sınırlı)
- `app/api/organizations/route.ts` - Organization listesi (RLS ile sınırlı)
- `app/dashboard/patients/page.tsx` - Patient listesi (RLS ile sınırlı)
- `app/dashboard/patients/[id]/page.tsx` - Patient detail (RLS ile sınırlı)
- `components/patients/AddPatientButton.tsx` - Patient ekleme (RLS kontrol)

## Production Checklist

- [ ] RLS tüm tablolarda ENABLED
- [ ] Policies tüm operasyonları kapsıyor (SELECT, INSERT, UPDATE, DELETE)
- [ ] Database backups alınmış
- [ ] Development ortamında test edilmiş
- [ ] Staging ortamında user acceptance test
- [ ] Production'a deploy
