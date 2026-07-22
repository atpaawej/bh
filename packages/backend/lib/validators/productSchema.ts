import { z } from 'zod'

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
  scheduledFor: z.string().datetime().optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
