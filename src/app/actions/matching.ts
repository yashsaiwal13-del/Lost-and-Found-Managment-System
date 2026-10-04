'use server';

import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/authz';
import { ItemStatus, MatchStatus, ConnectionType, ReturnStatus } from '@/lib/enums';
import { writeAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

export interface SuggestedMatchItem {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  date: string;
  status: string;
  image?: string | null;
  storageLocation?: string | null;
  reportedById?: string | null;
  reportedBy: {
    id: string;
    name: string;
    email: string;
    studentId?: string | null;
    phone?: string | null;
  };
}

export interface SuggestedMatchEntry {
  id: string;
  lostItemId: string;
  foundItemId: string;
  similarityScore: number;
  status: string;
  connectionType: string;
  note?: string | null;
  createdAt: string;
  lostItem: SuggestedMatchItem;
  foundItem: SuggestedMatchItem;
}

export interface ConfirmedMatchEntry {
  id: string;
  lostItemId: string;
  foundItemId: string;
  similarityScore: number;
  status: string;
  connectionType: string; // 'MANUAL' | 'SUGGESTED'
  note?: string | null;
  connectedAt?: string | null;
  connectedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  lostItem: SuggestedMatchItem;
  foundItem: SuggestedMatchItem;
  return?: {
    id: string;
    status: string;
    arrangedAt?: string | null;
    confirmedAt?: string | null;
    notes?: string | null;
  } | null;
}

export interface StudentMatchedItem {
  id: string;
  similarityScore: number;
  connectionType: string;
  connectedAt?: string | null;
  adminNote?: string | null;
  lostItem: {
    id: string;
    name: string;
    category: string;
    description: string;
    location: string;
    date: string;
    time?: string | null;
    status: string;
    image?: string | null;
  };
  foundItem: {
    id: string;
    title: string;
    description: string;
    category: string;
    reportedLocation: string;
    reportedDate: string;
    time?: string | null;
    image?: string | null;
    collectionPoint?: string | null;
  };
  returnStatus?: string | null;
  returnDetails?: {
    id: string;
    status: string;
    arrangedAt?: string | null;
    confirmedAt?: string | null;
    instructions?: string | null;
  } | null;
}

export interface ActionResponse {
  success: boolean;
  error?: string;
  match?: any;
}

/**
 * Server Action: Fetches all CONFIRMED matches for the current session user's lost reports.
 * Any authenticated role (STUDENT, FACULTY, ADMIN, SECURITY).
 * Session-derived identity: never accepts a student ID parameter.
 * Privacy-hardened: Never exposes found item reporter contact/identity fields.
 */
export async function getMyMatchedItems(): Promise<StudentMatchedItem[]> {
  const currentUser = await requireRole();

  const matches = await prisma.match.findMany({
    where: {
      status: MatchStatus.CONFIRMED,
      lostItem: {
        reportedById: currentUser.id,
        archived: false,
      },
      foundItem: {
        archived: false,
      },
    },
    select: {
      id: true,
      similarityScore: true,
      connectionType: true,
      connectedAt: true,
      note: true,
      lostItem: {
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          location: true,
          date: true,
          time: true,
          status: true,
          image: true,
        },
      },
      foundItem: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          location: true,
          date: true,
          time: true,
          image: true,
          storageLocation: true,
        },
      },
      return: {
        select: {
          id: true,
          status: true,
          arrangedAt: true,
          confirmedAt: true,
          notes: true,
        },
      },
    },
    orderBy: {
      connectedAt: 'desc',
    },
  });

  return matches.map((m) => ({
    id: m.id,
    similarityScore: m.similarityScore,
    connectionType: m.connectionType,
    connectedAt: m.connectedAt ? m.connectedAt.toISOString() : null,
    adminNote: m.note,
    lostItem: {
      id: m.lostItem.id,
      name: m.lostItem.name,
      category: m.lostItem.category,
      description: m.lostItem.description,
      location: m.lostItem.location,
      date: m.lostItem.date.toISOString(),
      time: m.lostItem.time,
      status: m.lostItem.status,
      image: m.lostItem.image,
    },
    foundItem: {
      id: m.foundItem.id,
      title: m.foundItem.name,
      description: m.foundItem.description,
      category: m.foundItem.category,
      reportedLocation: m.foundItem.location,
      reportedDate: m.foundItem.date.toISOString(),
      time: m.foundItem.time,
      image: m.foundItem.image,
      collectionPoint: m.foundItem.storageLocation,
    },
    returnStatus: m.return?.status || 'NOT_STARTED',
    returnDetails: m.return
      ? {
          id: m.return.id,
          status: m.return.status,
          arrangedAt: m.return.arrangedAt ? m.return.arrangedAt.toISOString() : null,
          confirmedAt: m.return.confirmedAt ? m.return.confirmedAt.toISOString() : null,
          instructions: m.return.notes,
        }
      : null,
  }));
}

/**
 * Server Action: Fetches all suggested matches across the campus registry.
 * Strictly protected: ADMIN or SECURITY role required.
 */
export async function getSuggestedMatches(): Promise<SuggestedMatchEntry[]> {
  await requireRole(['ADMIN', 'SECURITY']);

  const matches = await prisma.match.findMany({
    where: {
      status: MatchStatus.SUGGESTED,
      lostItem: {
        archived: false,
      },
      foundItem: {
        archived: false,
      },
    },
    include: {
      lostItem: {
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
        },
      },
      foundItem: {
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
        },
      },
    },
    orderBy: {
      similarityScore: 'desc',
    },
  });

  return matches.map((m) => ({
    id: m.id,
    lostItemId: m.lostItemId,
    foundItemId: m.foundItemId,
    similarityScore: m.similarityScore,
    status: m.status,
    connectionType: m.connectionType,
    note: m.note,
    createdAt: m.createdAt.toISOString(),
    lostItem: {
      id: m.lostItem.id,
      name: m.lostItem.name,
      category: m.lostItem.category,
      description: m.lostItem.description,
      location: m.lostItem.location,
      date: m.lostItem.date.toISOString(),
      status: m.lostItem.status,
      image: m.lostItem.image,
      storageLocation: m.lostItem.storageLocation,
      reportedById: m.lostItem.reportedById,
      reportedBy: {
        id: m.lostItem.reportedBy.id,
        name: m.lostItem.reportedBy.name,
        email: m.lostItem.reportedBy.email,
        studentId: m.lostItem.reportedBy.studentId,
        phone: m.lostItem.reportedBy.phone,
      },
    },
    foundItem: {
      id: m.foundItem.id,
      name: m.foundItem.name,
      category: m.foundItem.category,
      description: m.foundItem.description,
      location: m.foundItem.location,
      date: m.foundItem.date.toISOString(),
      status: m.foundItem.status,
      image: m.foundItem.image,
      storageLocation: m.foundItem.storageLocation,
      reportedById: m.foundItem.reportedById,
      reportedBy: {
        id: m.foundItem.reportedBy.id,
        name: m.foundItem.reportedBy.name,
        email: m.foundItem.reportedBy.email,
        studentId: m.foundItem.reportedBy.studentId,
        phone: m.foundItem.reportedBy.phone,
      },
    },
  }));
}

/**
 * Server Action: Fetches all confirmed and connected matches.
 * Strictly protected: ADMIN or SECURITY role required.
 */
export async function getConfirmedMatches(): Promise<ConfirmedMatchEntry[]> {
  await requireRole(['ADMIN', 'SECURITY']);

  const matches = await prisma.match.findMany({
    where: {
      status: MatchStatus.CONFIRMED,
      lostItem: {
        archived: false,
      },
      foundItem: {
        archived: false,
      },
    },
    include: {
      connectedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      return: true,
      lostItem: {
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
        },
      },
      foundItem: {
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
        },
      },
    },
    orderBy: {
      connectedAt: 'desc',
    },
  });

  return matches.map((m) => ({
    id: m.id,
    lostItemId: m.lostItemId,
    foundItemId: m.foundItemId,
    similarityScore: m.similarityScore,
    status: m.status,
    connectionType: m.connectionType,
    note: m.note,
    connectedAt: m.connectedAt ? m.connectedAt.toISOString() : null,
    connectedBy: m.connectedBy
      ? {
          id: m.connectedBy.id,
          name: m.connectedBy.name,
          email: m.connectedBy.email,
        }
      : null,
    createdAt: m.createdAt.toISOString(),
    return: m.return
      ? {
          id: m.return.id,
          status: m.return.status,
          arrangedAt: m.return.arrangedAt ? m.return.arrangedAt.toISOString() : null,
          confirmedAt: m.return.confirmedAt ? m.return.confirmedAt.toISOString() : null,
          notes: m.return.notes,
        }
      : null,
    lostItem: {
      id: m.lostItem.id,
      name: m.lostItem.name,
      category: m.lostItem.category,
      description: m.lostItem.description,
      location: m.lostItem.location,
      date: m.lostItem.date.toISOString(),
      status: m.lostItem.status,
      image: m.lostItem.image,
      storageLocation: m.lostItem.storageLocation,
      reportedById: m.lostItem.reportedById,
      reportedBy: {
        id: m.lostItem.reportedBy.id,
        name: m.lostItem.reportedBy.name,
        email: m.lostItem.reportedBy.email,
        studentId: m.lostItem.reportedBy.studentId,
        phone: m.lostItem.reportedBy.phone,
      },
    },
    foundItem: {
      id: m.foundItem.id,
      name: m.foundItem.name,
      category: m.foundItem.category,
      description: m.foundItem.description,
      location: m.foundItem.location,
      date: m.foundItem.date.toISOString(),
      status: m.foundItem.status,
      image: m.foundItem.image,
      storageLocation: m.foundItem.storageLocation,
      reportedById: m.foundItem.reportedById,
      reportedBy: {
        id: m.foundItem.reportedBy.id,
        name: m.foundItem.reportedBy.name,
        email: m.foundItem.reportedBy.email,
        studentId: m.foundItem.reportedBy.studentId,
        phone: m.foundItem.reportedBy.phone,
      },
    },
  }));
}

/**
 * Server Action: Fetches active lost and found reports for manual matching interface.
 */
export async function getActiveReportsForManualMatching() {
  await requireRole(['ADMIN', 'SECURITY']);

  const [lostReports, foundReports] = await Promise.all([
    prisma.item.findMany({
      where: {
        type: 'LOST',
        archived: false,
        status: { in: [ItemStatus.REPORTED, ItemStatus.OPEN, ItemStatus.PENDING_REVIEW, ItemStatus.PENDING_CLAIM] },
      },
      include: {
        reportedBy: {
          select: { id: true, name: true, email: true, studentId: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.item.findMany({
      where: {
        type: 'FOUND',
        archived: false,
        status: { in: [ItemStatus.REPORTED, ItemStatus.OPEN, ItemStatus.PENDING_REVIEW, ItemStatus.PENDING_CLAIM] },
      },
      include: {
        reportedBy: {
          select: { id: true, name: true, email: true, studentId: true, phone: true },
        },
        foundMatches: {
          where: { status: MatchStatus.CONFIRMED },
          select: { id: true, lostItemId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    lostReports: lostReports.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      location: item.location,
      date: item.date.toISOString(),
      status: item.status,
      image: item.image,
      storageLocation: item.storageLocation,
      reportedBy: item.reportedBy,
    })),
    foundReports: foundReports.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      location: item.location,
      date: item.date.toISOString(),
      status: item.status,
      image: item.image,
      storageLocation: item.storageLocation,
      reportedBy: item.reportedBy,
      isAlreadyConfirmed: item.foundMatches.length > 0,
      confirmedMatchId: item.foundMatches[0]?.id || null,
    })),
  };
}

/**
 * Server Action: Accepts a suggested match.
 * ADMIN/SECURITY-only via requireRole.
 * 
 * Concurrency-hardened:
 * 1. Inside a transaction, checks if any OTHER match for the found item is CONFIRMED.
 * 2. Uses atomic updateMany with a status guard { id: matchId, status: 'SUGGESTED' }.
 *    If count === 0, returns a clear error that another admin already handled/changed it.
 * 3. Sets found item status to PENDING_CLAIM.
 * 4. Initializes or updates Return record.
 */
export async function acceptSuggestedMatch(
  matchId: string,
  note?: string
): Promise<ActionResponse> {
  const admin = await requireRole(['ADMIN', 'SECURITY']);

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch current match
      const currentMatch = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          lostItem: true,
          foundItem: true,
        },
      });

      if (!currentMatch) {
        throw new Error('Suggested match not found.');
      }

      // 2. Uniqueness check: verify no OTHER Match for this foundItemId is already CONFIRMED
      const existingConfirmed = await tx.match.findFirst({
        where: {
          foundItemId: currentMatch.foundItemId,
          status: MatchStatus.CONFIRMED,
          NOT: {
            id: matchId,
          },
        },
      });

      if (existingConfirmed) {
        throw new Error('This found item is already connected to another report.');
      }

      // 3. Concurrency-guarded atomic update: only update if status is still SUGGESTED
      const updateResult = await tx.match.updateMany({
        where: {
          id: matchId,
          status: MatchStatus.SUGGESTED,
        },
        data: {
          status: MatchStatus.CONFIRMED,
          connectedById: admin.id,
          connectedAt: new Date(),
          note: note ? note.trim() : currentMatch.note,
        },
      });

      if (updateResult.count === 0) {
        throw new Error('This match was already handled or updated by another admin.');
      }

      // 4. Update found item status to PENDING_CLAIM
      await tx.item.update({
        where: { id: currentMatch.foundItemId },
        data: { status: ItemStatus.PENDING_CLAIM },
      });

      // 5. Create or connect Return model if not exists
      const existingReturn = await tx.return.findUnique({
        where: { matchId: currentMatch.id },
      });

      if (!existingReturn && currentMatch.lostItem?.reportedById) {
        await tx.return.create({
          data: {
            matchId: currentMatch.id,
            claimantId: currentMatch.lostItem.reportedById,
            status: ReturnStatus.NOT_STARTED,
            arrangedById: admin.id,
            arrangedAt: new Date(),
            notes: note ? `Match confirmed by ${admin.name}: ${note.trim()}` : undefined,
          },
        });
      }

      return {
        id: currentMatch.id,
        lostItemId: currentMatch.lostItemId,
        foundItemId: currentMatch.foundItemId,
        similarityScore: currentMatch.similarityScore,
        lostItemReportedById: currentMatch.lostItem?.reportedById,
        lostItemName: currentMatch.lostItem?.name,
      };
    }, { timeout: 15000, maxWait: 5000 });

    // Post-transaction tasks: Audit log & notification (outside transaction lock to prevent SQLite deadlocks)
    await writeAuditLog({
      actorId: admin.id,
      action: 'MATCH_SUGGESTION_ACCEPTED',
      targetType: 'MATCH',
      targetId: txResult.id,
      metadata: {
        lostItemId: txResult.lostItemId,
        foundItemId: txResult.foundItemId,
        similarityScore: txResult.similarityScore,
        adminNote: note || null,
      },
    });

    if (txResult.lostItemReportedById) {
      await createNotification({
        userId: txResult.lostItemReportedById,
        title: 'Potential Match Confirmed by Campus Security!',
        message: `Good news! Your lost item report for "${txResult.lostItemName}" has been connected with found item #${txResult.foundItemId}. Campus safety is preparing the return handover.`,
        type: 'MATCH_FOUND',
        link: `/dashboard`,
      });
    }

    return {
      success: true,
      match: { id: txResult.id, status: MatchStatus.CONFIRMED },
    };
  } catch (err: any) {
    console.error('Error accepting suggested match:', err);
    return {
      success: false,
      error: err.message || 'Failed to accept suggested match.',
    };
  }
}

/**
 * Server Action: Dismisses a suggested match.
 * ADMIN/SECURITY-only via requireRole.
 * Concurrency-guarded: Only dismisses if currently SUGGESTED.
 */
export async function dismissSuggestedMatch(matchId: string): Promise<ActionResponse> {
  const admin = await requireRole(['ADMIN', 'SECURITY']);

  try {
    const updateResult = await prisma.match.updateMany({
      where: {
        id: matchId,
        status: MatchStatus.SUGGESTED,
      },
      data: {
        status: MatchStatus.DISMISSED,
      },
    });

    if (updateResult.count === 0) {
      return {
        success: false,
        error: 'This match was already handled or dismissed by another admin.',
      };
    }

    await writeAuditLog({
      actorId: admin.id,
      action: 'MATCH_SUGGESTION_DISMISSED',
      targetType: 'MATCH',
      targetId: matchId,
      metadata: { matchId },
    });

    return {
      success: true,
    };
  } catch (err: any) {
    console.error('Error dismissing suggested match:', err);
    return {
      success: false,
      error: err.message || 'Failed to dismiss match.',
    };
  }
}

/**
 * Server Action: Manually connects a lost report and found report.
 * ADMIN/SECURITY-only via requireRole.
 * 
 * In a prisma transaction:
 * 1. Verify no Match for this foundItemId is already CONFIRMED.
 *    If one does, return { success: false, error: "This found item is already connected to another report." }
 * 2. Upsert Match row (status: CONFIRMED, connectionType: MANUAL, connectedById, connectedAt, note).
 * 3. Set the found Item's status to PENDING_CLAIM.
 */
export async function connectReportsManually(
  lostItemId: string,
  foundItemId: string,
  note?: string
): Promise<ActionResponse> {
  const admin = await requireRole(['ADMIN', 'SECURITY']);

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      // 1. Verify items exist
      const [lostItem, foundItem] = await Promise.all([
        tx.item.findUnique({ where: { id: lostItemId } }),
        tx.item.findUnique({ where: { id: foundItemId } }),
      ]);

      if (!lostItem || !foundItem) {
        throw new Error('Lost or Found report not found.');
      }

      if (lostItem.archived || foundItem.archived) {
        throw new Error('Cannot connect archived reports.');
      }

      // 2. Uniqueness check: verify no Match for this foundItemId is already CONFIRMED
      const existingConfirmed = await tx.match.findFirst({
        where: {
          foundItemId: foundItemId,
          status: MatchStatus.CONFIRMED,
          NOT: {
            lostItemId: lostItemId,
          },
        },
      });

      if (existingConfirmed) {
        throw new Error('This found item is already connected to another report.');
      }

      // 3. Upsert Match row (status: CONFIRMED, connectionType: MANUAL)
      const match = await tx.match.upsert({
        where: {
          lostItemId_foundItemId: {
            lostItemId,
            foundItemId,
          },
        },
        update: {
          status: MatchStatus.CONFIRMED,
          connectionType: ConnectionType.MANUAL,
          connectedById: admin.id,
          connectedAt: new Date(),
          note: note ? note.trim() : undefined,
        },
        create: {
          lostItemId,
          foundItemId,
          similarityScore: 1.0, // Manual connection by administrator
          status: MatchStatus.CONFIRMED,
          connectionType: ConnectionType.MANUAL,
          connectedById: admin.id,
          connectedAt: new Date(),
          note: note ? note.trim() : null,
        },
      });

      // 4. Update found item status to PENDING_CLAIM
      await tx.item.update({
        where: { id: foundItemId },
        data: {
          status: ItemStatus.PENDING_CLAIM,
        },
      });

      // 5. Initialize Return row if not exists
      if (lostItem.reportedById) {
        await tx.return.upsert({
          where: { matchId: match.id },
          update: {
            claimantId: lostItem.reportedById,
            arrangedById: admin.id,
            arrangedAt: new Date(),
            notes: note ? `Manual connection: ${note.trim()}` : undefined,
          },
          create: {
            matchId: match.id,
            claimantId: lostItem.reportedById,
            status: ReturnStatus.NOT_STARTED,
            arrangedById: admin.id,
            arrangedAt: new Date(),
            notes: note ? `Manual connection by ${admin.name}: ${note.trim()}` : undefined,
          },
        });
      }

      return {
        match,
        lostItemReportedById: lostItem.reportedById,
        lostItemName: lostItem.name,
      };
    }, { timeout: 15000, maxWait: 5000 });

    // Post-transaction: Audit log & notification outside transaction
    await writeAuditLog({
      actorId: admin.id,
      action: 'MANUAL_MATCH_CONNECTED',
      targetType: 'MATCH',
      targetId: txResult.match.id,
      metadata: {
        lostItemId,
        foundItemId,
        connectionType: 'MANUAL',
        adminNote: note || null,
      },
    });

    if (txResult.lostItemReportedById) {
      await createNotification({
        userId: txResult.lostItemReportedById,
        title: 'Manual Match Connected by Campus Security!',
        message: `Campus Security manually matched your lost report "${txResult.lostItemName}" with found report #${foundItemId}.`,
        type: 'MATCH_FOUND',
        link: `/dashboard`,
      });
    }

    return {
      success: true,
      match: txResult.match,
    };
  } catch (err: any) {
    console.error('Error manually connecting reports:', err);
    return {
      success: false,
      error: err.message || 'Failed to connect reports manually.',
    };
  }
}

/**
 * Server Action: Disconnects an existing match.
 * ADMIN/SECURITY-only via requireRole.
 * 
 * Concurrency-guarded:
 * 1. Sets Match.status to DISCONNECTED, disconnectedById to current admin,
 *    disconnectedAt to now, disconnectReason to given reason.
 *    (uses atomic updateMany with guard { id: matchId, status: 'CONFIRMED' }).
 * 2. If a Return row exists for this match and its status isn't CONFIRMED,
 *    sets that Return's status to CANCELLED too.
 * 3. Never deletes Match or Return rows.
 * 4. Sets the found Item's status back to OPEN only if no other CONFIRMED match exists for it.
 */
export async function disconnectMatch(
  matchId: string,
  reason: string
): Promise<ActionResponse> {
  const admin = await requireRole(['ADMIN', 'SECURITY']);

  const cleanReason = reason ? reason.trim() : '';
  if (!cleanReason) {
    return {
      success: false,
      error: 'A reason is required to disconnect a match.',
    };
  }

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: { foundItem: true },
      });

      if (!match) {
        throw new Error('Match record not found.');
      }

      // Concurrency guard: Only update if status is currently CONFIRMED
      const updateResult = await tx.match.updateMany({
        where: {
          id: matchId,
          status: MatchStatus.CONFIRMED,
        },
        data: {
          status: MatchStatus.DISCONNECTED,
          disconnectedById: admin.id,
          disconnectedAt: new Date(),
          disconnectReason: cleanReason,
        },
      });

      if (updateResult.count === 0) {
        throw new Error('This match was already disconnected or modified by another admin.');
      }

      // Revert found item status to OPEN only if no other CONFIRMED match exists for it
      const remainingConfirmed = await tx.match.findFirst({
        where: {
          foundItemId: match.foundItemId,
          status: MatchStatus.CONFIRMED,
          NOT: { id: matchId },
        },
      });

      if (!remainingConfirmed) {
        await tx.item.update({
          where: { id: match.foundItemId },
          data: {
            status: ItemStatus.OPEN,
          },
        });
      }

      // If a Return row exists for this match and its status isn't CONFIRMED, set that Return's status to CANCELLED too
      await tx.return.updateMany({
        where: {
          matchId: match.id,
          status: {
            not: ReturnStatus.CONFIRMED,
          },
        },
        data: {
          status: ReturnStatus.CANCELLED,
          notes: `Match disconnected by ${admin.name}: ${cleanReason}`,
        },
      });

      return {
        matchId: match.id,
        lostItemId: match.lostItemId,
        foundItemId: match.foundItemId,
      };
    }, { timeout: 15000, maxWait: 5000 });

    // Record Audit Log post-transaction
    await writeAuditLog({
      actorId: admin.id,
      action: 'MATCH_DISCONNECTED',
      targetType: 'MATCH',
      targetId: txResult.matchId,
      metadata: {
        lostItemId: txResult.lostItemId,
        foundItemId: txResult.foundItemId,
        reason: cleanReason,
      },
    });

    return {
      success: true,
      match: { id: txResult.matchId, status: MatchStatus.DISCONNECTED },
    };
  } catch (err: any) {
    console.error('Error disconnecting match:', err);
    return {
      success: false,
      error: err.message || 'Failed to disconnect match.',
    };
  }
}

export interface CollectedItemEntry {
  id: string; // Return ID
  matchId: string;
  lostItemId: string;
  foundItemId: string;
  title: string;
  category: string;
  description: string;
  image?: string | null;
  lostLocation: string;
  lostDate: string;
  foundLocation: string;
  foundDate: string;
  storageLocation?: string | null;
  confirmedAt: string;
  confirmedBy?: {
    id: string;
    name: string;
  } | null;
  notes?: string | null;
}

/**
 * Server Action: Arranges physical collection/pickup for a confirmed match.
 * ADMIN/SECURITY-only via requireRole.
 */
export async function arrangeCollection(
  matchId: string,
  notes?: string
): Promise<ActionResponse> {
  const admin = await requireRole(['ADMIN', 'SECURITY']);

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: { lostItem: true },
      });

      if (!match) {
        throw new Error('Match record not found.');
      }

      if (match.status !== MatchStatus.CONFIRMED) {
        throw new Error('Match must be in CONFIRMED status before arranging collection.');
      }

      const cleanNotes = notes ? notes.trim() : null;

      // Upsert Return row for this match
      const returnRow = await tx.return.upsert({
        where: { matchId },
        update: {
          status: ReturnStatus.ARRANGED,
          arrangedById: admin.id,
          arrangedAt: new Date(),
          notes: cleanNotes,
        },
        create: {
          matchId,
          claimantId: match.lostItem.reportedById,
          status: ReturnStatus.ARRANGED,
          arrangedById: admin.id,
          arrangedAt: new Date(),
          notes: cleanNotes,
        },
      });

      return {
        returnRow,
        lostItemReportedById: match.lostItem?.reportedById,
        lostItemName: match.lostItem?.name,
        cleanNotes,
      };
    }, { timeout: 15000, maxWait: 5000 });

    // Post-transaction: Audit Log & Notification
    await writeAuditLog({
      actorId: admin.id,
      action: 'RETURN_ARRANGED',
      targetType: 'RETURN',
      targetId: txResult.returnRow.id,
      metadata: {
        matchId,
        claimantId: txResult.returnRow.claimantId,
        notes: txResult.cleanNotes,
      },
    });

    if (txResult.lostItemReportedById) {
      await createNotification({
        userId: txResult.lostItemReportedById,
        title: 'Collection Arranged for Your Lost Item!',
        message: `Campus Security has scheduled pickup for "${txResult.lostItemName}". Notes: ${txResult.cleanNotes || 'Please visit the security desk with your Student ID.'}`,
        type: 'ITEM_READY_FOR_PICKUP',
        link: '/dashboard',
      });
    }

    return {
      success: true,
      match: txResult.returnRow,
    };
  } catch (err: any) {
    console.error('Error arranging collection:', err);
    return {
      success: false,
      error: err.message || 'Failed to arrange collection.',
    };
  }
}

/**
 * Server Action: Confirms physical handover of an item to the student.
 * ADMIN/SECURITY-only via requireRole.
 * 
 * Concurrency-guarded:
 * 1. Requires Return status to currently be ARRANGED.
 * 2. Uses atomic updateMany guard. If count === 0, returns a clear error.
 * 3. Sets Return status to CONFIRMED, confirmedAt to now, confirmedById to admin.
 * 4. Sets both the found Item's AND the lost Item's status to RESOLVED.
 * 5. This is the exclusive path that can set a Return to CONFIRMED.
 */
export async function confirmHandover(
  matchId: string,
  notes?: string
): Promise<ActionResponse> {
  const admin = await requireRole(['ADMIN', 'SECURITY']);

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      // 1. Concurrency-guarded update on Return row: must be currently ARRANGED
      const updateResult = await tx.return.updateMany({
        where: {
          matchId,
          status: ReturnStatus.ARRANGED,
        },
        data: {
          status: ReturnStatus.CONFIRMED,
          confirmedAt: new Date(),
          confirmedById: admin.id,
          notes: notes ? notes.trim() : undefined,
        },
      });

      if (updateResult.count === 0) {
        throw new Error(
          'Return must be in ARRANGED status before handover can be confirmed, or it was already confirmed by another admin.'
        );
      }

      // 2. Fetch match and items
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          lostItem: true,
          foundItem: true,
          return: true,
        },
      });

      if (!match) {
        throw new Error('Match record not found.');
      }

      const claimantId = match.return?.claimantId || match.lostItem.reportedById;

      // 3. Set both found Item and lost Item status to RESOLVED
      await tx.item.update({
        where: { id: match.foundItemId },
        data: {
          status: ItemStatus.RESOLVED,
          returnedAt: new Date(),
          returnedToId: claimantId,
          handoverByAdminId: admin.id,
        },
      });

      await tx.item.update({
        where: { id: match.lostItemId },
        data: {
          status: ItemStatus.RESOLVED,
          returnedAt: new Date(),
          returnedToId: claimantId,
          handoverByAdminId: admin.id,
        },
      });

      return {
        returnRow: match.return,
        matchId: match.id,
        lostItemId: match.lostItemId,
        foundItemId: match.foundItemId,
        claimantId,
        lostItemName: match.lostItem?.name,
      };
    }, { timeout: 15000, maxWait: 5000 });

    // Post-transaction: Audit Log & Notification
    await writeAuditLog({
      actorId: admin.id,
      action: 'HANDOVER_CONFIRMED',
      targetType: 'RETURN',
      targetId: txResult.returnRow?.id || txResult.matchId,
      metadata: {
        matchId: txResult.matchId,
        lostItemId: txResult.lostItemId,
        foundItemId: txResult.foundItemId,
        claimantId: txResult.claimantId,
        notes: notes || null,
      },
    });

    if (txResult.claimantId) {
      await createNotification({
        userId: txResult.claimantId,
        title: 'Item Handover Officially Confirmed',
        message: `Campus Security confirmed the physical handover of "${txResult.lostItemName}". Your report is now officially RESOLVED.`,
        type: 'ITEM_HANDOVER_COMPLETED',
        link: '/dashboard/collected',
      });
    }

    return {
      success: true,
      match: txResult.returnRow,
    };
  } catch (err: any) {
    console.error('Error confirming handover:', err);
    return {
      success: false,
      error: err.message || 'Failed to confirm item handover.',
    };
  }
}

/**
 * Server Action: Fetches all CONFIRMED collected items for the current session user.
 * Any authenticated role (STUDENT, etc.).
 * Filtered strictly to Return rows with status: CONFIRMED and claimantId == currentUser.id.
 * Items in ARRANGED status are NEVER returned here.
 */
export async function getMyCollectedItems(): Promise<CollectedItemEntry[]> {
  const currentUser = await requireRole();

  const returns = await prisma.return.findMany({
    where: {
      status: ReturnStatus.CONFIRMED,
      claimantId: currentUser.id,
    },
    include: {
      confirmedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      match: {
        include: {
          lostItem: true,
          foundItem: true,
        },
      },
    },
    orderBy: {
      confirmedAt: 'desc',
    },
  });

  return returns.map((r) => ({
    id: r.id,
    matchId: r.matchId,
    lostItemId: r.match.lostItemId,
    foundItemId: r.match.foundItemId,
    title: r.match.lostItem.name,
    category: r.match.lostItem.category,
    description: r.match.lostItem.description,
    image: r.match.foundItem.image || r.match.lostItem.image,
    lostLocation: r.match.lostItem.location,
    lostDate: r.match.lostItem.date.toISOString(),
    foundLocation: r.match.foundItem.location,
    foundDate: r.match.foundItem.date.toISOString(),
    storageLocation: r.match.foundItem.storageLocation,
    confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : r.updatedAt.toISOString(),
    confirmedBy: r.confirmedBy,
    notes: r.notes,
  }));
}

/**
 * Server Action: Student accepts an admin-confirmed connection.
 * Sets Return status to ARRANGED, logs audit entry, and notifies campus admins.
 */
export async function studentAcceptMatch(matchId: string): Promise<ActionResponse> {
  const currentUser = await requireRole();

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          lostItem: true,
          foundItem: true,
          return: true,
        },
      });

      if (!match) {
        throw new Error('Connection record not found.');
      }

      if (match.lostItem.reportedById !== currentUser.id) {
        throw new Error('You do not have permission to accept this connection.');
      }

      if (match.status !== MatchStatus.CONFIRMED) {
        throw new Error('This connection is no longer active.');
      }

      // Upsert return to ARRANGED status
      const returnRow = await tx.return.upsert({
        where: { matchId: match.id },
        update: {
          status: ReturnStatus.ARRANGED,
          arrangedAt: new Date(),
          notes: match.return?.notes || 'Match accepted by student. Ready for collection.',
        },
        create: {
          matchId: match.id,
          claimantId: currentUser.id,
          status: ReturnStatus.ARRANGED,
          arrangedAt: new Date(),
          notes: 'Match accepted by student. Ready for collection.',
        },
      });

      return {
        matchId: match.id,
        lostItemName: match.lostItem.name,
        foundItemId: match.foundItemId,
        returnRow,
      };
    }, { timeout: 15000, maxWait: 5000 });

    await writeAuditLog({
      actorId: currentUser.id,
      action: 'STUDENT_MATCH_ACCEPTED',
      targetType: 'MATCH',
      targetId: matchId,
      metadata: {
        matchId,
        studentName: currentUser.name,
        item: txResult.lostItemName,
      },
    });

    return {
      success: true,
      match: txResult.returnRow,
    };
  } catch (err: any) {
    console.error('Error in studentAcceptMatch:', err);
    return {
      success: false,
      error: err.message || 'Failed to accept connection.',
    };
  }
}

/**
 * Server Action: Student rejects an admin-confirmed connection ("Not Mine").
 * Sets match status to DISCONNECTED, cancels pending return, and reverts found item status to OPEN.
 */
export async function studentRejectMatch(
  matchId: string,
  reason?: string
): Promise<ActionResponse> {
  const currentUser = await requireRole();

  try {
    const cleanReason = reason?.trim() || 'Student indicated this is not their item.';

    const txResult = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          lostItem: true,
          foundItem: true,
        },
      });

      if (!match) {
        throw new Error('Connection record not found.');
      }

      if (match.lostItem.reportedById !== currentUser.id) {
        throw new Error('You do not have permission to reject this connection.');
      }

      // Disconnect match
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.DISCONNECTED,
          disconnectedById: currentUser.id,
          disconnectedAt: new Date(),
          disconnectReason: cleanReason,
        },
      });

      // Check if another confirmed match exists for found item
      const otherConfirmed = await tx.match.findFirst({
        where: {
          foundItemId: match.foundItemId,
          status: MatchStatus.CONFIRMED,
          NOT: { id: matchId },
        },
      });

      if (!otherConfirmed) {
        await tx.item.update({
          where: { id: match.foundItemId },
          data: { status: ItemStatus.OPEN },
        });
      }

      // Cancel return if exists
      await tx.return.updateMany({
        where: {
          matchId,
          status: { not: ReturnStatus.CONFIRMED },
        },
        data: {
          status: ReturnStatus.CANCELLED,
          notes: `Rejected by student: ${cleanReason}`,
        },
      });

      return {
        matchId: match.id,
        lostItemName: match.lostItem.name,
        foundItemId: match.foundItemId,
      };
    }, { timeout: 15000, maxWait: 5000 });

    await writeAuditLog({
      actorId: currentUser.id,
      action: 'STUDENT_MATCH_REJECTED',
      targetType: 'MATCH',
      targetId: matchId,
      metadata: {
        matchId,
        studentName: currentUser.name,
        reason: cleanReason,
      },
    });

    return {
      success: true,
    };
  } catch (err: any) {
    console.error('Error in studentRejectMatch:', err);
    return {
      success: false,
      error: err.message || 'Failed to reject connection.',
    };
  }
}

/**
 * Server Action: Student marks the item as Claimed & Collected.
 * Sets Return to CONFIRMED, marks both Lost & Found items as RESOLVED,
 * records audit log and notifies campus administration.
 */
export async function studentClaimItem(matchId: string): Promise<ActionResponse> {
  const currentUser = await requireRole();

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          lostItem: true,
          foundItem: true,
          return: true,
        },
      });

      if (!match) {
        throw new Error('Connection record not found.');
      }

      if (match.lostItem.reportedById !== currentUser.id) {
        throw new Error('You do not have authorization to claim this item.');
      }

      // Update Return row to CONFIRMED
      const returnRow = await tx.return.upsert({
        where: { matchId },
        update: {
          status: ReturnStatus.CONFIRMED,
          confirmedAt: new Date(),
          notes: 'Item confirmed collected and claimed by student.',
        },
        create: {
          matchId,
          claimantId: currentUser.id,
          status: ReturnStatus.CONFIRMED,
          confirmedAt: new Date(),
          notes: 'Item confirmed collected and claimed by student.',
        },
      });

      // Mark both Lost and Found items as RESOLVED
      await tx.item.update({
        where: { id: match.foundItemId },
        data: {
          status: ItemStatus.RESOLVED,
          returnedAt: new Date(),
          returnedToId: currentUser.id,
        },
      });

      await tx.item.update({
        where: { id: match.lostItemId },
        data: {
          status: ItemStatus.RESOLVED,
          returnedAt: new Date(),
          returnedToId: currentUser.id,
        },
      });

      return {
        matchId: match.id,
        lostItemId: match.lostItemId,
        foundItemId: match.foundItemId,
        lostItemName: match.lostItem.name,
        returnRow,
      };
    }, { timeout: 15000, maxWait: 5000 });

    // Write audit log
    await writeAuditLog({
      actorId: currentUser.id,
      action: 'ITEM_CLAIMED_BY_STUDENT',
      targetType: 'RETURN',
      targetId: txResult.returnRow.id,
      metadata: {
        matchId,
        claimantId: currentUser.id,
        lostItemId: txResult.lostItemId,
        foundItemId: txResult.foundItemId,
        item: txResult.lostItemName,
      },
    });

    // Notify administrators
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SECURITY'] } },
        select: { id: true },
        take: 10,
      });

      await Promise.all(
        admins.map((admin) =>
          createNotification({
            userId: admin.id,
            title: `Item Claimed: ${txResult.lostItemName}`,
            message: `${currentUser.name} confirmed they collected and claimed their matched item #${txResult.foundItemId}. Item is now marked RESOLVED.`,
            type: 'ITEM_HANDOVER_COMPLETED',
            link: '/admin?tab=custody',
          })
        )
      );
    } catch (notifErr) {
      console.error('Error notifying admins of claim:', notifErr);
    }

    return {
      success: true,
      match: txResult.returnRow,
    };
  } catch (err: any) {
    console.error('Error in studentClaimItem:', err);
    return {
      success: false,
      error: err.message || 'Failed to claim item.',
    };
  }
}

