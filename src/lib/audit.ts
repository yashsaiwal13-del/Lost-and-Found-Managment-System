import prisma from '@/lib/prisma';

export interface WriteAuditLogParams {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, any> | null;
  tx?: any;
}

/**
 * Record an immutable security and administrative action into the AuditLog table.
 * Strictly non-sensitive metadata only (never passwords or private answers).
 */
export async function writeAuditLog({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
  tx,
}: WriteAuditLogParams) {
  const db = tx || prisma;
  try {
    const stringifiedMeta = metadata
      ? typeof metadata === 'string'
        ? metadata
        : JSON.stringify(metadata)
      : null;

    return await db.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId: targetId || null,
        metadata: stringifiedMeta,
      },
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err);
    return null;
  }
}

/**
 * Backward compatibility wrapper
 */
export async function recordAuditLog(params: {
  adminId: string;
  adminName?: string;
  action: string;
  targetId?: string | null;
  details?: string | null;
  targetType?: string;
  metadata?: any;
}) {
  return writeAuditLog({
    actorId: params.adminId,
    action: params.action,
    targetType: params.targetType || 'SYSTEM',
    targetId: params.targetId,
    metadata: params.metadata || (params.details ? { details: params.details } : null),
  });
}
