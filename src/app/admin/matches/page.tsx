import { redirect } from 'next/navigation';

export default function AdminMatchesRedirectPage() {
  redirect('/admin?tab=matches');
}
