const fetch = require('node-fetch');

async function cleanFakeCourierOrders() {
  console.log('🧹 Cleaning fake courier orders...\n');

  try {
    // First, get all courier orders to see which ones are fake
    const getResponse = await fetch('http://localhost:3000/api/courier/orders');
    const getData = await getResponse.json();
    
    console.log(`Found ${getData.data?.length || 0} courier orders`);
    
    if (getData.data && getData.data.length > 0) {
      for (const order of getData.data) {
        const consignmentId = order.courierResponse?.consignment?.consignment_id;
        const isFake = consignmentId && consignmentId.startsWith('CO-');
        
        console.log(`Order ${order.id}: ${consignmentId} - ${isFake ? 'FAKE' : 'Real/Pending'}`);
        
        if (isFake) {
          console.log(`🗑️ This order has fake consignment ID: ${consignmentId}`);
        }
      }
    }

    console.log('\n📋 To create real courier orders:');
    console.log('1. Configure real Steadfast API credentials in Admin Panel');
    console.log('2. Delete existing fake courier orders from database');
    console.log('3. Change order status from "processing" to "in-courier" again');
    console.log('4. System will call real Steadfast API and get real consignment ID');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

cleanFakeCourierOrders();

