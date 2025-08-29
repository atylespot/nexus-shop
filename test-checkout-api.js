const fetch = require('node-fetch');

async function testCheckoutAPI() {
  console.log('🛒 Testing Checkout API...\n');

  const orderData = {
    customerName: 'Test Customer',
    phone: '01712345678',
    address: 'Test Address, Dhaka',
    district: 'Dhaka',
    items: [
      {
        productId: '1',
        quantity: 1,
        price: 1500
      },
      {
        productId: '2', 
        quantity: 1,
        price: 2000
      }
    ],
    shippingMethod: 'cash_on_delivery',
    shippingCost: 0,
    subtotal: 3500,
    total: 3500,
    currency: 'BDT'
  };

  try {
    console.log('📤 Sending test order...');
    console.log('Order Data:', JSON.stringify(orderData, null, 2));

    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    
    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Order created successfully!');
      console.log(`Order ID: ${result.orderId}`);
      console.log(`Order No: ${result.orderNo}`);
    } else {
      console.log('\n❌ Order creation failed');
      console.log(`Error: ${result.error}`);
    }

  } catch (error) {
    console.error('\n💥 Network Error:', error.message);
  }
}

testCheckoutAPI();

