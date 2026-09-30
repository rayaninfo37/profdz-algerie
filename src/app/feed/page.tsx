import { redirect } from 'next/navigation';

export const revalidate = 0;

/**
 * Educational Feed Page
 * 
 * Public social feed has been disabled in the simplified KRYTY release.
 * Teacher announcements are displayed directly on individual teacher profiles.
 * This route redirects cleanly to /teachers.
 */
export default async function EducationalFeedPage() {
  redirect('/teachers');
}