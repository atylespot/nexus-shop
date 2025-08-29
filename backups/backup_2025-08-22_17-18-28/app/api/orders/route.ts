import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('=== ORDER API CALLED ===');
    const body = await request.json();
    console.log('Request body:', body);
    
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
      landingPageId
    } = body;

    // Validate required fields
    if (!customerName || !customerPhone || !customerAddress || !productId) {
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

    console.log('Checking product with ID:', productId);
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { inventory: true }
    });
    
    console.log('Product found:', product);

    if (!product) {
      return NextResponse.json(
        { error: 'প্রোডাক্ট পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    // Check inventory - if no inventory record exists, create one with default stock
    let inventory = product.inventory;
    if (!inventory) {
      console.log('No inventory record found, creating default inventory...');
      inventory = await prisma.inventory.create({
        data: {
          productId: parseInt(productId),
          quantity: 100, // Default stock
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

    console.log('Product stock available:', inventory.quantity);
    console.log('Creating order...');

    // Create order
    const order = await prisma.landingPageOrder.create({
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
        paymentMethod: 'cash_on_delivery'
      }
    });

    console.log('Order created successfully:', order.id);

    // Update inventory - decrease quantity
    console.log('Updating inventory...');
    await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        quantity: {
          decrement: 1
        }
      }
    });
    console.log('Inventory updated successfully');

    // Create order history
    console.log('Creating order history...');
    await prisma.orderHistory.create({
      data: {
        orderId: order.id,
        status: 'processing',
        statusDate: new Date(),
        notes: 'অর্ডার তৈরি হয়েছে'
      }
    });
    console.log('Order history created successfully');

    return NextResponse.json({
      success: true,
      message: 'অর্ডার সফলভাবে জমা হয়েছে',
      orderId: order.id,
      order: {
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        productName: order.productName,
        totalAmount: order.totalAmount,
        status: order.status,
        orderDate: order.orderDate
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'অর্ডার তৈরি করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const orders = await prisma.landingPageOrder.findMany({
      include: {
        product: {
          include: { images: true }
        },
        history: {
          orderBy: {
            statusDate: 'desc'
          }
        }
      },
      orderBy: {
        orderDate: 'desc'
      }
    });

    console.log('Returning success response...');
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: 'অর্ডার লোড করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
