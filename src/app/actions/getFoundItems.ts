'use server';

import prisma from '@/lib/prisma';
import { ItemType } from '@/lib/enums';
import { CampusItem } from '@/types';

export interface GetFoundItemsParams {
  search?: string;
  category?: string;
  location?: string;
  dateRange?: string; // 'all' | 'today' | 'past3days' | 'pastweek' | 'pastmonth'
}

/**
 * Server Action: Fetches real found items from PostgreSQL database using Prisma.
 * Supports Search, Category, Location, and Date filters.
 */
export async function getFoundItemsFromDatabase(params?: GetFoundItemsParams): Promise<CampusItem[]> {
  const whereClause: any = {
    type: ItemType.FOUND,
  };

  // Category filter
  if (params?.category && params.category !== 'All') {
    whereClause.category = params.category;
  }

  // Location filter
  if (params?.location && params.location !== 'All Locations') {
    whereClause.location = {
      contains: params.location,
      mode: 'insensitive',
    };
  }

  // Search filter (name, description, location, storageLocation)
  if (params?.search && params.search.trim()) {
    const q = params.search.trim();
    whereClause.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } },
      { storageLocation: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Date filter
  if (params?.dateRange && params.dateRange !== 'all') {
    const now = new Date();
    let threshold = new Date();

    if (params.dateRange === 'today') {
      threshold.setHours(0, 0, 0, 0);
    } else if (params.dateRange === 'past3days') {
      threshold.setDate(now.getDate() - 3);
    } else if (params.dateRange === 'pastweek') {
      threshold.setDate(now.getDate() - 7);
    } else if (params.dateRange === 'pastmonth') {
      threshold.setDate(now.getDate() - 30);
    }

    whereClause.date = {
      gte: threshold,
    };
  }

  const dbItems = await prisma.item.findMany({
    where: whereClause,
    include: {
      reportedBy: true,
    },
    orderBy: {
      date: 'desc',
    },
  });

  const nowMs = Date.now();
  return dbItems.map((item) => {
    const itemDate = new Date(item.date);
    const diffDays = Math.max(0, Math.floor((nowMs - itemDate.getTime()) / (1000 * 60 * 60 * 24)));

    let statusFormat = item.status.toLowerCase();
    if (statusFormat === 'pending_claim') statusFormat = 'pending_verification';

    return {
      id: item.id,
      title: item.name,
      description: item.description,
      type: 'found',
      category: item.category as any,
      location: item.location,
      date: itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dateIso: item.date.toISOString(),
      daysAgo: diffDays,
      status: statusFormat as any,
      imageUrl: item.image || undefined,
      storageLocation: item.storageLocation || undefined,
      reportedBy: {
        role: (item.reportedBy?.role?.toLowerCase() || 'student') as any,
        name: item.reportedBy?.name || 'Campus Student',
      },
    };
  });
}
