import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getStudentReports } from '@/app/actions/getStudentReports';
import { getMyMatchedItems } from '@/app/actions/matching';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function StudentDashboardPage() {
  const session = await auth();

  // If not logged in, redirect to login
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  // Redirect role-specific users to their designated portals
  const userRole = (session.user as any).role;
  if (userRole === 'ADMIN') {
    redirect('/admin');
  }

  if (userRole === 'SECURITY') {
    redirect('/admin?tab=claims');
  }

  // Fetch real student reports & matches in parallel
  const [reports, matchedItems] = await Promise.all([
    getStudentReports(),
    getMyMatchedItems(),
  ]);

  return (
    <DashboardClient
      user={{
        id: session.user.id || '',
        name: session.user.name || 'Student',
        email: session.user.email || '',
        studentId: (session.user as any).studentId,
        role: userRole,
      }}
      reports={reports}
      matchedItems={matchedItems}
    />
  );
}
