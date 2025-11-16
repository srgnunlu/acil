/**
 * Protocol Library Type Definitions
 * Phase 10: Protocol Library & Clinical Tools
 */

// =====================================================
// PROTOCOL CATEGORY TYPES
// =====================================================

export interface ProtocolCategory {
  id: string
  workspace_id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string | null
  sort_order: number
  is_system: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ProtocolCategoryCreate = Omit<
  ProtocolCategory,
  'id' | 'created_at' | 'updated_at' | 'deleted_at'
>

export type ProtocolCategoryUpdate = Partial<
  Omit<ProtocolCategory, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'is_system'>
>

// =====================================================
// PROTOCOL TYPES
// =====================================================

export type ProtocolStatus = 'draft' | 'published' | 'archived'
export type ProtocolContentType = 'markdown' | 'html'

export interface Protocol {
  id: string
  workspace_id: string
  category_id: string | null
  title: string
  slug: string
  description: string | null
  content: string
  content_type: ProtocolContentType
  tags: string[]
  keywords: string[]
  version: string
  version_number: number
  parent_version_id: string | null
  status: ProtocolStatus
  is_active: boolean
  created_by: string | null
  updated_by: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProtocolWithCategory extends Protocol {
  category?: ProtocolCategory
}

export interface ProtocolWithStats extends Protocol {
  view_count: number
  favorite_count: number
  is_favorited: boolean
}

export type ProtocolCreate = Omit<
  Protocol,
  | 'id'
  | 'version_number'
  | 'published_at'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'
  | 'updated_by'
>

export type ProtocolUpdate = Partial<
  Omit<
    Protocol,
    | 'id'
    | 'workspace_id'
    | 'created_by'
    | 'created_at'
    | 'updated_at'
    | 'deleted_at'
  >
>

// =====================================================
// PROTOCOL ATTACHMENT TYPES
// =====================================================

export type ProtocolFileType = 'pdf' | 'image' | 'doc' | 'other'

export interface ProtocolAttachment {
  id: string
  protocol_id: string
  file_name: string
  file_type: ProtocolFileType | null
  file_size: number | null
  file_url: string
  uploaded_by: string | null
  created_at: string
}

export type ProtocolAttachmentCreate = Omit<ProtocolAttachment, 'id' | 'created_at'>

// =====================================================
// PROTOCOL FAVORITE TYPES
// =====================================================

export interface ProtocolFavorite {
  id: string
  protocol_id: string
  user_id: string
  workspace_id: string
  created_at: string
}

export type ProtocolFavoriteCreate = Omit<ProtocolFavorite, 'id' | 'created_at'>

// =====================================================
// PROTOCOL VIEW TYPES
// =====================================================

export interface ProtocolView {
  id: string
  protocol_id: string
  user_id: string
  workspace_id: string
  view_duration: number | null
  patient_id: string | null
  viewed_at: string
}

export type ProtocolViewCreate = Omit<ProtocolView, 'id' | 'viewed_at'>

// =====================================================
// PROTOCOL AI SUGGESTION TYPES
// =====================================================

export interface ProtocolAISuggestion {
  id: string
  patient_id: string
  protocol_id: string
  workspace_id: string
  relevance_score: number
  reasoning: string | null
  ai_model: string | null
  was_viewed: boolean
  was_helpful: boolean | null
  user_feedback: string | null
  suggested_at: string
  viewed_at: string | null
  feedback_at: string | null
}

export interface ProtocolAISuggestionWithProtocol extends ProtocolAISuggestion {
  protocol: Protocol
}

export type ProtocolAISuggestionCreate = Omit<
  ProtocolAISuggestion,
  'id' | 'was_viewed' | 'suggested_at' | 'viewed_at' | 'feedback_at'
>

// =====================================================
// PROTOCOL SEARCH TYPES
// =====================================================

export interface ProtocolSearchResult {
  id: string
  title: string
  description: string | null
  category_id: string | null
  rank: number
}

export interface ProtocolSearchParams {
  workspace_id: string
  search_query: string
  category_id?: string | null
  limit?: number
  tags?: string[]
  status?: ProtocolStatus
}

// =====================================================
// PROTOCOL ANALYTICS TYPES
// =====================================================

export interface ProtocolPopularityMetrics {
  protocol_id: string
  title: string
  view_count: number
  favorite_count: number
}

export interface ProtocolCategoryMetrics {
  category_id: string
  category_name: string
  protocol_count: number
  total_views: number
  total_favorites: number
}

// =====================================================
// PROTOCOL FILTER & SORT TYPES
// =====================================================

export type ProtocolSortField =
  | 'created_at'
  | 'updated_at'
  | 'title'
  | 'view_count'
  | 'favorite_count'

export type ProtocolSortOrder = 'asc' | 'desc'

export interface ProtocolFilters {
  category_id?: string | null
  status?: ProtocolStatus
  tags?: string[]
  search?: string
  created_by?: string
  is_favorited?: boolean
}

export interface ProtocolSort {
  field: ProtocolSortField
  order: ProtocolSortOrder
}

// =====================================================
// PROTOCOL VERSION TYPES
// =====================================================

export interface ProtocolVersion {
  id: string
  title: string
  version: string
  version_number: number
  created_by: string | null
  created_at: string
}

export interface ProtocolVersionHistory {
  current: Protocol
  versions: ProtocolVersion[]
}

// =====================================================
// UI STATE TYPES
// =====================================================

export interface ProtocolLibraryState {
  selectedCategory: string | null
  searchQuery: string
  filters: ProtocolFilters
  sort: ProtocolSort
  viewMode: 'grid' | 'list'
}

export interface ProtocolEditorState {
  protocol: Protocol | null
  isDirty: boolean
  isSaving: boolean
  errors: Record<string, string>
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ProtocolListResponse {
  protocols: ProtocolWithStats[]
  total: number
  page: number
  limit: number
}

export interface ProtocolDetailResponse {
  protocol: ProtocolWithCategory
  attachments: ProtocolAttachment[]
  is_favorited: boolean
  view_count: number
  favorite_count: number
  related_protocols: Protocol[]
}

// =====================================================
// FORM TYPES
// =====================================================

export interface ProtocolFormData {
  title: string
  category_id: string | null
  description: string
  content: string
  content_type: ProtocolContentType
  tags: string[]
  keywords: string[]
  status: ProtocolStatus
}

export interface ProtocolCategoryFormData {
  name: string
  slug: string
  description: string
  color: string
  icon: string
  sort_order: number
}
