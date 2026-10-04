import prisma from '@/lib/prisma';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  tx?: any;
}

/**
 * Dispatch an in-app notification to a user.
 */
export async function createNotification({
  userId,
  title,
  message,
  type,
  link,
  tx,
}: CreateNotificationParams) {
  const db = tx || prisma;
  try {
    return await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link: link || null,
        isRead: false,
      },
    });
  } catch (err) {
    console.error('[Notification] Failed to create in-app notification:', err);
    return null;
  }
}

/**
 * 1. Notify reporter when a new lost or found report is submitted.
 */
export async function notifyReporterOfSubmission(
  reporterId: string,
  itemId: string,
  itemName: string,
  itemType: 'LOST' | 'FOUND'
) {
  const typeText = itemType === 'LOST' ? 'Lost' : 'Found';
  return createNotification({
    userId: reporterId,
    title: `${typeText} Report Received: ${itemName}`,
    message: `Your ${typeText.toLowerCase()} item report for "${itemName}" has been safely registered in the Campus Registry. You will be notified of any similarity matches or updates.`,
    type: 'REPORT_RECEIVED',
    link: `/dashboard`,
  });
}

/**
 * 2. Notify student when custom verification questions are dispatched.
 */
export async function notifyStudentOfVerificationQuestions(
  studentId: string,
  itemId: string,
  itemName: string
) {
  return createNotification({
    userId: studentId,
    title: `Verification Questions Received: ${itemName}`,
    message: `Campus Security/Administration has sent verification inquiries for "${itemName}". Please submit your proof of ownership answers.`,
    type: 'VERIFICATION_QUESTION_RECEIVED',
    link: `/dashboard/verification`,
  });
}

/**
 * 3. Notify admins when a student submits verification answers.
 */
export async function notifyAdminsOfVerificationAnswers(
  creatorAdminId: string,
  studentName: string,
  itemId: string,
  itemName: string
) {
  // Notify the creator admin specifically
  await createNotification({
    userId: creatorAdminId,
    title: `Verification Answers Submitted: ${itemName}`,
    message: `${studentName} has submitted answers to your verification inquiries for "${itemName}".`,
    type: 'ANSWERS_SUBMITTED',
    link: `/admin/verification`,
  });

  // Also broadcast to other active administrators
  try {
    const otherAdmins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SECURITY'] },
        id: { not: creatorAdminId },
      },
      select: { id: true },
      take: 10,
    });

    await Promise.all(
      otherAdmins.map((admin) =>
        createNotification({
          userId: admin.id,
          title: `Verification Answers Submitted: ${itemName}`,
          message: `${studentName} has submitted verification answers for "${itemName}".`,
          type: 'ANSWERS_SUBMITTED',
          link: `/admin/verification`,
        })
      )
    );
  } catch (err) {
    console.error('[Notification] Error broadcasting answer alert to admins:', err);
  }
}

/**
 * 4. Notify student when clarification is requested.
 */
export async function notifyStudentOfClarification(
  studentId: string,
  itemId: string,
  itemName: string,
  clarificationNotes?: string | null
) {
  const noteSuffix = clarificationNotes ? ` Note: "${clarificationNotes}"` : '';
  return createNotification({
    userId: studentId,
    title: `Clarification Requested: ${itemName}`,
    message: `Campus Security reviewed your answers and requested additional details.${noteSuffix}`,
    type: 'CLARIFICATION_REQUESTED',
    link: `/dashboard/verification`,
  });
}

/**
 * 5. Notify student when verification is accepted or rejected.
 */
export async function notifyStudentOfVerificationDecision(
  studentId: string,
  itemId: string,
  itemName: string,
  decision: 'ACCEPTED' | 'REJECTED',
  notes?: string | null
) {
  if (decision === 'ACCEPTED') {
    return createNotification({
      userId: studentId,
      title: `Verification Approved: ${itemName}`,
      message: `Your ownership verification for "${itemName}" has been approved! The item is now verified and awaiting physical handover at Campus Security.`,
      type: 'VERIFICATION_ACCEPTED',
      link: `/dashboard`,
    });
  } else {
    const noteSuffix = notes ? ` Reason: "${notes}"` : '';
    return createNotification({
      userId: studentId,
      title: `Verification Not Approved: ${itemName}`,
      message: `Your verification for "${itemName}" was not accepted.${noteSuffix}`,
      type: 'VERIFICATION_REJECTED',
      link: `/dashboard`,
    });
  }
}

/**
 * 6. Notify student when a custody claim is approved or rejected.
 */
export async function notifyStudentOfClaimDecision(
  claimantId: string,
  itemId: string,
  itemName: string,
  decision: 'APPROVED' | 'REJECTED',
  rejectionReason?: string | null
) {
  if (decision === 'APPROVED') {
    return createNotification({
      userId: claimantId,
      title: `Claim Approved: ${itemName}`,
      message: `Your ownership claim for "${itemName}" was verified and approved by Campus Security. Please visit Security for physical handover.`,
      type: 'CLAIM_APPROVED',
      link: `/dashboard`,
    });
  } else {
    const reasonSuffix = rejectionReason ? ` Reason: "${rejectionReason}"` : '';
    return createNotification({
      userId: claimantId,
      title: `Claim Rejected: ${itemName}`,
      message: `Your claim for "${itemName}" could not be verified.${reasonSuffix}`,
      type: 'CLAIM_REJECTED',
      link: `/dashboard`,
    });
  }
}

/**
 * 7. Notify student when physical handover is confirmed.
 */
export async function notifyStudentOfHandover(
  studentId: string,
  itemId: string,
  itemName: string,
  handoverNotes?: string | null
) {
  const noteSuffix = handoverNotes ? ` Handover notes: "${handoverNotes}"` : '';
  return createNotification({
    userId: studentId,
    title: `Handover Confirmed: ${itemName}`,
    message: `Physical handover for "${itemName}" has been officially completed and marked resolved in the Campus Registry.${noteSuffix}`,
    type: 'ITEM_HANDOVER_COMPLETED',
    link: `/dashboard`,
  });
}

