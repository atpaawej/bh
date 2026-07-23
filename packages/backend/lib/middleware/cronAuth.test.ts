import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { cronAuthMiddleware } from "./cronAuth";
import { config } from "../config";
import { AppError } from "./errorHandler";

function mockReq(header?: string): Request {
  return {
    headers: header ? { "x-cron-secret": header } : {},
  } as unknown as Request;
}

function mockRes(): Response {
  return {} as Response;
}

describe("cronAuthMiddleware", () => {
  it("passes through when X-Cron-Secret matches", () => {
    const next = vi.fn();
    const req = mockReq(config.CRON_SECRET);

    cronAuthMiddleware(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("throws UNAUTHORIZED when X-Cron-Secret is missing", () => {
    const next = vi.fn();

    expect(() => cronAuthMiddleware(mockReq(), mockRes(), next)).toThrow(
      AppError,
    );
    try {
      cronAuthMiddleware(mockReq(), mockRes(), next);
    } catch (err) {
      expect(err).toMatchObject({
        status: 401,
        message: "Invalid or missing X-Cron-Secret header",
      });
    }
    expect(next).not.toHaveBeenCalled();
  });

  it("throws UNAUTHORIZED when X-Cron-Secret is wrong", () => {
    const next = vi.fn();

    expect(() =>
      cronAuthMiddleware(mockReq("wrong-secret"), mockRes(), next),
    ).toThrow(AppError);
    try {
      cronAuthMiddleware(mockReq("wrong-secret"), mockRes(), next);
    } catch (err) {
      expect(err).toMatchObject({
        status: 401,
        message: "Invalid or missing X-Cron-Secret header",
      });
    }
    expect(next).not.toHaveBeenCalled();
  });
});
