import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const isPrivileged = ['Finance', 'Admin', 'MD', 'Head of Division', 'Head of Department', 'Reporting Manager'].includes(user.role);

    const whereClause = isPrivileged
      ? {}
      : {
          OR: [
            { actorId: user.userId },
            { travelRequest: { employeeId: user.userId } },
          ],
        };

    const events = await prisma.auditEvent.findMany({
      where: whereClause,
      include: {
        travelRequest: {
          select: {
            id: true,
            requestNumber: true,
            destination: true,
            status: true,
            employee: {
              select: { name: true, empCode: true },
            },
          },
        },
        actor: {
          select: { name: true, empCode: true, designation: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
