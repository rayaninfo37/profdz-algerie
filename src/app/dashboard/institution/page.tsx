import { redirect } from 'next/navigation';

export const revalidate = 0;

/**
 * Institution Dashboard
 *
 * Institutions are no longer part of the simplified KRYTY product.
 * Redirects permanently to /dashboard/teacher or /.
 */
export default async function InstitutionDashboardPage() {
  redirect('/');
}
