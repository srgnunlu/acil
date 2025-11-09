import { z } from 'zod'

/**
 * Patient validation schemas
 */
export const createPatientSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı').max(100, 'İsim çok uzun'),
  age: z.number().int().positive().min(0).max(150).optional().nullable(),
  gender: z.enum(['Erkek', 'Kadın', 'Diğer']).optional().nullable(),
  category_id: z.string().uuid('Geçersiz kategori ID').optional().nullable(),
})

export const updatePatientSchema = createPatientSchema.partial()

/**
 * Patient data validation schemas
 */
export const patientDataSchema = z.object({
  patientId: z.string().uuid('Geçersiz hasta ID'),
  data_type: z.enum(['demographics', 'anamnesis', 'medications', 'vital_signs', 'history']),
  content: z.object({}).passthrough(), // Dynamic object - allows any properties
})

/**
 * Patient test validation schemas
 */
export const patientTestSchema = z.object({
  patientId: z.string().uuid('Geçersiz hasta ID'),
  test_type: z.string().min(1, 'Test tipi gerekli').max(100),
  results: z.object({}).passthrough(), // Dynamic object for test results
  images: z.array(z.string().url()).optional(),
})

/**
 * AI Analysis request validation
 */
export const aiAnalysisRequestSchema = z.object({
  patientId: z.string().uuid('Geçersiz hasta ID'),
  analysisType: z.enum(['initial', 'updated']).default('initial'),
})

/**
 * Chat message validation
 */
export const chatMessageSchema = z.object({
  patientId: z.string().uuid('Geçersiz hasta ID'),
  message: z.string().min(1, 'Mesaj boş olamaz').max(2000, 'Mesaj çok uzun (max 2000 karakter)'),
  sessionId: z.string().uuid('Geçersiz session ID').nullish(),
})

/**
 * Image upload validation
 */
export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "Dosya boyutu 10MB'dan küçük olmalı")
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      'Sadece JPEG, PNG ve WebP formatları destekleniyor'
    ),
  patientId: z.string().uuid('Geçersiz hasta ID'),
})

/**
 * Vision analysis request validation
 */
export const visionAnalysisSchema = z.object({
  imageBase64: z.string().min(1, 'Görsel verisi gerekli'),
  analysisType: z.enum(['ekg', 'skin_lesion', 'xray', 'other']),
  additionalContext: z.string().max(1000).optional(),
  patientId: z.string().uuid('Geçersiz hasta ID').optional(),
})

/**
 * Image comparison validation
 */
export const imageComparisonSchema = z.object({
  image1Base64: z.string().min(1, 'İlk görsel gerekli'),
  image2Base64: z.string().min(1, 'İkinci görsel gerekli'),
  comparisonType: z.enum(['ekg', 'xray', 'other']),
  context: z.string().max(1000).optional(),
  patientId: z.string().uuid('Geçersiz hasta ID').optional(),
})

/**
 * Reminder validation
 */
export const reminderSchema = z.object({
  patientId: z.string().uuid('Geçersiz hasta ID'),
  reminder_type: z.string().min(1, 'Hatırlatma tipi gerekli').max(100),
  scheduled_time: z.string().datetime('Geçerli bir tarih/saat gerekli'),
})

/**
 * Bulk patient operations
 */
export const bulkPatientOperationSchema = z.object({
  patientIds: z
    .array(z.string().uuid())
    .min(1, 'En az bir hasta seçilmeli')
    .max(50, 'Aynı anda en fazla 50 hasta işlenebilir'),
  action: z.enum(['delete', 'discharge', 'activate']),
})

/**
 * User profile update validation
 */
export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'İsim en az 2 karakter olmalı').max(100).optional(),
  specialty: z.string().max(100).optional(),
  institution: z.string().max(200).optional(),
})

/**
 * Generic UUID validation
 */
export const uuidSchema = z.string().uuid('Geçersiz ID formatı')

/**
 * Pagination validation
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Helper function to validate request body
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Zod v4 uses 'issues' instead of 'errors'
      const zodError = error as z.ZodError
      const errors = zodError.issues || []
      const firstError = errors[0]
      return {
        success: false,
        error: firstError?.message || 'Validation error',
      }
    }
    return { success: false, error: 'Unknown validation error' }
  }
}

/**
 * Safe parse helper for Next.js API routes
 */
export function safeParseRequest<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.safeParse(data)
}
