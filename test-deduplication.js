// Test script for Event ID Generation and Deduplication System
// Run this with: node test-deduplication.js

const testDeduplicationSystem = async () => {
  console.log('🧪 Testing Event ID Generation and Deduplication System\n');

  // Test 1: Event ID Generation
  console.log('📋 Test 1: Event ID Generation');
  console.log('='.repeat(50));
  
  const testEventIds = [];
  for (let i = 0; i < 5; i++) {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 12)}_${Math.random().toString(36).substr(2, 9)}`;
    testEventIds.push(eventId);
    console.log(`Event ID ${i + 1}: ${eventId}`);
  }
  
  // Check uniqueness
  const uniqueIds = new Set(testEventIds);
  console.log(`✅ Unique IDs: ${uniqueIds.size}/${testEventIds.length}`);
  console.log(`✅ All IDs are unique: ${uniqueIds.size === testEventIds.length}\n`);

  // Test 2: Server-side Deduplication
  console.log('📋 Test 2: Server-side Deduplication');
  console.log('='.repeat(50));
  
  const testEventData = {
    event_name: 'Purchase',
    user_data: { 
      fbp: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
    },
    custom_data: {
      value: 99.99,
      currency: 'USD',
      content_type: 'product',
      num_items: 1,
      content_ids: ['test_product_123']
    },
    fbc: `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
    email: 'test@example.com',
    phone: '+1234567890',
    external_id: 'customer_123'
  };

  console.log('🔄 Sending first event...');
  const response1 = await fetch('http://localhost:3000/api/fb-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testEventData)
  });
  
  const result1 = await response1.json();
  console.log('First event result:', {
    success: result1.success,
    event_id: result1.event_id,
    deduplication_key: result1.deduplication_key,
    status: response1.status
  });

  // Wait 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n🔄 Sending duplicate event (within deduplication window)...');
  const response2 = await fetch('http://localhost:3000/api/fb-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testEventData)
  });
  
  const result2 = await response2.json();
  console.log('Duplicate event result:', {
    success: result2.success,
    error: result2.error,
    event_id: result2.event_id,
    deduplication_key: result2.deduplication_key,
    status: response2.status
  });

  // Test 3: Different Events (Should not be deduplicated)
  console.log('\n📋 Test 3: Different Events (Should not be deduplicated)');
  console.log('='.repeat(50));
  
  const differentEventData = {
    ...testEventData,
    custom_data: {
      ...testEventData.custom_data,
      value: 149.99, // Different value
      content_ids: ['test_product_456'] // Different product
    }
  };

  console.log('🔄 Sending different event...');
  const response3 = await fetch('http://localhost:3000/api/fb-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(differentEventData)
  });
  
  const result3 = await response3.json();
  console.log('Different event result:', {
    success: result3.success,
    event_id: result3.event_id,
    deduplication_key: result3.deduplication_key,
    status: response3.status
  });

  // Test 4: Same Event After Deduplication Window
  console.log('\n📋 Test 4: Same Event After Deduplication Window');
  console.log('='.repeat(50));
  
  console.log('⏳ Waiting 6 seconds for deduplication window to expire...');
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  console.log('🔄 Sending same event after window expiration...');
  const response4 = await fetch('http://localhost:3000/api/fb-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testEventData)
  });
  
  const result4 = await response4.json();
  console.log('Same event after window result:', {
    success: result4.success,
    event_id: result4.event_id,
    deduplication_key: result4.deduplication_key,
    status: response4.status
  });

  // Test 5: Event ID Consistency
  console.log('\n📋 Test 5: Event ID Consistency');
  console.log('='.repeat(50));
  
  const providedEventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 12)}_${Math.random().toString(36).substr(2, 9)}`;
  
  const consistentEventData = {
    ...testEventData,
    event_id: providedEventId
  };

  console.log('🔄 Sending event with provided ID...');
  const response5 = await fetch('http://localhost:3000/api/fb-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(consistentEventData)
  });
  
  const result5 = await response5.json();
  console.log('Provided ID event result:', {
    success: result5.success,
    provided_id: providedEventId,
    returned_id: result5.event_id,
    id_matches: providedEventId === result5.event_id,
    deduplication_key: result5.deduplication_key
  });

  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  
  const tests = [
    {
      name: 'Event ID Uniqueness',
      passed: uniqueIds.size === testEventIds.length,
      details: `${uniqueIds.size}/${testEventIds.length} unique IDs`
    },
    {
      name: 'Server-side Deduplication',
      passed: response2.status === 409 && result2.error === 'Duplicate event detected',
      details: `Status: ${response2.status}, Error: ${result2.error}`
    },
    {
      name: 'Different Events Allowed',
      passed: response3.status === 200 && result3.success,
      details: `Status: ${response3.status}, Success: ${result3.success}`
    },
    {
      name: 'Deduplication Window Expiry',
      passed: response4.status === 200 && result4.success,
      details: `Status: ${response4.status}, Success: ${result4.success}`
    },
    {
      name: 'Event ID Consistency',
      passed: providedEventId === result5.event_id,
      details: `Provided: ${providedEventId}, Returned: ${result5.event_id}`
    }
  ];

  tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${test.name}`);
    console.log(`   Details: ${test.details}`);
  });

  const passedTests = tests.filter(t => t.passed).length;
  const totalTests = tests.length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Deduplication system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
};

// Run the test
testDeduplicationSystem().catch(console.error);
