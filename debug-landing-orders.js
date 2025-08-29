// 🐛 Debug Landing Page Orders
// This script helps debug issues with LandingPageOrder table

const BASE_URL = 'http://localhost:3000';

async function debugLandingOrders() {
  console.log('🐛 Debugging Landing Page Orders\n');

  try {
    // Test 1: Check if landing page orders API exists
    console.log('1️⃣ Testing landing page orders API...');
    const landingOrdersResponse = await fetch(`${BASE_URL}/api/landing`);
    if (landingOrdersResponse.ok) {
      const landingData = await landingOrdersResponse.json();
      console.log('✅ Landing page orders API working');
      console.log('   Total orders:', landingData.data?.length || 0);
    } else {
      console.log('❌ Landing page orders API failed:', landingOrdersResponse.status);
    }

    // Test 2: Check specific landing page order
    console.log('\n2️⃣ Testing specific landing page order...');
    const specificOrderResponse = await fetch(`${BASE_URL}/api/landing/6`);
    if (specificOrderResponse.ok) {
      const orderData = await specificOrderResponse.json();
      console.log('✅ Specific order retrieved:', orderData.message);
      console.log('   Order data:', JSON.stringify(orderData.data, null, 2));
    } else {
      const errorData = await specificOrderResponse.json();
      console.log('❌ Specific order failed:', errorData.error);
      console.log('   Status:', specificOrderResponse.status);
    }

    // Test 3: Check courier orders debug endpoint
    console.log('\n3️⃣ Testing courier orders debug endpoint...');
    const debugResponse = await fetch(`${BASE_URL}/api/courier/orders?debug=true`);
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug endpoint working');
      console.log('   Website orders:', debugData.data.websiteOrders.length);
      console.log('   Landing page orders:', debugData.data.landingPageOrders.length);
      
      if (debugData.data.landingPageOrders.length > 0) {
        console.log('\n📋 First landing page order details:');
        const firstOrder = debugData.data.landingPageOrders[0];
        console.log('   ID:', firstOrder.id);
        console.log('   Customer:', firstOrder.customerName);
        console.log('   Product:', firstOrder.productName);
        console.log('   Status:', firstOrder.status);
        console.log('   Delivery Area:', firstOrder.deliveryArea);
        console.log('   Address:', firstOrder.customerAddress);
      }
    } else {
      console.log('❌ Debug endpoint failed:', debugResponse.status);
    }

    // Test 4: Try to create courier order with detailed logging
    console.log('\n4️⃣ Testing courier order creation with detailed logging...');
    if (debugData?.data?.landingPageOrders?.length > 0) {
      const testOrderId = debugData.data.landingPageOrders[0].id;
      console.log(`   Testing with order ID: ${testOrderId}`);
      
      const courierResponse = await fetch(`${BASE_URL}/api/courier/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: testOrderId,
          courierService: 'steadfast',
          orderType: 'landing_page'
        })
      });
      
      console.log(`   Response status: ${courierResponse.status}`);
      
      if (courierResponse.ok) {
        const courierData = await courierResponse.json();
        console.log('✅ Courier order created successfully');
        console.log('   Data:', JSON.stringify(courierData, null, 2));
      } else {
        const errorData = await courierResponse.json();
        console.log('❌ Courier order creation failed');
        console.log('   Error:', errorData.error);
        console.log('   Full error response:', JSON.stringify(errorData, null, 2));
      }
    }

  } catch (error) {
    console.error('💥 Debug failed with error:', error.message);
    console.log('\n🔧 Error details:');
    console.log('   Stack:', error.stack);
  }
}

// Run the debug
debugLandingOrders();
