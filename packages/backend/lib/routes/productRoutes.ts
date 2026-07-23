// ── Product Routes ──

import { Router } from "express";
import { z } from "zod";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/productSchema";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { voteLimiter } from "../middleware/rateLimiter";
import { asyncHandler } from "../middleware/asyncHandler";
import { productService } from "../services/productService";
import { generateSignedUploadUrl } from "../services/cloudinaryService";

const router = Router();

const productListQuerySchema = z.object({
  cursor: z.string().optional(),
  category: z.string().optional(),
  week: z
    .string()
    .regex(/^\d{4}-W\d{2}$/, "Expected YYYY-Wnn format (e.g. 2026-W30)")
    .optional(),
});

router.get(
  "/",
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const { cursor, category, week } = productListQuerySchema.parse(req.query);
    const products = await productService.list({
      cursor,
      category,
      week,
      userId: req.user?.id,
    });
    res.json(products);
  }),
);

/**
 * GET /api/products/upload-url
 * Returns a signed Cloudinary upload URL for the specified folder type.
 * Must be defined before /:slug so Express doesn't capture "upload-url" as a slug.
 * Query param: folder — one of "logos", "heroes", "gallery"
 */
router.get(
  "/upload-url",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const folder = z
      .enum(["logos", "heroes", "gallery"])
      .parse(req.query.folder);
    const signed = generateSignedUploadUrl(folder);
    res.json(signed);
  }),
);

router.get(
  "/:slug",
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const product = await productService.getBySlug(
      req.params.slug,
      req.user?.id,
    );
    res.json(product);
  }),
);

router.post(
  "/",
  authMiddleware,
  validate(createProductSchema),
  asyncHandler(async (req, res) => {
    const product = await productService.create(req.user!.id, req.body);
    res.status(201).json(product);
  }),
);

router.patch(
  "/:slug",
  authMiddleware,
  validate(updateProductSchema),
  asyncHandler(async (req, res) => {
    const product = await productService.update(
      req.user!.id,
      req.params.slug,
      req.body,
    );
    res.json(product);
  }),
);

router.delete(
  "/:slug",
  authMiddleware,
  asyncHandler(async (req, res) => {
    await productService.remove(req.user!.id, req.params.slug);
    res.status(204).send();
  }),
);

router.post(
  "/:slug/vote",
  authMiddleware,
  voteLimiter,
  asyncHandler(async (req, res) => {
    const product = await productService.vote(req.user!.id, req.params.slug);
    res.json(product);
  }),
);

router.delete(
  "/:slug/vote",
  authMiddleware,
  voteLimiter,
  asyncHandler(async (req, res) => {
    const product = await productService.unvote(req.user!.id, req.params.slug);
    res.json(product);
  }),
);

/**
 * GET /api/products/:slug/edit
 * Returns the product including drafts for the owner (edit page).
 */
router.get(
  "/:slug/edit",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const product = await productService.getOwnBySlug(
      req.params.slug,
      req.user!.id,
    );
    res.json(product);
  }),
);

export default router;
