// 🧪 Test Order ID Debugging
// This script helps debug order ID issues in courier booking

const BASE_URL = 'http://localhost:3000';

async function debugOrderIDs() {
  console.log('🔍 Debugging Order ID Issues\n');

  try {
    // Test 1: Get available orders for debugging
    console.log('1️⃣ Getting available orders for debugging...');
    const debugResponse = await fetch(`${BASE_URL}/api/courier/orders?debug=true`);
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug data retrieved:', debugData.message);
      console.log('📋 Available orders:');
      debugData.data.forEach((order, index) => {
        console.log(`   ${index + 1}. ID: "${order.id}" (${typeof order.id}) | Order No: ${order.orderNo} | Customer: ${order.customerName} | Status: ${order.status}`);
      });
      
      // Test with first available order ID
      if (debugData.data.length > 0) {
        const testOrderId = debugData.data[0].id;
        console.log(`\n2️⃣ Testing courier order creation with order ID: "${testOrderId}"`);
        
        const testResponse = await fetch(`${BASE_URL}/api/courier/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: testOrderId,
            courierService: 'steadfast'
          })
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('✅ Test successful:', testData.message);
          console.log('   Courier Order ID:', testData.data.id);
        } else {
          const errorData = await testResponse.json();
          console.log('❌ Test failed:', errorData.error);
          console.log('   Status:', testResponse.status);
        }
      }
    } else {
      console.log('❌ Debug endpoint failed:', debugResponse.status);
    }

    // Test 3: Test with invalid order ID
    console.log('\n3️⃣ Testing with invalid order ID...');
    const invalidResponse = await fetch(`${BASE_URL}/api/courier/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'invalid-id-123',
        courierService: 'steadfast'
      })
    });
    
    if (invalidResponse.status === 404) {
      console.log('✅ Invalid order ID handling working (404 for non-existent order)');
    } else {
      console.log('⚠️ Unexpected response for invalid order ID:', invalidResponse.status);
    }

    console.log('\n🎯 Debug completed!');
    console.log('\n📝 Troubleshooting tips:');
    console.log('1. Check if order IDs are strings or numbers in database');
    console.log('2. Verify order exists before creating courier order');
    console.log('3. Check database schema for Order table');
    console.log('4. Ensure proper error handling in frontend');

  } catch (error) {
    console.error('💥 Debug failed with error:', error.message);
    console.log('\n🔧 Common issues:');
    console.log('1. Server not running');
    console.log('2. Database connection problem');
    console.log('3. API route not accessible');
  }
}

// Run the debug
debugOrderIDs();
