import { NextRequest, NextResponse } from 'next/server';
import { updateItemStatus } from '@/lib/dataStore';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ['REPORTED', 'OPEN', 'PENDING_CLAIM', 'RESOLVED', 'REJECTED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const updated = await updateItemStatus(id, status.toUpperCase());

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Item not found in database.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Item status successfully updated to ${status.toUpperCase()}.`,
      item: updated,
    });
  } catch (err: any) {
    console.error('API Error in PATCH /api/items/[id]/status:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update item status.' },
      { status: 500 }
    );
  }
}
