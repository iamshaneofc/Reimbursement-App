import { SignJWT, jwtVerify } from 'jose';

function getJwtSecret() {
  const secretStr = process.env.JWT_SECRET || 'nortex-super-secret-demo-jwt-key-2026-reimbursement';
  return new TextEncoder().encode(secretStr);
}

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
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as SessionPayload;
  } catch (err) {
    return null;
  }
}
