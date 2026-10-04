import { NextRequest, NextResponse } from 'next/server';
import { createVerificationRequest } from '@/app/actions/verification';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const { itemId, studentId, questions } = rawBody;

    const result = await createVerificationRequest(itemId, studentId, questions);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification questions successfully dispatched to student.',
        requestId: result.requestId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('API Error in POST /api/verification/questions:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to dispatch verification questions.' },
      { status: 500 }
    );
  }
}
