import type express from "express";
import type { UserRole } from "../../lib/db/database.js";
import { authenticateToken } from "./session.js";

export function requireRoles(allowedRoles: UserRole[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = authenticateToken(req.headers["authorization"], req.headers.cookie);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Valid Bearer token required." });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Forbidden. Role '${user.role}' lacks sufficient privileges. Required: [${allowedRoles.join(", ")}]`
      });
    }
    req.user = user;
    next();
  };
}

export const requireAdminAuth = requireRoles(["admin"]);
export const requireOperatorAuth = requireRoles(["admin", "operator"]);
export const requireAuditorAuth = requireRoles(["admin", "operator", "auditor"]);
