import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Get orders with customer information
    const orders = await db.order.findMany({
      select: {
        id: true,
        userEmail: true,
        phone: true,
        address: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Get landing page orders
    const landingOrders = await db.landingPageOrder.findMany({
      select: {
        id: true,
        customerName: true,
        customerAddress: true,
        totalAmount: true,
        orderDate: true,
        productName: true
      }
    });

    // Process customer data by district
    const customerData = new Map<string, {
      district: string;
      customers: Set<string>;
      totalOrders: number;
      totalRevenue: number;
      products: Map<string, number>;
      coordinates: { lat: number; lng: number };
    }>();

    // District coordinates (Bangladesh)
    const districtCoords: Record<string, { lat: number; lng: number }> = {
      'Dhaka': { lat: 23.8103, lng: 90.4125 },
      'Chittagong': { lat: 22.3419, lng: 91.8134 },
      'Sylhet': { lat: 24.8949, lng: 91.8687 },
      'Rajshahi': { lat: 24.3745, lng: 88.6042 },
      'Khulna': { lat: 22.8456, lng: 89.5403 },
      'Barisal': { lat: 22.7010, lng: 90.3535 },
      'Rangpur': { lat: 25.7439, lng: 89.2752 },
      'Mymensingh': { lat: 24.7471, lng: 90.4203 }
    };

    // Process website orders
    orders.forEach(order => {
      const address = order.address || '';
      const district = extractDistrict(address);
      
      if (district && districtCoords[district]) {
        if (!customerData.has(district)) {
          customerData.set(district, {
            district,
            customers: new Set(),
            totalOrders: 0,
            totalRevenue: 0,
            products: new Map(),
            coordinates: districtCoords[district]
          });
        }

        const data = customerData.get(district)!;
        data.customers.add(order.userEmail || order.phone || 'Unknown');
        data.totalOrders++;
        data.totalRevenue += order.total || 0;

        // Count products
        order.items.forEach(item => {
          const productName = item.product?.name || 'Unknown';
          data.products.set(productName, (data.products.get(productName) || 0) + 1);
        });
      }
    });

    // Process landing page orders
    landingOrders.forEach(order => {
      const address = order.customerAddress || '';
      const district = extractDistrict(address);
      
      if (district && districtCoords[district]) {
        if (!customerData.has(district)) {
          customerData.set(district, {
            district,
            customers: new Set(),
            totalOrders: 0,
            totalRevenue: 0,
            products: new Map(),
            coordinates: districtCoords[district]
          });
        }

        const data = customerData.get(district)!;
        data.customers.add(order.customerName);
        data.totalOrders++;
        data.totalRevenue += order.totalAmount || 0;

        // Count products
        const productName = order.productName || 'Unknown';
        data.products.set(productName, (data.products.get(productName) || 0) + 1);
      }
    });

    // Convert to response format
    const locations = Array.from(customerData.values()).map(data => ({
      id: Math.random(), // In real app, use proper ID
      district: data.district,
      city: `${data.district} City`,
      customerCount: data.customers.size,
      totalOrders: data.totalOrders,
      totalRevenue: data.totalRevenue,
      latitude: data.coordinates.lat,
      longitude: data.coordinates.lng,
      topProducts: Array.from(data.products.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name)
    }));

    const districtStats = Array.from(customerData.values()).map(data => ({
      district: data.district,
      customerCount: data.customers.size,
      totalOrders: data.totalOrders,
      totalRevenue: data.totalRevenue,
      avgOrderValue: data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0,
      growthRate: Math.random() * 20 - 5 // Mock growth rate
    }));

    return NextResponse.json({
      locations,
      districtStats,
      totalCustomers: Array.from(customerData.values()).reduce((sum, data) => sum + data.customers.size, 0),
      totalOrders: Array.from(customerData.values()).reduce((sum, data) => sum + data.totalOrders, 0),
      totalRevenue: Array.from(customerData.values()).reduce((sum, data) => sum + data.totalRevenue, 0)
    });

  } catch (error) {
    console.error('Customer info API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer information' }, 
      { status: 500 }
    );
  }
}

// Helper function to extract district from address
function extractDistrict(address: string): string | null {
  const districts = [
    'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 
    'Barisal', 'Rangpur', 'Mymensingh'
  ];

  const addressLower = address.toLowerCase();
  
  for (const district of districts) {
    if (addressLower.includes(district.toLowerCase())) {
      return district;
    }
  }

  // Try to extract from common patterns
  if (addressLower.includes('dhaka') || addressLower.includes('ঢাকা')) return 'Dhaka';
  if (addressLower.includes('chittagong') || addressLower.includes('চট্টগ্রাম')) return 'Chittagong';
  if (addressLower.includes('sylhet') || addressLower.includes('সিলেট')) return 'Sylhet';
  if (addressLower.includes('rajshahi') || addressLower.includes('রাজশাহী')) return 'Rajshahi';
  if (addressLower.includes('khulna') || addressLower.includes('খুলনা')) return 'Khulna';

  return null;
}
