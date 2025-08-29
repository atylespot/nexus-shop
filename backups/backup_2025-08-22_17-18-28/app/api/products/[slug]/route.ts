import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeCurrency } from "@/lib/currency";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const product = await db.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' }
        },
        inventory: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

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
        stock: product.inventory?.stock || 0,
        lowStockThreshold: product.inventory?.lowStockThreshold || 2,
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Check if product exists
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        images: true,
        inventory: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has orders (simplified for SQLite)
    try {
      const orderItemsCount = await db.orderItem.count({
        where: { productId: product.id }
      });

      if (orderItemsCount > 0) {
        return NextResponse.json(
          { error: 'Cannot delete product with existing orders' },
          { status: 400 }
        );
      }
    } catch (countError) {
      console.log('Order count check failed, proceeding with deletion:', countError);
      // Continue with deletion if count check fails
    }

    // Delete product images first
    if (product.images.length > 0) {
      await db.productImage.deleteMany({
        where: { productId: product.id }
      });
    }

    // Delete inventory record
    if (product.inventory) {
      await db.inventory.delete({
        where: { productId: product.id }
      });
    }

    // Delete the product
    await db.product.delete({
      where: { slug }
    });

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await req.json();
    const { name, description, regularPrice, salePrice, buyPrice, categoryId, currency, sku, images, initialStock } = body;

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { slug },
      include: {
        images: true,
        inventory: true
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update product
    const updatedProduct = await db.product.update({
      where: { slug },
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        regularPrice: parseFloat(regularPrice),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        buyPrice: parseFloat(buyPrice || regularPrice),
        currency: normalizeCurrency(currency),
        sku,
        categoryId: parseInt(categoryId),
        status: 'DRAFT'
      }
    });

    // Update inventory
    if (existingProduct.inventory) {
      await db.inventory.update({
        where: { productId: existingProduct.id },
        data: {
          stock: parseInt(initialStock) || 0,
          lowStockThreshold: 2
        }
      });
    } else {
      await db.inventory.create({
        data: {
          productId: existingProduct.id,
          stock: parseInt(initialStock) || 0,
          lowStockThreshold: 2
        }
      });
    }

    // Delete existing images
    if (existingProduct.images.length > 0) {
      await db.productImage.deleteMany({
        where: { productId: existingProduct.id }
      });
    }

    // Create new product images if provided
    if (images && images.length > 0) {
      await Promise.all(
        images.map((url: string, index: number) =>
          db.productImage.create({
            data: {
              url,
              alt: name,
              order: index,
              productId: existingProduct.id
            }
          })
        )
      );
    }

    // Fetch updated product with all relations
    const finalProduct = await db.product.findUnique({
      where: { id: existingProduct.id },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' }
        },
        inventory: true
      }
    });

    const formattedProduct = {
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
        stock: finalProduct!.inventory?.stock || 0,
        lowStockThreshold: finalProduct!.inventory?.lowStockThreshold || 2,
      },
      createdAt: finalProduct!.createdAt,
      updatedAt: finalProduct!.updatedAt
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
