# CLAUDE.md - AI Assistant Guide for ACIL Codebase

> **Last Updated:** 2025-11-15
> **Version:** 1.0.0
> **Purpose:** Comprehensive guide for AI assistants working on the ACIL codebase

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Codebase Structure](#codebase-structure)
4. [Architecture & Design Patterns](#architecture--design-patterns)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Conventions](#api-conventions)
8. [Development Workflow](#development-workflow)
9. [Testing Strategy](#testing-strategy)
10. [Key Libraries & Utilities](#key-libraries--utilities)
11. [Common Patterns](#common-patterns)
12. [Important Guidelines](#important-guidelines)
13. [Migration System](#migration-system)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**ACIL** is an AI-powered patient tracking and management platform designed for emergency medicine specialists and hospital departments.

### Key Features

- **Multi-Tenant Architecture**: Supports multiple organizations (hospitals/clinics) with isolated data
- **Workspace System**: Department/service-based workspaces (Emergency, ICU, Cardiology, etc.)
- **AI-Powered Analysis**: OpenAI GPT-4 for patient assessment and diagnosis recommendations
- **Visual Analysis**: Google Gemini for EKG, skin lesions, and radiological image analysis
- **Real-time Collaboration**: Live updates using Supabase Realtime
- **Role-Based Access Control (RBAC)**: Fine-grained permissions using CASL
- **Patient Chat**: AI assistant for each patient
- **Sticky Notes**: Team communication and collaboration
- **Notifications**: Real-time alerts and reminders
- **AI Monitoring**: Track AI performance and generate alerts
- **Trend Analysis**: Analyze patient data trends over time

### Current Development Phase

- ✅ **Phase 1-7 Completed**: Multi-tenant infrastructure, workspace management, real-time features, notifications, AI monitoring
- 🔄 **Active Development**: Performance optimization, UI/UX improvements, AI features enhancement

---

## 🛠️ Tech Stack

### Core Framework

- **Next.js 16.0.1** (App Router) - React framework with server-side rendering
- **React 19.2.0** - UI library
- **TypeScript 5.x** - Type-safe JavaScript

### Database & Backend

- **Supabase** - PostgreSQL database with real-time subscriptions
  - Authentication (email/password)
  - Row Level Security (RLS) policies
  - Real-time subscriptions
  - Storage (future: file uploads)
- **PostgreSQL** - Relational database

### AI Services

- **OpenAI GPT-4** (`openai` + `ai` SDK) - Text analysis, chat, diagnosis
- **Google Gemini** (`@google/generative-ai`) - Image/vision analysis
- **Vercel AI SDK** (`ai`) - Unified AI interface

### State Management

- **Zustand** - Lightweight state management
- **TanStack Query (React Query)** - Server state management, caching, real-time updates

### UI & Styling

- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Chart.js / Recharts** - Data visualization
- **TipTap** - Rich text editor (for notes with mentions)

### Authorization

- **CASL** - Isomorphic authorization library for role-based permissions

### Testing

- **Vitest** - Unit testing framework
- **Testing Library** - React component testing
- **Playwright** - End-to-end testing
- **Happy DOM** - DOM implementation for tests

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Run linters on staged files

### Monitoring & Analytics

- **Sentry** - Error tracking and performance monitoring
- **Web Vitals** - Performance metrics
- **Pino** - Structured logging

### Additional Services

- **Upstash Redis** - Rate limiting
- **Resend** - Email service
- **Web Push** - Push notifications

---

## 📁 Codebase Structure

```
acil/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, register)
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── patients/             # Patient management pages
│   │   ├── workspace/            # Workspace management
│   │   ├── organizations/        # Organization settings
│   │   ├── settings/             # User settings
│   │   ├── guidelines/           # Clinical guidelines
│   │   └── statistics/           # Analytics & reports
│   ├── setup/                    # Initial setup wizard
│   └── api/                      # API routes
│       ├── patients/             # Patient CRUD operations
│       ├── ai/                   # AI analysis endpoints
│       │   ├── analyze/          # Initial AI analysis
│       │   ├── chat/             # Patient chat
│       │   ├── vision/           # Image analysis
│       │   ├── compare/          # Test comparison
│       │   ├── trends/           # Trend analysis
│       │   ├── monitoring/       # AI performance monitoring
│       │   └── alerts/           # AI-generated alerts
│       ├── workspaces/           # Workspace management
│       ├── organizations/        # Organization management
│       ├── invitations/          # Workspace invitations
│       ├── sticky-notes/         # Team notes
│       ├── notifications/        # Notification system
│       ├── assignments/          # Patient assignments
│       ├── categories/           # Patient categories
│       ├── statistics/           # Analytics
│       └── debug/                # Debug endpoints
│
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── patients/                 # Patient-related components
│   │   ├── display/              # Display components
│   │   ├── forms/                # Form components
│   │   └── tabs/                 # Tab components
│   ├── chat/                     # Chat components
│   ├── dashboard/                # Dashboard components
│   ├── workspace/                # Workspace components
│   ├── organizations/            # Organization components
│   ├── sticky-notes/             # Sticky notes components
│   ├── notifications/            # Notification components
│   ├── ai-monitoring/            # AI monitoring UI
│   ├── charts/                   # Chart components
│   ├── realtime/                 # Real-time indicators
│   ├── providers/                # Context providers
│   └── dynamic/                  # Dynamic/lazy loaded components
│
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── ai/                       # AI service wrappers
│   │   ├── openai.ts             # OpenAI integration
│   │   ├── gemini.ts             # Gemini integration
│   │   ├── alert-service.ts      # AI alert generation
│   │   ├── comparison-service.ts # Test comparison
│   │   └── trend-analysis.ts     # Trend analysis
│   ├── permissions/              # Authorization logic
│   │   ├── ability.ts            # CASL ability definitions
│   │   ├── middleware.ts         # Permission middleware
│   │   ├── index.ts              # Permission helpers
│   │   └── workspace-helpers.ts  # Workspace permission utils
│   ├── hooks/                    # Custom React hooks
│   │   ├── usePatients.ts        # Patient data fetching
│   │   ├── useRealtimePatients.ts
│   │   ├── useRealtimeActivity.ts
│   │   ├── useRealtimeNotifications.ts
│   │   ├── useStickyNotes.ts
│   │   └── useRealtimeStickyNotes.ts
│   ├── patients/                 # Patient-specific logic
│   │   └── context-builder.ts    # Build AI context
│   ├── realtime/                 # Real-time utilities
│   │   ├── realtime-client.ts    # Supabase realtime wrapper
│   │   ├── optimistic-updates.ts # Optimistic UI updates
│   │   └── connection-manager.ts # Connection handling
│   ├── notifications/            # Notification services
│   │   ├── notification-service.ts
│   │   ├── push-service.ts
│   │   └── email-service.ts
│   ├── middleware/               # API middleware
│   │   ├── rate-limit.ts         # Rate limiting
│   │   └── api-cache.ts          # Response caching
│   ├── monitoring/               # Performance monitoring
│   ├── analytics/                # Analytics utilities
│   ├── validation/               # Zod schemas
│   │   └── schemas.ts
│   ├── config/                   # Configuration
│   │   └── env.ts                # Environment variables
│   ├── utils.ts                  # General utilities
│   └── logger.ts                 # Pino logger
│
├── types/                        # TypeScript type definitions
│   ├── database.types.ts         # Supabase generated types
│   ├── patient.types.ts          # Patient types
│   ├── multi-tenant.types.ts     # Workspace/org types
│   ├── notification.types.ts     # Notification types
│   ├── ai-monitoring.types.ts    # AI monitoring types
│   ├── sticky-notes.types.ts     # Sticky notes types
│   ├── invitation.types.ts       # Invitation types
│   ├── realtime.types.ts         # Real-time types
│   └── index.ts                  # Type exports
│
├── contexts/                     # React contexts
│
├── tests/                        # Test files
│   └── (unit tests organized by feature)
│
├── e2e/                          # Playwright E2E tests
│
├── scripts/                      # Build/migration scripts
│
├── docs/                         # Additional documentation
│
├── public/                       # Static assets
│
├── .husky/                       # Git hooks
│
├── *.sql                         # Database migration files
│   ├── supabase-schema.sql                           # Initial schema
│   ├── supabase-migration-phase1-multi-tenant.sql    # Multi-tenant
│   ├── supabase-migration-phase2-invitations.sql     # Invitations
│   ├── supabase-migration-phase3-realtime.sql        # Real-time
│   ├── supabase-migration-phase4-sticky-notes.sql    # Sticky notes
│   ├── supabase-migration-phase5-advanced-patient-mgmt.sql
│   ├── supabase-migration-phase6-notifications.sql   # Notifications
│   └── supabase-migration-phase7-ai-monitoring.sql   # AI monitoring
│
├── middleware.ts                 # Next.js middleware (auth)
├── instrumentation.ts            # Sentry instrumentation
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind config
├── vitest.config.ts              # Vitest config
├── playwright.config.ts          # Playwright config
└── .env.example                  # Environment variables template
```

---

## 🏗️ Architecture & Design Patterns

### 1. Multi-Tenant Architecture

The application uses a **three-tier multi-tenant model**:

```
Organization (Hospital/Clinic)
  └── Workspaces (Departments/Services)
      └── Patients (Isolated per workspace)
```

**Key Tables:**

- `organizations` - Top-level tenant (hospital, clinic)
- `workspaces` - Department/service within organization
- `workspace_members` - Users with roles in workspaces
- `patients` - Scoped to workspace

**Data Isolation:**

- Row Level Security (RLS) enforces workspace-level isolation
- All queries include `workspace_id` filter
- Users can belong to multiple workspaces with different roles

### 2. Permission System (CASL)

Uses **CASL** for isomorphic (client + server) authorization:

```typescript
// Define ability for user
const ability = defineAbilityFor({
  role: 'doctor',
  customPermissions: [],
})

// Check permissions
if (ability.can('create', 'Patient')) {
  // Allow action
}
```

**Roles Hierarchy** (from highest to lowest):

1. `owner` - Full workspace control
2. `admin` - User management, settings
3. `senior_doctor` - All patient operations + delete
4. `doctor` - Create, read, update patients
5. `resident` - Create, read, update (limited)
6. `nurse` - Read, create notes
7. `observer` - Read-only

**Permissions:**

- `patients.{create,read,update,delete,export}`
- `ai.{analyze,chat}`
- `notes.{create,read,update,delete}`
- `workspace.{manage,settings}`
- `users.{invite,remove}`
- `analytics.view`
- `audit.view`

**Files:**

- `lib/permissions/ability.ts` - CASL definitions
- `lib/permissions/middleware.ts` - API permission checks
- `components/providers/AbilityProvider.tsx` - Client-side context

### 3. Real-time Subscriptions

Uses **Supabase Realtime** for live updates:

```typescript
// Hook pattern
const { data, isLoading } = useRealtimePatients(workspaceId)

// Manual subscription
const subscription = supabase
  .channel('patients')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'patients',
    },
    handleChange
  )
  .subscribe()
```

**Real-time Features:**

- Patient list updates
- Sticky notes updates
- Activity feed
- Notifications
- User presence (future)

**Files:**

- `lib/realtime/realtime-client.ts` - Wrapper
- `lib/hooks/useRealtime*.ts` - Real-time hooks

### 4. Optimistic Updates

For better UX, UI updates immediately before server confirmation:

```typescript
// Example: Delete patient
onDelete: (patientId) => {
  // 1. Update UI immediately
  setPatients((prev) => prev.filter((p) => p.id !== patientId))

  // 2. Call API
  deletePatient(patientId).catch(() => {
    // 3. Rollback on error
    setPatients((prev) => [...prev, deletedPatient])
  })
}
```

**Files:**

- `lib/realtime/optimistic-updates.ts`

### 5. Server-Side Rendering (SSR)

Next.js App Router with Server Components:

- **Default**: Server Components (better performance)
- **Client Components**: Use `'use client'` directive when needed
  - Interactive components (buttons, forms)
  - Hooks (useState, useEffect)
  - Browser APIs

**Supabase Client Usage:**

- Server: `import { createClient } from '@/lib/supabase/server'`
- Client: `import { createClient } from '@/lib/supabase/client'`

### 6. API Route Structure

All API routes follow consistent patterns:

```typescript
// GET /api/patients?workspace_id=xxx
export async function GET(request: NextRequest) {
  // 1. Create Supabase client
  const supabase = await createClient()

  // 2. Authenticate user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 3. Validate workspace access
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // 4. Check permissions (if needed)
  const ability = defineAbilityFor({ role: membership.role })
  if (!ability.can('read', 'Patient')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 5. Fetch data (RLS enforces isolation)
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('workspace_id', workspaceId)

  // 6. Return response
  return NextResponse.json(data)
}
```

**Key Principles:**

- Always authenticate first
- Always check workspace membership
- Rely on RLS for data isolation
- Use consistent error responses
- Log errors with context

---

## 🗄️ Database Schema

### Core Tables

#### Organizations

```sql
organizations (
  id UUID PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE,
  type TEXT, -- hospital, clinic, health_center, private_practice
  subscription_tier TEXT, -- free, pro, enterprise
  subscription_status TEXT, -- active, inactive, trial, cancelled
  max_users INTEGER,
  max_workspaces INTEGER,
  max_patients_per_workspace INTEGER,
  settings JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### Workspaces

```sql
workspaces (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  name TEXT,
  slug TEXT,
  type TEXT, -- emergency, icu, cardiology, surgery, etc.
  color TEXT,
  icon TEXT,
  settings JSONB,
  is_active BOOLEAN,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### Workspace Members

```sql
workspace_members (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces,
  user_id UUID REFERENCES auth.users,
  role TEXT, -- owner, admin, senior_doctor, doctor, resident, nurse, observer
  permissions JSONB, -- custom permissions
  status TEXT, -- active, inactive, pending
  invited_by UUID,
  joined_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ
)
```

#### Profiles

```sql
profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  full_name TEXT,
  specialty TEXT,
  institution TEXT,
  subscription_tier TEXT,
  patient_limit INTEGER,
  current_organization_id UUID,
  notification_preferences JSONB,
  created_at TIMESTAMPTZ
)
```

#### Patients

```sql
patients (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces,
  organization_id UUID REFERENCES organizations,
  user_id UUID REFERENCES auth.users, -- creator
  assigned_to UUID REFERENCES auth.users,
  category_id UUID REFERENCES patient_categories,
  name TEXT,
  age INTEGER,
  gender TEXT,
  workflow_state TEXT, -- admission, assessment, diagnosis, treatment, etc.
  admission_date TIMESTAMPTZ,
  discharge_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ -- soft delete
)
```

#### Patient Data

```sql
patient_data (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  data_type TEXT, -- demographics, anamnesis, medications, vital_signs, history
  content JSONB,
  created_at TIMESTAMPTZ
)
```

#### AI Analyses

```sql
ai_analyses (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  analysis_type TEXT, -- initial, updated
  input_data JSONB,
  ai_response JSONB,
  references JSONB,
  created_at TIMESTAMPTZ
)
```

#### Chat Messages

```sql
chat_messages (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  user_id UUID REFERENCES auth.users,
  role TEXT, -- user, assistant
  content TEXT,
  created_at TIMESTAMPTZ
)
```

#### Sticky Notes

```sql
sticky_notes (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces,
  patient_id UUID REFERENCES patients,
  created_by UUID REFERENCES auth.users,
  content TEXT,
  position JSONB, -- { x, y }
  color TEXT,
  mentions JSONB, -- [{ user_id, full_name }]
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### Notifications

```sql
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  workspace_id UUID REFERENCES workspaces,
  type TEXT, -- mention, assignment, reminder, ai_alert, etc.
  title TEXT,
  message TEXT,
  link TEXT,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

#### AI Monitoring

```sql
ai_usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  workspace_id UUID,
  patient_id UUID,
  analysis_id UUID,
  model TEXT, -- gpt-4, gemini-1.5-pro
  operation TEXT, -- analyze, chat, vision, compare
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_cost NUMERIC,
  response_time_ms INTEGER,
  success BOOLEAN,
  error TEXT,
  created_at TIMESTAMPTZ
)

ai_comparisons (
  id UUID PRIMARY KEY,
  patient_id UUID,
  user_id UUID,
  workspace_id UUID,
  analysis_type TEXT,
  comparison_data JSONB,
  insights JSONB,
  created_at TIMESTAMPTZ
)

ai_alerts (
  id UUID PRIMARY KEY,
  patient_id UUID,
  workspace_id UUID,
  alert_type TEXT, -- critical_value, trend_anomaly, etc.
  severity TEXT, -- low, medium, high, critical
  title TEXT,
  message TEXT,
  metadata JSONB,
  is_resolved BOOLEAN,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

### Indexes

All tables have indexes on:

- Foreign keys
- `workspace_id` (for multi-tenant queries)
- `created_at` (for sorting)
- Soft delete: `deleted_at IS NULL`

### Row Level Security (RLS)

**All tables have RLS enabled** with policies like:

```sql
-- Example: patients table
CREATE POLICY "Users can view patients in their workspace"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = patients.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.status = 'active'
    )
  );

CREATE POLICY "Users can insert patients if they have permission"
  ON patients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = patients.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.status = 'active'
        AND workspace_members.role IN ('owner', 'admin', 'senior_doctor', 'doctor', 'resident')
    )
  );
```

**RLS Files:**

- `supabase-rls-policies.sql`
- `supabase-rls-complete-policies.sql`
- Various `*-rls-fix.sql` files

---

## 🔐 Authentication & Authorization

### Authentication (Supabase Auth)

**Strategy:** Email/Password (OAuth providers can be added)

**Flow:**

1. User registers: `/register` → Supabase Auth → Auto-creates `profiles` row
2. User logs in: `/login` → Supabase sets session cookie
3. Middleware checks auth on all `/dashboard/*` routes
4. Redirect to login if unauthenticated

**Files:**

- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `middleware.ts` - Route protection

### Authorization (Multi-Level)

**Level 1: Route Protection (Middleware)**

```typescript
// middleware.ts
if (!user && pathname.startsWith('/dashboard')) {
  return NextResponse.redirect('/login')
}
```

**Level 2: Workspace Membership**

```typescript
// All API routes
const membership = await supabase
  .from('workspace_members')
  .select('role')
  .eq('workspace_id', workspaceId)
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single()

if (!membership) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Level 3: CASL Permissions**

```typescript
const ability = defineAbilityFor({
  role: membership.role,
  customPermissions: membership.permissions,
})

if (!ability.can('delete', 'Patient')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Level 4: Row Level Security (Database)**

```sql
-- Enforced at database level
-- No way to bypass, even with direct DB access
```

### Frontend Authorization

```tsx
import { useAbility } from '@/components/providers/AbilityProvider'

function PatientActions({ patient }) {
  const ability = useAbility()

  return (
    <>
      {ability.can('update', 'Patient') && <button onClick={handleEdit}>Edit</button>}
      {ability.can('delete', 'Patient') && <button onClick={handleDelete}>Delete</button>}
    </>
  )
}
```

---

## 🔌 API Conventions

### Request/Response Format

**Success Response:**

```json
{
  "id": "uuid",
  "name": "Patient Name",
  "age": 45,
  ...
}
```

**Error Response:**

```json
{
  "error": "Error message"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Common Query Parameters

- `workspace_id` - **Required** for most endpoints
- `patient_id` - For patient-specific operations
- `page`, `limit` - For pagination (future)

### API Route Patterns

```
GET    /api/patients?workspace_id=xxx          # List
POST   /api/patients                           # Create
GET    /api/patients/[id]                      # Read
PATCH  /api/patients/[id]                      # Update
DELETE /api/patients/[id]                      # Delete

POST   /api/ai/analyze                         # AI analysis
POST   /api/ai/chat                            # AI chat
POST   /api/ai/vision                          # Image analysis
POST   /api/ai/compare                         # Test comparison
GET    /api/ai/trends?patient_id=xxx           # Trend analysis

GET    /api/workspaces                         # List workspaces
POST   /api/workspaces                         # Create workspace
GET    /api/workspaces/[id]/members            # List members
POST   /api/workspaces/[id]/members            # Add member
```

### Rate Limiting

Uses Upstash Redis for rate limiting:

```typescript
// Applied to AI endpoints
const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
})

const { success } = await rateLimit.limit(user.id)
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}
```

**Files:**

- `lib/middleware/rate-limit.ts`

---

## ⚙️ Development Workflow

### Environment Setup

1. **Clone repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up Supabase project** (see README.md)
4. **Create `.env.local`:**
   ```bash
   cp .env.example .env.local
   # Fill in values
   ```
5. **Run migrations** in Supabase SQL Editor:
   - `supabase-schema.sql`
   - `supabase-migration-phase1-multi-tenant-FIXED.sql`
   - `supabase-migration-phase2-invitations.sql`
   - ... (through phase 7)
6. **Start dev server:**
   ```bash
   npm run dev
   ```

### Development Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # ESLint check
npm run lint -- --fix    # Auto-fix lint issues

# Testing
npm run test             # Run unit tests (Vitest)
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report
npm run test:run         # Run tests once (CI mode)
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:debug   # Playwright debug mode

# Utilities
npm run verify:migration # Verify Phase 1 migration
```

### Git Workflow

**Husky Git Hooks:**

- Pre-commit: Runs `lint-staged` (ESLint + Prettier on staged files)

**Branch Strategy:**

- `main` - Production branch
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- AI branches: `claude/*` (for Claude Code)

**Commit Messages:**

```
feat: Add AI trend analysis for patient vitals
fix: Resolve RLS policy for workspace invitations
refactor: Simplify patient context builder
docs: Update CLAUDE.md with API conventions
test: Add unit tests for permission middleware
```

### Code Review Checklist

- [ ] TypeScript types are properly defined
- [ ] Authentication/authorization checks in place
- [ ] RLS policies cover the new table/column
- [ ] Error handling and logging implemented
- [ ] Tests written (unit or E2E)
- [ ] No hardcoded values (use env vars)
- [ ] No console.log (use logger)
- [ ] No exposed secrets
- [ ] Performance considerations (N+1 queries, large payloads)
- [ ] Accessibility (a11y) considered

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

**Location:** `lib/**/__tests__/*.test.ts`, `components/**/__tests__/*.test.tsx`

**Example:**

```typescript
// lib/permissions/__tests__/ability.test.ts
import { describe, it, expect } from 'vitest'
import { defineAbilityFor, canPerformAction } from '../ability'

describe('Permission System', () => {
  it('should allow doctor to create patients', () => {
    const ability = defineAbilityFor({ role: 'doctor' })
    expect(ability.can('create', 'Patient')).toBe(true)
  })

  it('should not allow nurse to delete patients', () => {
    const ability = defineAbilityFor({ role: 'nurse' })
    expect(ability.can('delete', 'Patient')).toBe(false)
  })
})
```

**Run tests:**

```bash
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # Coverage report
```

### Component Tests (Testing Library)

```tsx
// components/__tests__/PatientCard.test.tsx
import { render, screen } from '@testing-library/react'
import { PatientCard } from '../PatientCard'

describe('PatientCard', () => {
  it('renders patient name', () => {
    render(<PatientCard patient={{ name: 'John Doe', age: 45 }} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

### E2E Tests (Playwright)

**Location:** `e2e/*.spec.ts`

**Example:**

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard/patients')
})
```

**Run E2E tests:**

```bash
npm run test:e2e          # Headless
npm run test:e2e:headed   # With browser
npm run test:e2e:ui       # Playwright UI
npm run test:e2e:debug    # Debug mode
```

### Test Database

Use `.env.test` for test database:

```bash
cp .env.test.example .env.test
# Configure test Supabase project
```

---

## 📚 Key Libraries & Utilities

### Supabase Client

**Browser Client:**

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.from('patients').select('*')
```

**Server Client:**

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient() // async!
const { data, error } = await supabase.from('patients').select('*')
```

### TanStack Query (React Query)

**Configuration:** `components/providers/QueryProvider.tsx`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['patients', workspaceId],
  queryFn: () => fetchPatients(workspaceId),
})

// Mutate data
const mutation = useMutation({
  mutationFn: createPatient,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['patients'] })
  },
})
```

**Query Keys:** Centralized in `lib/queries/query-keys.ts`

```typescript
export const queryKeys = {
  patients: (workspaceId: string) => ['patients', workspaceId],
  patient: (patientId: string) => ['patient', patientId],
  // ...
}
```

### Zustand (State Management)

```typescript
// Example: Workspace store
import { create } from 'zustand'

interface WorkspaceStore {
  currentWorkspaceId: string | null
  setCurrentWorkspace: (id: string) => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  currentWorkspaceId: null,
  setCurrentWorkspace: (id) => set({ currentWorkspaceId: id }),
}))
```

### Logger (Pino)

```typescript
import { logger } from '@/lib/logger'

// Log levels: debug, info, warn, error
logger.info({ userId, action: 'login' }, 'User logged in')
logger.error({ error, patientId }, 'Failed to fetch patient')
```

**Configuration:** `lib/logger.ts`

### Validation (Zod)

```typescript
import { z } from 'zod'

const patientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

// Validate
const result = patientSchema.safeParse(data)
if (!result.success) {
  return { error: result.error.flatten() }
}
```

**Schemas:** `lib/validation/schemas.ts`

### AI Services

**OpenAI:**

```typescript
import { analyzePatient } from '@/lib/ai/openai'

const analysis = await analyzePatient({
  patientData,
  context,
  previousAnalyses,
})
```

**Gemini (Vision):**

```typescript
import { analyzeImage } from '@/lib/ai/gemini'

const result = await analyzeImage({
  imageUrl,
  analysisType: 'ekg',
  context,
})
```

**Vercel AI SDK (Streaming Chat):**

```typescript
import { OpenAIStream, StreamingTextResponse } from 'ai'

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages,
  stream: true,
})

const stream = OpenAIStream(response)
return new StreamingTextResponse(stream)
```

---

## 🎨 Common Patterns

### 1. Fetching Data with Real-time Updates

```typescript
'use client'
import { useRealtimePatients } from '@/lib/hooks/useRealtimePatients'

function PatientList({ workspaceId }) {
  const { data: patients, isLoading } = useRealtimePatients(workspaceId)

  if (isLoading) return <Spinner />

  return (
    <ul>
      {patients.map(patient => (
        <li key={patient.id}>{patient.name}</li>
      ))}
    </ul>
  )
}
```

### 2. Protected API Route

```typescript
// app/api/patients/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // 1. Auth check
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get workspace_id
  const workspaceId = request.nextUrl.searchParams.get('workspace_id')
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
  }

  // 3. Check workspace membership
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Fetch data (RLS applies)
  const { data: patients, error: fetchError } = await supabase
    .from('patients')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (fetchError) {
    logger.error({ error: fetchError }, 'Failed to fetch patients')
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }

  return NextResponse.json(patients)
}
```

### 3. Creating a New Table

**Steps:**

1. **Create migration SQL file:**

   ```sql
   -- supabase-migration-new-feature.sql
   CREATE TABLE my_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );

   -- Indexes
   CREATE INDEX idx_my_table_workspace ON my_table(workspace_id);

   -- RLS
   ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view in their workspace"
     ON my_table FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM workspace_members
         WHERE workspace_members.workspace_id = my_table.workspace_id
           AND workspace_members.user_id = auth.uid()
           AND workspace_members.status = 'active'
       )
     );

   -- Add more policies (INSERT, UPDATE, DELETE)
   ```

2. **Run migration in Supabase SQL Editor**

3. **Generate TypeScript types:**
   - Supabase Dashboard → Project Settings → API → Generate Types
   - Update `types/database.types.ts`

4. **Create API routes:**
   - `app/api/my-resource/route.ts`

5. **Create React hooks:**
   - `lib/hooks/useMyResource.ts`

6. **Update permissions** (if needed):
   - `lib/permissions/ability.ts`

### 4. AI Analysis Pattern

```typescript
// app/api/ai/analyze/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { patientId, workspaceId } = await request.json()

  // 1. Check permissions
  const membership = await checkWorkspaceMembership(supabase, user.id, workspaceId)
  if (!membership) return forbidden()

  // 2. Rate limiting
  const { success } = await rateLimit.limit(user.id)
  if (!success) return tooManyRequests()

  // 3. Fetch patient data
  const patient = await fetchPatient(supabase, patientId)

  // 4. Build AI context
  const context = await buildPatientContext(patient)

  // 5. Call AI service
  const analysis = await analyzePatient({ context })

  // 6. Save result
  const { data: savedAnalysis } = await supabase
    .from('ai_analyses')
    .insert({
      patient_id: patientId,
      analysis_type: 'initial',
      input_data: context,
      ai_response: analysis,
    })
    .select()
    .single()

  // 7. Log usage
  await logAIUsage({
    userId: user.id,
    workspaceId,
    patientId,
    operation: 'analyze',
    model: 'gpt-4',
    tokens: analysis.usage?.total_tokens,
  })

  return NextResponse.json(savedAnalysis)
}
```

---

## ⚠️ Important Guidelines

### 1. Security

- **NEVER** expose API keys in client code
- **ALWAYS** validate user input (Zod schemas)
- **ALWAYS** check workspace membership in API routes
- **NEVER** trust `workspace_id` from client - verify it
- **ALWAYS** use RLS policies (defense in depth)
- **NEVER** disable RLS in production
- **ALWAYS** sanitize user input for SQL/XSS
- **NEVER** log sensitive data (passwords, API keys)

### 2. Performance

- **AVOID** N+1 queries - use Supabase `.select()` joins

  ```typescript
  // BAD: N+1 query
  const patients = await supabase.from('patients').select('*')
  for (const patient of patients) {
    const category = await supabase.from('categories').select('*').eq('id', patient.category_id)
  }

  // GOOD: Single query with join
  const patients = await supabase.from('patients').select('*, category:patient_categories(*)')
  ```

- **USE** React Query caching
- **USE** optimistic updates for better UX
- **AVOID** unnecessary re-renders (React.memo, useMemo, useCallback)
- **LIMIT** API response size (pagination, field selection)
- **USE** Supabase indexes for frequently queried columns

### 3. TypeScript

- **ALWAYS** define types (avoid `any`)
- **USE** generated Supabase types from `types/database.types.ts`
- **CREATE** custom types in `types/*.types.ts`
- **EXPORT** types from `types/index.ts`
- **USE** strict TypeScript (`strict: true` in tsconfig)

### 4. Error Handling

- **ALWAYS** handle errors gracefully
- **LOG** errors with context (logger)
- **SHOW** user-friendly error messages
- **NEVER** expose internal error details to client
- **USE** Sentry for production error tracking

```typescript
try {
  const result = await riskyOperation()
  return NextResponse.json(result)
} catch (error) {
  logger.error(
    {
      error,
      userId: user.id,
      operation: 'riskyOperation',
    },
    'Operation failed'
  )

  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
```

### 5. Code Organization

- **COLOCATE** related files (components, hooks, utils)
- **FOLLOW** Next.js conventions (App Router)
- **SEPARATE** concerns (logic vs. presentation)
- **REUSE** components (DRY principle)
- **DOCUMENT** complex logic with comments
- **NAME** files consistently (kebab-case, PascalCase for components)

### 6. Real-time Subscriptions

- **CLEANUP** subscriptions on unmount

  ```typescript
  useEffect(() => {
    const subscription = supabase
      .channel('patients')
      .on('postgres_changes', ...)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])
  ```

- **AVOID** memory leaks
- **THROTTLE** high-frequency updates
- **USE** custom hooks for reusability

### 7. Environment Variables

- **PREFIX** client vars with `NEXT_PUBLIC_`
- **NEVER** commit `.env.local`
- **KEEP** `.env.example` updated
- **VALIDATE** env vars on startup (`lib/config/env.ts`)

### 8. Accessibility

- **USE** semantic HTML
- **ADD** ARIA labels where needed
- **ENSURE** keyboard navigation works
- **TEST** with screen readers
- **MAINTAIN** color contrast (WCAG AA)

---

## 🔄 Migration System

### Migration Phases

The database schema has evolved through 7 phases:

1. **Phase 1**: Multi-tenant infrastructure (organizations, workspaces, workspace_members)
2. **Phase 2**: Invitation system (workspace_invitations)
3. **Phase 3**: Real-time features (activity logs, presence)
4. **Phase 4**: Sticky notes (collaboration)
5. **Phase 5**: Advanced patient management (assignments, categories)
6. **Phase 6**: Notification system (push, email, in-app)
7. **Phase 7**: AI monitoring (usage logs, comparisons, alerts, trends)

### Migration Files

```
supabase-schema.sql                              # Initial schema
supabase-migration-phase1-multi-tenant-FIXED.sql # Phase 1 (use FIXED version)
supabase-migration-phase2-invitations.sql
supabase-migration-phase3-realtime.sql
supabase-migration-phase4-sticky-notes.sql
supabase-migration-phase5-advanced-patient-mgmt.sql
supabase-migration-phase6-notifications.sql
supabase-migration-phase7-ai-monitoring.sql
```

### Running Migrations

**For new Supabase projects:**

1. Open Supabase SQL Editor
2. Run migrations **in order**:
   ```
   1. supabase-schema.sql
   2. supabase-migration-phase1-multi-tenant-FIXED.sql
   3. supabase-migration-phase2-invitations.sql
   4. supabase-migration-phase3-realtime.sql
   5. supabase-migration-phase4-sticky-notes.sql
   6. supabase-migration-phase5-advanced-patient-mgmt.sql
   7. supabase-migration-phase6-notifications.sql
   8. supabase-migration-phase7-ai-monitoring.sql
   ```
3. Verify success (no errors)

**For existing projects:**

- Only run migrations you haven't applied yet
- Check current state first: `supabase-check-current-state.sql`

### Migration Guidelines

When creating new migrations:

1. **Name consistently:** `supabase-migration-phaseX-feature-name.sql`
2. **Include:**
   - Table creation
   - Indexes
   - RLS policies
   - Default data (if needed)
   - Triggers (if needed)
3. **Test thoroughly** on dev Supabase project first
4. **Document** in migration guide (e.g., `MIGRATION_GUIDE_PHASEX.md`)
5. **Update** `types/database.types.ts` after migration
6. **Commit** migration file to repo

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Invalid Supabase URL" or "Environment variable validation failed"

**Cause:** `.env.local` missing or incorrect

**Solution:**

```bash
# Check .env.local exists in project root
ls -la .env.local

# Verify values
cat .env.local

# Restart dev server
npm run dev
```

#### 2. "RLS Policy Violation" or "permission denied"

**Cause:** Missing or incorrect RLS policies

**Solution:**

- Re-run RLS migration: `supabase-rls-complete-policies.sql`
- Check user is member of workspace
- Verify `workspace_id` in query matches user's workspace

#### 3. "You are not a member of this workspace"

**Cause:** User not added to workspace

**Solution:**

```sql
-- Check workspace_members
SELECT * FROM workspace_members WHERE user_id = 'user-uuid';

-- Add user to workspace
INSERT INTO workspace_members (workspace_id, user_id, role, status)
VALUES ('workspace-uuid', 'user-uuid', 'doctor', 'active');
```

#### 4. Real-time Updates Not Working

**Cause:** Supabase Realtime not enabled or subscription issue

**Solution:**

- Check Supabase Dashboard → Database → Replication → Enable for tables
- Verify subscription in browser console
- Check RLS policies allow SELECT

#### 5. AI API Errors (OpenAI, Gemini)

**Cause:** Invalid API keys or rate limits

**Solution:**

- Verify API keys in `.env.local`
- Check API key has not expired
- Check OpenAI billing/quota
- Check error logs: `logger.error(...)`

#### 6. "Failed to fetch" or CORS Errors

**Cause:** Supabase URL mismatch or incorrect CORS settings

**Solution:**

- Verify `NEXT_PUBLIC_SUPABASE_URL` matches Supabase project URL
- Check Supabase Dashboard → Settings → API → URL
- Clear browser cache/cookies

#### 7. TypeScript Errors After Schema Change

**Cause:** Types out of sync with database

**Solution:**

1. Supabase Dashboard → Project Settings → API → Generate Types
2. Copy types to `types/database.types.ts`
3. Restart TypeScript server in IDE

#### 8. Tests Failing

**Cause:** Environment or mock issues

**Solution:**

- Check `.env.test` configured
- Verify mocks in `vitest.setup.ts`
- Clear test cache: `npx vitest run --clearCache`

### Debugging Tips

**Browser DevTools:**

- Network tab → Check API responses
- Console → Check errors
- Application → Check cookies (Supabase session)

**Server Logs:**

```bash
# Dev server logs
npm run dev

# Check logger output (Pino)
# Look for structured JSON logs
```

**Supabase Dashboard:**

- Database → Table Editor → Inspect data
- Authentication → Users → Check user state
- Logs → Check database logs

**React Query DevTools:**

- Install browser extension
- View query cache, mutations, errors

---

## 📖 Additional Resources

### Documentation Files

- `README.md` - Setup guide
- `DEVELOPMENT_PLAN.md` - Project roadmap
- `PHASE[X]_README.md` - Phase-specific documentation
- `MIGRATION_GUIDE_PHASE[X].md` - Migration instructions
- `*.md` - Various feature-specific docs

### Key Concepts to Understand

1. **Next.js App Router** - Server/Client Components, Route Handlers
2. **Supabase** - PostgreSQL, RLS, Auth, Realtime
3. **CASL** - Isomorphic authorization
4. **TanStack Query** - Server state management
5. **TypeScript** - Type safety, generics
6. **Multi-tenancy** - Data isolation, workspace scoping

### External Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [CASL Docs](https://casl.js.org/v6/en/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 🎯 Quick Reference

### File Extensions

- `.ts` - TypeScript
- `.tsx` - TypeScript + JSX (React)
- `.sql` - SQL migration
- `.md` - Markdown documentation

### Path Aliases

- `@/*` - Resolves to project root
- Example: `@/lib/supabase/client` → `/lib/supabase/client.ts`

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
GEMINI_API_KEY

# Optional
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
```

### Common Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Check code quality
npm run test             # Run tests
npm run test:e2e         # E2E tests
```

### Important Files

- `middleware.ts` - Auth middleware
- `app/layout.tsx` - Root layout
- `lib/supabase/server.ts` - Server Supabase client
- `lib/permissions/ability.ts` - CASL permissions
- `types/database.types.ts` - Database types

---

## 🤝 Contributing Guidelines for AI Assistants

When working on this codebase:

1. **Read this document first** - Understand architecture and conventions
2. **Follow existing patterns** - Be consistent with codebase style
3. **Test changes** - Write tests, run existing tests
4. **Update types** - Keep TypeScript types in sync
5. **Document changes** - Update relevant .md files
6. **Check security** - Verify auth/authz, RLS policies
7. **Log appropriately** - Use structured logging (Pino)
8. **Handle errors** - Graceful error handling, user-friendly messages
9. **Optimize performance** - Avoid N+1 queries, use caching
10. **Ask questions** - If uncertain, ask for clarification

---

**Last Updated:** 2025-11-15
**Maintainer:** ACIL Team
**For Questions:** Refer to project documentation or ask the development team
