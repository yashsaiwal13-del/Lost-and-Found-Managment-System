'use server';

import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/authz';

export interface AdminStudentRecord {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  isActiveLast7Days: boolean;
  reportsCount: number;
  inquiriesCount: number;
}

export interface GetAdminStudentsResult {
  students: AdminStudentRecord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  metrics: {
    totalStudents: number;
    activeInLast7Days: number;
    neverLoggedIn: number;
  };
}

/**
 * Server Action: Searchable, paginated query of campus students directly from PostgreSQL via Prisma.
 * Strictly protected: ADMIN or SECURITY role required via requireRole().
 * Explicitly excludes password hashes and sensitive credential fields.
 */
export async function getAdminStudents(params?: {
  search?: string;
  page?: number;
  limit?: number;
  filter?: 'all' | 'active' | 'inactive' | 'never_logged_in';
}): Promise<GetAdminStudentsResult> {
  await requireRole(['ADMIN', 'SECURITY']);

  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, Math.min(100, params?.limit || 15));
  const skip = (page - 1) * limit;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Build where clause
  const where: any = {
    role: 'STUDENT',
  };

  if (params?.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { studentId: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (params?.filter === 'active') {
    where.lastLoginAt = { gte: sevenDaysAgo };
  } else if (params?.filter === 'inactive') {
    where.OR = [
      { lastLoginAt: { lt: sevenDaysAgo } },
      { lastLoginAt: null },
    ];
  } else if (params?.filter === 'never_logged_in') {
    where.lastLoginAt = null;
  }

  // Execute queries
  const [totalFiltered, rawStudents, totalStudentsCount, activeLast7Count, neverLoggedCount] =
    await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              reportedItems: true,
              verificationRequestsReceived: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({
        where: {
          role: 'STUDENT',
          lastLoginAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.user.count({
        where: {
          role: 'STUDENT',
          lastLoginAt: null,
        },
      }),
    ]);

  const students: AdminStudentRecord[] = rawStudents.map((st) => {
    const isRecent = st.lastLoginAt ? new Date(st.lastLoginAt) >= sevenDaysAgo : false;
    return {
      id: st.id,
      name: st.name,
      email: st.email,
      studentId: st.studentId,
      role: st.role,
      createdAt: st.createdAt.toISOString(),
      lastLoginAt: st.lastLoginAt?.toISOString() || null,
      isActiveLast7Days: isRecent,
      reportsCount: st._count.reportedItems,
      inquiriesCount: st._count.verificationRequestsReceived,
    };
  });

  return {
    students,
    pagination: {
      page,
      limit,
      totalCount: totalFiltered,
      totalPages: Math.ceil(totalFiltered / limit) || 1,
    },
    metrics: {
      totalStudents: totalStudentsCount,
      activeInLast7Days: activeLast7Count,
      neverLoggedIn: neverLoggedCount,
    },
  };
}

export interface StudentAccountDetails {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  role: string;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  hasPassword: boolean;
  passwordPreview: string;
  reportedItems: {
    id: string;
    name: string;
    type: string;
    category: string;
    status: string;
    location: string;
    date: string;
    archived: boolean;
    image?: string | null;
  }[];
  claims: {
    id: string;
    status: string;
    createdAt: string;
    item: {
      id: string;
      name: string;
      type: string;
      category: string;
    };
  }[];
  verificationRequests: {
    id: string;
    status: string;
    createdAt: string;
    item: {
      id: string;
      name: string;
    };
    questionsCount: number;
  }[];
}

/**
 * Server Action: Fetches comprehensive profile details for a student account.
 * ADMIN or SECURITY role required.
 */
export async function getStudentAccountDetails(studentId: string): Promise<StudentAccountDetails | null> {
  await requireRole(['ADMIN', 'SECURITY']);

  const user = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      reportedItems: {
        orderBy: { createdAt: 'desc' },
      },
      claims: {
        include: {
          item: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      verificationRequestsReceived: {
        include: {
          item: true,
          questions: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    hasPassword: Boolean(user.password),
    passwordPreview: user.password ? '●●●●●●●● (BCrypt Encrypted)' : 'No Password Set (OAuth)',
    reportedItems: user.reportedItems.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      category: item.category,
      status: item.status,
      location: item.location,
      date: item.date.toISOString(),
      archived: item.archived,
      image: item.image,
    })),
    claims: user.claims.map((c) => ({
      id: c.id,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      item: {
        id: c.item.id,
        name: c.item.name,
        type: c.item.type,
        category: c.item.category,
      },
    })),
    verificationRequests: user.verificationRequestsReceived.map((vr) => ({
      id: vr.id,
      status: vr.status,
      createdAt: vr.createdAt.toISOString(),
      item: {
        id: vr.item.id,
        name: vr.item.name,
      },
      questionsCount: vr.questions.length,
    })),
  };
}

/**
 * Server Action: Deletes a student account.
 * ADMIN or SECURITY role required.
 */
export async function deleteStudentAccount(studentId: string): Promise<{ success: boolean; error?: string }> {
  const admin = await requireRole(['ADMIN', 'SECURITY']);

  try {
    const userToDelete = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!userToDelete) {
      return { success: false, error: 'Student account not found.' };
    }

    if (userToDelete.role === 'ADMIN' && admin.id !== userToDelete.id) {
      return { success: false, error: 'Cannot delete an administrator account.' };
    }

    // Disconnect optional relations before deletion to avoid SQLite constraint issues
    await prisma.item.updateMany({
      where: { archivedById: studentId },
      data: { archivedById: null },
    });
    await prisma.match.updateMany({
      where: { connectedById: studentId },
      data: { connectedById: null },
    });
    await prisma.match.updateMany({
      where: { disconnectedById: studentId },
      data: { disconnectedById: null },
    });
    await prisma.return.updateMany({
      where: { arrangedById: studentId },
      data: { arrangedById: null },
    });
    await prisma.return.updateMany({
      where: { confirmedById: studentId },
      data: { confirmedById: null },
    });

    // Delete user (cascades reportedItems, claims, verificationRequests, notifications, auditLogs)
    await prisma.user.delete({
      where: { id: studentId },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete student account:', err);
    return { success: false, error: err?.message || 'Failed to delete student account.' };
  }
}

