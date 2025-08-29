import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deriveCurrencyFromSettings, normalizeCurrency } from "@/lib/currency";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
    console.log('🔍 Fetching products from database...', { categoryId });
    
    const whereClause = categoryId ? { categoryId: parseInt(categoryId) } : {};
    
    const products = await db.product.findMany({
      where: whereClause,
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

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, regularPrice, salePrice, buyPrice, categoryId, currency, sku, images, initialStock } = body;

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
    const finalCurrency = normalizeCurrency(currency || siteSettings?.general?.currency || undefined);

    // Create product
    const product = await db.product.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
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
        stock: parseInt(initialStock) || 0,
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
        stock: createdProduct!.inventory?.stock || 0,
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
