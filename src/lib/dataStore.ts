import prisma from '@/lib/prisma';
import { ItemType, ItemStatus, UserRole } from '@/lib/enums';
import { runAutomatedItemMatching } from '@/lib/matching';

export interface StoredItem {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'LOST' | 'FOUND';
  location: string;
  date: string;
  time?: string | null;
  image?: string | null;
  status: string;
  storageLocation?: string | null;
  additionalDetails?: string | null;
  isArchived?: boolean;
  archivedReason?: string | null;
  reportedById: string;
  reportedByName?: string;
  reportedByEmail?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Permanently save a report to PostgreSQL via Prisma.
 * Throws errors directly if PostgreSQL operations fail.
 */
export async function saveItem(data: {
  name: string;
  description: string;
  category: string;
  type: 'LOST' | 'FOUND';
  location: string;
  date: string | Date;
  time?: string | null;
  image?: string | null;
  storageLocation?: string | null;
  additionalDetails?: string | null;
  reportedById: string;
}): Promise<{ item: StoredItem; isPostgres: boolean }> {
  const dateObj = data.date instanceof Date ? data.date : new Date(data.date);
  const safeDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
  const itemType = data.type === 'LOST' ? ItemType.LOST : ItemType.FOUND;

  const studentUser = await prisma.user.findUnique({ where: { id: data.reportedById } });
  if (!studentUser) {
    throw new Error(`User with ID ${data.reportedById} not found.`);
  }

  const created = await prisma.item.create({
    data: {
      name: data.name.trim(),
      description: data.description.trim(),
      category: data.category.trim(),
      type: itemType,
      status: ItemStatus.REPORTED,
      location: data.location.trim(),
      date: safeDate,
      time: data.time?.trim() || null,
      image: data.image || null,
      storageLocation: data.storageLocation?.trim() || null,
      additionalDetails: data.additionalDetails?.trim() || null,
      reportedById: studentUser.id,
    },
    include: {
      reportedBy: true,
    },
  });

  const storedItem: StoredItem = {
    id: created.id,
    name: created.name,
    description: created.description,
    category: created.category,
    type: created.type as 'LOST' | 'FOUND',
    location: created.location,
    date: created.date.toISOString(),
    time: created.time,
    image: created.image,
    status: created.status,
    storageLocation: created.storageLocation,
    additionalDetails: created.additionalDetails,
    isArchived: created.archived,
    archivedReason: created.archivedReason,
    reportedById: created.reportedById,
    reportedByName: created.reportedBy.name,
    reportedByEmail: created.reportedBy.email,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };

  // Run automated matching engine against opposite-type items
  try {
    await runAutomatedItemMatching(created.id);
  } catch (matchErr) {
    console.warn('[saveItem] Non-fatal automated matching warning:', matchErr);
  }

  return { item: storedItem, isPostgres: true };
}

/**
 * Fetch items with optional type, category, userId, and search filters from PostgreSQL via Prisma.
 */
export async function getItems(filters?: {
  type?: 'LOST' | 'FOUND';
  category?: string;
  userId?: string;
  search?: string;
  limit?: number;
  includeArchived?: boolean;
}): Promise<StoredItem[]> {
  const where: any = {};
  if (!filters?.includeArchived) {
    where.archived = false;
  }
  if (filters?.type) {
    where.type = filters.type === 'LOST' ? ItemType.LOST : ItemType.FOUND;
  }
  if (filters?.category && filters.category !== 'All Categories') {
    where.category = filters.category;
  }
  if (filters?.userId) {
    where.reportedById = filters.userId;
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
      { location: { contains: filters.search } },
    ];
  }

  const items = await prisma.item.findMany({
    where,
    include: { reportedBy: true },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 50,
  });

  return items.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    category: i.category,
    type: i.type as 'LOST' | 'FOUND',
    location: i.location,
    date: i.date.toISOString(),
    time: i.time,
    image: i.image,
    status: i.status as any,
    storageLocation: i.storageLocation,
    additionalDetails: i.additionalDetails,
    isArchived: i.archived,
    archivedReason: i.archivedReason,
    reportedById: i.reportedById,
    reportedByName: i.reportedBy.name,
    reportedByEmail: i.reportedBy.email,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));
}

/**
 * Fetch a single item by ID from PostgreSQL via Prisma.
 */
export async function getItemById(id: string): Promise<StoredItem | null> {
  const item = await prisma.item.findUnique({
    where: { id },
    include: { reportedBy: true },
  });

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    type: item.type as 'LOST' | 'FOUND',
    location: item.location,
    date: item.date.toISOString(),
    time: item.time,
    image: item.image,
    status: item.status as any,
    storageLocation: item.storageLocation,
    additionalDetails: item.additionalDetails,
    isArchived: item.archived,
    archivedReason: item.archivedReason,
    reportedById: item.reportedById,
    reportedByName: item.reportedBy.name,
    reportedByEmail: item.reportedBy.email,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

/**
 * Fetch all reports submitted by a specific user from PostgreSQL via Prisma.
 * Filters out archived reports by default.
 */
export async function getUserReports(identifier?: {
  userId?: string;
  email?: string;
  includeArchived?: boolean;
}): Promise<StoredItem[]> {
  if (!identifier?.userId && !identifier?.email) {
    return [];
  }

  const where: any = {};
  if (!identifier.includeArchived) {
    where.archived = false;
  }
  if (identifier.userId) {
    where.reportedById = identifier.userId;
  } else if (identifier.email) {
    where.reportedBy = { email: identifier.email };
  }

  const items = await prisma.item.findMany({
    where,
    include: { reportedBy: true },
    orderBy: { createdAt: 'desc' },
  });

  return items.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    category: i.category,
    type: i.type as 'LOST' | 'FOUND',
    location: i.location,
    date: i.date.toISOString(),
    time: i.time,
    image: i.image,
    status: i.status as any,
    storageLocation: i.storageLocation,
    additionalDetails: i.additionalDetails,
    isArchived: i.archived,
    archivedReason: i.archivedReason,
    reportedById: i.reportedById,
    reportedByName: i.reportedBy.name,
    reportedByEmail: i.reportedBy.email,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));
}

/**
 * Update an item's status in PostgreSQL via Prisma.
 */
export async function updateItemStatus(
  id: string,
  status: string
): Promise<StoredItem | null> {
  const updated = await prisma.item.update({
    where: { id },
    data: { status: status as ItemStatus },
    include: { reportedBy: true },
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    category: updated.category,
    type: updated.type as 'LOST' | 'FOUND',
    location: updated.location,
    date: updated.date.toISOString(),
    time: updated.time,
    image: updated.image,
    status: updated.status as any,
    storageLocation: updated.storageLocation,
    additionalDetails: updated.additionalDetails,
    isArchived: updated.archived,
    archivedReason: updated.archivedReason,
    reportedById: updated.reportedById,
    reportedByName: updated.reportedBy.name,
    reportedByEmail: updated.reportedBy.email,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function updateItem(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    category: string;
    location: string;
    status: string;
    storageLocation?: string | null;
    additionalDetails?: string | null;
  }>
): Promise<StoredItem | null> {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return null;

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.category !== undefined) updateData.category = data.category.trim();
  if (data.location !== undefined) updateData.location = data.location.trim();
  if (data.status !== undefined) updateData.status = data.status as ItemStatus;
  if (data.storageLocation !== undefined) updateData.storageLocation = data.storageLocation?.trim() || null;
  if (data.additionalDetails !== undefined) updateData.additionalDetails = data.additionalDetails?.trim() || null;

  const updated = await prisma.item.update({
    where: { id },
    data: updateData,
    include: { reportedBy: true },
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    category: updated.category,
    type: updated.type as 'LOST' | 'FOUND',
    location: updated.location,
    date: updated.date.toISOString(),
    time: updated.time,
    image: updated.image,
    status: updated.status as any,
    storageLocation: updated.storageLocation,
    additionalDetails: updated.additionalDetails,
    reportedById: updated.reportedById,
    reportedByName: updated.reportedBy.name,
    reportedByEmail: updated.reportedBy.email,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

/**
 * Delete an item from PostgreSQL via Prisma.
 */
export async function deleteItem(id: string): Promise<boolean> {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return false;

  await prisma.item.delete({ where: { id } });
  return true;
}
