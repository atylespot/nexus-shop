// 🧪 Direct API Test
// This script tests the courier orders API directly with detailed error logging

const BASE_URL = 'http://localhost:3000';

async function testDirectAPI() {
  console.log('🧪 Testing Courier Orders API Directly\n');

  try {
    // Test 1: Test with a specific landing page order ID
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
    console.log(`   Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success:', data);
    } else {
      console.log('❌ Error response:');
      try {
        const errorData = await response.json();
        console.log('   Error data:', errorData);
      } catch (parseError) {
        console.log('   Could not parse error response');
        const textResponse = await response.text();
        console.log('   Raw response:', textResponse);
      }
    }

  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

// Run the test
testDirectAPI();
