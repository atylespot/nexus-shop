import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    console.log('=== UNIFIED ORDER API CALLED ===');
    const body = await request.json();
    console.log('Request body:', body);
    
    // Check order type
    const { orderType, ...orderData } = body;
    
    if (orderType === 'landing_page') {
      return await createLandingPageOrder(orderData);
    } else {
      return await createWebsiteOrder(orderData);
    }
    
  } catch (error) {
    console.error('❌ Order creation error:', error);
    return NextResponse.json(
      { error: 'অর্ডার তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}

// Create Landing Page Order
async function createLandingPageOrder(data: any) {
  console.log('=== CREATING LANDING PAGE ORDER ===');
  console.log('Received data:', data);
  
  const { 
    customerName, 
    customerPhone, 
    customerAddress, 
    productId, 
    productName,
    productPrice,
    deliveryCharge,
    totalAmount,
    deliveryArea,
    landingPageId,
    paymentMethod
  } = data;

  console.log('Extracted fields:', {
    customerName,
    customerPhone,
    customerAddress,
    productId,
    productName,
    productPrice,
    deliveryCharge,
    totalAmount,
    deliveryArea,
    landingPageId
  });

  // Validate required fields
  if (!customerName || !customerPhone || !customerAddress || !productId) {
    console.log('❌ Landing page order validation failed');
    return NextResponse.json(
      { error: 'সব প্রয়োজনীয় তথ্য দিন' },
      { status: 400 }
    );
  }

  // Validate Bangladesh phone number
  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!phoneRegex.test(customerPhone)) {
    return NextResponse.json(
      { error: 'সঠিক বাংলাদেশের মোবাইল নম্বর দিন' },
      { status: 400 }
    );
  }

  // Check product and inventory
  const product = await db.product.findUnique({
    where: { id: parseInt(productId) },
    include: { inventory: true }
  });

  if (!product) {
    return NextResponse.json(
      { error: 'প্রোডাক্ট পাওয়া যায়নি' },
      { status: 404 }
    );
  }

  let inventory = product.inventory;
  if (!inventory) {
    inventory = await db.inventory.create({
      data: {
        productId: parseInt(productId),
        quantity: 100,
        lowStockThreshold: 10
      }
    });
  }

  if (inventory.quantity <= 0) {
    return NextResponse.json(
      { error: 'প্রোডাক্ট স্টকে নেই' },
      { status: 400 }
    );
  }

  // Generate unique order number
  const orderCount = await db.order.count();
  const orderNo = `ORD-${(orderCount + 1).toString().padStart(6, '0')}`;

  // Read customer session
  let customerId: number | null = null;
  try { const c = await cookies(); const cid = c.get('customer_id')?.value; if (cid) customerId = Number(cid); } catch {}

  // Create landing page order
  const order = await db.landingPageOrder.create({
    data: {
      customerName,
      customerPhone,
      customerAddress,
      productId: parseInt(productId),
      productName,
      productPrice: parseFloat(productPrice),
      deliveryCharge: parseFloat(deliveryCharge || '0'),
      totalAmount: parseFloat(totalAmount),
      deliveryArea: deliveryArea || 'ঢাকার ভিতরে',
      status: 'processing',
      landingPageId: parseInt(landingPageId),
      orderDate: new Date(),
      paymentMethod: paymentMethod || 'cash_on_delivery',
      customerId: customerId || undefined
    }
  });

  console.log('=== ORDER CREATED SUCCESSFULLY ===');
  console.log('Created order:', order);
  console.log('Order ID:', order.id);
  console.log('Order No:', orderNo);

  // Update inventory
  await db.inventory.update({
    where: { id: inventory.id },
    data: { quantity: { decrement: 1 } }
  });

  // Create order history
  await db.orderHistory.create({
    data: {
      orderId: order.id,
      status: 'processing',
      statusDate: new Date(),
      notes: 'অর্ডার তৈরি হয়েছে'
    }
  });

  const responseData = {
    success: true,
    message: 'ল্যান্ডিং পেজ অর্ডার সফলভাবে জমা হয়েছে',
    orderId: order.id,
    orderNo: orderNo,
    orderType: 'landing_page',
    order: {
      id: order.id,
      orderNo: orderNo,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      productName: order.productName,
      totalAmount: order.totalAmount,
      status: order.status,
      orderDate: order.orderDate
    }
  };

  console.log('=== SENDING RESPONSE ===');
  console.log('Response data:', responseData);

  // Send email notification for new order
  try {
    await emailService.sendOrderNotification({
      orderId: order.id.toString(),
      orderNo: orderNo,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      productName: order.productName,
      totalAmount: order.totalAmount,
      orderType: 'landing_page',
      orderDate: order.orderDate
    });
    console.log('📧 Email notification sent for landing page order');
  } catch (error) {
    console.error('❌ Failed to send email notification:', error);
  }

  return NextResponse.json(responseData);
}

// Create Website Order
async function createWebsiteOrder(data: any) {
  const { 
    customerName, 
    phone,
    address, 
    district,
    items,
    shippingMethod,
    shippingCost,
    subtotal,
    total,
    currency
  } = data;

  // Validate required fields
  if (!customerName || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {
    console.log('❌ Website order validation failed');
    return NextResponse.json(
      { error: 'সব প্রয়োজনীয় তথ্য দিন' },
      { status: 400 }
    );
  }

  // Validate Bangladesh phone number
  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!phoneRegex.test(phone)) {
    return NextResponse.json(
      { error: 'সঠিক বাংলাদেশের মোবাইল নম্বর দিন' },
      { status: 400 }
    );
  }

  // Validate all products and inventory
  for (const item of items) {
    const product = await db.product.findUnique({
      where: { id: parseInt(item.productId) },
      include: { inventory: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: `প্রোডাক্ট পাওয়া যায়নি (ID: ${item.productId})` },
        { status: 404 }
      );
    }

    let inventory = product.inventory;
    if (!inventory) {
      inventory = await db.inventory.create({
        data: {
          productId: product.id,
          quantity: 100,
          lowStockThreshold: 10
        }
      });
    }

    if (inventory.quantity < item.quantity) {
      return NextResponse.json(
        { error: `${product.name} পর্যাপ্ত স্টক নেই` },
        { status: 400 }
      );
    }
  }

  // Generate unique order number
  const orderCount = await db.order.count();
  const orderNo = `ORD-${(orderCount + 1).toString().padStart(6, '0')}`;

  // Optional customer
  let customerId: number | null = null;
  try { const c = await cookies(); const cid = c.get('customer_id')?.value; if (cid) customerId = Number(cid); } catch {}

  // Create main order
  const order = await db.order.create({
    data: {
      orderNo,
      customerName,
      phone,
      address,
      district: district || 'Dhaka',
      status: 'processing',
      paymentStatus: 'UNPAID',
      shippingMethod: shippingMethod || 'cash_on_delivery',
      shippingCost: parseFloat(shippingCost || '0'),
      subtotal: parseFloat(subtotal || '0'),
      total: parseFloat(total || '0'),
      currency: currency || 'BDT',
      customerId: customerId || undefined
    }
  });

  // Create order items and update inventory
  const displayItems: Array<{ name: string; image?: string | null }> = [];
  for (const rawItem of items) {
    const productIdStr = String(rawItem.productId);
    const baseProductId = parseInt(productIdStr, 10);
    const parts = productIdStr.split('_');
    const sizeName = parts.length >= 2 ? parts[1] : '';
    const colorName = parts.length >= 3 ? parts[2] : '';

    const product = await db.product.findUnique({
      where: { id: baseProductId },
      include: { images: true }
    });

    const displayName = `${product?.name || ''}${sizeName ? ` - ${sizeName}` : ''}${colorName ? ` - ${colorName}` : ''}`.trim();
    const displayImage = product?.images?.[0]?.url || null;
    displayItems.push({ name: displayName, image: displayImage });

    await db.orderItem.create({
      data: {
        orderId: order.id,
        productId: baseProductId,
        quantity: parseInt(rawItem.quantity),
        price: parseFloat(rawItem.price)
      }
    });

    await db.inventory.updateMany({
      where: { productId: baseProductId },
      data: { quantity: { decrement: parseInt(rawItem.quantity) } }
    });
  }

  // Write a journey event to preserve variation display (used as fallback in admin UI)
  try {
    const primary = displayItems[0];
    await db.customerJourneyEvent.create({
      data: {
        source: 'website',
        pageType: 'product',
        status: 'order_placed',
        orderId: order.id,
        productName: primary?.name || undefined,
        productImage: primary?.image || undefined
      }
    });
  } catch (e) {
    console.warn('Could not create journey event for order display name', e);
  }

  // Send email notification for new order
  try {
    await emailService.sendOrderNotification({
      orderId: order.id.toString(),
      orderNo: order.orderNo,
      customerName: order.customerName,
      customerPhone: order.phone,
      customerAddress: order.address,
      productName: displayItems[0]?.name || 'Multiple Products',
      totalAmount: order.total,
      orderType: 'website',
      orderDate: order.createdAt,
      items: displayItems.map(item => ({
        name: item.name,
        quantity: 1,
        price: order.total / displayItems.length
      }))
    });
    console.log('📧 Email notification sent for website order');
  } catch (error) {
    console.error('❌ Failed to send email notification:', error);
  }

  return NextResponse.json({
    success: true,
    message: 'ওয়েবসাইট অর্ডার সফলভাবে জমা হয়েছে',
    orderId: order.id,
    orderNo: order.orderNo,
    orderType: 'website',
    order: {
      id: order.id,
      orderNo: order.orderNo,
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      district: order.district,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt
    }
  });
}

export async function GET() {
  try {
    // Fetch both types of orders and journey events for fallback product info
    const [websiteOrdersRaw, landingPageOrders, journeyEvents] = await Promise.all([
      db.order.findMany({
        include: {
          items: {
            include: {
              product: {
                include: { images: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      db.landingPageOrder.findMany({
        include: {
          product: {
            include: { images: true }
          },
          history: {
            orderBy: { statusDate: 'desc' }
          }
        },
        orderBy: { orderDate: 'desc' }
      }),
      db.customerJourneyEvent.findMany({
        where: { orderId: { not: null } },
        select: { orderId: true, productName: true, productImage: true }
      })
    ]);

    // Build fallback map from journey -> orderId
    const byOrderId: Record<string, { productName?: string | null; productImage?: string | null }> = {};
    for (const j of journeyEvents as any[]) {
      if (!j.orderId) continue;
      const key = String(j.orderId);
      byOrderId[key] = byOrderId[key] || {};
      if (j.productName && !byOrderId[key].productName) byOrderId[key].productName = j.productName;
      if (j.productImage && !byOrderId[key].productImage) byOrderId[key].productImage = j.productImage;
    }

    // Enrich website orders with fallback product info
    const websiteOrders = (websiteOrdersRaw as any[]).map((o) => {
      const fallback = byOrderId[String(o.id)] || {};
      if (Array.isArray(o.items)) {
        o.items = o.items.map((it: any) => {
          const img = it.product?.images?.[0]?.url || it.productImage || fallback.productImage || null;
          // Prefer journey fallback productName (which includes variation), then item.productName, then DB product name
          const name = fallback.productName || it.productName || it.product?.name || null;
          return { ...it, productImage: img, productName: name };
        });
      }
      return o;
    });

    // Add order type and format
    const formattedWebsiteOrders = websiteOrders.map((order: any) => ({
      ...order,
      orderType: 'website',
      source: 'website'
    }));

    const formattedLandingPageOrders = landingPageOrders.map((order: any) => ({
      ...order,
      orderType: 'landing_page',
      source: 'landing_page',
      orderNo: `LP-${order.id.toString().padStart(6, '0')}`
    }));

    // Combine and sort by creation date
    const allOrders = [...formattedWebsiteOrders, ...formattedLandingPageOrders]
      .sort((a, b) => new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime());

    return NextResponse.json({ orders: allOrders });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: 'অর্ডার লোড করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
