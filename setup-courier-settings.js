const fetch = require('node-fetch');

async function setupCourierSettings() {
  console.log('⚙️ Setting up Courier Settings...\n');

  const courierSettings = {
    service: 'steadfast',
    apiKey: 'YOUR_STEADFAST_API_KEY', // Replace with real API key
    secretKey: 'YOUR_STEADFAST_SECRET_KEY', // Replace with real secret key
    baseUrl: 'https://portal.packzy.com/api/v1',
    isActive: true
  };

  try {
    const response = await fetch('http://localhost:3000/api/settings/courier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courierSettings)
    });

    const result = await response.json();
    console.log(`Setup Status: ${response.status}`);
    console.log(`Setup Result:`, JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Courier Settings Created Successfully!');
      console.log('🔑 NOTE: Please update with real Steadfast API credentials');
      console.log('📍 Go to: Admin Panel → Settings → Courier Settings');
    } else {
      console.log('\n❌ Failed to create courier settings');
    }
  } catch (error) {
    console.log(`❌ Setup Error: ${error.message}`);
  }
}

setupCourierSettings();

