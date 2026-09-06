'use server';

import prisma from '@/lib/prisma';
import { ItemType, ItemStatus, UserRole } from '@prisma/client';
import { saveItem } from '@/lib/dataStore';
import { getCurrentUser } from '@/app/actions/auth';

export interface ReportFoundInput {
  itemName: string;
  category: string;
  description: string;
  location: string;
  specificLocation?: string;
  dateFound: string;
  timeFound?: string;
  storageLocation: string;
  customStorage?: string;
  image?: string | null;
}

export interface ReportFoundResult {
  success: boolean;
  error?: string;
  item?: {
    id: string;
    name: string;
    category: string;
    location: string;
    storageLocation: string;
    type: string;
    status: string;
    createdAt: string;
  };
  savedToDatabase?: boolean;
}

/**
 * Server Action: Connects the Report Found Item form to PostgreSQL using Prisma,
 * with resilient permanent local storage fallback.
 */
export async function submitFoundItemReport(input: ReportFoundInput): Promise<ReportFoundResult> {
  // 1. VALIDATE THE DATA
  if (!input.itemName || !input.itemName.trim()) {
    return { success: false, error: 'Item name is required.' };
  }
  if (!input.category || !input.category.trim()) {
    return { success: false, error: 'Please select an item category.' };
  }
  if (!input.description || input.description.trim().length < 10) {
    return { success: false, error: 'Description must be at least 10 characters long.' };
  }
  if (!input.location || !input.location.trim()) {
    return { success: false, error: 'Location found is required.' };
  }
  if (!input.dateFound) {
    return { success: false, error: 'Date found is required.' };
  }
  if (!input.storageLocation || !input.storageLocation.trim()) {
    return { success: false, error: 'Current storage location is required.' };
  }

  const effectiveLocation = input.specificLocation?.trim()
    ? `${input.location.trim()} (${input.specificLocation.trim()})`
    : input.location.trim();

  const effectiveStorage = input.storageLocation === 'Other Campus Location (Specify Below)'
    ? (input.customStorage?.trim() || 'Specified by finder')
    : input.storageLocation.trim();

  try {
    const currentUser = await getCurrentUser();

    const { item, isPostgres } = await saveItem({
      name: input.itemName.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      type: 'FOUND',
      location: effectiveLocation,
      date: input.dateFound,
      time: input.timeFound?.trim() || null,
      storageLocation: effectiveStorage,
      image: input.image || null,
      reportedById: currentUser?.id,
      reportedByName: currentUser?.name || 'Student Reporter',
      reportedByEmail: currentUser?.email || 'student@campus.edu',
    });

    return {
      success: true,
      savedToDatabase: true,
      item: {
        id: item.id,
        name: item.name,
        category: item.category,
        location: item.location,
        storageLocation: item.storageLocation || effectiveStorage,
        type: item.type,
        status: item.status,
        createdAt: item.createdAt,
      },
    };
  } catch (err: any) {
    console.error('Error saving found report:', err);
    return {
      success: false,
      error: err?.message || 'Failed to save report to database.',
    };
  }
}
