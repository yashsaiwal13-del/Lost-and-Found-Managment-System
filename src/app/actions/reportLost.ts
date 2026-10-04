'use server';

import prisma from '@/lib/prisma';
import { ItemType, ItemStatus, UserRole } from '@/lib/enums';
import { saveItem } from '@/lib/dataStore';
import { requireRole } from '@/lib/authz';
import { reportLostSchema, formatZodError } from '@/lib/validations';
import { notifyReporterOfSubmission } from '@/lib/notifications';

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
 * Strictly validates via Zod and sends in-app confirmation notification.
 */
export async function submitLostItemReport(input: ReportLostInput): Promise<ReportLostResult> {
  const parsed = reportLostSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: formatZodError(parsed.error),
    };
  }

  const validData = parsed.data;

  const effectiveLocation = validData.specificLocation?.trim()
    ? `${validData.location.trim()} (${validData.specificLocation.trim()})`
    : validData.location.trim();

  let currentUser;
  try {
    currentUser = await requireRole();
  } catch (err: any) {
    return {
      success: false,
      error: 'You must be signed in to submit a lost item report.',
    };
  }

  try {
    const { item, isPostgres } = await saveItem({
      name: validData.itemName.trim(),
      description: validData.description.trim(),
      category: validData.category.trim(),
      type: 'LOST',
      location: effectiveLocation,
      date: validData.dateLost,
      time: validData.timeLost?.trim() || null,
      image: validData.image || null,
      additionalDetails: validData.additionalDetails?.trim() || null,
      reportedById: currentUser.id,
    });

    // Send confirmation in-app notification to reporter
    await notifyReporterOfSubmission(currentUser.id, item.id, item.name, 'LOST');

    // Run automated match suggestion engine against opposite-type reports
    try {
      const { generateSuggestions } = await import('@/lib/matching');
      await generateSuggestions(item.id);
    } catch (matchErr) {
      console.warn('[reportLost] Non-fatal suggestion generation warning:', matchErr);
    }

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

