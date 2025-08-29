// 🧪 Check Available Orders
// This script checks which order IDs are available and don't have courier orders

const BASE_URL = 'http://localhost:3000';

async function checkAvailableOrders() {
  console.log('🧪 Checking Available Orders\n');

  try {
    // Get debug info
    const debugResponse = await fetch(`${BASE_URL}/api/courier/orders?debug=true`);
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('📋 Available orders:');
      console.log('   Website Orders:', debugData.data.websiteOrders.map(o => o.id));
      console.log('   Landing Page Orders:', debugData.data.landingPageOrders.map(o => o.id));
      
      // Check which ones don't have courier orders
      const allOrderIds = [
        ...debugData.data.websiteOrders.map(o => ({ id: o.id, type: 'website' })),
        ...debugData.data.landingPageOrders.map(o => ({ id: o.id, type: 'landing_page' }))
      ];
      
      console.log('\n🔍 Checking which orders don\'t have courier orders...');
      
      for (const order of allOrderIds) {
        const courierResponse = await fetch(`${BASE_URL}/api/courier/orders?orderId=${order.id}`);
        if (courierResponse.ok) {
          const courierData = await courierResponse.json();
          if (courierData.data) {
            console.log(`   Order ID ${order.id} (${order.type}): ✅ Has courier order`);
          } else {
            console.log(`   Order ID ${order.id} (${order.type}): ❌ No courier order`);
          }
        } else {
          console.log(`   Order ID ${order.id} (${order.type}): ❌ No courier order`);
        }
      }
    }

  } catch (error) {
    console.error('💥 Check failed:', error.message);
  }
}

// Run the check
checkAvailableOrders();

