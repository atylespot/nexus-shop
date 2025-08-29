import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: list all landings
export async function GET() {
  try {
    const landings = await db.landingPage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true } } }
    });
    
    const out = landings.map((l: any) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      subtitle: l.subtitle,
      productId: l.productId,
      headerImage: l.headerImage,
      videoUrl: l.videoUrl,
      productDescription: l.productDescription,
      regularPrice: l.regularPrice,
      discountPrice: l.discountPrice,
      productImages: l.productImages,
      productFeatures: l.productFeatures,
      customerReviews: l.customerReviews,
      shippingAreas: l.shippingAreas || [{ area: 'ঢাকার ভিতরে', charge: '80' }],
      freeDelivery: l.freeDelivery || false,
      blocks: l.blocks,
      status: l.status,
      publishedAt: l.publishedAt,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      product: l.product
    }));
    
    return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('GET landing pages error:', e);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST: create landing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🚀 Landing page creation request:', body);
    
    const { 
      title, 
      subtitle, 
      productId, 
      headerImage, 
      videoUrl, 
      ctaText,
      productDescription, 
      regularPrice, 
      discountPrice, 
      productImages,
      productFeatures,
      customerReviews,
      shippingAreas,
      freeDelivery
    } = body;
    
    console.log('📥 Received data:', { title, subtitle, productId, headerImage, videoUrl, productDescription, regularPrice, discountPrice, productImages });
    
    if (!title || !productId) {
      return NextResponse.json({ error: 'Title and Product ID are required' }, { status: 400 });
    }
    
    try {
      const product = await db.product.findUnique({ where: { id: parseInt(productId) } });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      
      // Create a safe slug from product name and timestamp for Bengali text
      const productSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slugBase = productSlug || `product-${productId}`;
      let slug = `${slugBase}-${Date.now()}`;
      
      // Ensure uniqueness
      let i = 1;
      while (await db.landingPage.findUnique({ where: { slug } })) {
        slug = `${slugBase}-${Date.now()}-${i++}`;
      }
      
      console.log('🔗 Generated slug:', slug);
      
      const landingData: any = {
        slug: slug,
        title,
        subtitle,
        productId: parseInt(productId),
        headerImage,
        videoUrl,
        productDescription,
        regularPrice,
        discountPrice,
        productImages,
        productFeatures,
        customerReviews,
        shippingAreas,
        freeDelivery,
        status: 'draft'
      };
      if (ctaText) landingData.blocks = { ctaText };
      
      console.log('📝 Creating landing page with data:', landingData);
      
      const created = await db.landingPage.create({
        data: landingData,
        include: { product: { select: { id: true, name: true } } }
      });
      
      console.log('✅ Landing page created successfully:', created);
      
      const out = {
        id: created.id,
        title: created.title,
        subtitle: (created as any).subtitle || '',
        productId: (created as any).productId,
        productName: (created as any).product?.name || '',
        slug: created.slug,
        headerImage: (created as any).headerImage || null,
        videoUrl: (created as any).videoUrl || null,
        productDescription: (created as any).productDescription || null,
        regularPrice: (created as any).regularPrice || null,
        discountPrice: (created as any).discountPrice || null,
        ctaText: (created as any).blocks?.ctaText || undefined,
        pixelIds: (created as any).pixelIds || [],
        createdAt: created.createdAt
      };
      
      console.log('📤 Sending response:', out);
      return NextResponse.json(out, { status: 201 });
      
    } catch (e) {
      console.error('💥 Landing page creation error:', e);
      
      // Show specific error message
      let errorMessage = 'Failed to create landing page';
      
      if (e instanceof Error) {
        if (e.message.includes('Unique constraint')) {
          errorMessage = 'A landing page with this title already exists';
        } else if (e.message.includes('Foreign key constraint')) {
          errorMessage = 'Selected product does not exist';
        } else if (e.message.includes('Invalid value')) {
          errorMessage = 'Invalid data provided';
        } else {
          errorMessage = e.message;
        }
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (e) {
    console.error('💥 Request parsing error:', e);
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }
}


