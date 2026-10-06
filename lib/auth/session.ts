import { cookies, headers } from 'next/headers';
import { verifySessionToken, SessionPayload } from './jwt';
import prisma from '../db/prisma';

export const AUTH_COOKIE_NAME = 'nortex_auth_token';

export async function getCurrentUser(): Promise<(SessionPayload & { fullUser?: any }) | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    // Check Authorization header fallback
    const headerList = headers();
    const authHeader = headerList.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.substring(7);
      return await verifySessionToken(bearerToken);
    }
    return null;
  }

  const payload = await verifySessionToken(token);
  return payload;
}

export async function requireAuth(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireRole(allowedRoles: string[]): Promise<SessionPayload> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role) && user.role !== 'Admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
