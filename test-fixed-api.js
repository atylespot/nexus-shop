// 🧪 Test Fixed API
// This script tests the fixed courier orders API

const BASE_URL = 'http://localhost:3000';

async function testFixedAPI() {
  console.log('🧪 Testing Fixed Courier Orders API\n');

  try {
    // Test 1: Test with landing page order ID: 6
    console.log('1️⃣ Testing with landing page order ID: 6');
    
    const response = await fetch(`${BASE_URL}/api/courier/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 6,
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
    } else {
      console.log('❌ Error response:');
      try {
        const errorData = await response.json();
        console.log('   Error:', errorData.error);
      } catch (parseError) {
        console.log('   Could not parse error response');
      }
    }

    // Test 2: Test with website order ID: 1
    console.log('\n2️⃣ Testing with website order ID: 1');
    
    const response2 = await fetch(`${BASE_URL}/api/courier/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 1,
        courierService: 'steadfast',
        orderType: 'website'
      })
    });
    
    console.log(`   Response status: ${response2.status}`);
    
    if (response2.ok) {
      const data = await response2.json();
      console.log('✅ Success:', data.message);
      console.log('   Courier Order ID:', data.data.id);
      console.log('   Order Source:', data.orderSource);
      console.log('   Order Type:', data.data.orderType);
    } else {
      console.log('❌ Error response:');
      try {
        const errorData = await response2.json();
        console.log('   Error:', errorData.error);
      } catch (parseError) {
        console.log('   Could not parse error response');
      }
    }

    console.log('\n🎯 Fixed API test completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testFixedAPI();
