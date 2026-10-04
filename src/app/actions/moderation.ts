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

export interface DetailedReportView {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  location: string;
  date: string;
  time?: string | null;
  image?: string | null;
  status: string;
  storageLocation?: string | null;
  additionalDetails?: string | null;
  isArchived: boolean;
  archivedReason?: string | null;
  archivedAt?: string | null;
  reportedBy: {
    id: string;
    name: string;
    email: string;
    studentId?: string | null;
    phone?: string | null;
  };
  claims: {
    id: string;
    status: string;
    claimant: {
      id: string;
      name: string;
      email: string;
    };
    createdAt: string;
  }[];
  matches: {
    id: string;
    similarityScore: number;
    status: string;
    connectionType: string;
    otherItem: {
      id: string;
      name: string;
      category: string;
      type: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Server Action: Fetches rich detailed report view by report ID.
 * ADMIN or SECURITY role required.
 */
export async function getReportDetails(itemId: string): Promise<DetailedReportView | null> {
  await requireRole(['ADMIN', 'SECURITY']);

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      reportedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          phone: true,
        },
      },
      claims: {
        include: {
          claimant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      lostMatches: {
        include: {
          foundItem: {
            select: {
              id: true,
              name: true,
              category: true,
              type: true,
            },
          },
        },
      },
      foundMatches: {
        include: {
          lostItem: {
            select: {
              id: true,
              name: true,
              category: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!item) return null;

  const matches = [
    ...item.lostMatches.map((m) => ({
      id: m.id,
      similarityScore: m.similarityScore,
      status: m.status,
      connectionType: m.connectionType,
      otherItem: m.foundItem,
    })),
    ...item.foundMatches.map((m) => ({
      id: m.id,
      similarityScore: m.similarityScore,
      status: m.status,
      connectionType: m.connectionType,
      otherItem: m.lostItem,
    })),
  ];

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    type: item.type,
    location: item.location,
    date: item.date.toISOString(),
    time: item.time,
    image: item.image,
    status: item.status,
    storageLocation: item.storageLocation,
    additionalDetails: item.additionalDetails,
    isArchived: item.archived,
    archivedReason: item.archivedReason,
    archivedAt: item.archivedAt?.toISOString() || null,
    reportedBy: item.reportedBy,
    claims: item.claims.map((c) => ({
      id: c.id,
      status: c.status,
      claimant: c.claimant,
      createdAt: c.createdAt.toISOString(),
    })),
    matches,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

/**
 * Server Action: Permanently deletes a report from database.
 * Strictly protected: ADMIN or SECURITY role required.
 */
export async function deleteReportPermanently(itemId: string, reason?: string): Promise<ModerationResult> {
  try {
    const user = await requireRole(['ADMIN', 'SECURITY']);

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return { success: false, error: 'Report not found in database.' };
    }

    // Write audit log before deletion
    await writeAuditLog({
      actorId: user.id,
      action: 'REPORT_DELETED',
      targetType: 'ITEM',
      targetId: itemId,
      metadata: {
        itemName: item.name,
        itemType: item.type,
        category: item.category,
        reason: reason || 'Deleted by administrator',
      },
    });

    // Delete item (Prisma schema cascades claims, verificationRequests, matches)
    await prisma.item.delete({
      where: { id: itemId },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting report:', err);
    return { success: false, error: err?.message || 'Failed to delete report.' };
  }
}

