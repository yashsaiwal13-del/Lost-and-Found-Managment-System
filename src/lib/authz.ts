import { auth } from '@/auth';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  studentId?: string | null;
}

export interface AuthCheckResult {
  authorized: boolean;
  error?: string;
  user?: AuthUser;
}

/**
 * Checks if the current session user has one of the allowed roles.
 * If allowedRoles is empty or omitted, requires any authenticated session.
 * Throws an Error with a descriptive message if unauthorized or forbidden.
 */
export async function requireRole(allowedRoles?: string[]): Promise<AuthUser> {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized: Authentication session required.');
  }

  const user = session.user as unknown as AuthUser;

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user.role || !allowedRoles.includes(user.role)) {
      throw new Error(
        `Forbidden: Role '${user.role || 'UNKNOWN'}' is not authorized for this action. Required: ${allowedRoles.join(', ')}`
      );
    }
  }

  return user;
}

/**
 * Safe version of requireRole that returns an AuthCheckResult instead of throwing.
 */
export async function checkRole(allowedRoles?: string[]): Promise<AuthCheckResult> {
  try {
    const user = await requireRole(allowedRoles);
    return { authorized: true, user };
  } catch (err: any) {
    return { authorized: false, error: err?.message || 'Unauthorized' };
  }
}
