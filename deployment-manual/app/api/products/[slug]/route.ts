import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    console.log('🔍 Fetching product by slug:', slug);

    const product = await db.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' }
        },
        inventory: true,
        variations: {
          include: {
            size: true,
            color: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('📦 Found product:', {
      id: product.id,
      name: product.name,
      imagesCount: product.images.length,
      variationsCount: product.variations.length
    });

    const formattedProduct = {
      id: product.id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      aiDescription: product.aiDescription,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      buyPrice: product.buyPrice,
      currency: product.currency,
      sku: product.sku,
      status: product.status,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      images: product.images.map(img => img.url),
      inventory: {
        stock: product.inventory?.quantity || 0,
        lowStockThreshold: product.inventory?.lowStockThreshold || 2,
      },
      variations: product.variations.map(variation => ({
        id: variation.id.toString(),
        sizeId: variation.sizeId,
        colorId: variation.colorId,
        quantity: variation.quantity,
        price: variation.price,
        imageUrl: variation.imageUrl,
        sku: variation.sku,
        isActive: variation.isActive,
        size: variation.size ? {
          id: variation.size.id,
          name: variation.size.name,
          description: variation.size.description
        } : null,
        color: variation.color ? {
          id: variation.color.id,
          name: variation.color.name,
          hexCode: variation.color.hexCode,
          description: variation.color.description
        } : null
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    console.log('📤 Returning product with variations:', {
      variationsCount: formattedProduct.variations.length,
      sizesCount: formattedProduct.variations.filter(v => v.size).length,
      colorsCount: formattedProduct.variations.filter(v => v.color).length
    });

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const {
      name,
      description,
      regularPrice,
      salePrice,
      buyPrice,
      categoryId,
      currency,
      images,
      initialStock,
      hasSizeVariations,
      hasColorVariations,
      sizeVariations,
      colorVariations,
      combinationVariations
    } = body;

    const product = await db.product.findUnique({ where: { slug } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update product basics
    const updated = await db.product.update({
      where: { id: product.id },
      data: {
        name: name ?? product.name,
        description: description ?? product.description,
        regularPrice: regularPrice !== undefined ? parseFloat(regularPrice) : product.regularPrice,
        salePrice: salePrice !== undefined && salePrice !== null ? parseFloat(salePrice) : null,
        buyPrice: buyPrice !== undefined ? parseFloat(buyPrice) : product.buyPrice,
        currency: currency ?? product.currency,
        categoryId: categoryId ? parseInt(categoryId) : product.categoryId,
      }
    });

    // Update inventory quantity if provided
    if (initialStock !== undefined && initialStock !== null) {
      const qty = parseInt(initialStock) || 0;
      await db.inventory.upsert({
        where: { productId: updated.id },
        update: { quantity: qty },
        create: { productId: updated.id, quantity: qty, lowStockThreshold: 2 }
      });
    }

    // Replace images if provided
    if (Array.isArray(images)) {
      await db.productImage.deleteMany({ where: { productId: updated.id } });
      for (let i = 0; i < images.length; i++) {
        await db.productImage.create({
          data: { productId: updated.id, url: images[i], alt: name || updated.name, order: i }
        });
      }
    }

    // Rebuild variations based on payload
    await db.productVariation.deleteMany({ where: { productId: updated.id } });

    const ensureSize = async (sizeName: string) => {
      let size = await db.size.findUnique({ where: { name: sizeName } });
      if (!size) {
        size = await db.size.create({ data: { name: sizeName, description: `Size ${sizeName}` } });
      }
      return size;
    };

    const ensureColor = async (colorName: string) => {
      let color = await db.color.findUnique({ where: { name: colorName } });
      if (!color) {
        // fallback hex
        const hexMap: Record<string, string> = { red: '#FF0000', blue: '#0000FF', green: '#008000', black: '#000000', white: '#FFFFFF', yellow: '#FFFF00', purple: '#800080', pink: '#FFC0CB', orange: '#FFA500', brown: '#A52A2A', gray: '#808080', grey: '#808080' };
        const hex = hexMap[colorName?.toLowerCase?.()] || '#000000';
        color = await db.color.create({ data: { name: colorName, hexCode: hex, description: `Color ${colorName}` } });
      }
      return color;
    };

    if (hasSizeVariations && hasColorVariations && Array.isArray(combinationVariations) && combinationVariations.length > 0) {
      for (const combo of combinationVariations) {
        if (!combo.size || !combo.color) continue;
        const size = await ensureSize(combo.size);
        const color = await ensureColor(combo.color);
        await db.productVariation.create({
          data: {
            productId: updated.id,
            sizeId: size.id,
            colorId: color.id,
            quantity: combo.quantity || 0,
            price: combo.price || 0,
            imageUrl: combo.imagePreview || null,
            sku: `${updated.slug}-${combo.size}-${combo.color}-${Date.now()}`,
            isActive: true
          }
        });
      }
    } else {
      if (hasSizeVariations && Array.isArray(sizeVariations) && sizeVariations.length > 0) {
        for (const s of sizeVariations) {
          if (!s.size) continue;
          const size = await ensureSize(s.size);
          await db.productVariation.create({
            data: {
              productId: updated.id,
              sizeId: size.id,
              colorId: null,
              quantity: s.quantity || 0,
              price: s.price || 0,
              sku: `${updated.slug}-${s.size}-${Date.now()}`,
              isActive: true
            }
          });
        }
      }

      if (hasColorVariations && Array.isArray(colorVariations) && colorVariations.length > 0) {
        for (const c of colorVariations) {
          if (!c.color) continue;
          const color = await ensureColor(c.color);
          await db.productVariation.create({
            data: {
              productId: updated.id,
              sizeId: null,
              colorId: color.id,
              quantity: c.quantity || 0,
              price: c.price || 0,
              imageUrl: c.imagePreview || null,
              sku: `${updated.slug}-${c.color}-${Date.now()}`,
              isActive: true
            }
          });
        }
      }

      // If both toggles but no matrix provided, auto cross-product
      if (hasSizeVariations && hasColorVariations && (!combinationVariations || combinationVariations.length === 0) && Array.isArray(sizeVariations) && Array.isArray(colorVariations) && sizeVariations.length > 0 && colorVariations.length > 0) {
        for (const s of sizeVariations) {
          if (!s.size) continue;
          const size = await ensureSize(s.size);
          for (const c of colorVariations) {
            if (!c.color) continue;
            const color = await ensureColor(c.color);
            await db.productVariation.create({
              data: {
                productId: updated.id,
                sizeId: size.id,
                colorId: color.id,
                quantity: 0,
                price: 0,
                imageUrl: c.imagePreview || null,
                sku: `${updated.slug}-${s.size}-${c.color}-${Date.now()}`,
                isActive: true
              }
            });
          }
        }
      }
    }

    // Return updated product with variations
    const finalProduct = await db.product.findUnique({
      where: { id: updated.id },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        inventory: true,
        variations: { include: { size: true, color: true } }
      }
    });

    const formatted = {
      id: finalProduct!.id.toString(),
      name: finalProduct!.name,
      slug: finalProduct!.slug,
      description: finalProduct!.description,
      aiDescription: finalProduct!.aiDescription,
      regularPrice: finalProduct!.regularPrice,
      salePrice: finalProduct!.salePrice,
      buyPrice: finalProduct!.buyPrice,
      currency: finalProduct!.currency,
      sku: finalProduct!.sku,
      status: finalProduct!.status,
      categoryId: finalProduct!.categoryId,
      categoryName: finalProduct!.category.name,
      images: finalProduct!.images.map(img => img.url),
      inventory: {
        stock: finalProduct!.inventory?.quantity || 0,
        lowStockThreshold: finalProduct!.inventory?.lowStockThreshold || 2,
      },
      variations: finalProduct!.variations,
      createdAt: finalProduct!.createdAt,
      updatedAt: finalProduct!.updatedAt
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('❌ Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}