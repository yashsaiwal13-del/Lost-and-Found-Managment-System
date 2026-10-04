import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import StudentDashboardClient from '@/components/dashboard/StudentDashboardClient';

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; message?: string }>;
}) {
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
    redirect('/security');
  }

  const { denied, message } = await searchParams;

  return (
    <StudentDashboardClient 
      user={session.user} 
      denied={denied === 'true'} 
      deniedMessage={message} 
    />
  );
}
