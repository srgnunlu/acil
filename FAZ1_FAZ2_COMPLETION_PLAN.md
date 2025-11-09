# Faz 1 & Faz 2 Eksiklikler Tamamlama Planı

**Tarih:** 9 Kasım 2025  
**Durum:** Planlama Aşaması  
**Tahmini Süre:** 2-3 hafta

---

## 📋 Genel Bakış

Bu plan, Faz 1 ve Faz 2'de tespit edilen eksikliklerin tamamlanması için detaylı adımları içerir. Öncelik sırasına göre organize edilmiştir.

---

## 🎯 Öncelik Sırası

1. **Yüksek Öncelik** (Güvenlik & Temel Fonksiyonellik)
   - RLS Policies Test ve Doğrulama
   - Patient API Workspace Kontrolü
   - Backend Permission Middleware Güçlendirme

2. **Orta Öncelik** (Kullanıcı Deneyimi)
   - Organization Management UI
   - Organization Switcher Component
   - DashboardAbilityProvider Custom Permissions Fix

3. **Düşük Öncelik** (İyileştirmeler)
   - Protected Route Wrapper
   - Permission Test Suite

---

## 📅 Detaylı Plan

### **1. RLS Policies Test ve Doğrulama** ⚠️ YÜKSEK ÖNCELİK

**Hedef:** Veritabanı güvenlik katmanının doğru çalıştığını doğrulamak

#### Adımlar:

1. **RLS Durumunu Kontrol Et**

   ```sql
   -- Tüm tablolarda RLS aktif mi kontrol et
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN (
     'organizations', 'workspaces', 'workspace_members',
     'patients', 'patient_categories', 'workspace_invitations'
   );
   ```

2. **RLS Policies Listesini Çıkar**

   ```sql
   -- Mevcut policies'leri listele
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```

3. **Test Senaryoları Oluştur**
   - [ ] Farklı rollerle (owner, admin, doctor, nurse, observer) test
   - [ ] Workspace isolation testi (kullanıcı başka workspace'in verilerini görebiliyor mu?)
   - [ ] Organization isolation testi
   - [ ] Patient data access testi
   - [ ] Invitation access testi

4. **Test Script'i Yaz**
   - `scripts/test-rls-policies.ts` dosyası oluştur
   - Her tablo için farklı rollerle test yap
   - Sonuçları raporla

5. **Eksik Policies'leri Ekle**
   - [ ] Organizations için INSERT/UPDATE/DELETE policies
   - [ ] Workspaces için INSERT/UPDATE/DELETE policies
   - [ ] Patients için INSERT/UPDATE/DELETE policies
   - [ ] Workspace_members için INSERT/UPDATE/DELETE policies

**Deliverables:**

- ✅ RLS test script'i
- ✅ Test raporu
- ✅ Eksik policies'lerin eklenmesi
- ✅ Documentation

**Tahmini Süre:** 2-3 gün

---

### **2. Patient API Workspace Kontrolü** ⚠️ YÜKSEK ÖNCELİK

**Hedef:** Tüm patient API endpoint'lerinde workspace bazlı filtreleme ve güvenlik kontrolü

#### Kontrol Edilecek Endpoint'ler:

1. **GET /api/patients** (Liste)
   - [ ] Workspace bazlı filtreleme var mı?
   - [ ] Kullanıcının workspace'ine erişim kontrolü var mı?

2. **POST /api/patients** (Oluşturma)
   - [ ] Workspace_id zorunlu mu?
   - [ ] Kullanıcının workspace'ine erişimi var mı?

3. **GET /api/patients/[id]** (Detay)
   - [ ] Hasta kullanıcının workspace'inde mi kontrol ediliyor?
   - [ ] Workspace dışı erişim engelleniyor mu?

4. **PUT/PATCH /api/patients/[id]** (Güncelleme)
   - [ ] Workspace kontrolü var mı?
   - [ ] Permission kontrolü var mı?

5. **DELETE /api/patients/[id]** (Silme)
   - [ ] Workspace kontrolü var mı?
   - [ ] Permission kontrolü var mı?

6. **GET /api/patients/[id]/export** (Export)
   - [ ] Workspace kontrolü var mı?

7. **GET /api/patients/[id]/export-pdf** (PDF Export)
   - [ ] Workspace kontrolü var mı?

8. **PATCH /api/patients/bulk** (Toplu İşlemler)
   - [ ] Workspace kontrolü var mı?
   - [ ] Her hasta için workspace kontrolü yapılıyor mu?

#### Adımlar:

1. **Mevcut API'leri İncele**
   - [ ] Her endpoint'i tek tek kontrol et
   - [ ] Workspace kontrolü eksik olanları listele

2. **Workspace Helper Function Oluştur**

   ```typescript
   // lib/permissions/workspace-helpers.ts
   export async function requireWorkspaceAccess(
     supabase: SupabaseClient,
     userId: string,
     workspaceId: string
   ): Promise<{ hasAccess: boolean; role?: WorkspaceRole }>
   ```

3. **API Endpoint'lerini Güncelle**
   - [ ] Her endpoint'e workspace kontrolü ekle
   - [ ] Hata mesajlarını standardize et

4. **Test Yaz**
   - [ ] Farklı workspace'lerde test
   - [ ] Erişim engelleme testleri

**Deliverables:**

- ✅ Workspace helper functions
- ✅ Tüm endpoint'lerde workspace kontrolü
- ✅ Test suite
- ✅ Documentation

**Tahmini Süre:** 2-3 gün

---

### **3. Backend Permission Middleware Güçlendirme** ⚠️ YÜKSEK ÖNCELİK

**Hedef:** Tüm kritik API endpoint'lerinde permission kontrolü

#### Kontrol Edilecek Endpoint'ler:

1. **Organization Endpoints**
   - [ ] GET /api/organizations - Tüm organization'ları görebilir mi?
   - [ ] POST /api/organizations - Organization oluşturabilir mi?
   - [ ] PUT /api/organizations/[id] - Güncelleyebilir mi? (owner/admin)
   - [ ] DELETE /api/organizations/[id] - Silebilir mi? (owner)

2. **Workspace Endpoints**
   - [ ] POST /api/workspaces - Oluşturabilir mi? (org admin)
   - [ ] PUT /api/workspaces/[id] - Güncelleyebilir mi? (workspace admin)
   - [ ] DELETE /api/workspaces/[id] - Silebilir mi? (owner)

3. **Workspace Members**
   - [ ] GET /api/workspaces/[id]/members - Görebilir mi?
   - [ ] POST /api/workspaces/[id]/members - Ekleyebilir mi? (admin)
   - [ ] DELETE /api/workspaces/[id]/members/[memberId] - Çıkarabilir mi? (admin)

4. **Patient Categories**
   - [ ] POST /api/workspaces/[id]/categories - Oluşturabilir mi? (admin/senior_doctor)
   - [ ] PUT /api/workspaces/[id]/categories - Güncelleyebilir mi? (admin/senior_doctor)
   - [ ] DELETE /api/workspaces/[id]/categories - Silebilir mi? (admin/senior_doctor)

5. **Invitations**
   - [ ] POST /api/invitations - Oluşturabilir mi? (admin)
   - [ ] PATCH /api/invitations/[id] - Güncelleyebilir mi? (admin veya kendi invitation'ı)

#### Adımlar:

1. **Mevcut Middleware'i İncele**
   - [ ] `lib/permissions/middleware.ts` dosyasını kontrol et
   - [ ] Eksik fonksiyonları belirle

2. **Middleware Fonksiyonları Ekle**

   ```typescript
   // lib/permissions/middleware.ts
   export async function requirePermission(
     workspaceId: string,
     permission: Permission
   ): Promise<{ user: User; hasPermission: boolean }>

   export async function requireAnyPermission(
     workspaceId: string,
     permissions: Permission[]
   ): Promise<{ user: User; hasPermission: boolean }>
   ```

3. **API Endpoint'lerini Güncelle**
   - [ ] Her kritik endpoint'e permission kontrolü ekle
   - [ ] Standart hata mesajları kullan

4. **Test Yaz**
   - [ ] Farklı rollerle test
   - [ ] Permission bypass testleri

**Deliverables:**

- ✅ Geliştirilmiş middleware functions
- ✅ Tüm kritik endpoint'lerde permission kontrolü
- ✅ Test suite
- ✅ Documentation

**Tahmini Süre:** 2-3 gün

---

### **4. Organization Management UI** 📊 ORTA ÖNCELİK

**Hedef:** Organization yönetimi için tam fonksiyonel UI

#### Sayfalar:

1. **Organization List Page** (`/dashboard/organizations`)
   - [ ] Organization listesi
   - [ ] Organization kartları (isim, tip, üye sayısı, workspace sayısı)
   - [ ] Yeni organization oluştur butonu
   - [ ] Organization seçme/switching

2. **Organization Settings Page** (`/dashboard/organizations/[id]/settings`)
   - [ ] Genel bilgiler (isim, slug, tip, logo)
   - [ ] Abonelik bilgileri (tier, status, limits)
   - [ ] İletişim bilgileri (email, phone, address)
   - [ ] Ayarlar (timezone, language, date format)
   - [ ] Workspace listesi (bu organization'a ait)
   - [ ] Üye listesi (tüm workspace'lerden)

3. **Create Organization Modal/Page**
   - [ ] Form (isim, slug, tip)
   - [ ] Logo upload
   - [ ] İlk workspace oluşturma seçeneği
   - [ ] Validation

#### Components:

1. **OrganizationCard Component**

   ```typescript
   // components/organizations/OrganizationCard.tsx
   interface OrganizationCardProps {
     organization: Organization
     onSelect?: (id: string) => void
     onEdit?: (id: string) => void
   }
   ```

2. **OrganizationForm Component**

   ```typescript
   // components/organizations/OrganizationForm.tsx
   interface OrganizationFormProps {
     organization?: Organization
     onSubmit: (data: CreateOrganizationInput) => Promise<void>
     onCancel?: () => void
   }
   ```

3. **OrganizationSettings Component**
   ```typescript
   // components/organizations/OrganizationSettings.tsx
   // Tabs: General, Subscription, Workspaces, Members
   ```

#### Adımlar:

1. **API Endpoint'lerini Kontrol Et**
   - [ ] GET /api/organizations - ✅ Mevcut
   - [ ] POST /api/organizations - ✅ Mevcut
   - [ ] PUT /api/organizations/[id] - ✅ Mevcut
   - [ ] DELETE /api/organizations/[id] - Kontrol et

2. **Components Oluştur**
   - [ ] OrganizationCard
   - [ ] OrganizationForm
   - [ ] OrganizationSettings
   - [ ] OrganizationList

3. **Pages Oluştur**
   - [ ] `/dashboard/organizations/page.tsx`
   - [ ] `/dashboard/organizations/[id]/settings/page.tsx`

4. **Navigation Güncelle**
   - [ ] Dashboard nav'a organization linki ekle
   - [ ] Breadcrumb ekle

**Deliverables:**

- ✅ Organization list page
- ✅ Organization settings page
- ✅ Organization components
- ✅ Navigation updates

**Tahmini Süre:** 3-4 gün

---

### **5. Organization Switcher Component** 📊 ORTA ÖNCELİK

**Hedef:** Kullanıcının birden fazla organization'ı varsa aralarında geçiş yapabilmesi

#### Component Özellikleri:

1. **OrganizationSwitcher Component**
   - [ ] Dropdown menü
   - [ ] Mevcut organization gösterimi
   - [ ] Organization listesi
   - [ ] Organization seçme
   - [ ] Workspace listesi (seçili organization'a ait)

2. **Context Güncellemesi**
   - [ ] WorkspaceContext'e currentOrganization ekle
   - [ ] Organization değiştiğinde workspace'leri yenile

#### Adımlar:

1. **WorkspaceContext Güncelle**

   ```typescript
   // contexts/WorkspaceContext.tsx
   interface WorkspaceContextType {
     // ... mevcut
     currentOrganization: Organization | null
     setCurrentOrganization: (org: Organization | null) => void
     switchOrganization: (orgId: string) => void
   }
   ```

2. **OrganizationSwitcher Component Oluştur**

   ```typescript
   // components/organizations/OrganizationSwitcher.tsx
   export function OrganizationSwitcher() {
     // Dropdown UI
     // Organization listesi
     // Seçim işlemi
   }
   ```

3. **Dashboard Layout'a Ekle**
   - [ ] Header'a OrganizationSwitcher ekle
   - [ ] WorkspaceSwitcher'ın yanına yerleştir

4. **API Endpoint Kontrolü**
   - [ ] GET /api/organizations - ✅ Mevcut
   - [ ] Organization değiştirme endpoint'i gerekli mi?

**Deliverables:**

- ✅ OrganizationSwitcher component
- ✅ WorkspaceContext güncellemesi
- ✅ Dashboard layout integration

**Tahmini Süre:** 1-2 gün

---

### **6. DashboardAbilityProvider Custom Permissions Fix** 📊 ORTA ÖNCELİK

**Hedef:** Current user'ın custom permissions'ını doğru şekilde çekmek

#### Sorun:

`DashboardAbilityProvider.tsx` içinde current user'ın member bilgisini çekerken user ID kontrolü eksik.

#### Çözüm:

1. **API Endpoint Ekle**

   ```typescript
   // app/api/workspaces/[id]/members/me/route.ts
   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     // Current user'ın bu workspace'deki member bilgisini döndür
   }
   ```

2. **DashboardAbilityProvider Güncelle**
   ```typescript
   // components/providers/DashboardAbilityProvider.tsx
   useEffect(() => {
     if (!currentWorkspace?.id) return

     async function fetchMemberPermissions() {
       const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members/me`)
       // Current user'ın permissions'ını al
     }
   }, [currentWorkspace?.id])
   ```

#### Adımlar:

1. **API Endpoint Oluştur**
   - [ ] GET /api/workspaces/[id]/members/me
   - [ ] Current user'ın member bilgisini döndür

2. **DashboardAbilityProvider Güncelle**
   - [ ] Yeni endpoint'i kullan
   - [ ] User ID kontrolünü kaldır

3. **Test Et**
   - [ ] Farklı rollerle test
   - [ ] Custom permissions ile test

**Deliverables:**

- ✅ GET /api/workspaces/[id]/members/me endpoint
- ✅ DashboardAbilityProvider güncellemesi
- ✅ Test

**Tahmini Süre:** 1 gün

---

### **7. Protected Route Wrapper** 📊 DÜŞÜK ÖNCELİK

**Hedef:** Route-level permission kontrolü

#### Özellikler:

1. **ProtectedRoute Component**

   ```typescript
   // components/routing/ProtectedRoute.tsx
   interface ProtectedRouteProps {
     children: ReactNode
     permissions?: Permission[]
     roles?: WorkspaceRole[]
     fallback?: ReactNode
   }
   ```

2. **Middleware Integration**
   - [ ] Next.js middleware'de permission kontrolü
   - [ ] Redirect logic

#### Adımlar:

1. **ProtectedRoute Component Oluştur**
   - [ ] Permission kontrolü
   - [ ] Role kontrolü
   - [ ] Fallback UI

2. **Layout'larda Kullan**
   - [ ] Dashboard layout'a ekle
   - [ ] Workspace settings sayfasına ekle

3. **Middleware Güncelle** (Opsiyonel)
   - [ ] Next.js middleware'de permission kontrolü
   - [ ] Redirect logic

**Deliverables:**

- ✅ ProtectedRoute component
- ✅ Layout integration
- ✅ Documentation

**Tahmini Süre:** 1-2 gün

---

### **8. Permission Test Suite** 📊 DÜŞÜK ÖNCELİK

**Hedef:** Permission sistemini test eden kapsamlı test suite

#### Test Kategorileri:

1. **Unit Tests**
   - [ ] `hasPermission` function testi
   - [ ] `canPerformAction` function testi
   - [ ] `defineAbilityFor` function testi
   - [ ] Role-permission mapping testi

2. **Integration Tests**
   - [ ] Protected component testi
   - [ ] usePermission hook testi
   - [ ] DashboardAbilityProvider testi

3. **E2E Tests**
   - [ ] Farklı rollerle sayfa erişimi
   - [ ] Permission bypass testleri
   - [ ] API endpoint permission testleri

#### Adımlar:

1. **Test Setup**
   - [ ] Test utilities oluştur
   - [ ] Mock data hazırla

2. **Unit Tests Yaz**
   - [ ] `lib/permissions/__tests__/ability.test.ts`
   - [ ] `lib/permissions/__tests__/guards.test.tsx`

3. **Integration Tests Yaz**
   - [ ] `components/providers/__tests__/DashboardAbilityProvider.test.tsx`
   - [ ] `components/invitations/__tests__/InviteMemberForm.test.tsx`

4. **E2E Tests Yaz**
   - [ ] `e2e/permissions.spec.ts`

**Deliverables:**

- ✅ Unit test suite
- ✅ Integration test suite
- ✅ E2E test suite
- ✅ Test coverage >80%

**Tahmini Süre:** 3-4 gün

---

## 📊 Zaman Çizelgesi

| Hafta       | Görevler                                                                             | Süre    |
| ----------- | ------------------------------------------------------------------------------------ | ------- |
| **Hafta 1** | RLS Policies Test<br>Patient API Workspace Kontrolü<br>Backend Permission Middleware | 6-7 gün |
| **Hafta 2** | Organization Management UI<br>Organization Switcher<br>DashboardAbilityProvider Fix  | 4-5 gün |
| **Hafta 3** | Protected Route Wrapper<br>Permission Test Suite                                     | 4-5 gün |

**Toplam Tahmini Süre:** 14-17 gün (2-3 hafta)

---

## ✅ Başarı Kriterleri

### Güvenlik

- [ ] Tüm tablolarda RLS aktif ve test edilmiş
- [ ] Tüm API endpoint'lerinde workspace kontrolü var
- [ ] Tüm kritik endpoint'lerde permission kontrolü var
- [ ] Permission bypass testleri başarılı

### Fonksiyonellik

- [ ] Organization management UI tam fonksiyonel
- [ ] Organization switcher çalışıyor
- [ ] Custom permissions doğru çalışıyor
- [ ] Protected routes çalışıyor

### Test

- [ ] Permission test suite yazılmış
- [ ] Test coverage >80%
- [ ] Tüm testler geçiyor

---

## 🚨 Riskler ve Mitigasyon

### Risk 1: RLS Policies Eksik Olabilir

**Mitigasyon:** Kapsamlı test script'i yaz ve tüm senaryoları test et

### Risk 2: API Endpoint'lerinde Breaking Changes

**Mitigasyon:** Her değişiklikten önce mevcut davranışı dokümante et, backward compatibility sağla

### Risk 3: Performance Sorunları

**Mitigasyon:** Permission kontrolü için caching kullan, gereksiz sorguları önle

---

## 📝 Notlar

- Her görev tamamlandığında DEVELOPMENT_PLAN.md'deki checkbox'ları işaretle
- Her görev için PR oluştur ve code review yap
- Test sonuçlarını dokümante et
- Breaking changes için migration guide hazırla

---

## 🎯 Sonraki Adımlar

1. Bu planı gözden geçir ve onayla
2. İlk görevi (RLS Policies Test) başlat
3. Her görevi tamamladıkça checklist'i güncelle
4. Son görev tamamlandığında final review yap

---

**Plan Versiyonu:** 1.0  
**Son Güncelleme:** 9 Kasım 2025  
**Plan Sahibi:** Development Team
