// ── User Routes ──

import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import { userService } from "../services/userService";
import { updateProfileSchema } from "../validators/userSchema";

const router = Router();

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
    const profile = await userService.getProfile(req.params.username);
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
    const user = await userService.updateProfile(req.user!.id, req.body);
    res.json(user);
  }),
);

export default router;
