'use server';

import prisma from '@/lib/prisma';
import { ItemType, ItemStatus, UserRole } from '@prisma/client';
import { saveItem } from '@/lib/dataStore';
import { getCurrentUser } from '@/app/actions/auth';

export interface ReportLostInput {
  itemName: string;
  category: string;
  description: string;
  location: string;
  specificLocation?: string;
  dateLost: string;
  timeLost?: string;
  additionalDetails?: string;
  image?: string | null;
}

export interface ReportLostResult {
  success: boolean;
  error?: string;
  item?: {
    id: string;
    name: string;
    category: string;
    location: string;
    type: string;
    status: string;
    createdAt: string;
  };
  savedToDatabase?: boolean;
}

/**
 * Server Action: Connects the Report Lost Item form to PostgreSQL using Prisma.
 * Steps:
 * 1. Validate the data.
 * 2. Save the item in PostgreSQL.
 * 3. Set type to LOST.
 * 4. Set status to REPORTED.
 * 5. Return success result with created item record.
 */
export async function submitLostItemReport(input: ReportLostInput): Promise<ReportLostResult> {
  // ----------------------------------------------------
  // 1. VALIDATE THE DATA (Server-side validation)
  // ----------------------------------------------------
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
    return { success: false, error: 'Location lost is required.' };
  }
  if (!input.dateLost) {
    return { success: false, error: 'Date lost is required.' };
  }

  const effectiveLocation = input.specificLocation?.trim()
    ? `${input.location.trim()} (${input.specificLocation.trim()})`
    : input.location.trim();

  try {
    const currentUser = await getCurrentUser();

    const { item, isPostgres } = await saveItem({
      name: input.itemName.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      type: 'LOST',
      location: effectiveLocation,
      date: input.dateLost,
      time: input.timeLost?.trim() || null,
      image: input.image || null,
      additionalDetails: input.additionalDetails?.trim() || null,
      reportedById: currentUser?.id,
      reportedByName: currentUser?.name || 'Maya Lin',
      reportedByEmail: currentUser?.email || 'maya.lin@campus.edu',
    });

    return {
      success: true,
      savedToDatabase: true,
      item: {
        id: item.id,
        name: item.name,
        category: item.category,
        location: item.location,
        type: item.type,
        status: item.status,
        createdAt: item.createdAt,
      },
    };
  } catch (err: any) {
    console.error('Error saving lost report:', err);
    return {
      success: false,
      error: err?.message || 'Failed to save report to database.',
    };
  }
}
