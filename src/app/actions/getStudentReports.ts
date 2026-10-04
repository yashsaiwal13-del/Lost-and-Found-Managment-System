'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { StudentReport, ItemStatus } from '@/types';
import { MatchStatus } from '@/lib/enums';

/**
 * Fetches the currently authenticated student's own reports from the database,
 * along with connected matches, return arrangements, and verification status.
 */
export async function getStudentReports(): Promise<StudentReport[]> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return [];
    }

    const items = await prisma.item.findMany({
      where: {
        reportedById: user.id,
        archived: false,
      },
      include: {
        lostMatches: {
          where: {
            status: MatchStatus.CONFIRMED,
          },
          include: {
            foundItem: {
              select: {
                id: true,
                name: true,
                category: true,
                location: true,
                storageLocation: true,
                image: true,
              },
            },
            return: true,
          },
          orderBy: {
            connectedAt: 'desc',
          },
        },
        foundMatches: {
          where: {
            status: MatchStatus.CONFIRMED,
          },
          include: {
            lostItem: {
              select: {
                id: true,
                name: true,
                category: true,
                location: true,
              },
            },
            return: true,
          },
        },
        verificationRequests: {
          where: {
            status: { in: ['PENDING', 'CLARIFICATION_REQUESTED'] },
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return items.map((item) => {
      // Find confirmed match if exists
      const confirmedMatch = item.lostMatches.find((m) => m.status === MatchStatus.CONFIRMED);

      // Status mapping
      let statusFormat: ItemStatus = 'open';
      if (item.status === 'RESOLVED') {
        statusFormat = 'resolved';
      } else if (item.status === 'PENDING_CLAIM' || item.status === 'PENDING_REVIEW' || item.verificationRequests.length > 0) {
        statusFormat = 'pending_verification';
      } else if (item.status === 'REPORTED' || item.status === 'OPEN') {
        statusFormat = 'open';
      }

      let connectedMatchData = null;
      if (confirmedMatch && confirmedMatch.foundItem) {
        connectedMatchData = {
          matchId: confirmedMatch.id,
          foundItemId: confirmedMatch.foundItem.id,
          foundItemTitle: confirmedMatch.foundItem.name,
          foundItemCategory: confirmedMatch.foundItem.category,
          foundItemLocation: confirmedMatch.foundItem.location,
          similarityScore: confirmedMatch.similarityScore,
          connectionType: confirmedMatch.connectionType,
          collectionPoint: confirmedMatch.foundItem.storageLocation,
          returnStatus: confirmedMatch.return?.status || 'NOT_STARTED',
          arrangedAt: confirmedMatch.return?.arrangedAt ? confirmedMatch.return.arrangedAt.toISOString() : null,
          confirmedAt: confirmedMatch.return?.confirmedAt ? confirmedMatch.return.confirmedAt.toISOString() : null,
          instructions: confirmedMatch.return?.notes || null,
          adminNote: confirmedMatch.note || null,
        };
      }

      return {
        id: item.id,
        title: item.name,
        description: item.description,
        type: item.type.toLowerCase() as any,
        category: item.category as any,
        location: item.location,
        dateReported: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        rawDate: item.date.toISOString(),
        time: item.time,
        image: item.image,
        storageLocation: item.storageLocation,
        status: statusFormat,
        matchesCount: confirmedMatch ? 1 : 0,
        matchedItemId: confirmedMatch?.foundItemId || undefined,
        connectedMatch: connectedMatchData,
        hasPendingVerification: item.verificationRequests.length > 0,
      };
    });
  } catch (err) {
    console.error('Error fetching student reports:', err);
    return [];
  }
}

