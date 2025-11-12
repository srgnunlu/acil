# Phase 6: Comprehensive Notification System

## 🎉 Overview

Phase 6 implements a comprehensive, multi-channel notification system for the ACIL platform with:

- ✅ **In-App Notifications** - Real-time notifications with toast messages
- ✅ **Push Notifications (PWA)** - Browser push notifications
- ✅ **Email Notifications** - Template-based email system with Resend
- ✅ **User Preferences** - Granular notification settings with quiet hours
- ✅ **Database Triggers** - Automatic notifications for events
- ✅ **Notification Center** - Comprehensive UI for managing notifications

---

## 📦 New Dependencies

```json
{
  "resend": "^4.0.1",
  "web-push": "^3.6.7",
  "@types/web-push": "^3.6.3"
}
```

Install dependencies:
```bash
npm install resend web-push
npm install -D @types/web-push
```

---

## 🗄️ Database Changes

### New Tables

1. **notifications** - Already exists (Phase 3), enhanced with new columns
2. **push_subscriptions** - PWA push notification subscriptions
3. **email_queue** - Async email queue

### New Columns

**profiles table:**
- `notification_preferences` (JSONB) - User notification preferences

**notifications table:**
- `related_note_id` (UUID) - Link to sticky notes
- `sent_push` (BOOLEAN) - Push notification sent flag
- `sent_email` (BOOLEAN) - Email sent flag
- `sent_sms` (BOOLEAN) - SMS sent flag
- `expires_at` (TIMESTAMPTZ) - Expiration timestamp
- `action_url` (TEXT) - URL for notification action

### Migration

Run the migration script in Supabase SQL Editor:

```bash
# Open Supabase SQL Editor and run:
supabase-migration-phase6-notifications.sql
```

---

## 🚀 Features

### 1. In-App Notifications

Real-time notifications with Supabase Realtime:

```tsx
import { NotificationCenter } from '@/components/notifications/NotificationCenter'

<NotificationCenter userId={user.id} enabled={true} />
```

**Features:**
- Real-time updates via Supabase
- Toast notifications for new alerts
- Filtering by type and severity
- Mark as read/unread
- Delete notifications
- Unread badge counter

### 2. Notification Service

Create notifications programmatically:

```typescript
import { NotificationService } from '@/lib/notifications/notification-service'

// Create a single notification
await NotificationService.createNotification({
  user_id: userId,
  type: 'patient_assigned',
  title: 'Yeni Hasta Atandı',
  message: `Hasta: ${patientName}`,
  severity: 'medium',
  related_patient_id: patientId,
  related_workspace_id: workspaceId,
  action_url: `/dashboard/patients/${patientId}`,
})

// Notify all workspace members
await NotificationService.notifyWorkspaceMembers({
  workspace_id: workspaceId,
  type: 'patient_created',
  title: 'Yeni Hasta Eklendi',
  message: `Hasta: ${patientName}`,
  severity: 'info',
  related_patient_id: patientId,
})
```

### 3. Notification Helpers

Use helper functions for common notification types:

```typescript
import {
  notifyPatientEvent,
  notifyMention,
  notifyPatientAssignment,
  notifyAIAlert,
  notifyCriticalValue,
} from '@/lib/notifications/notification-helpers'

// Notify about patient assignment
await notifyPatientAssignment({
  assignedUserId: doctorId,
  assignedByName: 'Dr. Ahmet',
  patientId: patient.id,
  patientName: patient.name,
  workspaceId: workspaceId,
  assignmentType: 'primary',
})

// Notify about mention
await notifyMention({
  mentionedUserId: userId,
  mentionedByName: 'Dr. Ayşe',
  noteId: note.id,
  noteContent: note.content,
  patientId: patient.id,
  workspaceId: workspaceId,
})
```

### 4. Notification Preferences

Users can configure notification preferences:

```tsx
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'

<NotificationPreferences />
```

**Preference Options:**
- Email notifications
- Push notifications
- SMS notifications (optional)
- Mention notifications
- Assignment notifications
- Patient update notifications
- AI alert notifications
- Critical alerts (always on)
- Quiet hours (start/end times)

### 5. Push Notifications (PWA)

Subscribe to push notifications:

```typescript
// Request permission and subscribe
async function subscribeToPush() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.log('Push notifications not supported')
    return
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.log('Permission denied')
    return
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  })

  // Save subscription to server
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  })
}
```

**Send push notification:**

```typescript
import { PushService } from '@/lib/notifications/push-service'

await PushService.sendToUser(userId, {
  title: 'Yeni Bildirim',
  body: 'Hasta güncellendi',
  icon: '/icon-192.png',
  data: {
    action_url: '/dashboard/patients/123',
  },
})
```

### 6. Email Notifications

Send email notifications with templates:

```typescript
import { EmailService } from '@/lib/notifications/email-service'

// Send mention email
await EmailService.sendMentionEmail(
  {
    mentioned_by_name: 'Dr. Ahmet',
    note_content: 'Not içeriği...',
    patient_name: 'Ali Yılmaz',
    action_url: 'https://acil.app/dashboard/patients/123',
  },
  'doctor@example.com',
  'Dr. Ayşe'
)

// Queue email for async sending
await EmailService.queueEmail(
  'doctor@example.com',
  'Dr. Ayşe',
  userId,
  'Hasta Atandı',
  'assignment',
  {
    assigned_by_name: 'Dr. Ahmet',
    patient_name: 'Ali Yılmaz',
    action_url: 'https://acil.app/dashboard/patients/123',
  }
)
```

**Available Email Templates:**
- `mention` - Mention notifications
- `assignment` - Patient assignment
- `critical_alert` - Critical alerts
- `patient_update` - Patient updates
- `ai_alert` - AI alerts
- `workspace_invite` - Workspace invitations

### 7. Database Triggers

Automatic notifications are created for:

1. **Patient Events:**
   - New patient created
   - Patient updated (category, assignment, workflow)
   - Patient discharged

2. **Sticky Notes:**
   - New note added
   - User mentioned in note

3. **Mentions:**
   - User tagged in note

These are handled automatically via database triggers.

---

## ⚙️ Configuration

### Environment Variables

Add to your `.env.local`:

```bash
# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Web Push (PWA)
VAPID_PUBLIC_KEY=xxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxx
VAPID_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxxxxxxxxxxxx
```

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

### Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Add domain and verify DNS records
4. Add `RESEND_API_KEY` to environment variables

---

## 📊 API Endpoints

### Notifications

```
GET    /api/notifications              # Get notifications
POST   /api/notifications              # Create notification
PATCH  /api/notifications              # Mark all as read
DELETE /api/notifications              # Clear all notifications

GET    /api/notifications/[id]         # Get single notification
PATCH  /api/notifications/[id]         # Update notification
DELETE /api/notifications/[id]         # Delete notification

GET    /api/notifications/stats        # Get statistics
```

### Preferences

```
GET    /api/notifications/preferences  # Get user preferences
PUT    /api/notifications/preferences  # Update preferences
PATCH  /api/notifications/preferences  # Partial update
```

### Push Subscriptions

```
POST   /api/push/subscribe             # Subscribe to push
DELETE /api/push/subscribe             # Unsubscribe
```

---

## 🎨 Components

### NotificationCenter

Full-featured notification center with real-time updates:

```tsx
<NotificationCenter userId={user.id} enabled={true} />
```

### NotificationPreferences

User preferences management:

```tsx
<NotificationPreferences />
```

---

## 🔔 Notification Types

- `patient_created` - New patient added
- `patient_updated` - Patient information updated
- `patient_assigned` - Patient assigned to doctor
- `patient_discharged` - Patient discharged
- `mention` - User mentioned in note
- `note_added` - New note added
- `ai_alert` - AI analysis alert
- `ai_analysis_complete` - AI analysis completed
- `critical_value` - Critical value detected
- `task_assigned` - Task assigned
- `task_due` - Task due soon
- `task_completed` - Task completed
- `assignment` - General assignment
- `workspace_invite` - Workspace invitation
- `system` - System notification

---

## 🎯 Severity Levels

- `critical` - Requires immediate attention
- `high` - Important, should be reviewed soon
- `medium` - Normal priority
- `low` - Low priority
- `info` - Informational only

---

## 🧪 Testing

Test notifications:

```typescript
// Test push notification
await PushService.sendTestNotification(userId)

// Test email
await EmailService.sendTemplateEmail(
  'test@example.com',
  'Test User',
  'Test Notification',
  'mention',
  {
    mentioned_by_name: 'Test Doctor',
    note_content: 'This is a test',
    action_url: 'https://acil.app',
  }
)
```

---

## 📝 Usage Examples

### Example 1: Notify on Patient Assignment

```typescript
// In your patient assignment logic
import { notifyPatientAssignment } from '@/lib/notifications/notification-helpers'

await notifyPatientAssignment({
  assignedUserId: doctorId,
  assignedByName: currentUser.name,
  patientId: patient.id,
  patientName: patient.name,
  workspaceId: workspace.id,
  assignmentType: 'primary',
})
```

### Example 2: Notify Workspace on Critical Alert

```typescript
import { notifyWorkspaceAboutPatient } from '@/lib/notifications/notification-helpers'

await notifyWorkspaceAboutPatient({
  workspaceId: workspace.id,
  type: 'critical_value',
  patientId: patient.id,
  patientName: patient.name,
  message: `Kritik değer tespit edildi: ${valueName}`,
  severity: 'critical',
  excludeUserId: currentUser.id, // Don't notify the person who triggered it
})
```

### Example 3: Custom Notification

```typescript
import { NotificationService } from '@/lib/notifications/notification-service'

await NotificationService.createNotification({
  user_id: userId,
  type: 'system',
  title: 'Sistem Bakımı',
  message: 'Sistem bakımı 22:00-02:00 arasında yapılacaktır.',
  severity: 'info',
  action_url: '/system/maintenance',
  expires_at: new Date('2025-11-15T02:00:00Z').toISOString(),
})
```

---

## 🔐 Security

- All notifications are filtered by RLS policies
- Users can only see their own notifications
- Push subscriptions are user-specific
- Email queue is service-role only

---

## 🚦 Status

✅ **Phase 6 Complete**

All features implemented and ready for use:
- Database migrations ✅
- Notification engine ✅
- In-app notifications ✅
- Push notifications (PWA) ✅
- Email notifications ✅
- User preferences ✅
- API endpoints ✅
- Documentation ✅

---

## 📚 Next Steps

1. Run database migration
2. Install dependencies: `npm install`
3. Configure environment variables
4. Test notification system
5. Deploy to production

---

## 💡 Tips

1. **Quiet Hours**: Users can configure quiet hours to avoid non-critical notifications
2. **Critical Alerts**: Always sent regardless of preferences
3. **Email Queue**: Use queue for bulk notifications to avoid rate limits
4. **Push Permissions**: Request permission at appropriate time, not on page load
5. **Testing**: Use test endpoints before going live

---

## 🐛 Troubleshooting

### Push Notifications Not Working

1. Check VAPID keys are configured
2. Verify service worker is registered
3. Check browser supports notifications
4. Ensure HTTPS (required for PWA)

### Email Not Sending

1. Verify Resend API key
2. Check domain verification in Resend
3. Review email queue status
4. Check spam folder

### Notifications Not Showing

1. Check RLS policies
2. Verify user has workspace membership
3. Check notification preferences
4. Review browser console for errors

---

## 📞 Support

For issues or questions:
- Check [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)
- Review [Supabase Docs](https://supabase.com/docs)
- Check [Resend Docs](https://resend.com/docs)
- Review [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

**Built with ❤️ for ACIL Platform**
