# Faz 3: Real-time Collaboration - Kurulum Rehberi

Bu dokümant, Faz 3'te eklenen real-time collaboration özelliklerinin kurulumu ve kullanımı hakkında bilgi sağlar.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Veritabanı Migration](#veritabanı-migration)
3. [Yeni Özellikler](#yeni-özellikler)
4. [Kullanım Örnekleri](#kullanım-örnekleri)
5. [API Referansı](#api-referansı)
6. [Sorun Giderme](#sorun-giderme)

---

## 🎯 Genel Bakış

Faz 3'te aşağıdaki real-time özellikler eklendi:

✅ **User Presence Tracking** - Kullanıcıların online/offline durumu
✅ **Real-time Patient Updates** - Hasta verilerinin canlı senkronizasyonu
✅ **Live Activity Feed** - Workspace aktivite akışı
✅ **Real-time Notifications** - Anlık bildirimler
✅ **Optimistic Updates** - İyileştirilmiş UX için optimistik güncellemeler
✅ **Conflict Resolution** - Veri çakışması yönetimi
✅ **Connection Management** - Bağlantı sağlığı takibi

---

## 🗄️ Veritabanı Migration

### 1. Migration Dosyasını Çalıştırın

Supabase Dashboard'a gidin:
1. **SQL Editor** > **New Query**
2. `supabase-migration-phase3-realtime.sql` dosyasını açın
3. İçeriği kopyalayıp SQL Editor'a yapıştırın
4. **Run** butonuna tıklayın

### 2. Realtime Publication'ı Kontrol Edin

```sql
-- Realtime publication'ı kontrol et
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Şu tabloları görmeli:
-- - patients
-- - user_presence
-- - activity_log
-- - workspace_members
```

### 3. RLS Policies'i Doğrulayın

```sql
-- RLS aktif mi kontrol et
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_presence', 'activity_log');
```

---

## 🚀 Yeni Özellikler

### 1. User Presence Tracking

Kullanıcıların workspace'deki online/offline durumunu takip eder.

**Hook:**
```typescript
import { useRealtimePresence } from '@/lib/hooks/useRealtimePresence'

function MyComponent() {
  const { onlineUsers, updatePresence } = useRealtimePresence({
    workspaceId: 'workspace-id',
    userId: 'user-id'
  })

  // Durumu güncelle
  await updatePresence({ status: 'away' })

  // Hasta görüntüleme
  await updatePresence({ viewing_patient_id: 'patient-id' })
}
```

**Component:**
```tsx
import { OnlineUsersList } from '@/components/realtime/OnlineUsersList'

<OnlineUsersList workspaceId={workspaceId} userId={userId} />
```

### 2. Real-time Patient Updates

Hasta verilerindeki değişiklikleri anlık olarak dinler.

**Hook:**
```typescript
import { useRealtimePatients } from '@/lib/hooks/useRealtimePatients'

function PatientsList() {
  const { status } = useRealtimePatients({
    workspaceId: 'workspace-id',
    onInsert: (patient) => {
      console.log('Yeni hasta eklendi:', patient)
    },
    onUpdate: (patient) => {
      console.log('Hasta güncellendi:', patient)
    }
  })
}
```

### 3. Activity Feed

Workspace'deki tüm aktiviteleri gösterir.

**Hook:**
```typescript
import { useRealtimeActivity } from '@/lib/hooks/useRealtimeActivity'

function ActivityLog() {
  const { activities } = useRealtimeActivity({
    workspaceId: 'workspace-id',
    limit: 50
  })
}
```

**Component:**
```tsx
import { ActivityFeed } from '@/components/realtime/ActivityFeed'

<ActivityFeed workspaceId={workspaceId} limit={50} />
```

### 4. Real-time Notifications

Kullanıcıya özel bildirimleri anlık olarak alır.

**Hook:**
```typescript
import { useRealtimeNotifications } from '@/lib/hooks/useRealtimeNotifications'

function Notifications() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useRealtimeNotifications({
    userId: 'user-id',
    onNotification: (notification) => {
      // Toast göster
      toast.info(notification.title)
    }
  })
}
```

### 5. Presence Indicator

Bir hastayı kimin görüntülediğini gösterir.

**Component:**
```tsx
import { PresenceIndicator } from '@/components/realtime/PresenceIndicator'

<PresenceIndicator
  workspaceId={workspaceId}
  userId={userId}
  patientId={patientId}
/>
```

### 6. Connection Status

Real-time bağlantı durumunu gösterir.

**Component:**
```tsx
import { RealtimeStatusIndicator } from '@/components/realtime/RealtimeStatusIndicator'

<RealtimeStatusIndicator status={status} showLabel />
```

---

## 💡 Kullanım Örnekleri

### Örnek 1: Patient Detail Page'de Real-time

```tsx
'use client'

import { useRealtimePatients } from '@/lib/hooks/useRealtimePatients'
import { useRealtimePresence } from '@/lib/hooks/useRealtimePresence'
import { PresenceIndicator } from '@/components/realtime/PresenceIndicator'

export default function PatientDetailPage({ patientId, workspaceId, userId }) {
  // Real-time patient updates
  useRealtimePatients({
    workspaceId,
    onUpdate: (patient) => {
      if (patient.id === patientId) {
        // Patient data değişti, yenile
        queryClient.invalidateQueries(['patient', patientId])
      }
    }
  })

  // Presence tracking
  const { updatePresence } = useRealtimePresence({
    workspaceId,
    userId
  })

  useEffect(() => {
    // Bu hastayı görüntülediğimizi bildir
    updatePresence({ viewing_patient_id: patientId })

    return () => {
      // Sayfadan çıkarken temizle
      updatePresence({ viewing_patient_id: null })
    }
  }, [patientId])

  return (
    <div>
      <PresenceIndicator
        workspaceId={workspaceId}
        userId={userId}
        patientId={patientId}
      />
      {/* Patient details */}
    </div>
  )
}
```

### Örnek 2: Dashboard Layout'ta Online Users

```tsx
'use client'

import { OnlineUsersList } from '@/components/realtime/OnlineUsersList'
import { ActivityFeed } from '@/components/realtime/ActivityFeed'

export default function DashboardLayout({ workspaceId, userId }) {
  return (
    <div className="flex gap-4">
      <aside className="w-64">
        <OnlineUsersList workspaceId={workspaceId} userId={userId} />
        <ActivityFeed workspaceId={workspaceId} className="mt-4" />
      </aside>

      <main className="flex-1">
        {/* Main content */}
      </main>
    </div>
  )
}
```

### Örnek 3: Optimistic Updates ile Hasta Güncelleme

```tsx
import { OptimisticUpdateManager } from '@/lib/realtime/optimistic-updates'

const manager = new OptimisticUpdateManager<Patient>()

async function updatePatient(patient: Patient) {
  // Optimistic update ekle
  const update = manager.addUpdate(patient.id, 'update', patient)

  try {
    // Server'a gönder
    await fetch(`/api/patients/${patient.id}`, {
      method: 'PUT',
      body: JSON.stringify(patient)
    })

    // Başarılı
    manager.markSynced(patient.id)
  } catch (error) {
    // Hata
    manager.markError(patient.id, error as Error)
  }
}
```

---

## 📚 API Referansı

### Hooks

#### `useRealtimePatients`
```typescript
interface UseRealtimePatientsOptions {
  workspaceId: string
  enabled?: boolean
  onInsert?: (patient: Patient) => void
  onUpdate?: (patient: Patient) => void
  onDelete?: (patientId: string) => void
}
```

#### `useRealtimePresence`
```typescript
interface UseRealtimePresenceOptions {
  workspaceId: string
  userId: string
  enabled?: boolean
  initialStatus?: PresenceStatus // 'online' | 'away' | 'busy' | 'offline'
}
```

#### `useRealtimeActivity`
```typescript
interface UseRealtimeActivityOptions {
  workspaceId: string
  enabled?: boolean
  limit?: number
  onActivity?: (activity: ActivityLogWithUser) => void
}
```

#### `useRealtimeNotifications`
```typescript
interface UseRealtimeNotificationsOptions {
  userId: string
  enabled?: boolean
  onNotification?: (notification: Notification) => void
}
```

### Database Functions

#### `update_user_presence()`
```sql
SELECT update_user_presence(
  p_workspace_id := 'workspace-id',
  p_status := 'online',
  p_viewing_patient_id := 'patient-id'
);
```

#### `log_activity()`
```sql
SELECT log_activity(
  p_workspace_id := 'workspace-id',
  p_activity_type := 'patient_updated',
  p_entity_type := 'patient',
  p_entity_id := 'patient-id',
  p_description := 'Hasta bilgileri güncellendi'
);
```

#### `get_workspace_online_users()`
```sql
SELECT * FROM get_workspace_online_users('workspace-id');
```

#### `cleanup_inactive_presence()`
```sql
-- 5 dakikadan uzun inaktif kullanıcıları offline yap
SELECT cleanup_inactive_presence();
```

---

## 🔧 Sorun Giderme

### Problem: Real-time güncellemeler gelmiyor

**Çözüm:**
```sql
-- 1. Realtime publication kontrol et
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 2. Eksik tabloları ekle
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
```

### Problem: Presence güncellenmiyor

**Çözüm:**
```typescript
// 1. Hook'un enabled olduğundan emin ol
const { status } = useRealtimePresence({
  workspaceId,
  userId,
  enabled: true // ← Kontrol et
})

// 2. Connection status kontrol et
console.log('Presence status:', status)
```

### Problem: Çok fazla re-render

**Çözüm:**
```typescript
// Debounce kullan
import { debounce } from '@/lib/realtime/optimistic-updates'

const debouncedUpdate = debounce(updatePresence, 1000)
```

### Problem: Offline kullanıcılar silinmiyor

**Çözüm:**
```sql
-- Manual cleanup
SELECT cleanup_inactive_presence();

-- Cron job ekle (Supabase Dashboard > Database > Cron Jobs)
-- Her 5 dakikada bir çalıştır
SELECT cron.schedule(
  'cleanup-presence',
  '*/5 * * * *',
  $$ SELECT cleanup_inactive_presence(); $$
);
```

---

## 📝 Notlar

- Real-time subscriptions workspace bazlıdır
- Presence verisi 5 dakika inaktiflikten sonra otomatik temizlenir
- Activity log son 50 aktiviteyi tutar (değiştirilebilir)
- Notification'lar 30 gün sonra otomatik silinir (opsiyonel)
- Connection manager otomatik reconnect yapar (max 5 deneme)

---

## 🎉 Sonraki Adımlar

Faz 3 tamamlandı! Şimdi Faz 4'e geçebilirsiniz:
- Sticky Notes sistemi
- @mention sistemi
- Thread discussions
- Emoji reactions

---

**Geliştirici:** ACIL Takımı
**Versiyon:** Faz 3 - Real-time Collaboration
**Tarih:** 10 Kasım 2025
