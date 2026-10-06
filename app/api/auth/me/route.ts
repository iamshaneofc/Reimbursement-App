import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { reportingManager: true },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
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
          id: user.reportingManager.id,
          name: user.reportingManager.name,
          empCode: user.reportingManager.empCode,
          designation: user.reportingManager.designation,
        } : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
