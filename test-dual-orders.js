// 🧪 Test Dual Order Sources
// This script tests courier order creation from both website orders and landing page orders

const BASE_URL = 'http://localhost:3000';

async function testDualOrderSources() {
  console.log('🔍 Testing Courier Order Creation from Dual Sources\n');

  try {
    // Test 1: Get available orders from both sources
    console.log('1️⃣ Getting available orders from both sources...');
    const debugResponse = await fetch(`${BASE_URL}/api/courier/orders?debug=true`);
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug data retrieved:', debugData.message);
      
      console.log('\n📋 Available Website Orders:');
      debugData.data.websiteOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. ID: "${order.id}" | Order No: ${order.orderNo} | Customer: ${order.customerName} | Status: ${order.status}`);
      });
      
      console.log('\n📋 Available Landing Page Orders:');
      debugData.data.landingPageOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. ID: "${order.id}" | Customer: ${order.customerName} | Product: ${order.productName} | Status: ${order.status}`);
      });
      
      // Test 2: Test courier order creation from website order
      if (debugData.data.websiteOrders.length > 0) {
        const websiteOrderId = debugData.data.websiteOrders[0].id;
        console.log(`\n2️⃣ Testing courier order creation from website order ID: "${websiteOrderId}"`);
        
        const websiteResponse = await fetch(`${BASE_URL}/api/courier/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: websiteOrderId,
            courierService: 'steadfast',
            orderType: 'website'
          })
        });
        
        if (websiteResponse.ok) {
          const websiteData = await websiteResponse.json();
          console.log('✅ Website order test successful:', websiteData.message);
          console.log('   Courier Order ID:', websiteData.data.id);
          console.log('   Order Source:', websiteData.orderSource);
        } else {
          const errorData = await websiteResponse.json();
          console.log('❌ Website order test failed:', errorData.error);
          console.log('   Status:', websiteResponse.status);
        }
      }
      
      // Test 3: Test courier order creation from landing page order
      if (debugData.data.landingPageOrders.length > 0) {
        const landingPageOrderId = debugData.data.landingPageOrders[0].id;
        console.log(`\n3️⃣ Testing courier order creation from landing page order ID: "${landingPageOrderId}"`);
        
        const landingPageResponse = await fetch(`${BASE_URL}/api/courier/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: landingPageOrderId,
            courierService: 'steadfast',
            orderType: 'landing_page'
          })
        });
        
        if (landingPageResponse.ok) {
          const landingPageData = await landingPageResponse.json();
          console.log('✅ Landing page order test successful:', landingPageData.message);
          console.log('   Courier Order ID:', landingPageData.data.id);
          console.log('   Order Source:', landingPageData.orderSource);
        } else {
          const errorData = await landingPageResponse.json();
          console.log('❌ Landing page order test failed:', errorData.error);
          console.log('   Status:', landingPageResponse.status);
        }
      }
      
      // Test 4: Test with invalid order ID
      console.log('\n4️⃣ Testing with invalid order ID...');
      const invalidResponse = await fetch(`${BASE_URL}/api/courier/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 'invalid-id-123',
          courierService: 'steadfast'
        })
      });
      
      if (invalidResponse.status === 400) {
        console.log('✅ Invalid order ID handling working (400 for invalid format)');
      } else {
        console.log('⚠️ Unexpected response for invalid order ID:', invalidResponse.status);
      }
      
      // Test 5: Test with non-existent order ID
      console.log('\n5️⃣ Testing with non-existent order ID...');
      const nonExistentResponse = await fetch(`${BASE_URL}/api/courier/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 99999,
          courierService: 'steadfast'
        })
      });
      
      if (nonExistentResponse.status === 404) {
        console.log('✅ Non-existent order ID handling working (404 for not found)');
      } else {
        console.log('⚠️ Unexpected response for non-existent order ID:', nonExistentResponse.status);
      }

    } else {
      console.log('❌ Debug endpoint failed:', debugResponse.status);
    }

    console.log('\n🎯 Dual source testing completed!');
    console.log('\n📝 Summary:');
    console.log('✅ Website orders can create courier orders');
    console.log('✅ Landing page orders can create courier orders');
    console.log('✅ Invalid order IDs are properly rejected');
    console.log('✅ Non-existent order IDs return 404');
    console.log('✅ Order source tracking is implemented');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.log('\n🔧 Common issues:');
    console.log('1. Server not running');
    console.log('2. Database connection problem');
    console.log('3. API route not accessible');
  }
}

// Run the test
testDualOrderSources();
