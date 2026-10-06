import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IAuthTokenPayload, IUser, UserRole } from '../types';
import { db } from '../db/database';

export const JWT_SECRET = process.env.JWT_SECRET || 'lift-it-super-secret-jwt-key-2026-secure-fitness-app';
export const JWT_EXPIRES_IN = '7d';

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IAuthTokenPayload & { isFlagged?: boolean };
    }
  }
}

/**
 * Generate a cryptographically signed JWT token for an authenticated user
 */
export function generateToken(user: IUser): string {
  const payload: IAuthTokenPayload = {
    userId: user._id || user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Middleware: Verify JWT Authentication Token
 * Validates the Authorization header ("Bearer <token>")
 * Checks token validity, user status, and attaches user info to req.user.
 */
export async function verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Access denied. No authentication token provided in Authorization header.',
      code: 'AUTH_TOKEN_MISSING',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as IAuthTokenPayload;

    // Check if the user exists in the active database and has not been flagged/suspended
    const user = await db.findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid token: User account no longer exists.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    if (user.isFlagged) {
      res.status(403).json({
        success: false,
        error: `Account suspended: ${user.flagReason || 'Violated platform terms'}. Please contact administrator.`,
        code: 'ACCOUNT_FLAGGED',
      });
      return;
    }

    req.user = {
      ...decoded,
      role: user.role, // Use current live database role
      isFlagged: user.isFlagged,
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token. Please log in again.',
      code: 'AUTH_TOKEN_INVALID',
      details: err.message,
    });
  }
}

/**
 * Middleware: Verify Admin Role
 * Requires prior verifyToken middleware to populate req.user.
 * Restricts access exclusively to users with the 'admin' role.
 */
export function verifyAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required prior to role verification.',
      code: 'UNAUTHENTICATED',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Admin privilege required to perform this action.',
      code: 'INSUFFICIENT_PERMISSIONS',
      currentRole: req.user.role,
      requiredRole: 'admin',
    });
    return;
  }

  next();
}

/**
 * Middleware: Verify Role (Flexible RBAC Guard)
 * Checks if the authenticated user's role is in the allowedRoles array.
 */
export function verifyRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: User role '${req.user.role}' is not authorized. Required: [${allowedRoles.join(', ')}]`,
        code: 'ROLE_NOT_AUTHORIZED',
        currentRole: req.user.role,
        allowedRoles,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Optional Authentication
 * Attempts to parse JWT if present, but does not block requests without a token.
 * Useful for tiered public/registered endpoints (e.g. food database).
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as IAuthTokenPayload;
      const user = await db.findUserById(decoded.userId);
      if (user && !user.isFlagged) {
        req.user = {
          ...decoded,
          role: user.role,
          isFlagged: user.isFlagged,
        };
      }
    } catch {
      // Ignore token errors for optional auth; treat as guest
    }
  }

  next();
}
