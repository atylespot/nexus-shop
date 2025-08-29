const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMissingInventory() {
  try {
    console.log('=== CREATING MISSING INVENTORY RECORDS ===');
    
    // Get all products
    const products = await prisma.product.findMany();
    console.log(`Found ${products.length} products`);
    
    // Check which products don't have inventory records
    for (const product of products) {
      const existingInventory = await prisma.inventory.findUnique({
        where: { productId: product.id }
      });
      
      if (!existingInventory) {
        // Create inventory record
        await prisma.inventory.create({
          data: {
            productId: product.id,
            stock: 10, // Default stock
            lowStockThreshold: 2
          }
        });
        console.log(`Created inventory for product: ${product.name}`);
      } else {
        console.log(`Inventory already exists for product: ${product.name}`);
      }
    }
    
    console.log('Inventory creation completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingInventory();
