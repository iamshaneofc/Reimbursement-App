import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Nortex Reimbursement Database ---');

  // Ensure public/receipts directory exists and copy receipt assets
  const publicReceiptsDir = path.join(process.cwd(), 'public', 'receipts');
  if (!fs.existsSync(publicReceiptsDir)) {
    fs.mkdirSync(publicReceiptsDir, { recursive: true });
  }

  const sourceReceiptsDir = path.join(process.cwd(), 'docs', 'takehome_extracted', 'pack', 'receipts');
  if (fs.existsSync(sourceReceiptsDir)) {
    const files = fs.readdirSync(sourceReceiptsDir);
    for (const file of files) {
      const src = path.join(sourceReceiptsDir, file);
      const dest = path.join(publicReceiptsDir, file);
      fs.copyFileSync(src, dest);
    }
    console.log(`Copied ${files.length} receipt images to public/receipts/`);
  }

  // Clear existing data cleanly in reverse dependency order
  await (prisma as any).category?.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.expenseDocument.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.travelRequest.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users from employee_master.csv + Platform Admin
  const employeesData = [
    {
      empCode: 'NX-9001',
      name: 'System Admin',
      email: 'admin@nortexindustries.com',
      designation: 'Enterprise Platform Administrator',
      department: 'IT & Systems',
      costCentre: 'CE000',
      city: 'Mumbai',
      role: 'Admin',
      reportingManagerCode: null,
    },
    {
      empCode: 'NX-1000',
      name: 'Nandita Shah',
      email: 'nandita.shah@nortexindustries.com',
      designation: 'Managing Director',
      department: 'Corporate',
      costCentre: 'CE001',
      city: 'Mumbai',
      role: 'MD',
      reportingManagerCode: null,
    },
    {
      empCode: 'NX-1002',
      name: 'Arvind Rao',
      email: 'arvind.rao@nortexindustries.com',
      designation: 'Head of Division - Commercial',
      department: 'Commercial',
      costCentre: 'CE001',
      city: 'Mumbai',
      role: 'Head of Division',
      reportingManagerCode: 'NX-1000',
    },
    {
      empCode: 'NX-1108',
      name: 'Meera Krishnan',
      email: 'meera.krishnan@nortexindustries.com',
      designation: 'Head of Department - Sales',
      department: 'Sales',
      costCentre: 'CE100',
      city: 'Mumbai',
      role: 'Head of Department',
      reportingManagerCode: 'NX-1002',
    },
    {
      empCode: 'NX-2210',
      name: 'Suresh Iyer',
      email: 'suresh.iyer@nortexindustries.com',
      designation: 'Deputy General Manager',
      department: 'Sales',
      costCentre: 'CE110',
      city: 'Pune',
      role: 'Reporting Manager',
      reportingManagerCode: 'NX-1108',
    },
    {
      empCode: 'NX-4471',
      name: 'Chaitanya Reddy',
      email: 'chaitanya.reddy@nortexindustries.com',
      designation: 'Manager - Key Accounts',
      department: 'Sales',
      costCentre: 'CE110',
      city: 'Pune',
      role: 'Employee',
      reportingManagerCode: 'NX-2210',
    },
    {
      empCode: 'NX-5182',
      name: 'Deepa Nair',
      email: 'deepa.nair@nortexindustries.com',
      designation: 'Manager - Presales',
      department: 'Sales',
      costCentre: 'CE110',
      city: 'Chennai',
      role: 'Employee',
      reportingManagerCode: 'NX-2210',
    },
    {
      empCode: 'NX-4490',
      name: 'Imran Qureshi',
      email: 'imran.qureshi@nortexindustries.com',
      designation: 'Executive - Sales',
      department: 'Sales',
      costCentre: 'CE110',
      city: 'Pune',
      role: 'Employee',
      reportingManagerCode: 'NX-2210',
    },
    {
      empCode: 'NX-3300',
      name: 'Kavitha Balan',
      email: 'kavitha.balan@nortexindustries.com',
      designation: 'Controller',
      department: 'Finance',
      costCentre: 'CE900',
      city: 'Pune',
      role: 'Finance',
      reportingManagerCode: 'NX-1002',
    },
    {
      empCode: 'NX-3305',
      name: 'Ravi Menon',
      email: 'ravi.menon@nortexindustries.com',
      designation: 'Manager - Finance Shared Services',
      department: 'Finance',
      costCentre: 'CE900',
      city: 'Pune',
      role: 'Finance',
      reportingManagerCode: 'NX-3300',
    },
  ];

  // 2. Seed Default Reimbursement Categories
  const defaultCategories = [
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

  for (const cat of defaultCategories) {
    await (prisma as any).category.create({
      data: cat,
    });
  }

  const userMap = new Map<string, any>();

  // Insert users without manager foreign keys first
  for (const emp of employeesData) {
    const user = await prisma.user.create({
      data: {
        empCode: emp.empCode,
        name: emp.name,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        costCentre: emp.costCentre,
        city: emp.city,
        role: emp.role,
      },
    });
    userMap.set(emp.empCode, user);
  }

  // Update manager foreign keys
  for (const emp of employeesData) {
    if (emp.reportingManagerCode) {
      const manager = userMap.get(emp.reportingManagerCode);
      const user = userMap.get(emp.empCode);
      if (manager && user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { reportingManagerId: manager.id },
        });
      }
    }
  }
  console.log(`Seeded ${employeesData.length} users with reporting relationships.`);

  // 2. Seed the Golden-Path Bengaluru Trip for Chaitanya Reddy (NX-4471)
  const chaitanya = userMap.get('NX-4471');
  const suresh = userMap.get('NX-2210');
  const meera = userMap.get('NX-1108');
  const ravi = userMap.get('NX-3305');

  const tripBengaluru = await prisma.travelRequest.create({
    data: {
      requestNumber: 'TR/2026/0612',
      employeeId: chaitanya.id,
      destination: 'Bengaluru / Vertex Technologies',
      cityClass: 'Tier 1',
      startDate: new Date('2026-06-16T00:00:00Z'),
      endDate: new Date('2026-06-20T00:00:00Z'),
      purpose: 'Customer meeting + site visit at Vertex Technologies',
      category: 'Domestic',
      mode: 'Flight',
      estimatedCost: 43876.0,
      employeeBorneEstimate: 33320.0,
      advanceRequested: 20000.0,
      advanceDisbursed: 20000.0,
      advanceReference: 'ADV/2026/0619',
      status: 'APPROVED', // Ready for settlement claim entry & demonstration
      currentStepSequence: 2,
    },
  });

  // Approval steps for the Bengaluru Trip (₹33,320 employee borne -> RM + HOD)
  const step1 = await prisma.approvalStep.create({
    data: {
      travelRequestId: tripBengaluru.id,
      sequence: 1,
      role: 'Reporting Manager',
      approverId: suresh.id,
      status: 'APPROVED',
      remarks: 'Approved for Vertex site visit. Advance sanctioned.',
      decidedAt: new Date('2026-06-10T11:30:00Z'),
    },
  });

  const step2 = await prisma.approvalStep.create({
    data: {
      travelRequestId: tripBengaluru.id,
      sequence: 2,
      role: 'Head of Department',
      approverId: meera.id,
      status: 'APPROVED',
      remarks: 'Approved key customer engagement.',
      decidedAt: new Date('2026-06-10T14:15:00Z'),
    },
  });

  // Initial Audit events for Trip 1
  await prisma.auditEvent.createMany({
    data: [
      {
        travelRequestId: tripBengaluru.id,
        actorId: chaitanya.id,
        actorName: chaitanya.name,
        actorRole: 'Employee',
        action: 'CREATE_REQUEST',
        fromStatus: null,
        toStatus: 'DRAFT',
        metadata: JSON.stringify({ destination: 'Bengaluru', estimatedCost: 43876, advanceRequested: 20000 }),
      },
      {
        travelRequestId: tripBengaluru.id,
        actorId: chaitanya.id,
        actorName: chaitanya.name,
        actorRole: 'Employee',
        action: 'SUBMIT_REQUEST',
        fromStatus: 'DRAFT',
        toStatus: 'PENDING_APPROVAL',
        metadata: JSON.stringify({ approver: 'Suresh Iyer' }),
      },
      {
        travelRequestId: tripBengaluru.id,
        actorId: suresh.id,
        actorName: suresh.name,
        actorRole: 'Reporting Manager',
        action: 'APPROVE_REQUEST',
        fromStatus: 'PENDING_APPROVAL',
        toStatus: 'PENDING_APPROVAL',
        metadata: JSON.stringify({ sequence: 1, remarks: step1.remarks }),
      },
      {
        travelRequestId: tripBengaluru.id,
        actorId: meera.id,
        actorName: meera.name,
        actorRole: 'Head of Department',
        action: 'APPROVE_REQUEST',
        fromStatus: 'PENDING_APPROVAL',
        toStatus: 'APPROVED',
        metadata: JSON.stringify({ sequence: 2, remarks: step2.remarks }),
      },
      {
        travelRequestId: tripBengaluru.id,
        actorId: ravi.id,
        actorName: ravi.name,
        actorRole: 'Finance',
        action: 'DISBURSE_ADVANCE',
        fromStatus: 'APPROVED',
        toStatus: 'APPROVED',
        metadata: JSON.stringify({ amount: 20000, reference: 'ADV/2026/0619' }),
      },
    ],
  });

  // 3. Seed sample pending request by Imran Qureshi (NX-4490) for Manager Queue demo
  const imran = userMap.get('NX-4490');
  const tripImran = await prisma.travelRequest.create({
    data: {
      requestNumber: 'TR/2026/0701',
      employeeId: imran.id,
      destination: 'Ahmedabad / Dealer Conference',
      cityClass: 'Tier 2',
      startDate: new Date('2026-07-15T00:00:00Z'),
      endDate: new Date('2026-07-17T00:00:00Z'),
      purpose: 'Western Region Dealer network meeting',
      category: 'Domestic',
      mode: 'Flight',
      estimatedCost: 22000.0,
      employeeBorneEstimate: 15000.0,
      advanceRequested: 8000.0,
      status: 'PENDING_APPROVAL',
      currentStepSequence: 1,
    },
  });

  await prisma.approvalStep.create({
    data: {
      travelRequestId: tripImran.id,
      sequence: 1,
      role: 'Reporting Manager',
      approverId: suresh.id,
      status: 'PENDING',
    },
  });

  await prisma.auditEvent.create({
    data: {
      travelRequestId: tripImran.id,
      actorId: imran.id,
      actorName: imran.name,
      actorRole: 'Employee',
      action: 'SUBMIT_REQUEST',
      fromStatus: 'DRAFT',
      toStatus: 'PENDING_APPROVAL',
      metadata: JSON.stringify({ advanceRequested: 8000 }),
    },
  });

  console.log('Seeded trips TR/2026/0612 (Golden Path) and TR/2026/0701 (Pending Approval).');
  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
