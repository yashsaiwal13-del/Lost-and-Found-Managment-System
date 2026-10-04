'use server';

import prisma from '@/lib/prisma';
import { updateItemStatus } from '@/lib/dataStore';
import { writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/authz';
import { archiveReport, restoreReport } from '@/app/actions/moderation';

export async function changeItemStatus(itemId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole(['ADMIN', 'SECURITY']);

    const updated = await updateItemStatus(itemId, status);
    if (!updated) {
      return { success: false, error: 'Item not found.' };
    }

    await writeAuditLog({
      actorId: user.id,
      action: 'STATUS_CHANGED',
      targetType: 'ITEM',
      targetId: itemId,
      metadata: {
        newStatus: status,
        itemName: updated.name,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error changing item status:', err);
    return { success: false, error: err?.message || 'Failed to update item status.' };
  }
}

export async function toggleArchiveItem(
  itemId: string,
  archive: boolean,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  if (archive) {
    return archiveReport(itemId, reason || 'Archived by administrator');
  } else {
    return restoreReport(itemId);
  }
}
