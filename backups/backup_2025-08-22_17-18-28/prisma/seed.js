const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // Create admin user
  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.appUser.upsert({
    where: { userId: 'admin' },
    update: {},
    create: {
      userId: 'admin',
      passwordHash: hashedPassword,
      name: 'Admin User',
      email: 'admin@nexus.com',
      status: 'ACTIVE',
      phone: '+8801234567890'
    }
  });

  console.log('✅ Admin user created:', adminUser);

  // Create basic permissions
  const permissions = [
    { resource: 'dashboard', action: 'view' },
    { resource: 'products', action: 'view' },
    { resource: 'products', action: 'create' },
    { resource: 'products', action: 'edit' },
    { resource: 'products', action: 'delete' },
    { resource: 'orders', action: 'view' },
    { resource: 'orders', action: 'edit' },
    { resource: 'inventory', action: 'view' },
    { resource: 'inventory', action: 'edit' },
    { resource: 'categories', action: 'view' },
    { resource: 'categories', action: 'create' },
    { resource: 'categories', action: 'edit' },
    { resource: 'categories', action: 'delete' },
    { resource: 'landing', action: 'view' },
    { resource: 'landing', action: 'create' },
    { resource: 'landing', action: 'edit' },
    { resource: 'landing', action: 'delete' },
    { resource: 'settings', action: 'view' },
    { resource: 'settings', action: 'edit' },
    { resource: 'finance', action: 'view' },
    { resource: 'businessGrowth', action: 'view' },
    { resource: 'users', action: 'view' }
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: {},
      create: perm
    });
  }

  console.log('✅ Basic permissions created');

  // Create admin role
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' }
  });

  console.log('✅ Admin role created');

  // Assign all permissions to admin role
  for (const perm of permissions) {
    const permission = await prisma.permission.findUnique({
      where: { resource_action: { resource: perm.resource, action: perm.action } }
    });

    if (permission) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
          allowed: true
        }
      });
    }
  }

  console.log('✅ Permissions assigned to admin role');

  // Assign admin role to admin user
  await prisma.appUser.update({
    where: { id: adminUser.id },
    data: { roleId: adminRole.id }
  });

  console.log('✅ Admin role assigned to admin user');

  // Create sample categories
  const categories = [
    { name: 'Clothing', slug: 'clothing', imageUrl: '/images/categories/clothing.jpg' },
    { name: 'Electronics', slug: 'electronics', imageUrl: '/images/categories/electronics.jpg' },
    { name: 'Home & Garden', slug: 'home-garden', imageUrl: '/images/categories/home.jpg' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', imageUrl: '/images/categories/sports.jpg' },
    { name: 'Beauty & Health', slug: 'beauty-health', imageUrl: '/images/categories/beauty.jpg' }
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    });
    createdCategories.push(category);
    console.log(`✅ Category created: ${category.name}`);
  }

  // Create sample products
  const products = [
    {
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-tshirt',
      description: 'High-quality cotton t-shirt with modern design',
      aiDescription: 'Premium cotton fabric, comfortable fit, stylish design',
      buyPrice: 800,
      regularPrice: 1950,
      salePrice: 1500,
      currency: 'BDT',
      sku: 'TSH-001',
      status: 'ACTIVE',
      categoryId: createdCategories[0].id, // Clothing
      images: [
        { url: '/uploads/tshirt-1.jpg', alt: 'Premium Cotton T-Shirt Front', order: 0 },
        { url: '/uploads/tshirt-2.jpg', alt: 'Premium Cotton T-Shirt Back', order: 1 }
      ]
    },
    {
      name: 'Wireless Bluetooth Headphones',
      slug: 'wireless-bluetooth-headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      aiDescription: 'Bluetooth 5.0, noise cancellation, long battery life',
      buyPrice: 1200,
      regularPrice: 2500,
      salePrice: 2000,
      currency: 'BDT',
      sku: 'HP-001',
      status: 'ACTIVE',
      categoryId: createdCategories[1].id, // Electronics
      images: [
        { url: '/uploads/headphones-1.jpg', alt: 'Wireless Headphones', order: 0 }
      ]
    },
    {
      name: 'Smart LED Bulb',
      slug: 'smart-led-bulb',
      description: 'WiFi-enabled smart LED bulb with app control',
      aiDescription: 'Smart control, energy efficient, multiple colors',
      buyPrice: 300,
      regularPrice: 800,
      salePrice: 600,
      currency: 'BDT',
      sku: 'LED-001',
      status: 'ACTIVE',
      categoryId: createdCategories[2].id, // Home & Garden
      images: [
        { url: '/uploads/bulb-1.jpg', alt: 'Smart LED Bulb', order: 0 }
      ]
    },
    {
      name: 'Yoga Mat Premium',
      slug: 'yoga-mat-premium',
      description: 'Non-slip premium yoga mat for all types of yoga',
      aiDescription: 'Non-slip surface, comfortable thickness, easy to clean',
      buyPrice: 500,
      regularPrice: 1200,
      salePrice: 900,
      currency: 'BDT',
      sku: 'YM-001',
      status: 'ACTIVE',
      categoryId: createdCategories[3].id, // Sports & Outdoors
      images: [
        { url: '/uploads/yoga-mat-1.jpg', alt: 'Premium Yoga Mat', order: 0 }
      ]
    },
    {
      name: 'Organic Face Cream',
      slug: 'organic-face-cream',
      description: 'Natural organic face cream for all skin types',
      aiDescription: 'Organic ingredients, moisturizing, suitable for all skin types',
      buyPrice: 400,
      regularPrice: 1000,
      salePrice: 750,
      currency: 'BDT',
      sku: 'FC-001',
      status: 'ACTIVE',
      categoryId: createdCategories[4].id, // Beauty & Health
      images: [
        { url: '/uploads/face-cream-1.jpg', alt: 'Organic Face Cream', order: 0 }
      ]
    }
  ];

  const createdProducts = [];
  for (const prod of products) {
    const { images, ...productData } = prod;
    
    const product = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: productData
    });

    // Create product images
    for (const img of images) {
      await prisma.productImage.create({
        data: {
          ...img,
          productId: product.id
        }
      });
    }

    createdProducts.push(product);
    console.log(`✅ Product created: ${product.name}`);
  }

  // Create inventory for products
  for (const product of createdProducts) {
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        stock: Math.floor(Math.random() * 50) + 10, // Random stock between 10-60
        lowStockThreshold: 5
      }
    });
    console.log(`✅ Inventory created for: ${product.name}`);
  }

  // Create sample orders
  const orders = [
    {
      orderNo: 'ORD-001',
      customerName: 'Ahmed Khan',
      userEmail: 'ahmed@example.com',
      phone: '+8801712345678',
      address: 'Dhaka, Bangladesh',
      subtotal: 1500,
      total: 1500,
      currency: 'BDT',
      status: 'pending',
      paymentStatus: 'UNPAID',
      orderItems: [
        { productId: createdProducts[0].id, quantity: 1, price: 1500 }
      ]
    },
    {
      orderNo: 'ORD-002',
      customerName: 'Fatima Rahman',
      userEmail: 'fatima@example.com',
      phone: '+8801812345678',
      address: 'Chittagong, Bangladesh',
      subtotal: 2000,
      total: 2000,
      currency: 'BDT',
      status: 'completed',
      paymentStatus: 'PAID',
      orderItems: [
        { productId: createdProducts[1].id, quantity: 1, price: 2000 }
      ]
    }
  ];

  for (const orderData of orders) {
    const { orderItems, ...orderInfo } = orderData;
    
    const order = await prisma.order.upsert({
      where: { orderNo: orderInfo.orderNo },
      update: {},
      create: orderInfo
    });

    // Create order items
    for (const item of orderItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }
      });
    }

    console.log(`✅ Order created: ${order.orderNo}`);
  }

  // Create sample budget entries
  const budgetEntries = [
    { month: 'January', year: 2025, expenseType: 'Marketing', amount: 50000, currency: 'BDT', note: 'Facebook ads and promotions' },
    { month: 'January', year: 2025, expenseType: 'Inventory', amount: 100000, currency: 'BDT', note: 'Product purchases' },
    { month: 'January', year: 2025, expenseType: 'Operations', amount: 25000, currency: 'BDT', note: 'Office and utilities' }
  ];

  for (const budget of budgetEntries) {
    await prisma.budgetEntry.create({
      data: budget
    });
    console.log(`✅ Budget entry created: ${budget.expenseType} - ${budget.amount} ${budget.currency}`);
  }

  // Create sample ad product entries
  const adProductEntries = [
    {
      month: 'January',
      year: 2025,
      productId: createdProducts[0].id,
      productName: 'Premium Cotton T-Shirt',
      productImage: '/uploads/tshirt-1.jpg',
      buyingPrice: 800,
      sellingPrice: 1500,
      fbAdCost: 5000,
      deliveryCost: 100,
      monthlyBudget: 10000,
      desiredProfitPct: 20
    },
    {
      month: 'January',
      year: 2025,
      productId: createdProducts[1].id,
      productName: 'Wireless Bluetooth Headphones',
      productImage: '/uploads/headphones-1.jpg',
      buyingPrice: 1200,
      sellingPrice: 2000,
      fbAdCost: 8000,
      deliveryCost: 150,
      monthlyBudget: 15000,
      desiredProfitPct: 25
    }
  ];

  for (const adProduct of adProductEntries) {
    const entry = await prisma.adProductEntry.create({
      data: adProduct
    });

    // Create selling targets for the month
    const daysInMonth = 31;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `2025-01-${day.toString().padStart(2, '0')}`;
      await prisma.sellingTargetEntry.create({
        data: {
          adProductEntryId: entry.id,
          date: date,
          targetUnits: Math.floor(Math.random() * 10) + 5, // Random target 5-15
          soldUnits: Math.floor(Math.random() * 8) + 0 // Random sold 0-8
        }
      });
    }

    console.log(`✅ Ad product entry created: ${entry.productName}`);
  }

  console.log('🎉 Comprehensive database seeding completed successfully!');
  console.log('🔑 Login credentials:');
  console.log('   User ID: admin');
  console.log('   Password: admin123');
  console.log('📊 Created:');
  console.log(`   - ${createdCategories.length} categories`);
  console.log(`   - ${createdProducts.length} products`);
  console.log(`   - ${orders.length} orders`);
  console.log(`   - ${budgetEntries.length} budget entries`);
  console.log(`   - ${adProductEntries.length} ad product entries`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
