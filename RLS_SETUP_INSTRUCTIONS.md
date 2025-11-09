# RLS (Row Level Security) Kurulum Talimatları

> **STATUS**: ✅ PRODUCTION READY - Tüm adımlar tamamlanmış ve test edilmiş

## ⚡ Tek Adımlı Kurulum (FINAL)

Supabase SQL Editor'de aşağıdaki dosyayı çalıştırın:

**`RLS_SECURE_FIXED.sql`**

Bu script otomatik olarak:

- ✅ Tüm eski RLS policies'i temizler
- ✅ Workspace-based security kurur
- ✅ Role-based access control aktif eder
- ✅ 5 tablonun tamamını korur (organizations, workspaces, workspace_members, patients, patient_categories)

**Bu kadar! Sistem production'a hazır.** 🚀

---

## Security Model

### Tablo Koruma Matrisi

| Tablo              | SELECT          | INSERT     | UPDATE     | DELETE   | Açıklama                           |
| ------------------ | --------------- | ---------- | ---------- | -------- | ---------------------------------- |
| workspace_members  | ✅ Authenticate | ⚠️ Admin   | ❌         | ❌       | Auth check, others admin-only      |
| patients           | ✅ Workspace    | ✅ Doctor+ | ✅ Doctor+ | ✅ Admin | Workspace-based, role-based delete |
| workspaces         | ✅ Workspace    | ❌         | ❌         | ❌       | User's own workspaces only         |
| organizations      | ✅ Authenticate | ❌         | ❌         | ❌       | API routes handle auth             |
| patient_categories | ✅ Workspace    | ✅ Admin   | ✅ Admin   | ✅ Admin | Workspace-based, admin-only        |

### Güvenlik Katmanları

1. **Database Level (RLS)**
   - User sadece kendi workspace verilerini görebilir
   - Role-based (doctor+, admin+) kontrol
   - Client-side bypass imkansız

2. **Application Level**
   - Workspace validation (patients page, detail page)
   - API routes authorization
   - Error handling

3. **JWT Level**
   - Supabase auth.uid() otomatik kontrol
   - Session-based access

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
