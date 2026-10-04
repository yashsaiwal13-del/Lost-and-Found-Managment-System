import prisma from '@/lib/prisma';
import { ItemType, ItemStatus, MatchStatus, ConnectionType } from '@/lib/enums';

/**
 * Tokenize text into normalized unique words for similarity matching.
 * Strips common stop words and punctuation.
 */
function tokenizeText(text: string): Set<string> {
  const stopWords = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'and', 'but', 'or', 'so', 'it', 'its', 'my', 'your', 'his',
    'her', 'this', 'that', 'these', 'those', 'left', 'found', 'lost'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  return new Set(words);
}

/**
 * Compute Jaccard word similarity between two sets of tokens.
 */
function computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersectionCount++;
  });
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

export interface GeneratedMatchSummary {
  matchId: string;
  lostItemId: string;
  foundItemId: string;
  similarityScore: number;
  status: string;
  connectionType: string;
}

/**
 * Automated Match Suggestion Engine:
 * When a lost or found report is created, looks for potentially related reports
 * on the opposite side (same category, overlapping date window, similar location/keywords).
 * 
 * Scores candidate pairs (0.0 to 1.0) and upserts Match rows with status SUGGESTED
 * and connectionType SUGGESTED using Prisma's @@unique([lostItemId, foundItemId]) constraint,
 * preventing duplicate suggestion rows on re-runs.
 * 
 * @param newItemId - ID of the newly created or updated item
 * @returns Array of generated / updated Match summaries
 */
export async function generateSuggestions(newItemId: string): Promise<GeneratedMatchSummary[]> {
  try {
    const targetItem = await prisma.item.findUnique({
      where: { id: newItemId },
    });

    if (!targetItem || targetItem.archived) {
      return [];
    }

    const oppositeType = targetItem.type === ItemType.LOST ? ItemType.FOUND : ItemType.LOST;

    // Search active non-archived candidate items of the opposite type
    const candidates = await prisma.item.findMany({
      where: {
        type: oppositeType,
        archived: false,
        status: {
          in: [ItemStatus.REPORTED, ItemStatus.OPEN, ItemStatus.PENDING_CLAIM, ItemStatus.PENDING_REVIEW],
        },
      },
    });

    if (candidates.length === 0) {
      return [];
    }

    const targetTokens = tokenizeText(
      `${targetItem.name} ${targetItem.description} ${targetItem.additionalDetails || ''}`
    );
    const targetLocationTokens = tokenizeText(targetItem.location);
    const targetDate = new Date(targetItem.date).getTime();

    const matchesCreated: GeneratedMatchSummary[] = [];

    for (const candidate of candidates) {
      // 1. Category Matching (Weight: 35%)
      let categoryScore = 0;
      if (targetItem.category.toLowerCase().trim() === candidate.category.toLowerCase().trim()) {
        categoryScore = 1.0;
      }

      // 2. Location Proximity (Weight: 25%)
      let locationScore = 0;
      const candidateLocationTokens = tokenizeText(candidate.location);
      const locJaccard = computeJaccardSimilarity(targetLocationTokens, candidateLocationTokens);

      const targetLocLower = targetItem.location.toLowerCase().trim();
      const candidateLocLower = candidate.location.toLowerCase().trim();

      if (targetLocLower === candidateLocLower) {
        locationScore = 1.0;
      } else if (locJaccard > 0) {
        locationScore = Math.min(1.0, 0.5 + locJaccard * 0.5);
      } else if (
        targetLocLower.includes(candidateLocLower) ||
        candidateLocLower.includes(targetLocLower)
      ) {
        locationScore = 0.8;
      }

      // 3. Date Proximity (Weight: 20%)
      let dateScore = 0;
      const candidateDate = new Date(candidate.date).getTime();
      const diffDays = Math.abs(targetDate - candidateDate) / (1000 * 60 * 60 * 24);

      if (diffDays <= 1) dateScore = 1.0;
      else if (diffDays <= 3) dateScore = 0.85;
      else if (diffDays <= 7) dateScore = 0.65;
      else if (diffDays <= 14) dateScore = 0.40;
      else if (diffDays <= 30) dateScore = 0.20;

      // 4. Text / Keyword Similarity (Weight: 20%)
      const candidateTokens = tokenizeText(
        `${candidate.name} ${candidate.description} ${candidate.additionalDetails || ''}`
      );
      const textJaccard = computeJaccardSimilarity(targetTokens, candidateTokens);
      const textScore = Math.min(1.0, textJaccard * 1.5);

      // Compute Total Weighted Similarity Score (0.00 to 1.00)
      const totalScore =
        categoryScore * 0.35 +
        locationScore * 0.25 +
        dateScore * 0.20 +
        textScore * 0.20;
      const roundedScore = Math.round(totalScore * 100) / 100;

      // Minimum confidence threshold to prevent noise
      if (roundedScore >= 0.40) {
        const lostItemId = targetItem.type === ItemType.LOST ? targetItem.id : candidate.id;
        const foundItemId = targetItem.type === ItemType.FOUND ? targetItem.id : candidate.id;

        // Check if an existing match exists
        const existingMatch = await prisma.match.findUnique({
          where: {
            lostItemId_foundItemId: {
              lostItemId,
              foundItemId,
            },
          },
        });

        // If existing match is already manually CONFIRMED or DISCONNECTED, preserve its status
        const nextStatus =
          existingMatch && (existingMatch.status === MatchStatus.CONFIRMED || existingMatch.status === MatchStatus.DISCONNECTED)
            ? existingMatch.status
            : MatchStatus.SUGGESTED;

        const nextConnectionType =
          existingMatch && existingMatch.connectionType === ConnectionType.MANUAL
            ? ConnectionType.MANUAL
            : ConnectionType.SUGGESTED;

        const upserted = await prisma.match.upsert({
          where: {
            lostItemId_foundItemId: {
              lostItemId,
              foundItemId,
            },
          },
          update: {
            similarityScore: roundedScore,
            status: nextStatus,
            connectionType: nextConnectionType,
          },
          create: {
            lostItemId,
            foundItemId,
            similarityScore: roundedScore,
            status: MatchStatus.SUGGESTED,
            connectionType: ConnectionType.SUGGESTED,
          },
        });

        matchesCreated.push({
          matchId: upserted.id,
          lostItemId: upserted.lostItemId,
          foundItemId: upserted.foundItemId,
          similarityScore: upserted.similarityScore,
          status: upserted.status,
          connectionType: upserted.connectionType,
        });
      }
    }

    return matchesCreated;
  } catch (err) {
    console.error('[Matching Engine] Error generating suggestions:', err);
    return [];
  }
}

/**
 * Backward compatibility alias
 */
export async function runAutomatedItemMatching(newItemId: string): Promise<number> {
  const suggestions = await generateSuggestions(newItemId);
  return suggestions.length;
}
