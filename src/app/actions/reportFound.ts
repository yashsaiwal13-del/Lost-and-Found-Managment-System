'use server';

import prisma from '@/lib/prisma';
import { ItemType, ItemStatus, UserRole } from '@/lib/enums';
import { saveItem } from '@/lib/dataStore';
import { requireRole } from '@/lib/authz';
import { reportFoundSchema, formatZodError } from '@/lib/validations';
import { notifyReporterOfSubmission } from '@/lib/notifications';

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
 * with Zod input validation and in-app confirmation notification.
 */
export async function submitFoundItemReport(input: ReportFoundInput): Promise<ReportFoundResult> {
  const parsed = reportFoundSchema.safeParse(input);
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

  const effectiveStorage = validData.storageLocation === 'Other Campus Location (Specify Below)'
    ? (input.customStorage?.trim() || 'Specified by finder')
    : (validData.storageLocation?.trim() || 'Security Locker');

  let currentUser;
  try {
    currentUser = await requireRole();
  } catch (err: any) {
    return {
      success: false,
      error: 'You must be signed in to submit a found item report.',
    };
  }

  try {
    const { item, isPostgres } = await saveItem({
      name: validData.itemName.trim(),
      description: validData.description.trim(),
      category: validData.category.trim(),
      type: 'FOUND',
      location: effectiveLocation,
      date: validData.dateFound,
      time: validData.timeFound?.trim() || null,
      storageLocation: effectiveStorage,
      image: validData.image || null,
      reportedById: currentUser.id,
    });

    // Send confirmation notification to reporter
    await notifyReporterOfSubmission(currentUser.id, item.id, item.name, 'FOUND');

    // Run automated match suggestion engine against opposite-type reports
    try {
      const { generateSuggestions } = await import('@/lib/matching');
      await generateSuggestions(item.id);
    } catch (matchErr) {
      console.warn('[reportFound] Non-fatal suggestion generation warning:', matchErr);
    }

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

