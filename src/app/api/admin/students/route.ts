import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { UserRole } from '@/lib/enums';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'SECURITY') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: ADMIN or SECURITY clearance required to access student directory.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const where: any = {
      role: UserRole.STUDENT,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { studentId: { contains: search } },
      ];
    }

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        role: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            reportedItems: true,
            claims: true,
            verificationRequestsReceived: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      total: students.length,
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        studentId: s.studentId,
        phone: s.phone,
        joinedDate: s.createdAt,
        lastActive: s.lastLoginAt || s.createdAt,
        totalReports: s._count.reportedItems,
        totalClaims: s._count.claims,
        pendingInquiries: s._count.verificationRequestsReceived,
      })),
    });
  } catch (err: any) {
    console.error('API Error in GET /api/admin/students:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to retrieve student directory.' },
      { status: 500 }
    );
  }
}
