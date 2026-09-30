import { redirect } from 'next/navigation';

export const revalidate = 0;

/**
 * Institution Profile Detail Page
 *
 * Institutions are no longer part of the simplified KRYTY product.
 * This route redirects permanently to /teachers.
 */
export default async function InstitutionDetailPage() {
  redirect('/teachers');
}
