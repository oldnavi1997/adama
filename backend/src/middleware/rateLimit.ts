import type { NextFunction, Request, Response } from "express";
import { redisIncrWithExpire } from "../lib/redis.js";

type RateLimitOptions = {
  keyPrefix: string;
  windowSeconds: number;
  maxRequests: number;
};

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "unknown";
}

export function rateLimit(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = getClientIp(req);
      const bucket = Math.floor(Date.now() / 1000 / options.windowSeconds);
      const key = `${options.keyPrefix}:${ip}:${bucket}`;
      const count = await redisIncrWithExpire(key, options.windowSeconds);
      if (count != null && count > options.maxRequests) {
        res.status(429).json({ message: "Too many requests. Please try again later." });
        return;
      }
    } catch {
      // Fail-open: if redis is unavailable, do not block requests.
    }
    next();
  };
}
