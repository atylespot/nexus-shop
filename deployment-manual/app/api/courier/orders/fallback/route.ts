import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, orderType = 'website', error } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Creating fallback courier order for order ID: ${orderId}`);

    // Convert to number since database stores IDs as numbers
    const numericOrderId = parseInt(String(orderId));
    if (isNaN(numericOrderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    // Find the order to get basic information
    let order;
    let orderSource = 'unknown';
    
    try {
      // First, try to find in Order table (website orders)
      order = await db.order.findUnique({
        where: { id: numericOrderId },
        select: {
          id: true,
          customerName: true,
          phone: true,
          address: true,
          total: true,
          shippingCost: true,
          district: true
        }
      });
      
      if (order) {
        orderSource = 'website';
        console.log(`✅ Found website order ID: ${order.id}`);
      } else {
        // If not found in Order table, try LandingPageOrder table
        console.log(`🔍 Order not found in website orders, checking landing page orders...`);
        
        const landingPageOrder = await db.landingPageOrder.findUnique({
          where: { id: numericOrderId },
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            customerAddress: true,
            totalAmount: true,
            deliveryCharge: true,
            deliveryArea: true
          }
        });
        
        if (landingPageOrder) {
          orderSource = 'landing_page';
          console.log(`✅ Found landing page order ID: ${landingPageOrder.id}`);
          
          // Convert LandingPageOrder to Order-like structure
          order = {
            id: landingPageOrder.id,
            customerName: landingPageOrder.customerName || 'Unknown Customer',
            phone: landingPageOrder.customerPhone || 'No Phone',
            address: landingPageOrder.customerAddress || 'No Address',
            total: landingPageOrder.totalAmount || 0,
            shippingCost: landingPageOrder.deliveryCharge || 0,
            district: landingPageOrder.deliveryArea || 'Unknown Area'
          };
        }
      }
    } catch (dbError) {
      console.error('❌ Database error finding order:', dbError);
      return NextResponse.json(
        { error: 'Failed to find order in database' },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate delivery charge
    let deliveryCharge = 0;
    if (order.shippingCost && order.shippingCost > 0) {
      deliveryCharge = order.shippingCost;
    } else if (order.district && order.district !== 'Unknown Area') {
      const districtLower = order.district.toLowerCase();
      switch (districtLower) {
        case 'dhaka':
        case 'ঢাকা':
          deliveryCharge = 80;
          break;
        case 'chittagong':
        case 'চট্টগ্রাম':
          deliveryCharge = 120;
          break;
        case 'sylhet':
        case 'সিলেট':
          deliveryCharge = 150;
          break;
        case 'rajshahi':
        case 'রাজশাহী':
          deliveryCharge = 140;
          break;
        case 'khulna':
        case 'খুলনা':
          deliveryCharge = 130;
          break;
        case 'barisal':
        case 'বরিশাল':
          deliveryCharge = 140;
          break;
        case 'rangpur':
        case 'রংপুর':
          deliveryCharge = 160;
          break;
        case 'mymensingh':
        case 'ময়মনসিংহ':
          deliveryCharge = 100;
          break;
        case 'ফ্রি ডেলিভারি':
          deliveryCharge = 0;
          break;
        default:
          deliveryCharge = 100;
      }
    } else {
      deliveryCharge = 100; // Default charge
    }

    console.log(`📦 Creating fallback courier order with delivery charge: ${deliveryCharge}`);

    // Create courier order with fallback data
    const courierOrder = await db.courierOrder.create({
      data: {
        orderId: numericOrderId,
        orderType: orderSource,
        courierStatus: 'pending',
        courierNote: `Fallback courier order created due to API error: ${error || 'Unknown error'}`,
        deliveryCharge: deliveryCharge,
        courierResponse: {
          service: 'steadfast',
          orderSource: orderSource,
          error: error || 'Unknown error',
          fallback: true,
          createdAt: new Date().toISOString(),
          note: 'This courier order was created as a fallback due to API failure'
        }
      }
    });

    console.log(`✅ Fallback courier order created successfully for ${orderSource} order ${orderId}`);
    console.log(`📋 Courier order details:`, {
      id: courierOrder.id,
      orderId: courierOrder.orderId,
      courierStatus: courierOrder.courierStatus,
      deliveryCharge: courierOrder.deliveryCharge
    });

    return NextResponse.json({
      message: 'Fallback courier order created successfully',
      data: courierOrder,
      orderSource: orderSource
    });

  } catch (error: any) {
    console.error('💥 Error creating fallback courier order:', error);
    console.error('🔧 Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });
    
    return NextResponse.json(
      { error: 'Failed to create fallback courier order' },
      { status: 500 }
    );
  }
}
