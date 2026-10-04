import { redirect } from 'next/navigation';

export default function SecurityDeskRedirectPage() {
  redirect('/admin?tab=claims');
}
