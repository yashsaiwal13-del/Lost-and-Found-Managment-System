'use server';

import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/authz';

export interface AdminAuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface GetAuditLogsResult {
  logs: AdminAuditLogEntry[];
  totalCount: number;
}

/**
 * Server Action: Fetches immutable system audit log entries from PostgreSQL via Prisma.
 * Strictly protected: ADMIN or SECURITY role required via requireRole().
 * Sanitizes metadata so that credentials, password hashes, and private raw inputs are never exposed.
 */
export async function getAdminAuditLogs(params?: {
  limit?: number;
  actionFilter?: string;
}): Promise<GetAuditLogsResult> {
  await requireRole(['ADMIN', 'SECURITY']);

  const limit = Math.max(1, Math.min(200, params?.limit || 50));
  const where: any = {};

  if (params?.actionFilter && params.actionFilter !== 'ALL') {
    where.action = params.actionFilter;
  }

  const [totalCount, rawLogs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            studentId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    }),
  ]);

  const logs: AdminAuditLogEntry[] = rawLogs.map((entry) => {
    let sanitizedMetadata: Record<string, any> | null = null;

    if (entry.metadata) {
      let rawMeta: Record<string, any> | null = null;
      if (typeof entry.metadata === 'string') {
        try {
          rawMeta = JSON.parse(entry.metadata);
        } catch {
          rawMeta = { details: entry.metadata };
        }
      } else if (typeof entry.metadata === 'object') {
        rawMeta = entry.metadata as Record<string, any>;
      }

      if (rawMeta) {
        const safe: Record<string, any> = {};
        for (const [key, value] of Object.entries(rawMeta)) {
          const lowerKey = key.toLowerCase();
          if (
            !lowerKey.includes('password') &&
            !lowerKey.includes('hash') &&
            !lowerKey.includes('secret')
          ) {
            safe[key] = value;
          }
        }
        sanitizedMetadata = safe;
      }
    }

    return {
      id: entry.id,
      actorId: entry.actorId,
      actorName: entry.actor?.name || 'System Operator',
      actorEmail: entry.actor?.email || 'admin@campus.edu',
      actorRole: entry.actor?.role || 'ADMIN',
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: sanitizedMetadata,
      createdAt: entry.createdAt.toISOString(),
    };
  });

  return {
    logs,
    totalCount,
  };
}
