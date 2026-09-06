import { NextRequest, NextResponse } from 'next/server';
import { getItems } from '@/lib/dataStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get('type');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    const type = typeParam ? (typeParam.toUpperCase() as 'LOST' | 'FOUND') : undefined;

    const items = await getItems({
      type,
      category,
      search,
      limit,
    });

    return NextResponse.json({
      success: true,
      total: items.length,
      items,
    });
  } catch (err: any) {
    console.error('API Error in GET /api/items:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to retrieve items.' },
      { status: 500 }
    );
  }
}
