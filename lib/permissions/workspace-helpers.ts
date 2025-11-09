// ============================================
// WORKSPACE HELPER FUNCTIONS
// ============================================
// Workspace erişim kontrolü için yardımcı fonksiyonlar

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { WorkspaceRole } from '@/types/multi-tenant.types'

// ============================================
// TYPES
// ============================================

export interface WorkspaceAccessResult {
  hasAccess: boolean
  role?: WorkspaceRole
  workspaceId?: string
  error?: string
}

// ============================================
// WORKSPACE ACCESS CHECK
// ============================================

/**
 * Kullanıcının belirli bir workspace'e erişimi olup olmadığını kontrol eder
 *
 * @param supabase Supabase client instance
 * @param userId Kullanıcı ID
 * @param workspaceId Workspace ID
 * @returns Workspace erişim bilgisi ve rol
 */
export async function requireWorkspaceAccess(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<WorkspaceAccessResult> {
  try {
    const { data: membership, error } = await supabase
      .from('workspace_members')
      .select('role, status, workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !membership) {
      return {
        hasAccess: false,
        error: 'Workspace erişimi yok veya kullanıcı aktif üye değil',
      }
    }

    return {
      hasAccess: true,
      role: membership.role as WorkspaceRole,
      workspaceId: membership.workspace_id,
    }
  } catch (error) {
    return {
      hasAccess: false,
      error: error instanceof Error ? error.message : 'Workspace kontrolü sırasında hata oluştu',
    }
  }
}

/**
 * Hasta'nın kullanıcının workspace'inde olup olmadığını kontrol eder
 *
 * @param supabase Supabase client instance
 * @param userId Kullanıcı ID
 * @param patientId Hasta ID
 * @returns Workspace erişim bilgisi
 */
export async function requirePatientWorkspaceAccess(
  supabase: SupabaseClient,
  userId: string,
  patientId: string
): Promise<WorkspaceAccessResult> {
  try {
    // Önce hastayı al
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('workspace_id, deleted_at')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return {
        hasAccess: false,
        error: 'Hasta bulunamadı',
      }
    }

    if (patient.deleted_at) {
      return {
        hasAccess: false,
        error: 'Hasta silinmiş',
      }
    }

    // Workspace erişimini kontrol et
    return await requireWorkspaceAccess(supabase, userId, patient.workspace_id)
  } catch (error) {
    return {
      hasAccess: false,
      error:
        error instanceof Error ? error.message : 'Hasta workspace kontrolü sırasında hata oluştu',
    }
  }
}

/**
 * Kullanıcının aktif workspace'lerini döndürür
 *
 * @param supabase Supabase client instance
 * @param userId Kullanıcı ID
 * @returns Workspace ID listesi
 */
export async function getUserWorkspaceIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  try {
    const { data: memberships, error } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error || !memberships) {
      return []
    }

    return memberships.map((m) => m.workspace_id)
  } catch (error) {
    console.error('Error fetching user workspaces:', error)
    return []
  }
}

/**
 * Kullanıcının belirli bir workspace'te belirli bir role sahip olup olmadığını kontrol eder
 *
 * @param supabase Supabase client instance
 * @param userId Kullanıcı ID
 * @param workspaceId Workspace ID
 * @param allowedRoles İzin verilen roller
 * @returns Rol kontrolü sonucu
 */
export async function requireWorkspaceRole(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  allowedRoles: WorkspaceRole[]
): Promise<WorkspaceAccessResult> {
  const accessResult = await requireWorkspaceAccess(supabase, userId, workspaceId)

  if (!accessResult.hasAccess || !accessResult.role) {
    return {
      hasAccess: false,
      error: 'Workspace erişimi yok',
    }
  }

  if (!allowedRoles.includes(accessResult.role)) {
    return {
      hasAccess: false,
      role: accessResult.role,
      error: `Bu işlem için ${allowedRoles.join(' veya ')} rolü gerekli`,
    }
  }

  return accessResult
}
