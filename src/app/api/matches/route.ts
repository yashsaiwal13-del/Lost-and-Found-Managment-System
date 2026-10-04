import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { MatchStatus } from '@/lib/enums';

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

    // For students: match where their lost item or found item is involved
    // For admin / security: return all suggested matches
    let where: any = {
      status: { not: MatchStatus.DISMISSED },
    };

    if (userRole !== 'ADMIN' && userRole !== 'SECURITY') {
      where = {
        status: { not: MatchStatus.DISMISSED },
        OR: [
          { lostItem: { reportedById: session.user.id } },
          { foundItem: { reportedById: session.user.id } },
        ],
      };
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        lostItem: {
          include: {
            reportedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        foundItem: {
          include: {
            reportedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: [
        { similarityScore: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      total: matches.length,
      matches,
    });
  } catch (err: any) {
    console.error('API Error in GET /api/matches:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to retrieve match suggestions.' },
      { status: 500 }
    );
  }
}
