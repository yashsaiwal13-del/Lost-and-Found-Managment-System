import { NextRequest, NextResponse } from 'next/server';
import { saveItem } from '@/lib/dataStore';
import { getCurrentUser } from '@/app/actions/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      itemName,
      category,
      description,
      location,
      specificLocation,
      dateLost,
      timeLost,
      image,
      additionalDetails,
    } = body;

    // Validation
    if (!itemName || itemName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Item name is required (min 2 characters).' },
        { status: 400 }
      );
    }
    if (!category || !category.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please select an item category.' },
        { status: 400 }
      );
    }
    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Description must be at least 10 characters long.' },
        { status: 400 }
      );
    }
    if (!location || !location.trim()) {
      return NextResponse.json(
        { success: false, error: 'Location lost is required.' },
        { status: 400 }
      );
    }
    if (!dateLost) {
      return NextResponse.json(
        { success: false, error: 'Date lost is required.' },
        { status: 400 }
      );
    }

    const effectiveLocation = specificLocation?.trim()
      ? `${location.trim()} (${specificLocation.trim()})`
      : location.trim();

    // Authenticated user
    const currentUser = await getCurrentUser();

    const { item, isPostgres } = await saveItem({
      name: itemName.trim(),
      description: description.trim(),
      category: category.trim(),
      type: 'LOST',
      location: effectiveLocation,
      date: dateLost,
      time: timeLost || null,
      image: image || null,
      additionalDetails: additionalDetails?.trim() || null,
      reportedById: currentUser?.id,
      reportedByName: currentUser?.name || 'Maya Lin',
      reportedByEmail: currentUser?.email || 'maya.lin@campus.edu',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Lost item report successfully saved to the database.',
        savedToDatabase: true,
        isPostgres,
        item,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('API Error in /api/reports/lost:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error while saving report.' },
      { status: 500 }
    );
  }
}
