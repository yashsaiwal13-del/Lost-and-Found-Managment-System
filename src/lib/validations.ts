import { z, ZodError } from 'zod';

// ----------------------------------------------------
// 1. Authentication Schemas
// ----------------------------------------------------

export const studentRegistrationSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid collegiate email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.'),
  studentId: z
    .string()
    .trim()
    .min(3, 'Student ID / Badge number must be at least 3 characters.'),
  phone: z.string().trim().optional().nullable(),
});

export const adminProfileUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid administrative email.'),
  studentId: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  currentPassword: z.string().optional().nullable(),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters long.')
    .optional()
    .nullable(),
});

// ----------------------------------------------------
// 2. Report Submission Schemas
// ----------------------------------------------------

const imageValidation = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      if (val.startsWith('http://') || val.startsWith('https://')) return true;
      if (val.startsWith('data:image/')) {
        // Validate Data URL MIME type and max size (~7MB base64 string ~ 5MB file)
        const matches = val.match(/^data:image\/(jpeg|png|webp|gif|svg\+xml);base64,/);
        if (!matches) return false;
        return val.length <= 7.5 * 1024 * 1024;
      }
      return false;
    },
    { message: 'Uploaded photo must be a valid JPEG, PNG, WebP, or GIF image under 5MB.' }
  )
  .optional()
  .nullable();

export const reportLostSchema = z.object({
  itemName: z.string().trim().min(2, 'Item name is required (min 2 characters).'),
  category: z.string().trim().min(1, 'Please select an item category.'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters long.'),
  location: z.string().trim().min(2, 'Location lost is required.'),
  specificLocation: z.string().trim().optional().nullable(),
  dateLost: z.string().min(1, 'Date lost is required.'),
  timeLost: z.string().optional().nullable(),
  image: imageValidation,
  additionalDetails: z.string().optional().nullable(),
});

export const reportFoundSchema = z.object({
  itemName: z.string().trim().min(2, 'Item name is required (min 2 characters).'),
  category: z.string().trim().min(1, 'Please select an item category.'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters long.'),
  location: z.string().trim().min(2, 'Location found is required.'),
  specificLocation: z.string().trim().optional().nullable(),
  dateFound: z.string().min(1, 'Date found is required.'),
  timeFound: z.string().optional().nullable(),
  image: imageValidation,
  storageLocation: z.string().trim().optional().nullable(),
  additionalDetails: z.string().optional().nullable(),
});

// ----------------------------------------------------
// 3. Claim Schemas
// ----------------------------------------------------

export const submitClaimSchema = z.object({
  itemId: z.string().trim().min(1, 'Target item ID is required.'),
  color: z.string().trim().min(2, 'Please describe the item color (min 2 characters).'),
  uniqueMark: z.string().trim().min(3, 'Please describe unique markings, serial numbers, or stickers (min 3 characters).'),
  lastSeenLocation: z.string().trim().min(3, 'Please state where you last saw this item (min 3 characters).'),
});

export const approveClaimSchema = z.object({
  claimId: z.string().trim().min(1, 'Claim ID is required.'),
});

export const updateClaimStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
    message: 'Status must be one of: PENDING, APPROVED, REJECTED.',
  }),
  rejectionReason: z.string().trim().optional().nullable(),
  reviewedBy: z.string().trim().optional().nullable(),
});

export const updateItemSchema = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().min(5).optional(),
  category: z.string().trim().optional(),
  location: z.string().trim().optional(),
  status: z.enum([
    'REPORTED',
    'PENDING_REVIEW',
    'OPEN',
    'VERIFICATION_REQUIRED',
    'AWAITING_STUDENT_ANSWERS',
    'ANSWERS_SUBMITTED',
    'PENDING_CLAIM',
    'VERIFIED',
    'ITEM_RETURNED',
    'RESOLVED',
    'REJECTED',
    'ARCHIVED',
  ]).optional(),
  storageLocation: z.string().trim().optional().nullable(),
  additionalDetails: z.string().trim().optional().nullable(),
  isArchived: z.boolean().optional(),
  archivedReason: z.string().trim().optional().nullable(),
});

export const rejectClaimSchema = z.object({
  claimId: z.string().trim().min(1, 'Claim ID is required.'),
  reason: z.string().trim().min(3, 'Rejection reason is required (min 3 characters).'),
});

export const confirmHandoverSchema = z.object({
  itemId: z.string().trim().min(1, 'Item ID is required.'),
  recipientUserId: z.string().trim().min(1, 'Recipient user ID is required.'),
  handoverNotes: z.string().trim().optional().nullable(),
});

// ----------------------------------------------------
// 4. Verification Schemas
// ----------------------------------------------------

export const createVerificationRequestSchema = z.object({
  itemId: z.string().trim().min(1, 'Target Item ID is required.'),
  recipientId: z.string().trim().min(1, 'Recipient student user ID is required.'),
  questions: z
    .array(z.string().trim().min(3, 'Each question must be at least 3 characters.'))
    .min(1, 'At least one verification question is required.')
    .max(10, 'Maximum of 10 verification questions per request.'),
});

export const submitVerificationAnswersSchema = z.object({
  requestId: z.string().trim().min(1, 'Verification request ID is required.'),
  answers: z
    .array(
      z.object({
        questionId: z.string().trim().min(1, 'Question ID is required.'),
        answerText: z.string().trim().min(1, 'Answer text cannot be empty.'),
      })
    )
    .min(1, 'At least one answer must be provided.'),
});

export const reviewVerificationRequestSchema = z.object({
  requestId: z.string().trim().min(1, 'Verification request ID is required.'),
  decision: z.enum(['ACCEPTED', 'REJECTED', 'CLARIFICATION_REQUESTED'], {
    message: 'Decision must be ACCEPTED, REJECTED, or CLARIFICATION_REQUESTED.',
  }),
  reviewNotes: z.string().trim().optional().nullable(),
});

// ----------------------------------------------------
// 5. Moderation & Item Status Schemas
// ----------------------------------------------------

export const archiveReportSchema = z.object({
  itemId: z.string().trim().min(1, 'Item ID is required.'),
  reason: z.string().trim().min(3, 'Archive reason is required (min 3 characters).'),
});

export const restoreReportSchema = z.object({
  itemId: z.string().trim().min(1, 'Item ID is required.'),
});

export const updateItemStatusSchema = z.object({
  status: z.enum([
    'REPORTED',
    'PENDING_REVIEW',
    'OPEN',
    'VERIFICATION_REQUIRED',
    'AWAITING_STUDENT_ANSWERS',
    'ANSWERS_SUBMITTED',
    'PENDING_CLAIM',
    'VERIFIED',
    'ITEM_RETURNED',
    'RESOLVED',
    'REJECTED',
    'ARCHIVED',
  ], {
    message: 'Invalid item status.',
  }),
});

/**
 * Format Zod validation errors into a clean, human-readable message string.
 */
export function formatZodError(error: ZodError): string {
  if (error.issues && error.issues.length > 0) {
    return error.issues.map((issue) => issue.message).join(' ');
  }
  return error.message || 'Invalid input data.';
}
