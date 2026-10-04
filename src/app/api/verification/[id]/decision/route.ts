import { NextRequest, NextResponse } from 'next/server';
import { reviewVerificationRequest } from '@/app/actions/verification';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rawBody = await req.json();
    const { decision, adminNotes } = rawBody;

    const result = await reviewVerificationRequest(id, decision, adminNotes);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification decision recorded: ${decision}`,
    });
  } catch (err: any) {
    console.error('API Error in PATCH /api/verification/[id]/decision:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to record verification decision.' },
      { status: 500 }
    );
  }
}
