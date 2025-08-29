// 🧪 Test New Consignment ID
// This script tests the updated courier orders API with consignment_id

const BASE_URL = 'http://localhost:3000';

async function testNewConsignment() {
  console.log('🧪 Testing Updated Courier Orders API with Consignment ID\n');

  try {
    // Test 1: Test with a new order ID that doesn't have a courier order
    console.log('1️⃣ Testing with a new order ID (should create new courier order)');
    
    // First, let's check what orders are available
    const debugResponse = await fetch(`${BASE_URL}/api/courier/orders?debug=true`);
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('📋 Available orders:', debugData.data);
      
      // Find an order that doesn't have a courier order
      const websiteOrder = debugData.data.websiteOrders[0];
      const landingPageOrder = debugData.data.landingPageOrders[0];
      
      if (websiteOrder) {
        console.log(`\n2️⃣ Testing with website order ID: ${websiteOrder.id}`);
        
        const response = await fetch(`${BASE_URL}/api/courier/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: websiteOrder.id,
            courierService: 'steadfast',
            orderType: 'website'
          })
        });
        
        console.log(`   Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Success:', data.message);
          console.log('   Courier Order ID:', data.data.id);
          console.log('   Order Source:', data.orderSource);
          console.log('   Order Type:', data.data.orderType);
          
          // Check if consignment_id is present
          if (data.data.courierResponse?.consignment?.consignment_id) {
            console.log('   Consignment ID:', data.data.courierResponse.consignment.consignment_id);
            console.log('   ✅ Consignment ID is present!');
          } else {
            console.log('   ❌ Consignment ID is missing!');
          }
        } else {
          console.log('❌ Error response:');
          try {
            const errorData = await response.json();
            console.log('   Error:', errorData.error);
          } catch (parseError) {
            console.log('   Could not parse error response');
          }
        }
      }
      
      if (landingPageOrder) {
        console.log(`\n3️⃣ Testing with landing page order ID: ${landingPageOrder.id}`);
        
        const response2 = await fetch(`${BASE_URL}/api/courier/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: landingPageOrder.id,
            courierService: 'steadfast',
            orderType: 'landing_page'
          })
        });
        
        console.log(`   Response status: ${response2.status}`);
        
        if (response2.ok) {
          const data = await response2.json();
          console.log('✅ Success:', data.message);
          console.log('   Courier Order ID:', data.data.id);
          console.log('   Order Source:', data.orderSource);
          console.log('   Order Type:', data.data.orderType);
          
          // Check if consignment_id is present
          if (data.data.courierResponse?.consignment?.consignment_id) {
            console.log('   Consignment ID:', data.data.courierResponse.consignment.consignment_id);
            console.log('   ✅ Consignment ID is present!');
          } else {
            console.log('   ❌ Consignment ID is missing!');
          }
        } else {
          console.log('❌ Error response:');
          try {
            const errorData = await response2.json();
            console.log('   Error:', errorData.error);
          } catch (parseError) {
            console.log('   Could not parse error response');
          }
        }
      }
    }

    console.log('\n🎯 New consignment ID test completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testNewConsignment();

