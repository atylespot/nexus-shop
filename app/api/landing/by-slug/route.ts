import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const landing = await db.landingPage.findUnique({
      where: { slug },
      include: { product: { include: { images: true } } },
    });

    if (!landing) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    // Ensure JSON serialization for `blocks`, `productImages`, `customerReviews`, `shippingAreas`, `pixelIds`
    const serializedLanding = {
      ...landing,
      blocks: landing.blocks ? JSON.parse(JSON.stringify(landing.blocks)) : null,
      productImages: landing.productImages ? JSON.parse(JSON.stringify(landing.productImages)) : [],
      customerReviews: landing.customerReviews ? JSON.parse(JSON.stringify(landing.customerReviews)) : [],
      shippingAreas: landing.shippingAreas ? JSON.parse(JSON.stringify(landing.shippingAreas)) : [],
      pixelIds: landing.pixelIds ? JSON.parse(JSON.stringify(landing.pixelIds)) : [],
      // Convert Date objects to ISO strings for client-side
      createdAt: landing.createdAt.toISOString(),
      updatedAt: landing.updatedAt.toISOString(),
      publishedAt: landing.publishedAt ? landing.publishedAt.toISOString() : null,
    };

    return NextResponse.json(serializedLanding);
  } catch (error) {
    console.error('Error fetching landing page by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landing page' },
      { status: 500 }
    );
  }
}
