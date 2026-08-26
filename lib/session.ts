import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getCurrentUser() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });
    return session?.user ?? null;
  } catch (error) {
    console.error('Error retrieving session user:', error);
    return null;
  }
}
