// ── User Routes ──

import { z } from "zod";
import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import { AppError } from "../middleware/errorHandler";
import { userService } from "../services/userService";
import { updateProfileSchema } from "../validators/userSchema";

const router = Router();

const usernameParamSchema = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/);

/**
 * GET /api/users/me
 * Returns the authenticated user's full profile (including bio, socials, etc.).
 */
router.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await userService.getOwnProfile(req.user!.id);
    res.json(user);
  }),
);

/**
 * GET /api/users/:username
 * Public profile with user info + list of launched products.
 * Throws 404 for non-existent usernames.
 * NOTE: Must be defined AFTER /me so Express doesn't capture "me" as a username.
 */
router.get(
  "/:username",
  asyncHandler(async (req, res) => {
    const result = usernameParamSchema.safeParse(req.params.username);
    if (!result.success) {
      throw AppError.validation("Invalid username");
    }
    const profile = await userService.getProfile(result.data);
    res.json(profile);
  }),
);

/**
 * PATCH /api/users/me
 * Update own profile. Auth required.
 * Accepts partial updates to name, bio, avatarUrl, twitterHandle, website.
 */
router.patch(
  "/me",
  authMiddleware,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    await userService.updateProfile(req.user!.id, req.body);
    const user = await userService.getOwnProfile(req.user!.id);
    res.json(user);
  }),
);

export default router;
