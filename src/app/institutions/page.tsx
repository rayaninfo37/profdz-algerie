import { redirect } from 'next/navigation';

export const revalidate = 0;

/**
 * Institutions Directory Page
 *
 * Institutions are no longer part of the simplified KRYTY product.
 * All discovery focuses on teachers. This route redirects permanently to /teachers.
 */
export default async function InstitutionsPage() {
  redirect('/teachers');
}
