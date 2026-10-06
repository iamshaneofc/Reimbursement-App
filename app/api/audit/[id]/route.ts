import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const { id } = params;

    const events = await prisma.auditEvent.findMany({
      where: { travelRequestId: id },
      include: {
        actor: {
          select: { name: true, empCode: true, designation: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
