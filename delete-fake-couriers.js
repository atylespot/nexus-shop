const fetch = require('node-fetch');

async function deleteFakeCouriers() {
  console.log('🧹 Deleting fake courier orders...\n');

  try {
    // First check how many fake orders exist
    const getResponse = await fetch('http://localhost:3000/api/debug/clean-fake-couriers');
    const getResult = await getResponse.json();
    console.log('📊 Current Status:', getResult);

    console.log('\n🗑️ Deleting fake courier orders...');
    
    // Delete fake courier orders
    const deleteResponse = await fetch('http://localhost:3000/api/debug/clean-fake-couriers', {
      method: 'DELETE'
    });
    
    const deleteResult = await deleteResponse.json();
    console.log(`Delete Status: ${deleteResponse.status}`);
    console.log('Delete Result:', deleteResult);

    if (deleteResponse.ok) {
      console.log(`\n✅ Successfully deleted ${deleteResult.deletedCount} fake courier orders!`);
    } else {
      console.log('\n❌ Failed to delete fake courier orders');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

deleteFakeCouriers();

