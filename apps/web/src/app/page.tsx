import { redirect } from 'next/navigation';

// Root redirects to marketing landing page at /home
// or dashboard at /overview if authenticated
export default function RootPage() {
  // For now, redirect to overview (dashboard)
  // Marketing page is at /(marketing)/page.tsx via route group
  redirect('/overview');
}
