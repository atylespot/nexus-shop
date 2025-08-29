import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = parseInt(url.searchParams.get('range') || '30');
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - range);

    // Get orders data
    const orders = await db.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Get landing page orders
    const landingOrders = await db.landingPageOrder.findMany({
      where: {
        orderDate: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Get landing pages with view counts
    const landingPages = await db.landingPage.findMany({
      select: {
        slug: true,
        title: true,
        viewCount: true
      }
    });

    // Calculate total metrics
    const totalOrders = orders.length + landingOrders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0) + 
                        landingOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Get unique customers (approximate)
    const uniqueCustomers = new Set([
      ...orders.map(o => o.customerName),
      ...landingOrders.map(o => o.customerName)
    ]).size;

    const totalPageViews = landingPages.reduce((sum, page) => sum + (page.viewCount || 0), 0);

    // Calculate growth (mock data for now - you can implement actual comparison)
    const orderGrowth = Math.floor(Math.random() * 20) - 10; // -10 to +10
    const revenueGrowth = Math.floor(Math.random() * 25) - 5; // -5 to +20
    const customerGrowth = Math.floor(Math.random() * 15) - 5; // -5 to +10
    const viewGrowth = Math.floor(Math.random() * 30); // 0 to +30

    // Get top products
    const productSales = new Map<string, { orders: number; revenue: number; name: string; id: number }>();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.product.id.toString();
        if (!productSales.has(key)) {
          productSales.set(key, {
            orders: 0,
            revenue: 0,
            name: item.product.name,
            id: item.product.id
          });
        }
        const product = productSales.get(key)!;
        product.orders += item.quantity;
        product.revenue += item.price * item.quantity;
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Order status distribution
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalOrders) * 100)
    }));

    // Landing page performance
    const landingPageViews = landingPages.map(page => {
      const pageOrders = landingOrders.filter(order => 
        order.landingPageSlug === page.slug
      ).length;
      
      const conversionRate = page.viewCount > 0 ? (pageOrders / page.viewCount) * 100 : 0;
      
      return {
        slug: page.slug,
        title: page.title,
        views: page.viewCount || 0,
        orders: pageOrders,
        conversionRate
      };
    }).sort((a, b) => b.views - a.views).slice(0, 5);

    // Monthly data (simplified)
    const monthlyData = [
      { month: 'Jan', orders: Math.floor(Math.random() * 100), revenue: Math.floor(Math.random() * 50000) },
      { month: 'Feb', orders: Math.floor(Math.random() * 120), revenue: Math.floor(Math.random() * 60000) },
      { month: 'Mar', orders: Math.floor(Math.random() * 150), revenue: Math.floor(Math.random() * 75000) },
      { month: 'Apr', orders: Math.floor(Math.random() * 130), revenue: Math.floor(Math.random() * 65000) },
      { month: 'May', orders: Math.floor(Math.random() * 140), revenue: Math.floor(Math.random() * 70000) },
      { month: 'Jun', orders: totalOrders, revenue: totalRevenue }
    ];

    const analyticsData = {
      totalOrders,
      totalRevenue,
      totalCustomers: uniqueCustomers,
      totalPageViews,
      orderGrowth,
      revenueGrowth,
      customerGrowth,
      viewGrowth,
      topProducts,
      monthlyData,
      ordersByStatus,
      landingPageViews
    };

    return NextResponse.json(analyticsData);
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' }, 
      { status: 500 }
    );
  }
}
