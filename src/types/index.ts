export type ItemType = 'lost' | 'found';

export type ItemStatus = 'open' | 'claimed' | 'pending_verification' | 'verified' | 'resolved';

export type Category = 
  | 'Electronics'
  | 'IDs & Cards'
  | 'Books & Notes'
  | 'Keys & Access'
  | 'Clothing & Accessories'
  | 'Bags & Wallets'
  | 'Bottles & Containers'
  | 'Other';

export interface CampusItem {
  id: string;
  title: string;
  description: string;
  type: ItemType;
  category: Category;
  location: string;
  date: string;
  dateIso?: string;
  daysAgo?: number;
  status: ItemStatus;
  imageUrl?: string;
  image?: string | null;
  storageLocation?: string; // Where security holds it, e.g. "Security Desk - Locker #14"
  isArchived?: boolean;
  archivedReason?: string;
  reportedBy: {
    role: 'student' | 'staff' | 'security';
    name: string;
  };
}

export interface StudentStats {
  totalReports: number;
  lostCount: number;
  foundCount: number;
  possibleMatches: number;
  pendingClaims: number;
  resolvedItems: number;
}

export interface StudentReport {
  id: string;
  title: string;
  description: string;
  type: ItemType;
  category: Category;
  location: string;
  dateReported: string;
  rawDate?: string;
  time?: string | null;
  image?: string | null;
  storageLocation?: string | null;
  status: ItemStatus;
  matchesCount: number;
  matchedItemId?: string;
  claimId?: string;
  connectedMatch?: {
    matchId: string;
    foundItemId: string;
    foundItemTitle: string;
    foundItemCategory: string;
    foundItemLocation: string;
    similarityScore: number;
    connectionType: string;
    collectionPoint?: string | null;
    returnStatus?: string | null;
    arrangedAt?: string | null;
    confirmedAt?: string | null;
    instructions?: string | null;
    adminNote?: string | null;
  } | null;
  hasPendingVerification?: boolean;
}

export interface PossibleMatch {
  id: string;
  studentReportId: string;
  studentReportTitle: string;
  foundItem: CampusItem;
  similarityScore: number; // e.g. 96%
  matchReason: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  badge: string;
}

export interface CampusFeature {
  title: string;
  description: string;
  iconName: string;
  badge?: string;
}

export type ClaimDecision = 'pending' | 'approved' | 'rejected';

export interface AdminClaim {
  id: string;
  itemId: string;
  itemTitle: string;
  itemCategory: Category;
  storageLocation: string;
  claimantName: string;
  studentId: string;
  studentEmail: string;
  submittedDate: string;
  status: ClaimDecision;
  rejectionReason?: string;
  answers: {
    exactColor: string;
    uniqueMark: string;
    lastSeenLocation: string;
  };
}

export interface AdminStats {
  totalLostReports: number;
  totalFoundReports: number;
  pendingClaims: number;
  resolvedItems: number;
}

