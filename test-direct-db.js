// 🧪 Test Direct Database
// This script tests direct database operations for courier orders

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectDB() {
  console.log('🧪 Testing Direct Database Operations\n');

  try {
    // Test 1: Create courier order for landing page order ID: 6
    console.log('1️⃣ Creating courier order for landing page order ID: 6');
    
    const courierOrder = await prisma.courierOrder.create({
      data: {
        orderId: 6,
        orderType: 'landing_page',
        courierStatus: 'pending',
        courierNote: 'Test creation without foreign key constraints',
        deliveryCharge: 0,
        courierResponse: {
          service: 'steadfast',
          orderSource: 'landing_page',
          orderDetails: {
            customerName: 'apple',
            productName: 'Organic Face Cream',
            deliveryArea: 'ফ্রি ডেলিভারি',
            address: 'uttara'
          },
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

    // Test 2: Create courier order for website order ID: 1
    console.log('\n2️⃣ Creating courier order for website order ID: 1');
    
    const courierOrder2 = await prisma.courierOrder.create({
      data: {
        orderId: 1,
        orderType: 'website',
        courierStatus: 'pending',
        courierNote: 'Test creation for website order',
        deliveryCharge: 100,
        courierResponse: {
          service: 'steadfast',
          orderSource: 'website',
          createdAt: new Date().toISOString(),
          testCreated: true
        }
      }
    });
    
    console.log('✅ Courier order created successfully:', {
      id: courierOrder2.id,
      orderId: courierOrder2.orderId,
      orderType: courierOrder2.orderType,
      courierStatus: courierOrder2.courierStatus
    });

    // Test 3: List all courier orders
    console.log('\n3️⃣ Listing all courier orders');
    const allCourierOrders = await prisma.courierOrder.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📋 Total courier orders: ${allCourierOrders.length}`);
    allCourierOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ID: ${order.id} | Order ID: ${order.orderId} | Type: ${order.orderType} | Status: ${order.courierStatus}`);
    });

    // Test 4: Clean up test data
    console.log('\n4️⃣ Cleaning up test data');
    await prisma.courierOrder.delete({
      where: { id: courierOrder.id }
    });
    await prisma.courierOrder.delete({
      where: { id: courierOrder2.id }
    });
    console.log('🧹 Test courier orders deleted');

    console.log('\n🎯 Direct database test completed successfully!');

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
testDirectDB();
