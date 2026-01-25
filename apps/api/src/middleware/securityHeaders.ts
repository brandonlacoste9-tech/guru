import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

/**
 * Helmet configuration for standard production security:
 * - CSP (strict)
 * - HSTS (maxAge 180 days)
 * - X-Frame-Options (DENY)
 * - Referrer-Policy
 * - X-Content-Type-Options (nosniff)
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://*.supabase.co",
        "https://*.supabase.in",
        "http://localhost:*",
        "ws://localhost:*",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://fonts.googleapis.com",
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 60 * 60 * 24 * 180, // 180 days
    includeSubDomains: true,
  },
  frameguard: { action: "deny" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  noSniff: true,
  xssFilter: false,
});

export const useSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  return securityHeaders(req, res, next);
};
