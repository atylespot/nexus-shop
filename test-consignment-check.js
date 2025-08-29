// 🧪 Test Consignment ID Check
// This script tests if consignment_id is properly returned from existing courier orders

const BASE_URL = 'http://localhost:3000';

async function testConsignmentCheck() {
  console.log('🧪 Testing Consignment ID Check\n');

  try {
    // Test 1: Check landing page order ID: 6
    console.log('1️⃣ Checking landing page order ID: 6');
    
    const response1 = await fetch(`${BASE_URL}/api/courier/orders?orderId=6`);
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Success:', data1.message);
      console.log('   Courier Order ID:', data1.data.id);
      console.log('   Order Type:', data1.data.orderType);
      
      // Check consignment_id
      if (data1.data.courierResponse?.consignment?.consignment_id) {
        console.log('   ✅ Consignment ID:', data1.data.courierResponse.consignment.consignment_id);
      } else {
        console.log('   ❌ Consignment ID missing!');
      }
    } else {
      console.log('❌ Error:', response1.status);
    }

    // Test 2: Check website order ID: 1
    console.log('\n2️⃣ Checking website order ID: 1');
    
    const response2 = await fetch(`${BASE_URL}/api/courier/orders?orderId=1`);
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Success:', data2.message);
      console.log('   Courier Order ID:', data2.data.id);
      console.log('   Order Type:', data2.data.orderType);
      
      // Check consignment_id
      if (data2.data.courierResponse?.consignment?.consignment_id) {
        console.log('   ✅ Consignment ID:', data2.data.courierResponse.consignment.consignment_id);
      } else {
        console.log('   ❌ Consignment ID missing!');
      }
    } else {
      console.log('❌ Error:', response2.status);
    }

    console.log('\n🎯 Consignment ID check completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testConsignmentCheck();

