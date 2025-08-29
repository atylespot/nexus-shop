import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { landingId } = await req.json();

    if (!landingId || isNaN(parseInt(landingId))) {
      return NextResponse.json({ error: 'Invalid landing page ID' }, { status: 400 });
    }

    // Increment view count
    const updatedLanding = await db.landingPage.update({
      where: { id: parseInt(landingId) },
      data: {
        viewCount: {
          increment: 1
        }
      },
      select: {
        id: true,
        viewCount: true
      }
    });

    return NextResponse.json({
      success: true,
      viewCount: updatedLanding.viewCount
    });

  } catch (error) {
    console.error('Error updating view count:', error);
    return NextResponse.json(
      { error: 'Failed to update view count' },
      { status: 500 }
    );
  }
}
