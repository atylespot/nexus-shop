// 🧪 Test Courier Page
// This script tests the courier page API to check data structure

const BASE_URL = 'http://localhost:3000';

async function testCourierPage() {
  console.log('🧪 Testing Courier Page API\n');

  try {
    // Test 1: Get all courier orders
    console.log('1️⃣ Getting all courier orders');
    
    const response = await fetch(`${BASE_URL}/api/courier/orders`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success:', data.message);
      console.log(`   Total courier orders: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        const firstOrder = data.data[0];
        console.log('\n📋 First courier order structure:');
        console.log('   ID:', firstOrder.id);
        console.log('   Order ID:', firstOrder.orderId);
        console.log('   Order Type:', firstOrder.orderType);
        console.log('   Courier Status:', firstOrder.courierStatus);
        console.log('   Delivery Charge:', firstOrder.deliveryCharge);
        
        if (firstOrder.courierResponse) {
          console.log('\n📦 Courier Response:');
          console.log('   Service:', firstOrder.courierResponse.service);
          console.log('   Order Source:', firstOrder.courierResponse.orderSource);
          
          if (firstOrder.courierResponse.consignment) {
            console.log('   Consignment ID:', firstOrder.courierResponse.consignment.consignment_id);
            console.log('   Consignment Status:', firstOrder.courierResponse.consignment.status);
          }
          
          if (firstOrder.courierResponse.orderDetails) {
            console.log('\n📋 Order Details:');
            console.log('   Customer Name:', firstOrder.courierResponse.orderDetails.customerName);
            console.log('   Product Name:', firstOrder.courierResponse.orderDetails.productName);
            console.log('   Delivery Area:', firstOrder.courierResponse.orderDetails.deliveryArea);
            console.log('   Address:', firstOrder.courierResponse.orderDetails.address);
          }
        }
      }
    } else {
      console.log('❌ Error response:', response.status);
      try {
        const errorData = await response.json();
        console.log('   Error:', errorData.error);
      } catch (parseError) {
        console.log('   Could not parse error response');
      }
    }

    console.log('\n🎯 Courier page test completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testCourierPage();

