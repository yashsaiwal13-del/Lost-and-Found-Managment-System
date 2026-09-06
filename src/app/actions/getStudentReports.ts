'use server';

import { getCurrentUser } from '@/app/actions/auth';
import { getUserReports } from '@/lib/dataStore';
import { StudentReport } from '@/types';

/**
 * Fetches the currently authenticated student's own reports from the database.
 */
export async function getStudentReports(): Promise<StudentReport[]> {
  try {
    const user = await getCurrentUser();

    const items = await getUserReports({
      userId: user?.id,
      email: user?.email || 'maya.lin@campus.edu',
    });

    return items.map((item) => {
      let statusFormat = item.status.toLowerCase();
      if (statusFormat === 'pending_claim') statusFormat = 'pending_verification';

      return {
        id: item.id,
        title: item.name,
        description: item.description,
        type: item.type.toLowerCase() as any,
        category: item.category as any,
        location: item.location,
        dateReported: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        status: statusFormat as any,
        matchesCount: item.type === 'LOST' ? 1 : 0,
      };
    });
  } catch (err) {
    console.warn('Error fetching student reports:', err);
    return [];
  }
}
