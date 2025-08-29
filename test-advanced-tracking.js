// Test script for Advanced Tracking API with all critical parameters
// Run this with: node test-advanced-tracking.js

const testAdvancedTracking = async () => {
  const testData = {
    event_name: 'Purchase',
    user_data: { 
      fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
    },
    custom_data: {
      value: 99.99,
      currency: 'USD',
      content_type: 'product',
      num_items: 1,
      event_source_url: 'http://localhost:3000'
    },
    // Advanced tracking parameters for 100% match quality
    fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
    email: 'test@example.com',
    phone: '+1234567890',
    external_id: 'customer_123',
    fb_login_id: 'fb_user_456',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  console.log('🚀 Testing Advanced Tracking API...');
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
      console.log('✅ SUCCESS!');
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
testAdvancedTracking();
