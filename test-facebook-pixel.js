// Test Facebook Pixel Test Events
// Run this in browser console after visiting your site

console.log('🚀 Testing Facebook Pixel Test Events...\n');

// Check if Facebook Pixel is loaded
if (typeof fbq !== 'undefined') {
  console.log('✅ Facebook Pixel (fbq) is loaded');
  console.log('📊 Pixel ID:', fbq.getState().pixelId);
  
  // Test PageView event
  console.log('\n📱 Testing PageView Event...');
  fbq('track', 'PageView');
  
  // Test AddToCart event
  console.log('\n🛒 Testing AddToCart Event...');
  fbq('track', 'AddToCart', {
    content_ids: ['test_product_123'],
    content_name: 'Test Product',
    content_type: 'product',
    value: 99.99,
    currency: 'USD',
    num_items: 1
  });
  
  // Test Search event
  console.log('\n🔍 Testing Search Event...');
  fbq('track', 'Search', {
    search_string: 'test search',
    content_category: 'search',
    content_type: 'search'
  });
  
  // Test Scroll event
  console.log('\n📜 Testing Scroll Event...');
  fbq('track', 'Scroll', {
    scroll_depth: 50,
    content_type: 'page',
    content_name: 'Test Page'
  });
  
  // Test TimeOnPage event
  console.log('\n⏰ Testing TimeOnPage Event...');
  fbq('track', 'TimeOnPage', {
    time_spent: 60,
    content_type: 'page',
    content_name: 'Test Page'
  });
  
  // Test Engagement event
  console.log('\n🎯 Testing Engagement Event...');
  fbq('track', 'Engagement', {
    engagement_type: 'click',
    content_type: 'page',
    content_name: 'Test Page'
  });
  
  console.log('\n🎉 All Facebook Pixel Test Events Sent!');
  console.log('📊 Check Facebook Events Manager for test events');
  
} else {
  console.log('❌ Facebook Pixel (fbq) is not loaded');
  console.log('🔍 Make sure you are on your website and FacebookPixelTest component is loaded');
}

// Manual event tracking function
window.testPixelEvent = (eventName, parameters = {}) => {
  if (typeof fbq !== 'undefined') {
    fbq('track', eventName, parameters);
    console.log(`✅ ${eventName} event sent with parameters:`, parameters);
  } else {
    console.log('❌ Facebook Pixel not available');
  }
};

console.log('\n💡 Use testPixelEvent("EventName", {param: "value"}) to test custom events');
