export const ItemType = {
  LOST: 'LOST',
  FOUND: 'FOUND',
} as const;
export type ItemType = (typeof ItemType)[keyof typeof ItemType];

export const ItemStatus = {
  REPORTED: 'REPORTED',
  PENDING_REVIEW: 'PENDING_REVIEW',
  OPEN: 'OPEN',
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  AWAITING_STUDENT_ANSWERS: 'AWAITING_STUDENT_ANSWERS',
  ANSWERS_SUBMITTED: 'ANSWERS_SUBMITTED',
  PENDING_CLAIM: 'PENDING_CLAIM',
  VERIFIED: 'VERIFIED',
  ITEM_RETURNED: 'ITEM_RETURNED',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const UserRole = {
  STUDENT: 'STUDENT',
  FACULTY: 'FACULTY',
  SECURITY: 'SECURITY',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ClaimStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ClaimStatus = (typeof ClaimStatus)[keyof typeof ClaimStatus];

export const VerificationStatus = {
  AWAITING_STUDENT_ANSWERS: 'AWAITING_STUDENT_ANSWERS',
  ANSWERS_SUBMITTED: 'ANSWERS_SUBMITTED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  CLARIFICATION_REQUESTED: 'CLARIFICATION_REQUESTED',
  ITEM_RETURNED: 'ITEM_RETURNED',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const AuditAction = {
  QUESTION_SENT: 'QUESTION_SENT',
  CLARIFICATION_REQUESTED: 'CLARIFICATION_REQUESTED',
  ANSWERS_SUBMITTED: 'ANSWERS_SUBMITTED',
  CLAIM_APPROVED: 'CLAIM_APPROVED',
  CLAIM_REJECTED: 'CLAIM_REJECTED',
  VERIFICATION_APPROVED: 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED: 'VERIFICATION_REJECTED',
  ITEM_HANDOVER_COMPLETED: 'ITEM_HANDOVER_COMPLETED',
  REPORT_ARCHIVED: 'REPORT_ARCHIVED',
  REPORT_UNARCHIVED: 'REPORT_UNARCHIVED',
  STATUS_CHANGED: 'STATUS_CHANGED',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const MatchStatus = {
  SUGGESTED: 'SUGGESTED',
  CONFIRMED: 'CONFIRMED',
  DISMISSED: 'DISMISSED',
  DISCONNECTED: 'DISCONNECTED',
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const ConnectionType = {
  MANUAL: 'MANUAL',
  SUGGESTED: 'SUGGESTED',
} as const;
export type ConnectionType = (typeof ConnectionType)[keyof typeof ConnectionType];

export const ReturnStatus = {
  NOT_STARTED: 'NOT_STARTED',
  ARRANGED: 'ARRANGED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
} as const;
export type ReturnStatus = (typeof ReturnStatus)[keyof typeof ReturnStatus];

