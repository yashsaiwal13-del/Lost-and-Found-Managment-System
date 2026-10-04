'use server';

import prisma from '@/lib/prisma';
import { ItemType } from '@/lib/enums';
import { CampusItem } from '@/types';

export async function getAllCampusItems(params?: {
  type?: 'LOST' | 'FOUND';
  category?: string;
  search?: string;
  limit?: number;
  includeArchived?: boolean;
}): Promise<CampusItem[]> {
  const where: any = {};
  if (!params?.includeArchived) {
    where.archived = false;
  }
  if (params?.type) {
    where.type = params.type;
  }
  if (params?.category && params.category !== 'All' && params.category !== 'All Categories') {
    where.category = params.category;
  }
  if (params?.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { location: { contains: q } },
    ];
  }

  const items = await prisma.item.findMany({
    where,
    include: { reportedBy: true },
    orderBy: { createdAt: 'desc' },
    take: params?.limit || 100,
  });

  const nowMs = Date.now();
  return items.map((i) => {
    const itemDate = new Date(i.date);
    const diffDays = Math.max(0, Math.floor((nowMs - itemDate.getTime()) / (1000 * 60 * 60 * 24)));
    let statusFormat = i.status?.toLowerCase();
    if (statusFormat === 'pending_claim') statusFormat = 'pending_verification';

    return {
      id: i.id,
      title: i.name,
      description: i.description,
      type: i.type?.toLowerCase() as any,
      category: i.category as any,
      location: i.location,
      date: itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dateIso: i.date.toISOString(),
      daysAgo: diffDays,
      status: statusFormat as any,
      imageUrl: i.image || undefined,
      storageLocation: i.storageLocation || undefined,
      isArchived: i.archived,
      archivedReason: i.archivedReason || undefined,
      reportedBy: {
        role: (i.reportedBy?.role?.toLowerCase() || 'student') as any,
        name: i.reportedBy?.name || 'Campus Member',
      },
    };
  });
}

export async function getCampusItemById(id: string): Promise<CampusItem | null> {
  const item = await prisma.item.findUnique({
    where: { id },
    include: { reportedBy: true },
  });

  if (!item) return null;

  const itemDate = new Date(item.date);
  const diffDays = Math.max(0, Math.floor((Date.now() - itemDate.getTime()) / (1000 * 60 * 60 * 24)));
  let statusFormat = item.status?.toLowerCase();
  if (statusFormat === 'pending_claim') statusFormat = 'pending_verification';

  return {
    id: item.id,
    title: item.name,
    description: item.description,
    type: item.type?.toLowerCase() as any,
    category: item.category as any,
    location: item.location,
    date: itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    dateIso: item.date.toISOString(),
    daysAgo: diffDays,
    status: statusFormat as any,
    imageUrl: item.image || undefined,
    storageLocation: item.storageLocation || undefined,
    isArchived: item.archived,
    archivedReason: item.archivedReason || undefined,
    reportedBy: {
      role: (item.reportedBy?.role?.toLowerCase() || 'student') as any,
      name: item.reportedBy?.name || 'Campus Member',
    },
  };
}
