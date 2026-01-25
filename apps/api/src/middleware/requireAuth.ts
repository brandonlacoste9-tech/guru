import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

// Supabase client for server-side verification
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false },
  },
);

/**
 * Verify Supabase JWT from `Authorization: Bearer <token>`
 * Attaches the decoded user to `req.user`.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    // If we're in development and don't want to enforce yet, we could skip.
    // But the user said "Replace the mock", so we enforce.
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    console.warn("Auth error:", error?.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Attach the user payload for downstream handlers
  (req as any).user = data.user;
  next();
}
