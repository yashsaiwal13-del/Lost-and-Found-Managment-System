'use server';

import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit';
import { archiveReportSchema, restoreReportSchema, formatZodError } from '@/lib/validations';

export interface ModerationResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Soft-archives a campus item report with a mandatory reason.
 * Strictly protected: ADMIN or SECURITY role required via requireRole().
 * 
 * Important: Does NOT delete related Claim, VerificationRequest, or Match rows.
 * Only excludes the item from public and active browsing views.
 */
export async function archiveReport(
  itemId: string,
  reason: string
): Promise<ModerationResult> {
  try {
    const user = await requireRole(['ADMIN', 'SECURITY']);

    const parsed = archiveReportSchema.safeParse({ itemId, reason });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const { itemId: validItemId, reason: validReason } = parsed.data;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return { success: false, error: 'Reported item not found in database.' };
    }

    const now = new Date();

    // Soft-archive the item (preserves all relations, claims, and verification records)
    await prisma.item.update({
      where: { id: itemId },
      data: {
        archived: true,
        archivedReason: reason.trim(),
        archivedAt: now,
        archivedById: user.id,
      },
    });

    // Record immutable audit entry
    await writeAuditLog({
      actorId: user.id,
      action: 'REPORT_ARCHIVED',
      targetType: 'ITEM',
      targetId: itemId,
      metadata: {
        itemName: item.name,
        itemType: item.type,
        category: item.category,
        reason: reason.trim(),
        archivedAt: now.toISOString(),
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error archiving report:', err);
    return { success: false, error: err?.message || 'Failed to archive report.' };
  }
}

/**
 * Server Action: Restores a soft-archived item report back to the active registry.
 * Strictly protected: ADMIN or SECURITY role required via requireRole().
 */
export async function restoreReport(itemId: string): Promise<ModerationResult> {
  try {
    const user = await requireRole(['ADMIN', 'SECURITY']);

    const parsed = restoreReportSchema.safeParse({ itemId });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const { itemId: validItemId } = parsed.data;

    const item = await prisma.item.findUnique({
      where: { id: validItemId },
    });

    if (!item) {
      return { success: false, error: 'Reported item not found in database.' };
    }

    // Restore the item to active status
    await prisma.item.update({
      where: { id: validItemId },
      data: {
        archived: false,
        archivedReason: null,
        archivedAt: null,
        archivedById: null,
      },
    });

    // Record immutable audit entry
    await writeAuditLog({
      actorId: user.id,
      action: 'REPORT_RESTORED',
      targetType: 'ITEM',
      targetId: itemId,
      metadata: {
        itemName: item.name,
        itemType: item.type,
        category: item.category,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error restoring report:', err);
    return { success: false, error: err?.message || 'Failed to restore report.' };
  }
}
