import type { UserRole } from "../../lib/db/database.js";

export type { UserRole };

export interface AuthenticatedUser {
  role: UserRole;
  tenantId: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
