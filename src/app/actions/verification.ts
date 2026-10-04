'use server';

import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit';
import { 
  createVerificationRequestSchema,
  submitVerificationAnswersSchema,
  reviewVerificationRequestSchema,
  formatZodError
} from '@/lib/validations';
import { 
  notifyStudentOfVerificationQuestions,
  notifyAdminsOfVerificationAnswers,
  notifyStudentOfClarification,
  notifyStudentOfVerificationDecision
} from '@/lib/notifications';

export interface VerificationQuestionData {
  id: string;
  questionText: string;
  answerText?: string | null;
  answeredAt?: string | null;
  order: number;
}

export interface VerificationRequestData {
  id: string;
  itemId: string;
  item: {
    id: string;
    name: string;
    category: string;
    type: string;
    location: string;
    storageLocation?: string | null;
    status: string;
    image?: string | null;
  };
  recipientId: string;
  recipient: {
    id: string;
    name: string;
    email: string;
    studentId?: string | null;
  };
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  status: 'PENDING' | 'ANSWERED' | 'CLARIFICATION_REQUESTED' | 'ACCEPTED' | 'REJECTED';
  adminNotes?: string | null;
  questions: VerificationQuestionData[];
  createdAt: string;
  updatedAt: string;
}

export interface VerificationActionResult {
  success: boolean;
  error?: string;
  requestId?: string;
}

/**
 * 1. Admin/Security: Creates a new verification inquiry with custom questions targeted at a specific student.
 */
export async function createVerificationRequest(
  itemId: string,
  recipientStudentId: string,
  questions: string[]
): Promise<VerificationActionResult> {
  try {
    const admin = await requireRole(['ADMIN', 'SECURITY']);

    const parsed = createVerificationRequestSchema.safeParse({
      itemId,
      recipientId: recipientStudentId,
      questions,
    });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const { itemId: validItemId, recipientId: validRecipientInput, questions: filteredQuestions } = parsed.data;

    // Verify item exists
    const item = await prisma.item.findUnique({ where: { id: validItemId } });
    if (!item) {
      return { success: false, error: 'Referenced campus item not found.' };
    }

    // Verify recipient student exists (lookup by id or studentId or email)
    const student = await prisma.user.findFirst({
      where: {
        OR: [
          { id: validRecipientInput },
          { studentId: validRecipientInput },
          { email: validRecipientInput.toLowerCase() },
        ],
      },
    });

    if (!student) {
      return { success: false, error: 'Target student not found in university directory.' };
    }

    // Create the VerificationRequest and its ordered questions in a transaction
    const createdRequest = await prisma.verificationRequest.create({
      data: {
        itemId: item.id,
        recipientId: student.id,
        createdById: admin.id,
        status: 'PENDING',
        questions: {
          create: filteredQuestions.map((qText, index) => ({
            questionText: qText,
            order: index,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    // Notify the student
    await notifyStudentOfVerificationQuestions(student.id, item.id, item.name);

    // Log administrative audit action
    await writeAuditLog({
      actorId: admin.id,
      action: 'VERIFICATION_SENT',
      targetType: 'VERIFICATION_REQUEST',
      targetId: createdRequest.id,
      metadata: {
        itemId: item.id,
        itemName: item.name,
        recipientId: student.id,
        recipientName: student.name,
        questionsCount: filteredQuestions.length,
      },
    });

    return {
      success: true,
      requestId: createdRequest.id,
    };
  } catch (err: any) {
    console.error('Error creating verification request:', err);
    return {
      success: false,
      error: err?.message || 'Failed to dispatch verification questions.',
    };
  }
}

/**
 * 2. Admin/Security: Lists all verification requests across campus with full relations.
 */
export async function getVerificationRequestsForAdmin(): Promise<VerificationRequestData[]> {
  await requireRole(['ADMIN', 'SECURITY']);

  const requests = await prisma.verificationRequest.findMany({
    include: {
      item: true,
      recipient: true,
      createdBy: true,
      questions: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    item: {
      id: r.item.id,
      name: r.item.name,
      category: r.item.category,
      type: r.item.type,
      location: r.item.location,
      storageLocation: r.item.storageLocation,
      status: r.item.status,
      image: r.item.image,
    },
    recipientId: r.recipientId,
    recipient: {
      id: r.recipient.id,
      name: r.recipient.name,
      email: r.recipient.email,
      studentId: r.recipient.studentId,
    },
    createdById: r.createdById,
    createdBy: {
      id: r.createdBy.id,
      name: r.createdBy.name,
      role: r.createdBy.role,
    },
    status: r.status as any,
    adminNotes: r.adminNotes,
    questions: r.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      answerText: q.answerText,
      answeredAt: q.answeredAt?.toISOString() || null,
      order: q.order,
    })),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/**
 * 3. Student: Returns ONLY verification requests addressed to the authenticated student session user.
 */
export async function getMyVerificationRequests(): Promise<VerificationRequestData[]> {
  const currentUser = await requireRole();

  const requests = await prisma.verificationRequest.findMany({
    where: {
      recipientId: currentUser.id,
    },
    include: {
      item: true,
      recipient: true,
      createdBy: true,
      questions: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    item: {
      id: r.item.id,
      name: r.item.name,
      category: r.item.category,
      type: r.item.type,
      location: r.item.location,
      storageLocation: r.item.storageLocation,
      status: r.item.status,
      image: r.item.image,
    },
    recipientId: r.recipientId,
    recipient: {
      id: r.recipient.id,
      name: r.recipient.name,
      email: r.recipient.email,
      studentId: r.recipient.studentId,
    },
    createdById: r.createdById,
    createdBy: {
      id: r.createdBy.id,
      name: r.createdBy.name,
      role: r.createdBy.role,
    },
    status: r.status as any,
    adminNotes: r.adminNotes,
    questions: r.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      answerText: q.answerText,
      answeredAt: q.answeredAt?.toISOString() || null,
      order: q.order,
    })),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/**
 * 4. Student: Submits answers to assigned verification questions.
 * Strictly verifies that the authenticated user is the designated recipient.
 */
export async function submitVerificationAnswers(
  requestId: string,
  answers: { questionId: string; answerText: string }[]
): Promise<VerificationActionResult> {
  try {
    const currentUser = await requireRole();

    const parsed = submitVerificationAnswersSchema.safeParse({ requestId, answers });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const { requestId: validReqId, answers: validAnswers } = parsed.data;

    // Verify ownership of the request
    const request = await prisma.verificationRequest.findUnique({
      where: { id: validReqId },
      include: { item: true, questions: true },
    });

    if (!request) {
      return { success: false, error: 'Verification request not found.' };
    }

    // STRICT RECIPIENT SECURITY CHECK: Student can NEVER answer a request addressed to someone else
    if (request.recipientId !== currentUser.id) {
      return {
        success: false,
        error: 'Forbidden: You do not have permission to answer this verification request.',
      };
    }

    // Update each question's answer in the database
    const now = new Date();
    for (const ans of validAnswers) {
      if (ans.questionId && ans.answerText?.trim()) {
        await prisma.verificationQuestion.updateMany({
          where: {
            id: ans.questionId,
            verificationRequestId: request.id,
          },
          data: {
            answerText: ans.answerText.trim(),
            answeredAt: now,
          },
        });
      }
    }

    // Update the request status to ANSWERED
    await prisma.verificationRequest.update({
      where: { id: validReqId },
      data: {
        status: 'ANSWERED',
      },
    });

    // Notify administrators of answer submission
    await notifyAdminsOfVerificationAnswers(
      request.createdById,
      currentUser.name || 'Student',
      request.item.id,
      request.item.name
    );

    return { success: true };
  } catch (err: any) {
    console.error('Error submitting verification answers:', err);
    return {
      success: false,
      error: err?.message || 'Failed to submit verification answers.',
    };
  }
}

/**
 * 5. Admin/Security: Reviews student answers and records a decision.
 */
export async function reviewVerificationRequest(
  requestId: string,
  decision: 'ACCEPTED' | 'REJECTED' | 'CLARIFICATION_REQUESTED',
  note?: string
): Promise<VerificationActionResult> {
  try {
    const admin = await requireRole(['ADMIN', 'SECURITY']);

    const parsed = reviewVerificationRequestSchema.safeParse({
      requestId,
      decision,
      reviewNotes: note,
    });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const { requestId: validReqId, decision: validDecision, reviewNotes: validNote } = parsed.data;

    const request = await prisma.verificationRequest.findUnique({
      where: { id: validReqId },
      include: { item: true, recipient: true },
    });

    if (!request) {
      return { success: false, error: 'Verification request not found.' };
    }

    // Update the verification request
    await prisma.verificationRequest.update({
      where: { id: validReqId },
      data: {
        status: validDecision,
        adminNotes: validNote || null,
      },
    });

    // If ACCEPTED, mark the item as VERIFIED (intermediate state awaiting handover)
    if (validDecision === 'ACCEPTED') {
      await prisma.item.update({
        where: { id: request.itemId },
        data: { status: 'VERIFIED' },
      });
    }

    // Notify the student
    if (validDecision === 'CLARIFICATION_REQUESTED') {
      await notifyStudentOfClarification(
        request.recipientId,
        request.itemId,
        request.item.name,
        validNote
      );
    } else {
      await notifyStudentOfVerificationDecision(
        request.recipientId,
        request.itemId,
        request.item.name,
        validDecision as 'ACCEPTED' | 'REJECTED',
        validNote
      );
    }

    // Record audit log
    await writeAuditLog({
      actorId: admin.id,
      action: validDecision === 'ACCEPTED' ? 'CLAIM_APPROVED' : validDecision === 'REJECTED' ? 'CLAIM_REJECTED' : 'VERIFICATION_REVIEWED',
      targetType: 'VERIFICATION_REQUEST',
      targetId: request.id,
      metadata: {
        decision: validDecision,
        itemId: request.itemId,
        itemName: request.item.name,
        recipientId: request.recipientId,
        note: validNote || undefined,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error reviewing verification request:', err);
    return {
      success: false,
      error: err?.message || 'Failed to record verification review decision.',
    };
  }
}
