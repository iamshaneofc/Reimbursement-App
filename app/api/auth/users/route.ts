import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        reportingManager: {
          select: { name: true, empCode: true, designation: true },
        },
      },
      orderBy: [
        { role: 'asc' },
        { empCode: 'asc' },
      ],
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
