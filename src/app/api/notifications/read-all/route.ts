import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (err: any) {
    console.error('API Error in POST /api/notifications/read-all:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to mark notifications read.' },
      { status: 500 }
    );
  }
}
