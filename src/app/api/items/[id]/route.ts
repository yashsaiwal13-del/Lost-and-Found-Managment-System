import { NextRequest, NextResponse } from 'next/server';
import { getItemById } from '@/lib/dataStore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getItemById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found in campus database.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (err: any) {
    console.error('API Error in GET /api/items/[id]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to retrieve item.' },
      { status: 500 }
    );
  }
}
