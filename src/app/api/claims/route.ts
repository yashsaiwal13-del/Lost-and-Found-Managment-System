import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { ClaimStatus, ItemStatus, ItemType } from '@/lib/enums';
import { submitClaimSchema, formatZodError } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You must be signed in to submit an ownership claim.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = submitClaimSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const { itemId, color, uniqueMark, lastSeenLocation } = validation.data;

    // Verify target item exists
    const targetItem = await prisma.item.findUnique({
      where: { id: itemId.trim() },
    });

    if (!targetItem) {
      return NextResponse.json(
        { success: false, error: 'Target item not found in campus database.' },
        { status: 404 }
      );
    }

    if (targetItem.type !== ItemType.FOUND) {
      return NextResponse.json(
        { success: false, error: 'Ownership claims can only be filed against FOUND items.' },
        { status: 400 }
      );
    }

    if (targetItem.status === ItemStatus.RESOLVED) {
      return NextResponse.json(
        { success: false, error: 'This item has already been resolved and returned to its owner.' },
        { status: 400 }
      );
    }

    // Create claim bound strictly to the session user's ID
    const claim = await prisma.claim.create({
      data: {
        itemId: targetItem.id,
        claimantId: session.user.id,
        color: color.trim(),
        uniqueMark: uniqueMark.trim(),
        lastSeenLocation: lastSeenLocation.trim(),
        status: ClaimStatus.PENDING,
      },
      include: {
        item: true,
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
          },
        },
      },
    });

    // Update item status to PENDING_CLAIM
    await prisma.item.update({
      where: { id: targetItem.id },
      data: { status: ItemStatus.PENDING_CLAIM },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Ownership verification claim successfully submitted for Campus Security review.',
        claim,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('API Error in POST /api/claims:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to submit ownership claim.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;

    // If STUDENT, only return their own claims
    // If SECURITY or ADMIN, return all claims
    const where = userRole === 'SECURITY' || userRole === 'ADMIN'
      ? {}
      : { claimantId: session.user.id };

    const claims = await prisma.claim.findMany({
      where,
      include: {
        item: true,
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      total: claims.length,
      claims,
    });
  } catch (err: any) {
    console.error('API Error in GET /api/claims:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to retrieve claims.' },
      { status: 500 }
    );
  }
}
