import { Request, Response, NextFunction } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }

  static notFound(resource: string) {
    return new AppError(
      404,
      `${resource.toUpperCase()}_NOT_FOUND`,
      `${resource} not found`,
    );
  }

  static conflict(message: string) {
    return new AppError(409, "CONFLICT", message);
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Not allowed") {
    return new AppError(403, "FORBIDDEN", message);
  }

  static validation(message: string, details?: Record<string, string[]>) {
    return new AppError(400, "VALIDATION_ERROR", message, details);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Our custom AppError
  if (err instanceof AppError) {
    return res.status(err.status).json({
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // Prisma known request errors
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        status: 409,
        code: "CONFLICT",
        message: "A record with this value already exists",
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        status: 404,
        code: "NOT_FOUND",
        message: "Resource not found",
      });
    }
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: err.flatten().fieldErrors,
    });
  }

  // Unknown errors — log, don't leak
  console.error("Unhandled error:", err);
  return res.status(500).json({
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Something went wrong",
  });
}
