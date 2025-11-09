# Phase 2 Migration Guide: RBAC & Permissions

## 📋 Overview

Bu migration, **Faz 2: RBAC & Permissions** için gerekli veritabanı değişikliklerini içerir:

- Workspace invitation sistemi
- User activity logging
- Permission-based RLS policies
- Invitation management functions

## 🎯 Hedefler

- ✅ Workspace invitation sistemi
- ✅ Email-based invitations
- ✅ Role ve custom permission assignment
- ✅ Invitation expiry (7 gün)
- ✅ Accept/Decline flow
- ✅ Activity logging
- ✅ RLS policies

## 📝 Migration Adımları

### 1. Supabase SQL Editor'ı Aç

1. [Supabase Dashboard](https://app.supabase.com) → Projects → Projenizi seçin
2. Sol menüden **SQL Editor**'ı açın
3. **New Query** butonuna tıklayın

### 2. Migration Script'ini Çalıştır

1. `supabase-migration-phase2-invitations.sql` dosyasının içeriğini kopyalayın
2. SQL Editor'a yapıştırın
3. **Run** butonuna basın ▶️
4. Hata olmadığından emin olun

### 3. Sonuçları Kontrol Et

Aşağıdaki sorguları çalıştırarak migration'ın başarılı olduğundan emin olun:

```sql
-- 1. Tabloları kontrol et
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('workspace_invitations', 'user_activity_log')
ORDER BY table_name;

-- Beklenen sonuç: 2 satır
-- - user_activity_log
-- - workspace_invitations

-- 2. Kolonları kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workspace_invitations'
ORDER BY ordinal_position;

-- 3. RLS policies kontrol et
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('workspace_invitations', 'user_activity_log')
ORDER BY tablename, policyname;

-- Beklenen: Her tablo için birkaç policy

-- 4. Functions kontrol et
SELECT proname, prokind
FROM pg_proc
WHERE proname IN ('accept_workspace_invitation', 'decline_workspace_invitation');

-- Beklenen: 2 function

-- 5. Indexes kontrol et
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('workspace_invitations', 'user_activity_log')
ORDER BY tablename, indexname;
```

## 🧪 Test

### Test 1: Invitation Oluşturma

```sql
-- Admin olarak invitation oluştur (API üzerinden yapılmalı normalde)
INSERT INTO workspace_invitations (
  workspace_id,
  email,
  role,
  invited_by
) VALUES (
  'YOUR_WORKSPACE_ID',
  'test@example.com',
  'doctor',
  auth.uid()
);

-- Invitation'ı kontrol et
SELECT * FROM workspace_invitations WHERE email = 'test@example.com';
```

### Test 2: RLS Policy Test

```sql
-- Kendi workspace'inizdeki invitations'ları görebiliyor musunuz?
SELECT * FROM workspace_invitations;

-- Sonuç: Sadece admin olduğunuz workspace'lerin invitations'ları
```

### Test 3: Activity Log

```sql
-- Activity log yazma testi
INSERT INTO user_activity_log (
  user_id,
  workspace_id,
  activity_type,
  entity_type,
  description
) VALUES (
  auth.uid(),
  'YOUR_WORKSPACE_ID',
  'test_activity',
  'test',
  'Migration test'
);

-- Activity log okuma
SELECT * FROM user_activity_log WHERE activity_type = 'test_activity';
```

## 📊 Yeni Tablolar

### workspace_invitations

| Column             | Type        | Description                      |
| ------------------ | ----------- | -------------------------------- |
| id                 | UUID        | Primary key                      |
| workspace_id       | UUID        | Workspace reference              |
| email              | TEXT        | Invitee email                    |
| invited_user_id    | UUID        | User ID (after acceptance)       |
| role               | TEXT        | Role to be assigned              |
| custom_permissions | JSONB       | Custom permissions override      |
| invitation_token   | UUID        | Unique invitation token          |
| invited_by         | UUID        | Inviter user ID                  |
| invited_at         | TIMESTAMPTZ | Invitation creation time         |
| expires_at         | TIMESTAMPTZ | Expiration time (default 7 days) |
| status             | TEXT        | pending/accepted/declined/...    |
| accepted_at        | TIMESTAMPTZ | Acceptance timestamp             |
| declined_at        | TIMESTAMPTZ | Decline timestamp                |
| message            | TEXT        | Optional invitation message      |

### user_activity_log

| Column          | Type        | Description            |
| --------------- | ----------- | ---------------------- |
| id              | UUID        | Primary key            |
| user_id         | UUID        | User reference         |
| workspace_id    | UUID        | Workspace reference    |
| organization_id | UUID        | Organization reference |
| activity_type   | TEXT        | Activity type          |
| entity_type     | TEXT        | Entity type            |
| entity_id       | UUID        | Entity reference       |
| description     | TEXT        | Activity description   |
| metadata        | JSONB       | Additional data        |
| ip_address      | INET        | User IP                |
| user_agent      | TEXT        | User agent string      |
| created_at      | TIMESTAMPTZ | Activity timestamp     |

## 🔒 RLS Policies

### workspace_invitations

1. **Workspace admins can view invitations** - Admin'ler workspace invitations'larını görebilir
2. **Users can view their own invitations** - Kullanıcılar kendi email'lerine gelen invitations'ları görebilir
3. **Workspace admins can create invitations** - Admin'ler invitation oluşturabilir
4. **Users can update their own invitations** - Kullanıcılar kendi invitations'larını güncelleyebilir (accept/decline)
5. **Workspace admins can update invitations** - Admin'ler invitations'ları güncelleyebilir
6. **Workspace admins can delete invitations** - Admin'ler invitations'ları silebilir

### user_activity_log

1. **Users can view their own activity** - Kullanıcılar kendi aktivitelerini görebilir
2. **Workspace admins can view workspace activity** - Admin'ler workspace aktivitelerini görebilir
3. **System can insert activity logs** - Sistem (API) log kaydı oluşturabilir

## 🔧 Functions

### accept_workspace_invitation(invitation_token UUID)

Kullanıcının invitation'ı kabul etmesini sağlar.

```sql
SELECT accept_workspace_invitation('INVITATION_TOKEN_HERE');
```

Returns:

```json
{
  "success": true,
  "member_id": "uuid",
  "workspace_id": "uuid"
}
```

### decline_workspace_invitation(invitation_token UUID)

Kullanıcının invitation'ı reddetmesini sağlar.

```sql
SELECT decline_workspace_invitation('INVITATION_TOKEN_HERE');
```

Returns:

```json
{
  "success": true
}
```

## 🚨 Rollback

Eğer migration'ı geri almak isterseniz:

```sql
-- 1. Drop functions
DROP FUNCTION IF EXISTS accept_workspace_invitation(UUID);
DROP FUNCTION IF EXISTS decline_workspace_invitation(UUID);
DROP FUNCTION IF EXISTS auto_expire_invitations();
DROP FUNCTION IF EXISTS update_workspace_invitations_updated_at();

-- 2. Drop tables
DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS workspace_invitations CASCADE;

-- 3. Remove columns from workspace_members
ALTER TABLE workspace_members
  DROP COLUMN IF EXISTS invitation_id,
  DROP COLUMN IF EXISTS last_activity_at;
```

## ✅ Success Criteria

Migration başarılı sayılır eğer:

- [x] `workspace_invitations` tablosu oluşturuldu
- [x] `user_activity_log` tablosu oluşturuldu
- [x] RLS policies aktif ve çalışıyor
- [x] Invitation functions oluşturuldu ve çalışıyor
- [x] Indexes oluşturuldu
- [x] Triggers oluşturuldu

## 📞 Sorun Giderme

### Hata: "permission denied for table workspace_invitations"

**Neden**: RLS policy eksik veya yanlış yapılandırılmış.

**Çözüm**:

```sql
-- RLS policies'i kontrol et
SELECT * FROM pg_policies WHERE tablename = 'workspace_invitations';

-- RLS enable/disable
ALTER TABLE workspace_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
```

### Hata: "function accept_workspace_invitation does not exist"

**Neden**: Function oluşturulmamış.

**Çözüm**: Migration script'ini tekrar çalıştırın veya function'ı manuel oluşturun.

## 📚 Sonraki Adımlar

1. **API Endpoints**: Invitation API endpoints'lerini oluştur
2. **Frontend UI**: Invitation UI components'lerini oluştur
3. **Email**: Email notification service entegrasyonu (Resend/SendGrid)
4. **Testing**: Integration tests yaz

---

**Migration Versiyonu**: Phase 2.0
**Tarih**: 9 Kasım 2025
**Gereksinim**: Phase 1 migration tamamlanmış olmalı
