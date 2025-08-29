import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SteadfastCourierService } from '@/lib/courier';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, note, deliveryType } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get courier settings
    const courierSetting = await prisma.courierSetting.findFirst();
    if (!courierSetting || !courierSetting.isActive) {
      return NextResponse.json(
        { error: 'Courier service is not configured or not active' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if courier order already exists
    const existingCourierOrder = await prisma.courierOrder.findUnique({
      where: { orderId: parseInt(orderId) }
    });

    if (existingCourierOrder) {
      return NextResponse.json(
        { error: 'Courier order already exists for this order' },
        { status: 400 }
      );
    }

    // Initialize courier service
    const courierService = new SteadfastCourierService(
      courierSetting.apiKey,
      courierSetting.secretKey,
      courierSetting.baseUrl
    );

    // Prepare courier order data
    const courierOrderData = {
      invoice: order.orderNo,
      recipient_name: order.customerName || 'N/A',
      recipient_phone: order.phone || '00000000000',
      recipient_address: order.address || 'N/A',
      cod_amount: order.total,
      note: note || '',
      item_description: order.items.map(item => item.product.name).join(', '),
      total_lot: order.items.reduce((sum, item) => sum + item.quantity, 0),
      delivery_type: deliveryType || 0
    };

    // Create courier order
    const courierResponse = await courierService.createOrder(courierOrderData);

    if (courierResponse.status !== 200) {
      throw new Error(courierResponse.message || 'Failed to create courier order');
    }

    // Save courier order to database
    const courierOrder = await prisma.courierOrder.create({
      data: {
        orderId: parseInt(orderId),
        consignmentId: courierResponse.consignment?.consignment_id?.toString(),
        trackingCode: courierResponse.consignment?.tracking_code,
        courierStatus: courierResponse.consignment?.status || 'pending',
        courierNote: note,
        deliveryCharge: courierResponse.consignment?.delivery_charge || null,
        courierResponse: courierResponse
      }
    });

    // Update order status
    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status: 'SHIPPED' }
    });

    // Auto-update Selling Targets immediately on courier booking (real sale confirmed)
    try {
      const now = new Date();
      const year = now.getFullYear();
      const monthName = now.toLocaleString('default', { month: 'long' });
      const date = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Aggregate qty per product
      const productIdToQty: Record<number, number> = {};
      for (const item of order.items) {
        productIdToQty[item.productId] = (productIdToQty[item.productId] || 0) + item.quantity;
      }

      const tasks: Promise<any>[] = [];
      for (const [productIdStr, qty] of Object.entries(productIdToQty)) {
        const productId = parseInt(productIdStr, 10);
        tasks.push((async () => {
          let adEntry = await prisma.adProductEntry.findFirst({ where: { productId, month: monthName, year } });
          if (!adEntry) {
            const anyItem = order.items.find(i => i.productId === productId);
            const productName = anyItem?.product?.name;
            if (productName) {
              adEntry = await prisma.adProductEntry.findFirst({ where: { productName, month: monthName, year } });
            }
          }
          if (!adEntry) return;
          await prisma.sellingTargetEntry.upsert({
            where: {
              adProductEntryId_date: {
                adProductEntryId: adEntry.id,
                date,
              }
            },
            update: { soldUnits: { increment: qty } },
            create: {
              adProductEntryId: adEntry.id,
              date,
              targetUnits: adEntry.requiredDailyUnits || 0,
              soldUnits: qty,
            }
          });
        })());
      }

      await Promise.all(tasks);
      console.log(`✅ Selling targets auto-updated on courier create for order ${orderId} on ${date}`);
    } catch (autoErr) {
      console.error('⚠️ Failed to auto-update selling targets on courier create:', autoErr);
    }

    return NextResponse.json({ 
      message: 'Courier order created successfully',
      data: {
        courierOrder,
        courierResponse
      }
    });
  } catch (error) {
    console.error('Error creating courier order:', error);
    return NextResponse.json(
      { error: 'Failed to create courier order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      const courierOrder = await prisma.courierOrder.findUnique({
        where: { orderId: parseInt(orderId) },
        include: {
          order: true
        }
      });

      if (!courierOrder) {
        return NextResponse.json(
          { error: 'Courier order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ 
        message: 'Courier order retrieved successfully',
        data: courierOrder 
      });
    }

    // Get all courier orders
    const courierOrders = await prisma.courierOrder.findMany({
      include: {
        order: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      message: 'Courier orders retrieved successfully',
      data: courierOrders 
    });
  } catch (error) {
    console.error('Error fetching courier orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courier orders' },
      { status: 500 }
    );
  }
}
