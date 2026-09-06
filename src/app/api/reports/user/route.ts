import { NextRequest, NextResponse } from 'next/server';
import { getUserReports } from '@/lib/dataStore';
import { getCurrentUser } from '@/app/actions/auth';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // Query reports by user ID or user email
    const reports = await getUserReports({
      userId: currentUser?.id,
      email: currentUser?.email,
    });

    return NextResponse.json({
      success: true,
      currentUser: currentUser
        ? {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
          }
        : null,
      total: reports.length,
      reports,
    });
  } catch (err: any) {
    console.error('API Error in GET /api/reports/user:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to retrieve user reports.' },
      { status: 500 }
    );
  }
}
