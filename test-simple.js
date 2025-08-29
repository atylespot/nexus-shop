// 🧪 Simple Database Test
// This script tests the database operations directly

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimple() {
  console.log('🧪 Testing Database Operations Directly\n');

  try {
    // Test 1: Check if landing page order exists
    console.log('1️⃣ Checking landing page order ID: 6');
    const landingPageOrder = await prisma.landingPageOrder.findUnique({
      where: { id: 6 },
      include: {
        product: true
      }
    });
    
    if (landingPageOrder) {
      console.log('✅ Landing page order found:', {
        id: landingPageOrder.id,
        customerName: landingPageOrder.customerName,
        productName: landingPageOrder.productName,
        deliveryArea: landingPageOrder.deliveryArea,
        customerAddress: landingPageOrder.customerAddress,
        deliveryCharge: landingPageOrder.deliveryCharge
      });
    } else {
      console.log('❌ Landing page order not found');
      return;
    }

    // Test 2: Check if courier order already exists
    console.log('\n2️⃣ Checking if courier order already exists for order ID: 6');
    const existingCourierOrder = await prisma.courierOrder.findUnique({
      where: { orderId: 6 }
    });
    
    if (existingCourierOrder) {
      console.log('✅ Courier order already exists:', {
        id: existingCourierOrder.id,
        orderId: existingCourierOrder.orderId,
        courierStatus: existingCourierOrder.courierStatus
      });
    } else {
      console.log('✅ No existing courier order found');
    }

    // Test 3: Check courier settings
    console.log('\n3️⃣ Checking courier settings');
    const courierSetting = await prisma.courierSetting.findFirst({
      where: { isActive: true }
    });
    
    if (courierSetting) {
      console.log('✅ Active courier service found:', {
        id: courierSetting.id,
        baseUrl: courierSetting.baseUrl
      });
    } else {
      console.log('❌ No active courier service found');
      return;
    }

    // Test 4: Try to create courier order
    if (!existingCourierOrder) {
      console.log('\n4️⃣ Attempting to create courier order');
      
      try {
        const courierOrder = await prisma.courierOrder.create({
          data: {
            orderId: 6,
            courierStatus: 'pending',
            courierNote: 'Test creation from script',
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
          courierStatus: courierOrder.courierStatus
        });
        
        // Clean up - delete the test order
        await prisma.courierOrder.delete({
          where: { id: courierOrder.id }
        });
        console.log('🧹 Test courier order cleaned up');
        
      } catch (createError) {
        console.error('❌ Failed to create courier order:', createError.message);
        console.error('🔧 Error details:', {
          name: createError.name,
          code: createError.code,
          meta: createError.meta
        });
      }
    }

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
testSimple();
