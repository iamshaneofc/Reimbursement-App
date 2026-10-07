import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/rbac';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth().catch(() => null);
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('all') === 'true' && session && canAccessAdmin(session);

    let categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    // If table is empty, auto-seed defaults
    if (categories.length === 0) {
      const defaults = [
        { name: 'Domestic Travel', code: 'DOM_TRAVEL', icon: 'Plane', description: 'Domestic flights, intercity trains, lodging, and daily meals.', requiresProof: true, maxLimit: 200000, displayOrder: 1 },
        { name: 'International Travel', code: 'INT_TRAVEL', icon: 'Globe', description: 'Cross-border business travel, international airfare, and lodging.', requiresProof: true, maxLimit: 500000, displayOrder: 2 },
        { name: 'Cash Advance', code: 'CASH_ADV', icon: 'Banknote', description: 'Pre-trip petty cash advance up to 60% of estimated out-of-pocket expenses.', requiresProof: false, maxLimit: 50000, displayOrder: 3 },
        { name: 'Meals & Per Diem', code: 'MEALS', icon: 'Utensils', description: 'Daily food allowances and working meal reimbursements during approved travel.', requiresProof: true, maxLimit: 2500, displayOrder: 4 },
        { name: 'Local Conveyance', code: 'LOCAL_CONV', icon: 'Car', description: 'City cabs, auto-rickshaws, metro fares, and business mileage.', requiresProof: true, maxLimit: 5000, displayOrder: 5 },
        { name: 'Business Entertainment', code: 'BUS_ENT', icon: 'Briefcase', description: 'Client entertainment, business lunches/dinners. Prior HOD approval required > ₹2,000.', requiresProof: true, maxLimit: 25000, displayOrder: 6 },
        { name: 'Conference & Training', code: 'CONF_TRAIN', icon: 'Award', description: 'Professional certifications, technical workshops, and conference registrations.', requiresProof: true, maxLimit: 50000, displayOrder: 7 },
        { name: 'Phone & Internet', code: 'PHONE_NET', icon: 'Wifi', description: 'Monthly mobile bill and home broadband reimbursement for eligible staff.', requiresProof: true, maxLimit: 3000, displayOrder: 8 },
        { name: 'General Expense', code: 'GEN_EXP', icon: 'Receipt', description: 'Emergency office supplies, client courier charges, and miscellaneous fees.', requiresProof: true, maxLimit: 10000, displayOrder: 9 },
      ];

      for (const def of defaults) {
        await prisma.category.upsert({
          where: { code: def.code },
          update: {},
          create: def,
        });
      }

      categories = await prisma.category.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { displayOrder: 'asc' },
      });
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!canAccessAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden: Admin authorization required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, icon, description, requiresProof, maxLimit, isActive, displayOrder } = body;

    if (!name || !code || !description) {
      return NextResponse.json({ error: 'Name, code, and description are required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        icon: icon || 'Tag',
        description,
        requiresProof: requiresProof !== undefined ? requiresProof : true,
        maxLimit: maxLimit ? parseFloat(maxLimit) : null,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder ? parseInt(displayOrder, 10) : 10,
      },
    });

    return NextResponse.json({ category, message: 'Category created successfully' });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A category with this name or code already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
