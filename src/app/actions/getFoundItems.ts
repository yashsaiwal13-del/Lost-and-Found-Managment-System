'use server';

import prisma from '@/lib/prisma';
import { ItemType } from '@prisma/client';
import { CampusItem } from '@/types';
import { MOCK_ITEMS } from '@/data/mockData';

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
  try {
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

    if (dbItems && dbItems.length > 0) {
      const nowMs = Date.now();
      return dbItems.map((item) => {
        const itemDate = new Date(item.date);
        const diffDays = Math.max(0, Math.floor((nowMs - itemDate.getTime()) / (1000 * 60 * 60 * 24)));

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
          status: item.status.toLowerCase() as any,
          imageUrl: item.image || undefined,
          storageLocation: item.storageLocation || undefined,
          reportedBy: {
            role: (item.reportedBy?.role?.toLowerCase() || 'student') as any,
            name: item.reportedBy?.name || 'Campus Student',
          },
        };
      });
    }

    // If database returned 0 results for a specific search or category:
    if (params?.search || (params?.category && params.category !== 'All') || (params?.location && params.location !== 'All Locations')) {
      return [];
    }

    // If database has no records yet (e.g. fresh installation before seeding), fallback to mock found items:
    return MOCK_ITEMS.filter((item) => item.type === 'found');
  } catch (error: any) {
    console.warn('Database note in getFoundItems (fetching from local dataStore):', error?.message || error);
    
    // Fetch from persistent dataStore
    const { getItems } = await import('@/lib/dataStore');
    const storeItems = await getItems({
      type: 'FOUND',
      category: params?.category,
      search: params?.search,
    });

    const nowMs = Date.now();
    let mapped: CampusItem[] = storeItems.map((item) => {
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
        dateIso: item.date,
        daysAgo: diffDays,
        status: statusFormat as any,
        imageUrl: item.image || undefined,
        storageLocation: item.storageLocation || undefined,
        reportedBy: {
          role: 'student',
          name: item.reportedByName || 'Campus Student',
        },
      };
    });

    if (params?.location && params.location !== 'All Locations') {
      const locLower = params.location.toLowerCase();
      mapped = mapped.filter((i) => i.location.toLowerCase().includes(locLower) || i.location === params.location);
    }
    if (params?.dateRange && params.dateRange !== 'all') {
      if (params.dateRange === 'today') mapped = mapped.filter((i) => (i.daysAgo ?? 0) <= 0);
      else if (params.dateRange === 'past3days') mapped = mapped.filter((i) => (i.daysAgo ?? 0) <= 3);
      else if (params.dateRange === 'pastweek') mapped = mapped.filter((i) => (i.daysAgo ?? 0) <= 7);
      else if (params.dateRange === 'pastmonth') mapped = mapped.filter((i) => (i.daysAgo ?? 0) <= 30);
    }

    return mapped;
  }
}
