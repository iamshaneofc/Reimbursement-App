import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/rbac';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    if (!canAccessAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden: Admin authorization required' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.code !== undefined) updateData.code = body.code.toUpperCase().trim();
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.requiresProof !== undefined) updateData.requiresProof = Boolean(body.requiresProof);
    if (body.maxLimit !== undefined) updateData.maxLimit = body.maxLimit !== null ? parseFloat(body.maxLimit) : null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.displayOrder !== undefined) updateData.displayOrder = parseInt(body.displayOrder, 10);

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ category: updated, message: 'Category updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    if (!canAccessAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden: Admin authorization required' }, { status: 403 });
    }

    const { id } = params;
    // Soft delete / deactivate
    const updated = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ category: updated, message: 'Category deactivated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
