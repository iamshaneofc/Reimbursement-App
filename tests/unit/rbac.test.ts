import { describe, it, expect } from 'vitest';
import { signSessionToken, verifySessionToken } from '@/lib/auth/jwt';

describe('RBAC & Security Token Tests', () => {
  it('32-38. JWT Session Token correctly encapsulates role and cannot be forged without secret', async () => {
    const employeePayload = {
      userId: 'user-chaitanya',
      empCode: 'NX-4471',
      name: 'Chaitanya Reddy',
      email: 'chaitanya.reddy@nortexindustries.com',
      role: 'Employee',
      department: 'Sales',
      costCentre: 'CE110',
    };

    const token = await signSessionToken(employeePayload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('user-chaitanya');
    expect(verified?.role).toBe('Employee');

    // Invalid/tampered token fails verification
    const tamperedToken = token.slice(0, -5) + 'abcde';
    const tamperedResult = await verifySessionToken(tamperedToken);
    expect(tamperedResult).toBeNull();
  });
});
