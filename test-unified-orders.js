const fetch = require('node-fetch');

async function testUnifiedOrders() {
  console.log('🔄 Testing Unified Orders API...\n');

  // Test 1: Website Order
  console.log('📱 Test 1: Creating Website Order...');
  const websiteOrderData = {
    orderType: 'website',
    customerName: 'Website Customer',
    phone: '01712345678',
    address: 'Website Address, Dhaka',
    district: 'Dhaka',
    items: [
      {
        productId: '1',
        quantity: 1,
        price: 1500
      }
    ],
    shippingMethod: 'cash_on_delivery',
    shippingCost: 0,
    subtotal: 1500,
    total: 1500,
    currency: 'BDT'
  };

  try {
    const websiteResponse = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(websiteOrderData)
    });

    const websiteResult = await websiteResponse.json();
    console.log(`✅ Website Order Status: ${websiteResponse.status}`);
    console.log(`✅ Website Order Result:`, websiteResult);
  } catch (error) {
    console.log(`❌ Website Order Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Landing Page Order
  console.log('📄 Test 2: Creating Landing Page Order...');
  const landingPageOrderData = {
    orderType: 'landing_page',
    customerName: 'Landing Page Customer',
    customerPhone: '01887654321',
    customerAddress: 'Landing Page Address, Chittagong',
    productId: '2',
    productName: 'Test Product',
    productPrice: 2000,
    deliveryCharge: 100,
    totalAmount: 2100,
    deliveryArea: 'চট্টগ্রাম',
    landingPageId: 1
  };

  try {
    const landingPageResponse = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(landingPageOrderData)
    });

    const landingPageResult = await landingPageResponse.json();
    console.log(`✅ Landing Page Order Status: ${landingPageResponse.status}`);
    console.log(`✅ Landing Page Order Result:`, landingPageResult);
  } catch (error) {
    console.log(`❌ Landing Page Order Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Get All Orders
  console.log('📋 Test 3: Fetching All Orders...');
  try {
    const getResponse = await fetch('http://localhost:3000/api/orders');
    const getResult = await getResponse.json();
    console.log(`✅ Get Orders Status: ${getResponse.status}`);
    console.log(`✅ Total Orders: ${getResult.orders?.length || 0}`);
    
    if (getResult.orders) {
      getResult.orders.forEach((order, index) => {
        console.log(`   Order ${index + 1}: ${order.orderType} - ${order.orderNo} - ${order.customerName}`);
      });
    }
  } catch (error) {
    console.log(`❌ Get Orders Error: ${error.message}`);
  }

  console.log('\n🎉 Unified Orders API Test Complete!');
}

testUnifiedOrders();

