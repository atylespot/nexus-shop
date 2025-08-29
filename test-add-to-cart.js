// Test script for Add to Cart event
// Run this with: node test-add-to-cart.js

const testAddToCart = async () => {
  const testData = {
    event_name: 'AddToCart',
    user_data: { 
      fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
    },
    custom_data: {
      value: 1050,
      currency: 'BDT',
      content_ids: ['7'],
      content_name: 'Baby Carrier Hipset',
      content_type: 'product',
      num_items: 1
    }
  };

  console.log('🛒 Testing Add to Cart Event...');
  console.log('📊 Test Data:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/fb-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ SUCCESS! Add to Cart Event Sent');
      console.log('📈 Match Quality Score:', result.tracking_data.match_quality_score + '/10');
      console.log('🔍 Parameters Sent:', result.tracking_data.parameters_sent);
      console.log('🎯 Critical Parameters:', result.tracking_data.critical_parameters);
    } else {
      console.log('❌ FAILED!');
      console.log('Error:', result.error);
      console.log('Message:', result.message);
      if (result.debug) {
        console.log('Debug Info:', result.debug);
      }
    }
  } catch (error) {
    console.error('🚨 Network Error:', error.message);
  }
};

// Run the test
testAddToCart();
