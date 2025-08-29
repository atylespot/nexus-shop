// 🧪 Test Fresh Order
// This script tests with a fresh order ID that doesn't have a courier order

const BASE_URL = 'http://localhost:3000';

async function testFreshOrder() {
  console.log('🧪 Testing with Fresh Order ID\n');

  try {
    // Test with order ID 7 (which should not have a courier order)
    console.log('1️⃣ Testing with order ID: 7 (should create new courier order)');
    
    const response = await fetch(`${BASE_URL}/api/courier/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 7,
        courierService: 'steadfast',
        orderType: 'landing_page'
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
        
        // Show the full courierResponse structure
        console.log('   📋 Full courierResponse:', JSON.stringify(data.data.courierResponse, null, 2));
      } else {
        console.log('   ❌ Consignment ID is missing!');
        console.log('   📋 courierResponse structure:', JSON.stringify(data.data.courierResponse, null, 2));
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

    console.log('\n🎯 Fresh order test completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testFreshOrder();
