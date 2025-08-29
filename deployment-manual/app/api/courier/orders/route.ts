import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SteadfastCourierService, CourierOrderData } from '@/lib/courier';

export async function POST(request: NextRequest) {
  try {
    // First, check if courier service is configured and active
    const courierSetting = await db.courierSetting.findFirst();
    if (!courierSetting || !courierSetting.isActive) {
      return NextResponse.json(
        { error: 'Courier service is not configured or not active. Please configure courier settings first.' },
        { status: 400 }
      );
    }

    console.log('✅ Courier service is active:', {
      isActive: courierSetting.isActive,
      hasApiKey: !!courierSetting.apiKey,
      hasSecretKey: !!courierSetting.secretKey,
      baseUrl: courierSetting.baseUrl
    });

    const body = await request.json();
    console.log('📋 Request body received:', body);
    
    const { orderId, courierService = 'steadfast', orderType = 'website' } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Validate order ID format
    if (typeof orderId !== 'string' && typeof orderId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    // Clean and validate order ID
    const cleanOrderId = String(orderId).trim();
    if (!cleanOrderId || cleanOrderId === 'undefined' || cleanOrderId === 'null') {
      return NextResponse.json(
        { error: 'Order ID cannot be empty or invalid' },
        { status: 400 }
      );
    }

    console.log(`📝 Processing courier order request for order ID: "${cleanOrderId}" (type: ${orderType})`);

    // Convert to number since database stores IDs as numbers
    const numericOrderId = parseInt(cleanOrderId);
    if (isNaN(numericOrderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID format - must be a number' },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking for order with numeric ID: ${numericOrderId}`);
    
    let order;
    let orderSource = 'unknown';
    
    try {
      // First, try to find in Order table (website orders)
      order = await db.order.findUnique({
        where: { id: numericOrderId },
        include: {
          items: {
            include: {
              product: true
            }
          }
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
          include: {
            product: true
          }
        });
        
        if (landingPageOrder) {
          orderSource = 'landing_page';
          console.log(`✅ Found landing page order ID: ${landingPageOrder.id}`);
          console.log(`📋 Landing page order details:`, {
            customerName: landingPageOrder.customerName,
            productName: landingPageOrder.productName,
            deliveryArea: landingPageOrder.deliveryArea,
            customerAddress: landingPageOrder.customerAddress,
            deliveryCharge: landingPageOrder.deliveryCharge
          });
          
          // Convert LandingPageOrder to Order-like structure for consistency
          // Handle null/undefined values safely
          order = {
            id: landingPageOrder.id,
            orderNo: `LP-${landingPageOrder.id.toString().padStart(6, '0')}`,
            customerName: landingPageOrder.customerName || 'Unknown Customer',
            userEmail: null,
            phone: landingPageOrder.customerPhone || 'No Phone',
            status: landingPageOrder.status || 'processing',
            shippingCost: landingPageOrder.deliveryCharge || 0,
            subtotal: landingPageOrder.productPrice || 0,
            total: landingPageOrder.totalAmount || 0,
            district: landingPageOrder.deliveryArea || 'Unknown Area',
            address: landingPageOrder.customerAddress || 'No Address',
            items: [{
              id: landingPageOrder.id,
              productId: landingPageOrder.productId,
              quantity: 1,
              price: landingPageOrder.productPrice || 0,
              product: landingPageOrder.product || { name: 'Unknown Product' }
            }]
          };
          
          console.log(`✅ Converted landing page order to standard format`);
        }
      }
      
      console.log(`🔍 Order lookup result:`, order ? `Found ${orderSource} order ID: ${order.id}` : 'Order not found in both tables');
    } catch (dbError) {
      console.error('❌ Database error during order lookup:', dbError);
      return NextResponse.json(
        { error: 'Database error during order lookup' },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found in either website orders or landing page orders' },
        { status: 404 }
      );
    }

    // Check if courier order already exists
    const existingCourierOrder = await db.courierOrder.findUnique({
      where: { orderId: numericOrderId }
    });

    if (existingCourierOrder) {
      return NextResponse.json(
        { 
          message: 'Courier order already exists',
          data: existingCourierOrder
        },
        { status: 200 }
      );
    }

    // Get courier settings (already checked above, using existing courierSetting)
    if (!courierSetting) {
      return NextResponse.json(
        { error: 'No active courier service configured' },
        { status: 400 }
      );
    }

    // Calculate delivery charge based on order details
    let deliveryCharge = 0;
    if (order.shippingCost && order.shippingCost > 0) {
      deliveryCharge = order.shippingCost;
      console.log(`💰 Using order shipping cost: ${deliveryCharge}`);
    } else {
      // Default delivery charge based on district
      if (order.district && order.district !== 'Unknown Area') {
        const districtLower = order.district.toLowerCase();
        console.log(`🗺️ Calculating delivery charge for district: ${order.district}`);
        
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
        console.log(`💰 Calculated delivery charge: ${deliveryCharge}`);
      } else {
        deliveryCharge = 100; // Default charge
        console.log(`💰 Using default delivery charge: ${deliveryCharge}`);
      }
    }

    console.log(`📦 Creating courier order with delivery charge: ${deliveryCharge}`);

    // Initialize Steadfast Courier Service
    const steadfastService = new SteadfastCourierService(
      courierSetting.apiKey,
      courierSetting.secretKey,
      courierSetting.baseUrl
    );

    // Prepare courier request data
    const courierRequestData: CourierOrderData = {
      invoice: `INV-${numericOrderId}-${Date.now()}`,
      recipient_name: order.customerName || 'Unknown Customer',
      recipient_phone: order.phone || '',
      recipient_address: order.address || 'No Address',
      cod_amount: order.total || 0,
      note: `Order from ${orderSource}. Customer: ${order.customerName || 'Unknown'}`
    };

    console.log(`🚚 Sending order to Steadfast Courier...`);
    console.log(`📋 Courier request data:`, courierRequestData);
    console.log(`🔑 Using API Key: ${courierSetting.apiKey.substring(0, 8)}...`);
    console.log(`🔑 Using Secret Key: ${courierSetting.secretKey.substring(0, 8)}...`);
    console.log(`🌐 Using Base URL: ${courierSetting.baseUrl}`);

    let courierApiResponse;
    
    try {
      // Call real Steadfast API - using createOrder method
      console.log(`📡 Making API call to: ${courierSetting.baseUrl}/create_order`);
      courierApiResponse = await steadfastService.createOrder(courierRequestData);
      console.log(`✅ Steadfast API Response:`, courierApiResponse);
      
      // Check if response has success status
      if (courierApiResponse.status !== 200) {
        throw new Error(`Steadfast API Error: ${courierApiResponse.message || 'Unknown error'}`);
      }
      
    } catch (courierApiError: any) {
      console.error(`❌ Steadfast API Error:`, courierApiError);
      return NextResponse.json(
        { error: `Courier booking failed: ${courierApiError.message}` },
        { status: 500 }
      );
    }

    // Create courier order with real data
    let courierOrder;
    
    try {
      courierOrder = await db.courierOrder.create({
        data: {
          orderId: numericOrderId,
          orderType: orderSource,
          consignmentId: courierApiResponse.consignment?.consignment_id?.toString() || null,
          trackingCode: courierApiResponse.consignment?.tracking_code || null,
          courierStatus: 'pending',
          courierNote: `Real courier booking via Steadfast API`,
          deliveryCharge: deliveryCharge,
          courierResponse: {
            service: courierService,
            orderSource: orderSource,
            steadfastResponse: courierApiResponse,
            consignment: {
              consignment_id: courierApiResponse.consignment?.consignment_id?.toString(),
              tracking_code: courierApiResponse.consignment?.tracking_code,
              status: courierApiResponse.consignment?.status || 'pending',
              invoice: courierRequestData.invoice,
              created_at: new Date().toISOString()
            },
            orderDetails: {
              customerName: order.customerName,
              phone: order.phone || '',
              address: order.address,
              productName: order.items[0]?.product?.name || 'Unknown Product',
              deliveryArea: order.district,
              codAmount: courierRequestData.cod_amount
            },
            createdAt: new Date().toISOString(),
            realBooking: true
          }
        }
      });
    } catch (createError: any) {
      console.error('💥 Failed to create courier order:', createError.message);
      
      // If foreign key constraint fails, try creating with minimal data
      if (createError.code === 'P2003') {
        console.log('🔄 Retrying with minimal data due to foreign key constraint...');
        
        courierOrder = await db.courierOrder.create({
          data: {
            orderId: numericOrderId,
            orderType: orderSource,
            courierStatus: 'pending',
            courierNote: `Auto-created when ${orderSource} order status changed to in-courier (minimal data)`,
            deliveryCharge: deliveryCharge,
            courierResponse: {
              service: courierService,
              orderSource: orderSource,
              consignment: {
                consignment_id: `CO-${Date.now()}-${numericOrderId}`,
                status: 'pending',
                created_at: new Date().toISOString()
              },
              error: 'Foreign key constraint bypassed',
              createdAt: new Date().toISOString(),
              autoCreated: true
            }
          }
        });
        
        console.log('✅ Courier order created with minimal data');
      } else {
        throw createError; // Re-throw if it's not a foreign key constraint error
      }
    }

    console.log(`✅ Courier order created successfully for ${orderSource} order ${orderId}`);
    console.log(`📋 Courier order details:`, {
      id: courierOrder.id,
      orderId: courierOrder.orderId,
      courierStatus: courierOrder.courierStatus,
      deliveryCharge: courierOrder.deliveryCharge
    });

    return NextResponse.json({
      message: 'Courier order created successfully',
      data: courierOrder,
      orderSource: orderSource
    });

  } catch (error: any) {
    console.error('💥 Error creating courier order:', error);
    console.error('🔧 Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });
    
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
    const debug = searchParams.get('debug');
    const status = (searchParams.get('status') || '').toLowerCase();
    const phone = (searchParams.get('phone') || '').trim();
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));

    // Debug endpoint to check order IDs from both tables
    if (debug === 'true') {
      const websiteOrders = await db.order.findMany({
        select: { id: true, orderNo: true, customerName: true, status: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      
      const landingPageOrders = await db.landingPageOrder.findMany({
        select: { id: true, customerName: true, productName: true, status: true },
        take: 5,
        orderBy: { orderDate: 'desc' }
      });
      
      return NextResponse.json({
        message: 'Debug: Available orders from both sources',
        data: {
          websiteOrders: websiteOrders.map((o: any) => ({ ...o, source: 'website' })),
          landingPageOrders: landingPageOrders.map((o: any) => ({ ...o, source: 'landing_page' }))
        },
        note: 'Use these order IDs to test courier order creation from both sources'
      });
    }

    if (orderId) {
      // Get specific courier order
      const cleanOrderId = String(orderId).trim();
      const numericOrderId = parseInt(cleanOrderId);
      
      if (isNaN(numericOrderId)) {
        return NextResponse.json(
          { error: 'Invalid order ID format' },
          { status: 400 }
        );
      }
      
      const courierOrder = await db.courierOrder.findUnique({
        where: { orderId: numericOrderId }
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

    // Build filters
    const where: any = {};
    if (status) where.courierStatus = status;
    if (phone) where.courierNote = { contains: phone };
    if (from || to) {
      where.createdAt = {} as any;
      if (from) (where.createdAt as any).gte = new Date(from);
      if (to) (where.createdAt as any).lte = new Date(new Date(to).setHours(23,59,59,999));
    }

    const [total, courierOrdersRaw] = await Promise.all([
      db.courierOrder.count({ where }),
      db.courierOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    // Enrich with real customer/product info from source orders
    const courierOrders = await Promise.all(courierOrdersRaw.map(async (co: any) => {
      let customerName: string | undefined;
      let productName: string | undefined;
      let address: string | undefined;
      try {
        if ((co.orderType || '').toLowerCase() === 'landing_page') {
          const lp = await db.landingPageOrder.findUnique({
            where: { id: co.orderId },
            select: { customerName: true, productName: true, customerAddress: true }
          });
          customerName = lp?.customerName || undefined;
          productName = lp?.productName || undefined;
          address = lp?.customerAddress || undefined;
        } else {
          const o = await db.order.findUnique({
            where: { id: co.orderId },
            select: { customerName: true, address: true, items: { select: { product: { select: { name: true } } } } }
          });
          customerName = o?.customerName || undefined;
          productName = (o?.items && o.items[0]?.product?.name) || undefined;
          address = o?.address || undefined;
        }
      } catch {}

      const courierResponse = co.courierResponse || {};
      const orderDetails = {
        customerName: customerName || courierResponse?.orderDetails?.customerName,
        productName: productName || courierResponse?.orderDetails?.productName,
        address: address || courierResponse?.orderDetails?.address
      };
      return { ...co, courierResponse: { ...courierResponse, orderDetails } };
    }));

    return NextResponse.json({
      message: 'Courier orders retrieved successfully',
      data: courierOrders,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });

  } catch (error) {
    console.error('Error fetching courier orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courier orders' },
      { status: 500 }
    );
  }
}
