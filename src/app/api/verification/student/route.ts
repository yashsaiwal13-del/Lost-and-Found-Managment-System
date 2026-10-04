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
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    let where: any = {};

    if (userRole === 'ADMIN' || userRole === 'SECURITY') {
      const studentId = searchParams.get('studentId');
      if (studentId) where.recipientId = studentId;
      if (itemId) where.itemId = itemId;
    } else {
      where.recipientId = session.user.id;
      if (itemId) where.itemId = itemId;
    }

    const verifications = await prisma.verificationRequest.findMany({
      where,
      include: {
        item: true,
        recipient: {
          select: { id: true, name: true, email: true, studentId: true },
        },
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        questions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      total: verifications.length,
      verifications: verifications.map((v) => ({
        ...v,
        student: v.recipient,
        questions: v.questions.map((q) => q.questionText),
        answers: v.questions.map((q) => q.answerText).filter(Boolean),
      })),
    });
  } catch (err: any) {
    console.error('API Error in GET /api/verification/student:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load verification inquiries.' },
      { status: 500 }
    );
  }
}
