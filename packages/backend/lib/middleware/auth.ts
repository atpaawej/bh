import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AppError } from "./errorHandler";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw AppError.unauthorized("Missing or invalid authorization header");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthUser & {
      sub: string;
    };
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      username: payload.username ?? null,
      avatarUrl: payload.avatarUrl,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized("Token expired");
    }
    throw AppError.unauthorized("Invalid token");
  }
};

export const optionalAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthUser & {
      sub: string;
    };
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      username: payload.username ?? null,
      avatarUrl: payload.avatarUrl,
    };
  } catch {
    // Silently ignore invalid tokens for optional auth
  }

  next();
};
