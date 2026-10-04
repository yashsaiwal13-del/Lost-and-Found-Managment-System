import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { ClaimStatus, ItemStatus } from '@/lib/enums';
import { updateClaimStatusSchema, formatZodError } from '@/lib/validations';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const claim = await prisma.claim.findUnique({
      where: { id },
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

    if (!claim) {
      return NextResponse.json(
        { success: false, error: 'Claim not found.' },
        { status: 404 }
      );
    }

    const userRole = (session.user as any).role;
    if (claim.claimantId !== session.user.id && userRole !== 'SECURITY' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access denied.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      claim,
    });
  } catch (err: any) {
    console.error('API Error in GET /api/claims/[id]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to retrieve claim.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'SECURITY' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: SECURITY or ADMIN clearance required to resolve claims.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.claim.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Claim with ID "${id}" was not found.` },
        { status: 404 }
      );
    }

    const rawBody = await req.json();
    const normalizedBody = {
      ...rawBody,
      status: rawBody?.status?.toUpperCase(),
    };

    const validation = updateClaimStatusSchema.safeParse(normalizedBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const { status: normalizedStatus, rejectionReason, reviewedBy } = validation.data;
    const officerSignature = reviewedBy?.trim() || `${session.user.name || 'Security Officer'} (#${userRole})`;

    // Update the claim record
    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: {
        status: normalizedStatus as ClaimStatus,
        rejectionReason: normalizedStatus === 'REJECTED' ? rejectionReason?.trim() || 'Ownership verification failed.' : null,
        reviewedBy: officerSignature,
        resolvedAt: normalizedStatus !== 'PENDING' ? new Date() : null,
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

    // When approved, update the related Item status to RESOLVED
    if (normalizedStatus === 'APPROVED') {
      await prisma.item.update({
        where: { id: existing.itemId },
        data: {
          status: ItemStatus.RESOLVED,
        },
      });
    } else if (normalizedStatus === 'REJECTED') {
      // If rejected, check if there are other pending claims on this item
      const otherPending = await prisma.claim.findFirst({
        where: {
          itemId: existing.itemId,
          status: ClaimStatus.PENDING,
          id: { not: id },
        },
      });

      if (!otherPending) {
        await prisma.item.update({
          where: { id: existing.itemId },
          data: { status: ItemStatus.OPEN },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Claim successfully ${normalizedStatus.toLowerCase()}.`,
      claim: updatedClaim,
    });
  } catch (err: any) {
    console.error('API Error in PATCH /api/claims/[id]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update claim.' },
      { status: 500 }
    );
  }
}
