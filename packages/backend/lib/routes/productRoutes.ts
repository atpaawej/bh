// ── Product Routes ──

import { Router } from "express";
import { createProductSchema } from "../validators/productSchema";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { voteLimiter } from "../middleware/rateLimiter";
import { asyncHandler } from "../middleware/asyncHandler";
import { productService } from "../services/productService";

const router = Router();

router.get(
  "/",
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const { cursor, category, week } = req.query as any;
    const products = await productService.list({
      cursor,
      category,
      week,
      userId: req.user?.id,
    });
    res.json(products);
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

export default router;
