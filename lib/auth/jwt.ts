import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nortex-super-secret-demo-jwt-key-2026-reimbursement'
);

export interface SessionPayload {
  userId: string;
  empCode: string;
  name: string;
  email: string;
  role: string;
  department: string;
  costCentre: string;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(JWT_SECRET, token);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
