import prisma from '../db/prisma';

export interface LogAuditOptions {
  travelRequestId: string;
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  metadata?: Record<string, any> | null;
}

export async function logAuditEvent(options: LogAuditOptions) {
  try {
    return await prisma.auditEvent.create({
      data: {
        travelRequestId: options.travelRequestId,
        actorId: options.actorId || null,
        actorName: options.actorName,
        actorRole: options.actorRole,
        action: options.action,
        fromStatus: options.fromStatus || null,
        toStatus: options.toStatus || null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't crash main operation if audit logging fails
    return null;
  }
}
