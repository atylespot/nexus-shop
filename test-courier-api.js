// 🧪 Test Courier API Endpoints
// Run this script to test the courier API functionality

const BASE_URL = 'http://localhost:3000';

async function testCourierAPI() {
  console.log('🚚 Testing Courier API Endpoints\n');

  try {
    // Test 1: GET /api/courier/orders (should return empty array or existing orders)
    console.log('1️⃣ Testing GET /api/courier/orders...');
    const getResponse = await fetch(`${BASE_URL}/api/courier/orders`);
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('✅ GET /api/courier/orders successful:', data.message);
      console.log(`   Found ${data.data?.length || 0} courier orders`);
    } else {
      console.log('❌ GET /api/courier/orders failed:', getResponse.status);
    }

    // Test 2: POST /api/courier/orders (test with invalid data)
    console.log('\n2️⃣ Testing POST /api/courier/orders with invalid data...');
    const postResponse = await fetch(`${BASE_URL}/api/courier/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'invalid' })
    });
    
    if (postResponse.status === 400) {
      console.log('✅ POST /api/courier/orders validation working (400 for invalid data)');
    } else {
      console.log('⚠️ POST /api/courier/orders unexpected response:', postResponse.status);
    }

    // Test 3: Test status mapping endpoint
    console.log('\n3️⃣ Testing GET /api/courier/status?testMapping=true...');
    const mappingResponse = await fetch(`${BASE_URL}/api/courier/status?testMapping=true`);
    if (mappingResponse.ok) {
      const mappingData = await mappingResponse.json();
      console.log('✅ Status mapping test successful:', mappingData.message);
      console.log(`   Found ${mappingData.mapping?.length || 0} test cases`);
    } else {
      console.log('❌ Status mapping test failed:', mappingResponse.status);
    }

    console.log('\n🎯 All tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Start your Next.js server: npm run dev');
    console.log('2. Try changing an order status to "in-courier"');
    console.log('3. Check if courier order is created automatically');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your Next.js server is running');
    console.log('2. Check if the API routes are properly created');
    console.log('3. Verify database connection');
  }
}

// Run the test
testCourierAPI();
