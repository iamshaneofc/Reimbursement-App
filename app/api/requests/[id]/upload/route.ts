import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;

    const request = await prisma.travelRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ error: 'Travel request not found' }, { status: 404 });
    }

    const isOwner = request.employeeId === session.userId;
    const isPrivileged = ['Reporting Manager', 'Head of Department', 'Head of Division', 'MD', 'Finance', 'Admin'].includes(session.role);

    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: 'Unauthorized to upload documents to this request' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const expenseId = formData.get('expenseId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in upload' }, { status: 400 });
    }

    // File size validation (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum permitted limit of 10MB' }, { status: 400 });
    }

    // File format validation
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.csv', '.xlsx'];
    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({
        error: `Invalid file type "${ext}". Permitted formats: PDF, PNG, JPG, WEBP, CSV, XLSX`,
      }, { status: 400 });
    }

    // Create uploads directory in public folder
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Generate sanitized unique filename
    const sanitizedBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storedFileName = `${Date.now()}-${sanitizedBase}${ext}`;
    const filePath = path.join(uploadDir, storedFileName);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${storedFileName}`;

    // Store in Prisma ExpenseDocument
    const document = await prisma.expenseDocument.create({
      data: {
        travelRequestId: id,
        expenseId: expenseId || null,
        fileName: originalName,
        fileUrl: fileUrl,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
      },
    });

    // If attached to an existing expense line, link it
    if (expenseId) {
      await prisma.expense.update({
        where: { id: expenseId },
        data: {
          proofRef: storedFileName,
          proofVerified: true,
        },
      });
    }

    // Log audit event
    await logAuditEvent({
      travelRequestId: id,
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      action: 'UPLOAD_DOCUMENT',
      fromStatus: request.status,
      toStatus: request.status,
      metadata: {
        documentId: document.id,
        fileName: originalName,
        storedFileName,
        fileSize: file.size,
        fileType: file.type,
        fileUrl,
        expenseId: expenseId || null,
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        storedFileName,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
