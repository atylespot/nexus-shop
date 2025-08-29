import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const inventory = await db.inventory.findMany({
      include: {
        product: {
          include: {
            images: true,
            category: true
          }
        }
      }
    });

    const formattedInventory = inventory.map((item, index) => ({
      // Use productId as the primary id for UI consistency, with index to ensure uniqueness
      id: `${item.productId.toString()}-${index}`,
      productId: item.productId,
      productSlug: item.product.slug,
      productName: item.product.name,
      productImage: item.product.images[0]?.url || '',
      categoryId: item.product.categoryId,
      categoryName: item.product.category?.name || null,
      currency: item.product.currency,
      buyPrice: item.product.buyPrice,
      stock: item.quantity,
      lowStockThreshold: item.lowStockThreshold || 10,
      isLowStock: item.quantity <= (item.lowStockThreshold || 10)
    }));

    return NextResponse.json(formattedInventory, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, stock, lowStockThreshold } = body;

    if (!productId || stock === undefined) {
      return NextResponse.json(
        { error: 'Product ID and stock are required' },
        { status: 400 }
      );
    }

    const pid = parseInt(productId);
    const newStock = parseInt(stock);
    const newThreshold = lowStockThreshold !== undefined && lowStockThreshold !== null
      ? parseInt(lowStockThreshold)
      : {}

    const updatedInventory = await db.inventory.upsert({
      where: { productId: pid },
      update: {
        quantity: newStock,
        ...(newThreshold !== undefined ? { lowStockThreshold: newThreshold } : {})
      },
      create: {
        productId: pid,
        quantity: newStock,
        lowStockThreshold: newThreshold ?? 10
      },
      include: {
        product: {
          include: { images: true }
        }
      }
    });

    console.log(`Inventory upserted for product ${pid}: quantity = ${newStock}`);

    return NextResponse.json(updatedInventory, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
