const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function testWebsiteFront() {
  console.log('🌐 Testing Website Front Page Data...\n');
  
  try {
    // Test 1: Check Categories
    console.log('📂 Testing Categories...');
    const categories = await db.category.findMany({
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✅ Found ${categories.length} categories`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });
    console.log('');

    // Test 2: Check Products
    console.log('📦 Testing Products...');
    const products = await db.product.findMany({
      include: {
        category: true,
        images: true,
        inventory: true
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✅ Found ${products.length} products`);
    products.forEach(product => {
      console.log(`   - ${product.name} (${product.slug})`);
      console.log(`     Price: ${product.salePrice || product.regularPrice} ${product.currency}`);
      console.log(`     Category: ${product.category.name}`);
      console.log(`     Images: ${product.images.length}`);
      console.log(`     Stock: ${product.inventory?.quantity || 0}`);
      console.log('');
    });

    // Test 3: Check API endpoints
    console.log('🔌 Testing API Endpoints...');
    
    // Test categories API
    try {
      const categoriesResponse = await fetch('http://localhost:3000/api/categories');
      const categoriesData = await categoriesResponse.json();
      console.log(`✅ Categories API: ${categoriesResponse.status} - ${categoriesData.categories?.length || 0} categories`);
    } catch (error) {
      console.log(`❌ Categories API error: ${error.message}`);
    }

    // Test products API
    try {
      const productsResponse = await fetch('http://localhost:3000/api/products');
      const productsData = await productsResponse.json();
      console.log(`✅ Products API: ${productsResponse.status} - ${productsData.products?.length || 0} products`);
    } catch (error) {
      console.log(`❌ Products API error: ${error.message}`);
    }

    console.log('\n🎉 Website Front Page Data Test Complete!');

  } catch (error) {
    console.error('❌ Error testing website front:', error);
  } finally {
    await db.$disconnect();
  }
}

testWebsiteFront();

