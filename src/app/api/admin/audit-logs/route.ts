import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

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
        { success: false, error: 'Forbidden: ADMIN or SECURITY clearance required to view audit logs.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const action = searchParams.get('action') || undefined;

    const where: any = {};
    if (action && action !== 'ALL') {
      where.action = action;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      total: logs.length,
      logs,
    });
  } catch (err: any) {
    console.error('API Error in GET /api/admin/audit-logs:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to retrieve audit logs.' },
      { status: 500 }
    );
  }
}
