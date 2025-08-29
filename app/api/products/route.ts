import { NextRequest, NextResponse } from "next/server";
import { performanceMonitor } from '@/lib/performance';
import { db } from "@/lib/db";
import { cookies } from 'next/headers';
import { deriveCurrencyFromSettings, normalizeCurrency } from "@/lib/currency";

// Helper function to get color hex codes
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    red: '#FF0000',
    blue: '#0000FF',
    green: '#008000',
    black: '#000000',
    white: '#FFFFFF',
    yellow: '#FFFF00',
    purple: '#800080',
    pink: '#FFC0CB',
    orange: '#FFA500',
    brown: '#A52A2A',
    gray: '#808080',
    grey: '#808080'
  };
  
  return colorMap[colorName.toLowerCase()] || '#000000';
}

export async function GET(request: NextRequest) {
  const timerId = performanceMonitor.startTimer('products_api');
  
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
    console.log('🔍 Fetching products from database...', { categoryId });
    
    const whereClause = categoryId ? { categoryId: parseInt(categoryId) } : {};
    
    const products = await db.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' }
        },
        inventory: true
      }
    });

    console.log('📦 Raw products from database:', products.length);
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`, {
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        imagesCount: product.images.length,
        imageUrls: product.images.map(img => img.url.substring(0, 50) + '...')
      });
    });

    const formattedProducts = products.map(product => ({
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      aiDescription: product.aiDescription,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      buyPrice: product.buyPrice,
      buyingPrice: product.buyPrice, // Alias for compatibility
      sellingPrice: product.regularPrice, // Alias for compatibility
      currency: product.currency,
      sku: product.sku,
      status: product.status,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      images: product.images.map(img => img.url),
      image: product.images[0]?.url || null, // First image for compatibility
      stock: product.inventory?.quantity || 0,
      lowStockThreshold: product.inventory?.lowStockThreshold || 10,
      // Include nested inventory for frontend compatibility
      inventory: {
        stock: product.inventory?.quantity || 0,
        lowStockThreshold: product.inventory?.lowStockThreshold || 10,
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    console.log('📤 Returning formatted products with total images:', 
      formattedProducts.reduce((total, product) => total + product.images.length, 0)
    );
    console.log('📤 Final formatted products:', formattedProducts);

    // Return products directly instead of wrapping in object
    const duration = performanceMonitor.endTimer(timerId, 'products_api');
    console.log(`⚡ Products API took ${duration.toFixed(2)}ms`);
    
    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    
    performanceMonitor.endTimer(timerId, 'products_api');
    
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, regularPrice, salePrice, buyPrice, categoryId, currency, sku, images, initialStock, hasSizeVariations, hasColorVariations, sizeVariations, colorVariations } = body;
    // When both size and color are enabled, UI may send a combination matrix
    const combinationVariations: Array<{ size: string; color: string; quantity?: number; price?: number; imagePreview?: string; }>
      = Array.isArray((body as any).combinationVariations) ? (body as any).combinationVariations : [];

    console.log('🔍 Creating product with data:', {
      name,
      description,
      regularPrice,
      salePrice,
      buyPrice,
      categoryId,
      currency,
      sku,
      imagesCount: images ? images.length : 0,
      initialStock
    });

    if (!name || !regularPrice || !categoryId) {
      return NextResponse.json(
        { error: 'Name, regular price, and category are required' },
        { status: 400 }
      );
    }

    // Resolve currency: prefer explicit payload, else general setting, else default (BDT)
    const siteSettings = await db.siteSetting.findFirst();
    let finalCurrency = currency || "BDT";
    
    // Try to get currency from site settings if available
    if (siteSettings) {
      try {
        const generalSettings = siteSettings.general as any;
        if (generalSettings?.currency) {
          finalCurrency = generalSettings.currency;
        }
      } catch (e) {
        console.log('⚠️ Could not parse general settings, using default currency');
      }
    }
    
    finalCurrency = normalizeCurrency(finalCurrency);

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists and make it unique
    while (await db.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create product
    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        regularPrice: parseFloat(regularPrice),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        buyPrice: parseFloat(buyPrice || regularPrice),
        currency: finalCurrency,
        sku,
        categoryId: parseInt(categoryId),
        status: 'DRAFT'
      }
    });

    console.log('✅ Product created:', product.id);

    // Create inventory record
    await db.inventory.create({
      data: {
        productId: product.id,
        quantity: parseInt(initialStock) || 0,
        lowStockThreshold: 2
      }
    });

    console.log('✅ Inventory created');

    // Create product images if provided
    if (images && images.length > 0) {
      console.log('🖼️ Creating images:', images.length);
      
      const imagePromises = images.map((url: string, index: number) => {
        console.log(`📸 Creating image ${index + 1}:`, url.substring(0, 100) + '...');
        
        return db.productImage.create({
          data: {
            url,
            alt: name,
            order: index,
            productId: product.id
          }
        });
      });

      const createdImages = await Promise.all(imagePromises);
      console.log('✅ Images created:', createdImages.length);
    } else {
      console.log('⚠️ No images provided');
    }

    // Combination-first logic: when both toggles are on and matrix provided
    if (
      hasSizeVariations && hasColorVariations &&
      combinationVariations && combinationVariations.length > 0
    ) {
      console.log('🧩 Creating size-color combination variations:', combinationVariations.length);
      for (const combo of combinationVariations) {
        if (!combo.size || !combo.color) continue;
        let sizeRecord = await db.size.findUnique({ where: { name: combo.size } });
        if (!sizeRecord) {
          sizeRecord = await db.size.create({ data: { name: combo.size, description: `Size ${combo.size}` } });
        }
        let colorRecord = await db.color.findUnique({ where: { name: combo.color } });
        if (!colorRecord) {
          const hexCode = getColorHex(combo.color);
          colorRecord = await db.color.create({ data: { name: combo.color, hexCode, description: `Color ${combo.color}` } });
        }
        await db.productVariation.create({
          data: {
            productId: product.id,
            sizeId: sizeRecord.id,
            colorId: colorRecord.id,
            quantity: combo.quantity || 0,
            price: combo.price || 0,
            imageUrl: combo.imagePreview || null,
            sku: `${product.slug}-${combo.size}-${combo.color}-${Date.now()}`
          }
        });
      }
      console.log('✅ Combination variations created');
    } else {
      // Size-only variations
      if (hasSizeVariations && sizeVariations && sizeVariations.length > 0) {
        console.log('📏 Creating size variations:', sizeVariations.length);
        for (const variation of sizeVariations) {
          let sizeRecord = await db.size.findUnique({ where: { name: variation.size } });
          if (!sizeRecord) {
            sizeRecord = await db.size.create({ data: { name: variation.size, description: `Size ${variation.size}` } });
          }
          await db.productVariation.create({
            data: {
              productId: product.id,
              sizeId: sizeRecord.id,
              colorId: null,
              quantity: variation.quantity || 0,
              price: variation.price || 0,
              sku: `${product.slug}-${variation.size}-${Date.now()}`
            }
          });
        }
        console.log('✅ Size variations created');
      }
      // Color-only variations
      if (hasColorVariations && colorVariations && colorVariations.length > 0) {
        console.log('🎨 Creating color variations:', colorVariations.length);
        for (const variation of colorVariations) {
          let colorRecord = await db.color.findUnique({ where: { name: variation.color } });
          if (!colorRecord) {
            const hexCode = getColorHex(variation.color);
            colorRecord = await db.color.create({ data: { name: variation.color, hexCode, description: `Color ${variation.color}` } });
          }
          await db.productVariation.create({
            data: {
              productId: product.id,
              sizeId: null,
              colorId: colorRecord.id,
              quantity: variation.quantity || 0,
              price: variation.price || 0,
              imageUrl: variation.imagePreview || null,
              sku: `${product.slug}-${variation.color}-${Date.now()}`
            }
          });
        }
        console.log('✅ Color variations created');
      }
      // Fallback cross-product if both toggles are on but no matrix provided
      if (
        hasSizeVariations && hasColorVariations &&
        (!combinationVariations || combinationVariations.length === 0) &&
        sizeVariations && sizeVariations.length > 0 &&
        colorVariations && colorVariations.length > 0
      ) {
        console.log('🧮 Creating auto cross-product size-color variations');
        for (const s of sizeVariations) {
          if (!s.size) continue;
          let sizeRecord = await db.size.findUnique({ where: { name: s.size } });
          if (!sizeRecord) {
            sizeRecord = await db.size.create({ data: { name: s.size, description: `Size ${s.size}` } });
          }
          for (const c of colorVariations) {
            if (!c.color) continue;
            let colorRecord = await db.color.findUnique({ where: { name: c.color } });
            if (!colorRecord) {
              const hexCode = getColorHex(c.color);
              colorRecord = await db.color.create({ data: { name: c.color, hexCode, description: `Color ${c.color}` } });
            }
            await db.productVariation.create({
              data: {
                productId: product.id,
                sizeId: sizeRecord.id,
                colorId: colorRecord.id,
                quantity: 0,
                price: 0,
                imageUrl: (c as any).imagePreview || null,
                sku: `${product.slug}-${s.size}-${c.color}-${Date.now()}`
              }
            });
          }
        }
        console.log('✅ Auto cross-product variations created');
      }
    }

    // Log activity
    try {
      const c = cookies();
      const actor = Number(c.get('session_user')?.value || '0') || null;
      if (actor) {
        await db.adminActivityLog.create({
          data: {
            actorId: actor,
            action: 'create_product',
            targetType: 'product',
            targetId: String(product.id),
            meta: { name }
          }
        });
      }
    } catch (logErr) {
      console.warn('Activity log failed (product create):', logErr);
    }

    // Fetch created product with all relations
    const createdProduct = await db.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' }
        },
        inventory: true
      }
    });

    console.log('🔍 Final product data:', {
      id: createdProduct?.id,
      name: createdProduct?.name,
      imagesCount: createdProduct?.images.length,
      imageUrls: createdProduct?.images.map(img => img.url.substring(0, 50) + '...')
    });

    const formattedProduct = {
      id: createdProduct!.id.toString(),
      name: createdProduct!.name,
      slug: createdProduct!.slug,
      description: createdProduct!.description,
      aiDescription: createdProduct!.aiDescription,
      regularPrice: createdProduct!.regularPrice,
      salePrice: createdProduct!.salePrice,
      buyPrice: createdProduct!.buyPrice,
      currency: createdProduct!.currency,
      sku: createdProduct!.sku,
      status: createdProduct!.status,
      categoryId: createdProduct!.categoryId,
      categoryName: createdProduct!.category.name,
      images: createdProduct!.images.map(img => img.url),
      inventory: {
        stock: createdProduct!.inventory?.quantity || 0,
        lowStockThreshold: createdProduct!.inventory?.lowStockThreshold || 2,
      },
      createdAt: createdProduct!.createdAt,
      updatedAt: createdProduct!.updatedAt
    };

    console.log('📤 Returning formatted product with images:', formattedProduct.images.length);

    return NextResponse.json(formattedProduct, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
