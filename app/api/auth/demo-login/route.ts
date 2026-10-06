import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { signSessionToken } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empCode } = body;

    if (!empCode) {
      return NextResponse.json({ error: 'Employee code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { empCode },
      include: { reportingManager: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const token = await signSessionToken({
      userId: user.id,
      empCode: user.empCode,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      costCentre: user.costCentre,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        empCode: user.empCode,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        costCentre: user.costCentre,
        city: user.city,
        reportingManager: user.reportingManager ? {
          name: user.reportingManager.name,
          empCode: user.reportingManager.empCode,
          designation: user.reportingManager.designation,
        } : null,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
