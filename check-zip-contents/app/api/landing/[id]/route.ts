import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT: update landing page
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    console.log('🚀 Landing page update request:', { id, body });
    
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
      freeDelivery,
      variantConfig,
      paymentMethod
    } = body;
    
    if (!title || !productId) {
      return NextResponse.json({ error: 'title and productId required' }, { status: 400 });
    }
    
    // Check if landing page exists
    const existing = await db.landingPage.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return NextResponse.json({ error: 'landing page not found' }, { status: 404 });
    }
    
    // Check if product exists
    const product = await db.product.findUnique({ where: { id: Number(productId) } });
    if (!product) {
      return NextResponse.json({ error: 'product not found' }, { status: 404 });
    }
    
    // Generate new slug if title changed
    let slug = existing.slug;
    if (title !== existing.title) {
      const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      slug = slugBase;
      let i = 1;
      // Ensure new slug is unique (excluding this id)
      while (await db.landingPage.findFirst({ where: { slug, NOT: { id: Number(id) } } })) {
        slug = `${slugBase}-${i++}`;
      }
    }
    
    const updateData: any = {
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
      blocks: (ctaText || variantConfig || paymentMethod) ? { ctaText, variantConfig, paymentMethod } : null
    };
    
    if (subtitle !== undefined) updateData.subtitle = subtitle || null;
    if (headerImage !== undefined) updateData.headerImage = headerImage || null;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null;
    if (productDescription !== undefined) updateData.productDescription = productDescription || null;
    if (regularPrice !== undefined) updateData.regularPrice = regularPrice || null;
    if (discountPrice !== undefined) updateData.discountPrice = discountPrice || null;
    if (productImages !== undefined) updateData.productImages = productImages || null;
    if (productFeatures !== undefined) updateData.productFeatures = productFeatures || null;
    if (customerReviews !== undefined) updateData.customerReviews = customerReviews || null;
    if (shippingAreas !== undefined) updateData.shippingAreas = shippingAreas || null;
    if (freeDelivery !== undefined) updateData.freeDelivery = freeDelivery;
    
    console.log('📝 Updating landing page with data:', updateData);
    
    let updated;
    try {
      updated = await db.landingPage.update({
        where: { id: Number(id) },
        data: updateData,
        include: { product: { select: { id: true, name: true } } }
      });
      
      console.log('✅ Landing page updated successfully:', updated);
    } catch (updateError) {
      console.error('💥 Database update error:', updateError);
      
      // Check if it's a schema validation error
      if (updateError instanceof Error) {
        if (updateError.message.includes('Unknown field')) {
          return NextResponse.json({ error: 'Database schema mismatch. Please restart the server.' }, { status: 500 });
        } else if (updateError.message.includes('Invalid value')) {
          return NextResponse.json({ error: 'Invalid data format provided' }, { status: 400 });
        }
      }
      
      return NextResponse.json({ error: `Database update failed: ${updateError instanceof Error ? updateError.message : 'Unknown error'}` }, { status: 500 });
    }
    
    const out = {
      id: updated.id,
      title: updated.title,
      subtitle: (updated as any).subtitle || '',
      productId: (updated as any).productId,
      productName: (updated as any).product?.name || '',
      slug: updated.slug,
      headerImage: (updated as any).headerImage || null,
      videoUrl: (updated as any).videoUrl || null,
      productDescription: (updated as any).productDescription || null,
      regularPrice: (updated as any).regularPrice || null,
      discountPrice: (updated as any).discountPrice || null,
      productImages: (updated as any).productImages || null,
      productFeatures: (updated as any).productFeatures || null,
      customerReviews: (updated as any).customerReviews || null,
      shippingAreas: (updated as any).shippingAreas || null,
      freeDelivery: (updated as any).freeDelivery || false,
      ctaText: (updated as any).blocks?.ctaText || undefined,
      pixelIds: (updated as any).pixelIds || [],
      createdAt: updated.createdAt
    };
    
    return NextResponse.json(out);
  } catch (e) {
    console.error('💥 Landing page update error:', e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE: delete landing page
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🗑️ Landing page delete request:', { id });
    
    // Check if landing page exists
    const existing = await db.landingPage.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return NextResponse.json({ error: 'landing page not found' }, { status: 404 });
    }
    
    await db.landingPage.delete({ where: { id: Number(id) } });
    
    console.log('✅ Landing page deleted successfully');
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('💥 Landing page delete error:', e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
