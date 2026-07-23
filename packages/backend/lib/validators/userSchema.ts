import { z } from "zod";

/**
 * Schema for updating own profile.
 * All fields are optional; at least one must be provided.
 */
export const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    bio: z.string().max(500).trim().optional().nullable(),
    avatarUrl: z.string().url().max(1000).optional().nullable(),
    twitterHandle: z.string().max(100).trim().optional().nullable(),
    website: z.string().url().max(500).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
