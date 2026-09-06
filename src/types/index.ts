export type ItemType = 'lost' | 'found';

export type ItemStatus = 'open' | 'claimed' | 'pending_verification' | 'resolved';

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
  storageLocation?: string; // Where security holds it, e.g. "Security Desk - Locker #14"
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
  status: ItemStatus;
  matchesCount: number;
  matchedItemId?: string;
  claimId?: string;
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
