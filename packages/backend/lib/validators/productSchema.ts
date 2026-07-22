import { z } from 'zod'

/**
 * Validates that a date string represents a Friday in the future.
 */
function isFutureFriday(dateStr: string): boolean {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return false
  // getUTCDay: 5 = Friday
  if (date.getUTCDay() !== 5) return false
  return date.getTime() > Date.now()
}

export const createProductSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  tagline: z.string().min(10).max(150).trim(),
  description: z.string().min(50).max(5000).trim(),
  websiteUrl: z.string().url().max(500),
  demoUrl: z.string().url().max(500).optional(),
  categoryId: z.string().uuid(),
  logoUrl: z.string().url().max(1000),
  heroImageUrl: z.string().url().max(1000),
  galleryUrls: z.array(z.string().url().max(1000)).max(5).optional(),
  videoUrl: z.string().url().max(1000).optional(),
  scheduledFor: z
    .string()
    .datetime()
    .refine(isFutureFriday, {
      message: 'scheduledFor must be a Friday date in the future',
    })
    .optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

/**
 * Schema for updating an existing product.
 * All fields are optional; at least one field must be provided.
 */
export const updateProductSchema = z
  .object({
    name: z.string().min(3).max(100).trim().optional(),
    tagline: z.string().min(10).max(150).trim().optional(),
    description: z.string().min(50).max(5000).trim().optional(),
    websiteUrl: z.string().url().max(500).optional(),
    demoUrl: z.string().url().max(500).optional().nullable(),
    categoryId: z.string().uuid().optional(),
    logoUrl: z.string().url().max(1000).optional(),
    heroImageUrl: z.string().url().max(1000).optional(),
    galleryUrls: z.array(z.string().url().max(1000)).max(5).optional(),
    videoUrl: z.string().url().max(1000).optional().nullable(),
    scheduledFor: z
      .string()
      .datetime()
      .refine(isFutureFriday, {
        message: 'scheduledFor must be a Friday date in the future',
      })
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export type UpdateProductInput = z.infer<typeof updateProductSchema>
