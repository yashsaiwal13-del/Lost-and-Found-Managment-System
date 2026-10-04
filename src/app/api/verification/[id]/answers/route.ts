import { NextRequest, NextResponse } from 'next/server';
import { submitVerificationAnswers } from '@/app/actions/verification';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rawBody = await req.json();
    const { answers } = rawBody;

    const result = await submitVerificationAnswers(id, answers);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your verification answers have been submitted for Administrative review.',
    });
  } catch (err: any) {
    console.error('API Error in POST /api/verification/[id]/answers:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to submit verification answers.' },
      { status: 500 }
    );
  }
}
