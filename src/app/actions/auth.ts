'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { UserRole } from '@/lib/enums';
import { 
  studentRegistrationSchema, 
  adminProfileUpdateSchema, 
  formatZodError 
} from '@/lib/validations';
import { checkRateLimit } from '@/lib/rateLimit';

export interface RegisterStudentInput {
  name: string;
  email: string;
  studentId: string;
  password: string;
  phone?: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    studentId?: string | null;
  };
}

/**
 * Register a new Student account in PostgreSQL using Prisma and bcryptjs.
 * Strictly validated via Zod and rate-limited.
 */
export async function registerStudent(input: RegisterStudentInput): Promise<AuthActionResult> {
  // 1. Zod input schema validation
  const parsed = studentRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: formatZodError(parsed.error),
    };
  }

  const { name, email, studentId, password, phone } = parsed.data;

  // 2. Rate limit registration attempts (10 attempts per 1 hour per email)
  const rateLimitResult = checkRateLimit({
    key: `register:${email}`,
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: rateLimitResult.error || 'Too many registration attempts. Please try again later.',
    };
  }

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return { success: false, error: 'An account with this collegiate email already exists.' };
    }

    const existingStudentId = await prisma.user.findUnique({ where: { studentId } });
    if (existingStudentId) {
      return { success: false, error: 'An account with this Student ID already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        studentId,
        password: hashedPassword,
        role: UserRole.STUDENT, // Strictly forced to STUDENT server-side
        phone: phone?.trim() || null,
      },
    });

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        studentId: newUser.studentId,
      },
    };
  } catch (err: any) {
    console.error('Error during student registration in PostgreSQL:', err);
    return {
      success: false,
      error: 'Registration is temporarily unavailable, please try again.',
    };
  }
}

/**
 * Get the currently authenticated session user.
 */
export async function getCurrentUser() {
  try {
    const session = await auth();
    if (!session?.user) return null;
    return session.user as {
      id: string;
      name: string;
      email: string;
      role: 'STUDENT' | 'SECURITY' | 'ADMIN';
      studentId?: string;
    };
  } catch (err) {
    return null;
  }
}

/**
 * Server Action: Logs out the user safely and invalidates authentication cookies.
 */
export async function logoutUser() {
  const { signOut } = await import('@/auth');
  await signOut({ redirectTo: '/login' });
}

export interface UpdateAdminProfileInput {
  name?: string;
  email?: string;
  currentPassword: string;
  newPassword?: string;
  phone?: string;
  studentId?: string;
}

export interface UpdateAdminProfileResult {
  success: boolean;
  error?: string;
  passwordChanged?: boolean;
}

/**
 * Updates admin display name, email, or password.
 * Strictly verifies the current password with bcrypt before allowing modifications.
 */
export async function updateAdminProfile(input: UpdateAdminProfileInput): Promise<UpdateAdminProfileResult> {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: 'Session user ID is missing.' };
  }

  const parsed = adminProfileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: formatZodError(parsed.error),
    };
  }

  const validData = parsed.data;
  if (!validData.currentPassword) {
    return { success: false, error: 'Current password is required to save changes.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      return { success: false, error: 'User account not found.' };
    }

    // Verify current password with bcrypt
    const isMatch = await bcrypt.compare(validData.currentPassword, user.password);
    if (!isMatch) {
      return { success: false, error: 'Incorrect current password.' };
    }

    const updateData: { name?: string; email?: string; password?: string; phone?: string; studentId?: string } = {};

    if (validData.name && validData.name.trim() !== '') {
      updateData.name = validData.name.trim();
    }

    if (validData.email && validData.email.trim() !== '') {
      const email = validData.email.trim().toLowerCase();
      if (email !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.id !== user.id) {
          return { success: false, error: 'An account with this email address already exists.' };
        }
        updateData.email = email;
      }
    }

    if (validData.phone !== undefined) {
      updateData.phone = validData.phone?.trim() || undefined;
    }

    if (validData.studentId !== undefined) {
      updateData.studentId = validData.studentId?.trim() || undefined;
    }

    let passwordChanged = false;
    if (validData.newPassword && validData.newPassword.trim() !== '') {
      updateData.password = await bcrypt.hash(validData.newPassword, 12);
      passwordChanged = true;
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true, passwordChanged: false };
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Record non-sensitive admin settings change audit log
    const { writeAuditLog } = await import('@/lib/audit');
    await writeAuditLog({
      actorId: userId,
      action: 'ADMIN_SETTINGS_CHANGED',
      targetType: 'USER',
      targetId: userId,
      metadata: {
        nameUpdated: !!updateData.name,
        emailUpdated: !!updateData.email,
        passwordChanged,
      },
    });

    return {
      success: true,
      passwordChanged,
    };
  } catch (err: any) {
    console.error('Error updating admin profile:', err);
    return {
      success: false,
      error: 'Failed to update admin profile. Please try again.',
    };
  }
}
