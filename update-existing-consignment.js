// 🧪 Update Existing Consignment IDs
// This script updates existing courier orders with consignment_id

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExistingConsignment() {
  console.log('🧪 Updating Existing Courier Orders with Consignment IDs\n');

  try {
    // Get all courier orders
    const courierOrders = await prisma.courierOrder.findMany();
    console.log(`📋 Found ${courierOrders.length} courier orders`);
    
    for (const courierOrder of courierOrders) {
      console.log(`\n🔄 Updating courier order ID: ${courierOrder.id} for order ID: ${courierOrder.orderId}`);
      
      // Check if consignment_id already exists
      const currentResponse = courierOrder.courierResponse || {};
      if (currentResponse.consignment?.consignment_id) {
        console.log(`   ✅ Already has consignment_id: ${currentResponse.consignment.consignment_id}`);
        continue;
      }
      
      // Add consignment_id
      const updatedResponse = {
        ...currentResponse,
        consignment: {
          consignment_id: `CO-${Date.now()}-${courierOrder.orderId}`,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      };
      
      // Update the courier order
      const updatedOrder = await prisma.courierOrder.update({
        where: { id: courierOrder.id },
        data: {
          courierResponse: updatedResponse
        }
      });
      
      console.log(`   ✅ Updated with consignment_id: ${updatedResponse.consignment.consignment_id}`);
    }
    
    console.log('\n🎯 All existing courier orders updated!');

  } catch (error) {
    console.error('💥 Update failed:', error.message);
    console.error('🔧 Error details:', {
      name: error.name,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateExistingConsignment();

