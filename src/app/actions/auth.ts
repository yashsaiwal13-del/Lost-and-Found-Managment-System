'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signIn, signOut, auth } from '@/auth';
import { UserRole } from '@prisma/client';
import { saveFallbackUser, findUserByEmail, findUserByStudentId } from '@/lib/userStore';

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
 */
export async function registerStudent(input: RegisterStudentInput): Promise<AuthActionResult> {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const studentId = input.studentId?.trim().toUpperCase();
  const password = input.password;

  if (!name) return { success: false, error: 'Full name is required.' };
  if (!email || !email.includes('@')) return { success: false, error: 'A valid college email address is required.' };
  if (!studentId) return { success: false, error: 'Student ID number is required.' };
  if (!password || password.length < 6) return { success: false, error: 'Password must be at least 6 characters long.' };

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const existingStudentId = await prisma.user.findUnique({ where: { studentId } });
    if (existingStudentId) {
      return { success: false, error: 'An account with this Student ID already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        studentId,
        password: hashedPassword,
        role: UserRole.STUDENT,
        phone: input.phone?.trim() || null,
      },
    });

    saveFallbackUser({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      studentId: newUser.studentId,
      phone: newUser.phone,
      password: hashedPassword,
      role: 'STUDENT',
      createdAt: new Date(),
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
    console.warn('Database note during student registration (saving to fallback store):', err?.message || err);

    // Gracefully register in fallback store if PostgreSQL is unreachable
    if (findUserByEmail(email)) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    if (findUserByStudentId(studentId)) {
      return { success: false, error: 'An account with this Student ID already exists.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fallbackId = `usr_${Date.now()}`;
    const registeredUser = saveFallbackUser({
      id: fallbackId,
      name,
      email,
      studentId,
      phone: input.phone?.trim() || null,
      password: hashedPassword,
      role: 'STUDENT',
      createdAt: new Date(),
    });

    return {
      success: true,
      user: {
        id: registeredUser.id,
        name: registeredUser.name,
        email: registeredUser.email,
        role: registeredUser.role,
        studentId: registeredUser.studentId,
      },
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
