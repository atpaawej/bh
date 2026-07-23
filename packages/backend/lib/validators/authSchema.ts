import { z } from "zod";

export const loginSchema = z
  .object({
    provider: z.enum(["google", "github"]).optional(),
    email: z.string().email().optional(),
    code: z.string().min(1).optional(),
    accessToken: z.string().min(1).optional(),
    tokenHash: z.string().min(1).optional(),
    type: z.enum(["email", "magiclink"]).optional(),
  })
  .superRefine((value, ctx) => {
    const modes = [
      value.provider,
      value.email,
      value.code,
      value.accessToken,
      value.tokenHash,
    ].filter(Boolean);
    if (modes.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Provide exactly one of: provider (OAuth start), email (magic link), code, accessToken, or tokenHash",
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
