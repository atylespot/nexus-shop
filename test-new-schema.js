// 🧪 Test New Schema
// This script tests the new schema where CourierOrder can reference both order types

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewSchema() {
  console.log('🧪 Testing New Schema\n');

  try {
    // Test 1: Create courier order for landing page order
    console.log('1️⃣ Creating courier order for landing page order ID: 6');
    
    const courierOrder = await prisma.courierOrder.create({
      data: {
        orderId: 6,
        orderType: 'landing_page',
        courierStatus: 'pending',
        courierNote: 'Test creation with new schema',
        deliveryCharge: 0,
        courierResponse: {
          service: 'steadfast',
          orderSource: 'landing_page',
          createdAt: new Date().toISOString(),
          testCreated: true
        }
      }
    });
    
    console.log('✅ Courier order created successfully:', {
      id: courierOrder.id,
      orderId: courierOrder.orderId,
      orderType: courierOrder.orderType,
      courierStatus: courierOrder.courierStatus
    });

    // Test 2: Retrieve the courier order with relations
    console.log('\n2️⃣ Retrieving courier order with relations');
    
    const retrievedOrder = await prisma.courierOrder.findUnique({
      where: { id: courierOrder.id },
      include: {
        order: true,
        landingPageOrder: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (retrievedOrder) {
      console.log('✅ Courier order retrieved:', {
        id: retrievedOrder.id,
        orderId: retrievedOrder.orderId,
        orderType: retrievedOrder.orderType,
        order: retrievedOrder.order ? 'Website order found' : 'No website order',
        landingPageOrder: retrievedOrder.landingPageOrder ? 'Landing page order found' : 'No landing page order'
      });
      
      if (retrievedOrder.landingPageOrder) {
        console.log('📋 Landing page order details:', {
          customerName: retrievedOrder.landingPageOrder.customerName,
          productName: retrievedOrder.landingPageOrder.productName,
          deliveryArea: retrievedOrder.landingPageOrder.deliveryArea
        });
      }
    }

    // Test 3: Clean up - delete the test order
    console.log('\n3️⃣ Cleaning up test data');
    await prisma.courierOrder.delete({
      where: { id: courierOrder.id }
    });
    console.log('🧹 Test courier order deleted');

    console.log('\n🎯 New schema test completed successfully!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('🔧 Error details:', {
      name: error.name,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNewSchema();
