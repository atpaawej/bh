import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { AppError } from "./errorHandler";

/**
 * Validates the `X-Cron-Secret` header for internal cron endpoints.
 * Rejects the request if the header is missing or does not match CRON_SECRET.
 */
export const cronAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const secret = req.headers["x-cron-secret"];

  if (!secret || secret !== config.CRON_SECRET) {
    throw AppError.unauthorized("Invalid or missing X-Cron-Secret header");
  }

  next();
};
