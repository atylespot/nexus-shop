// Test script for order notification system
const testOrderNotification = async () => {
  console.log('🧪 Testing Order Notification System...\n');

  try {
    // Test 1: Create a landing page order
    console.log('📝 Test 1: Creating landing page order...');
    const landingPageOrderResponse = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderType: 'landing_page',
        customerName: 'টেস্ট গ্রাহক',
        customerPhone: '01712345678',
        customerAddress: 'টেস্ট ঠিকানা, ঢাকা',
        productId: '1',
        productName: 'Smartphone X1',
        productPrice: 25000,
        deliveryCharge: 60,
        totalAmount: 25060,
        deliveryArea: 'ঢাকার ভিতরে',
        landingPageId: 1,
        paymentMethod: 'cash_on_delivery'
      })
    });

    if (landingPageOrderResponse.ok) {
      const landingPageOrder = await landingPageOrderResponse.json();
      console.log('✅ Landing page order created:', landingPageOrder.orderId);
      console.log('📧 Email notification should be sent automatically\n');
    } else {
      console.log('❌ Failed to create landing page order');
    }

    // Test 2: Create a website order
    console.log('📝 Test 2: Creating website order...');
    const websiteOrderResponse = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderType: 'website',
        customerName: 'ওয়েবসাইট গ্রাহক',
        phone: '01812345678',
        address: 'ওয়েবসাইট ঠিকানা, চট্টগ্রাম',
        district: 'চট্টগ্রাম',
        items: [
          {
            productId: '1',
            quantity: 1,
            price: 25000
          }
        ],
        shippingMethod: 'cash_on_delivery',
        shippingCost: 60,
        subtotal: 25000,
        total: 25060,
        currency: 'BDT'
      })
    });

    if (websiteOrderResponse.ok) {
      const websiteOrder = await websiteOrderResponse.json();
      console.log('✅ Website order created:', websiteOrder.orderId);
      console.log('📧 Email notification should be sent automatically\n');
    } else {
      console.log('❌ Failed to create website order');
    }

    // Test 3: Test email configuration
    console.log('📝 Test 3: Testing email configuration...');
    const testEmailResponse = await fetch('http://localhost:3000/api/settings/email/test', {
      method: 'POST'
    });

    if (testEmailResponse.ok) {
      const testResult = await testEmailResponse.json();
      console.log('✅ Test email result:', testResult.message);
    } else {
      const testResult = await testEmailResponse.json();
      console.log('❌ Test email failed:', testResult.error);
    }

    console.log('\n🎉 Order notification system test completed!');
    console.log('📧 Check your email inbox for notifications');
    console.log('🔧 Configure email settings at: http://localhost:3000/admin/settings/email');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testOrderNotification();
