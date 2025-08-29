const fetch = require('node-fetch');

async function testRealCourierBooking() {
  console.log('🚚 Testing Real Courier Booking...\n');

  // Test 1: Check Courier Settings
  console.log('⚙️ Step 1: Checking Courier Settings...');
  try {
    const settingsResponse = await fetch('http://localhost:3000/api/settings/courier');
    const settingsData = await settingsResponse.json();
    
    console.log(`Settings Status: ${settingsResponse.status}`);
    if (settingsData.data) {
      console.log(`✅ Courier Service: Steadfast`);
      console.log(`✅ Active: ${settingsData.data.isActive}`);
      console.log(`✅ API Key: ${settingsData.data.apiKey ? 'Set' : 'Not Set'}`);
      console.log(`✅ Secret Key: ${settingsData.data.secretKey ? 'Set' : 'Not Set'}`);
      console.log(`✅ Base URL: ${settingsData.data.baseUrl}`);
      console.log(`✅ Last Updated: ${new Date(settingsData.data.updatedAt).toLocaleString()}`);
      
      if (!settingsData.data.apiKey || !settingsData.data.secretKey) {
        console.log('\n⚠️  WARNING: API credentials not configured!');
        console.log('📍 Please go to Admin Panel → Settings → Courier Settings');
        console.log('📍 Enter your real Steadfast API credentials');
        return;
      }
      
      if (!settingsData.data.isActive) {
        console.log('\n⚠️  WARNING: Courier service is inactive!');
        console.log('📍 Please activate the service in Admin Panel');
        return;
      }
      
    } else {
      console.log('❌ No courier settings found');
      console.log('📍 Please configure courier settings first');
      return;
    }
  } catch (error) {
    console.log(`❌ Settings Error: ${error.message}`);
    return;
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Test Real Courier Order Creation
  console.log('📦 Step 2: Creating Real Courier Order...');
  
  const courierOrderData = {
    orderId: '6', // Use an existing order ID
    courierService: 'steadfast',
    orderType: 'landing_page'
  };

  try {
    const courierResponse = await fetch('http://localhost:3000/api/courier/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courierOrderData)
    });

    const courierResult = await courierResponse.json();
    console.log(`Courier Booking Status: ${courierResponse.status}`);
    console.log(`Courier Booking Result:`, JSON.stringify(courierResult, null, 2));

    if (courierResponse.ok && courierResult.data) {
      console.log('\n✅ Real Courier Booking Success!');
      console.log(`🚚 Consignment ID: ${courierResult.data.consignmentId || 'Not found'}`);
      console.log(`📱 Tracking Code: ${courierResult.data.trackingCode || 'Not found'}`);
      console.log(`📋 Status: ${courierResult.data.courierStatus}`);
      
      if (courierResult.data.courierResponse?.steadfastResponse) {
        console.log(`🎯 Steadfast Response Available: YES`);
        console.log(`📊 Steadfast Status: ${courierResult.data.courierResponse.steadfastResponse.status}`);
      } else {
        console.log(`❌ Steadfast Response Available: NO`);
      }
    } else {
      console.log('\n❌ Real Courier Booking Failed');
      console.log(`Error: ${courierResult.error || 'Unknown error'}`);
      
      if (courierResult.error && courierResult.error.includes('401')) {
        console.log('\n🔑 401 Error: Invalid API credentials');
        console.log('📍 Please check your Steadfast API Key and Secret Key');
        console.log('📍 Make sure they are correct and active');
      }
    }
  } catch (error) {
    console.log(`❌ Courier Booking Error: ${error.message}`);
  }

  console.log('\n🎉 Real Courier Booking Test Complete!');
}

testRealCourierBooking();

