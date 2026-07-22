import { z } from "zod";

export const createCommentSchema = z.object({
  body: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be 1000 characters or fewer"),
  parentId: z.string().uuid().nullable().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
