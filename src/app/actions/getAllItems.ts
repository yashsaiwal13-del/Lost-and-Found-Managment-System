'use server';

import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/authz';

export interface AdminCampusItem {
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
  reportedById: string;
  reportedByName: string;
  reportedByEmail: string;
  reportedByStudentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Server Action: Fetches all items directly from PostgreSQL via Prisma for Admin & Security console.
 * Strictly requires ADMIN or SECURITY role via requireRole().
 */
export async function getAllAdminItems(params?: {
  includeArchived?: boolean;
}): Promise<AdminCampusItem[]> {
  await requireRole(['ADMIN', 'SECURITY']);

  const where: any = {};
  if (!params?.includeArchived) {
    where.archived = false;
  }

  const items = await prisma.item.findMany({
    where,
    include: {
      reportedBy: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return items.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    category: i.category,
    type: i.type,
    location: i.location,
    date: i.date.toISOString(),
    time: i.time,
    image: i.image,
    status: i.status,
    storageLocation: i.storageLocation,
    additionalDetails: i.additionalDetails,
    isArchived: i.archived,
    archivedReason: i.archivedReason,
    reportedById: i.reportedById,
    reportedByName: i.reportedBy?.name || 'Campus Student',
    reportedByEmail: i.reportedBy?.email || 'student@campus.edu',
    reportedByStudentId: i.reportedBy?.studentId || null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));
}
