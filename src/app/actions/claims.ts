'use server';

import prisma from '@/lib/prisma';
import { ClaimStatus, ItemStatus, UserRole } from '@/lib/enums';
import { AdminClaim } from '@/types';
import { requireRole } from '@/lib/authz';

import { 
  submitClaimSchema, 
  approveClaimSchema, 
  rejectClaimSchema, 
  confirmHandoverSchema, 
  formatZodError 
} from '@/lib/validations';
import { 
  notifyStudentOfClaimDecision, 
  notifyStudentOfHandover 
} from '@/lib/notifications';

export interface SubmitClaimInput {
  itemId: string;
  color: string;
  uniqueMark: string;
  lastSeenLocation: string;
  claimantEmail?: string;
}

export interface ClaimActionResult {
  success: boolean;
  error?: string;
  claimId?: string;
  status?: string;
}

/**
 * 1. Save the claim to PostgreSQL via Prisma
 * 2. Set status to PENDING
 * 3. Never auto-approves
 */
export async function submitOwnershipClaim(input: SubmitClaimInput): Promise<ClaimActionResult> {
  const parsed = submitClaimSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: formatZodError(parsed.error),
    };
  }

  const { itemId, color, uniqueMark, lastSeenLocation } = parsed.data;

  // Determine claimant user strictly from session
  let currentUser;
  try {
    currentUser = await requireRole();
  } catch (err) {
    return { success: false, error: 'You must be signed in to submit an ownership claim.' };
  }
  const claimantId = currentUser.id;

  try {
    // Check if target item exists in DB
    const targetItem = await prisma.item.findUnique({
      where: { id: input.itemId },
    });

    if (!targetItem) {
      return { success: false, error: 'Item not found.' };
    }

    // 1. Save the claim
    // 2. Set status to PENDING
    const createdClaim = await prisma.claim.create({
      data: {
        itemId: targetItem.id,
        claimantId: claimantId,
        color: color,
        uniqueMark: uniqueMark,
        lastSeenLocation: lastSeenLocation,
        status: ClaimStatus.PENDING,
      },
    });

    // Update item status to PENDING_CLAIM
    await prisma.item.update({
      where: { id: targetItem.id },
      data: { status: ItemStatus.PENDING_CLAIM },
    });

    return {
      success: true,
      claimId: createdClaim.id,
      status: createdClaim.status,
    };
  } catch (err: any) {
    console.error('Error submitting ownership claim:', err);
    return {
      success: false,
      error: err?.message || 'Failed to submit claim.',
    };
  }
}

/**
 * Fetch all claims for Admin/Security dashboard review from PostgreSQL via Prisma
 */
export async function getAdminClaims(): Promise<AdminClaim[]> {
  await requireRole(['ADMIN', 'SECURITY']);

  const claims = await prisma.claim.findMany({
    include: {
      item: true,
      claimant: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return claims.map((c) => ({
    id: c.id,
    itemId: c.itemId,
    itemTitle: c.item.name,
    itemCategory: c.item.category as any,
    claimantName: c.claimant.name,
    studentId: c.claimant.studentId || 'STU-STUDENT',
    studentEmail: c.claimant.email,
    submittedDate: new Date(c.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    status: c.status.toLowerCase() as any,
    storageLocation: c.item.storageLocation || 'Campus Security Locker',
    answers: {
      exactColor: c.color,
      uniqueMark: c.uniqueMark,
      lastSeenLocation: c.lastSeenLocation,
    },
    rejectionReason: c.rejectionReason || undefined,
  }));
}

import { writeAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

/**
 * Security/Admin approves an ownership claim:
 * - Records reviewer identity from authenticated session (never from client parameter)
 * - Updates claim status to APPROVED
 * - Updates item status to intermediate state VERIFIED (awaiting explicit handover confirmation)
 */
export async function approveClaim(
  claimId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole(['ADMIN', 'SECURITY']);

    const parsed = approveClaimSchema.safeParse({ claimId });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const existing = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true, claimant: true },
    });

    if (!existing) {
      return { success: false, error: 'Claim not found in database.' };
    }

    const reviewerTag = `${user.name} (${user.role})`;

    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: ClaimStatus.APPROVED,
        reviewedBy: reviewerTag,
        resolvedAt: new Date(),
      },
    });

    // Set item to intermediate state VERIFIED (awaiting handover confirmation)
    await prisma.item.update({
      where: { id: existing.itemId },
      data: {
        status: ItemStatus.VERIFIED,
      },
    });

    // Notify the claimant
    await notifyStudentOfClaimDecision(
      existing.claimantId,
      existing.itemId,
      existing.item.name,
      'APPROVED'
    );

    // Record audit log
    await writeAuditLog({
      actorId: user.id,
      action: 'CLAIM_APPROVED',
      targetType: 'CLAIM',
      targetId: existing.id,
      metadata: {
        claimId,
        itemId: existing.itemId,
        itemName: existing.item.name,
        claimantName: existing.claimant.name,
        claimantEmail: existing.claimant.email,
        itemStatus: 'VERIFIED',
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error approving claim:', err);
    return { success: false, error: err?.message || 'Failed to approve claim.' };
  }
}

/**
 * Security/Admin rejects a claim:
 * - Records reviewer identity from authenticated session
 * - Updates claim status to REJECTED with mandatory reason
 */
export async function rejectClaim(
  claimId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole(['ADMIN', 'SECURITY']);

    const parsed = rejectClaimSchema.safeParse({ claimId, reason });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const existing = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true, claimant: true },
    });

    if (!existing) {
      return { success: false, error: 'Claim not found in database.' };
    }

    const reviewerTag = `${user.name} (${user.role})`;

    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: ClaimStatus.REJECTED,
        rejectionReason: parsed.data.reason,
        reviewedBy: reviewerTag,
        resolvedAt: new Date(),
      },
    });

    // Notify claimant
    await notifyStudentOfClaimDecision(
      existing.claimantId,
      existing.itemId,
      existing.item.name,
      'REJECTED',
      parsed.data.reason
    );

    // Record audit log
    await writeAuditLog({
      actorId: user.id,
      action: 'CLAIM_REJECTED',
      targetType: 'CLAIM',
      targetId: existing.id,
      metadata: {
        claimId,
        itemId: existing.itemId,
        itemName: existing.item.name,
        reason: parsed.data.reason,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error rejecting claim:', err);
    return { success: false, error: err?.message || 'Failed to reject claim.' };
  }
}

/**
 * Explicit Second Step: Admin/Security confirms physical item handover to recipient:
 * - Strictly requires ADMIN or SECURITY role
 * - Records real session user ID who authorized and executed the handover
 * - Sets the item status to RESOLVED
 * - Stamps returnedAt timestamp and recipient info
 */
export async function confirmHandover(
  itemId: string,
  recipientUserId?: string,
  handoverNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole(['ADMIN', 'SECURITY']);

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { reportedBy: true },
    });

    if (!item) {
      return { success: false, error: 'Item not found in database.' };
    }

    const effectiveRecipientId = recipientUserId || item.reportedById;

    const parsed = confirmHandoverSchema.safeParse({
      itemId,
      recipientUserId: effectiveRecipientId,
      handoverNotes: handoverNotes || undefined,
    });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const now = new Date();

    // Update item status to RESOLVED and stamp returnedAt
    await prisma.item.update({
      where: { id: itemId },
      data: {
        status: ItemStatus.RESOLVED,
        returnedAt: now,
        returnedToId: effectiveRecipientId,
        handoverByAdminId: user.id,
      },
    });

    // Notify the recipient student
    await notifyStudentOfHandover(
      effectiveRecipientId,
      itemId,
      item.name,
      handoverNotes
    );

    // Record immutable audit trail
    await writeAuditLog({
      actorId: user.id,
      action: 'HANDOVER_CONFIRMED',
      targetType: 'ITEM',
      targetId: itemId,
      metadata: {
        itemName: item.name,
        recipientId: effectiveRecipientId,
        returnedAt: now.toISOString(),
        notes: handoverNotes || undefined,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error confirming handover:', err);
    return { success: false, error: err?.message || 'Failed to confirm item handover.' };
  }
}
