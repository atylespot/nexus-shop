"use client";
import { useState, useEffect } from "react";
import {
  ShoppingCartIcon,
  CubeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface DashboardData {
  orders: {
    total: number;
    pending: number;
    processing: number;
    'in-courier': number;
    delivered: number;
    cancelled: number;
    refunded: number;
  };
  products: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    active: number;
  };
  recentOrders: Array<{
    id: string;
    customerName: string;
    amount: number;
    status: string;
    date: string;
  }>;
  lowStockProducts: Array<{
    id: number;
    name: string;
    currentStock: number;
    minStock: number;
    price: number;
  }>;
  topSellingProducts: Array<{
    id: number;
    name: string;
    soldCount: number;
    revenue: number;
  }>;
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    orders: { total: 0, pending: 0, processing: 0, 'in-courier': 0, delivered: 0, cancelled: 0, refunded: 0 },
    products: { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 },
    revenue: { today: 0, thisWeek: 0, thisMonth: 0, total: 0 },
    customers: { total: 0, newThisMonth: 0, active: 0 },
    recentOrders: [],
    lowStockProducts: [],
    topSellingProducts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 30 seconds silently
    const interval = setInterval(() => {
      fetchDashboardDataSilently();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersResponse = await fetch('/api/orders');
      const orders = await ordersResponse.ok ? await ordersResponse.json() : [];
      
      // Fetch products
      const productsResponse = await fetch('/api/products');
      const products = await productsResponse.ok ? await productsResponse.json() : [];
      
      // Calculate order statistics
      const orderStats = {
        total: orders.length,
        pending: orders.filter((o: any) => o.status === 'pending').length,
        processing: orders.filter((o: any) => o.status === 'processing').length,
        'in-courier': orders.filter((o: any) => o.status === 'in-courier').length,
        delivered: orders.filter((o: any) => o.status === 'delivered').length,
        cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
        refunded: orders.filter((o: any) => o.status === 'refunded').length
      };

      // Calculate product statistics
      const productStats = {
        total: products.length,
        inStock: products.filter((p: any) => p.stock > 10).length,
        lowStock: products.filter((p: any) => p.stock <= 10 && p.stock > 0).length,
        outOfStock: products.filter((p: any) => p.stock === 0).length
      };

      // Calculate revenue (mock data for now - you can integrate with real payment system)
      const revenueStats = {
        today: orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString();
        }).reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        thisWeek: orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        }).reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        thisMonth: orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        }).reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        total: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
      };

      // Calculate customer statistics
      const uniqueCustomers = new Set(orders.map((o: any) => o.phone));
      const customerStats = {
        total: uniqueCustomers.size,
        newThisMonth: orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        }).filter((o: any, index: number, arr: any[]) => 
          arr.findIndex((order: any) => order.phone === o.phone) === index
        ).length,
        active: orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        }).filter((o: any, index: number, arr: any[]) => 
          arr.findIndex((order: any) => order.phone === o.phone) === index
        ).length
      };

      // Get recent orders
      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((order: any) => ({
          id: order.id,
          customerName: order.customerName || 'Unknown',
          amount: order.total || 0,
          status: order.status,
          date: new Date(order.createdAt).toLocaleDateString()
        }));

      // Get low stock products
      const lowStockProducts = products
        .filter((p: any) => p.stock <= 10 && p.stock > 0)
        .slice(0, 5)
        .map((product: any) => ({
          id: product.id,
          name: product.name,
          currentStock: product.stock || 0,
          minStock: 10,
          price: product.price || 0
        }));

      // Get top selling products (mock data - you can integrate with real analytics)
      const topSellingProducts = products
        .slice(0, 5)
        .map((product: any, index: number) => ({
          id: product.id,
          name: product.name,
          soldCount: Math.floor(Math.random() * 100) + 10, // Mock data
          revenue: (Math.floor(Math.random() * 100) + 10) * (product.price || 1000)
        }))
        .sort((a: any, b: any) => b.soldCount - a.soldCount);

      setDashboardData({
        orders: orderStats,
        products: productStats,
        revenue: revenueStats,
        customers: customerStats,
        recentOrders,
        lowStockProducts,
        topSellingProducts
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Silent data refresh without loading states
  const fetchDashboardDataSilently = async () => {
    try {
      // Fetch orders
      const ordersResponse = await fetch('/api/orders');
      const orders = await ordersResponse.ok ? await ordersResponse.json() : [];
      
      // Fetch products
      const productsResponse = await fetch('/api/products');
      const products = await productsResponse.ok ? await productsResponse.json() : [];
      
      // Calculate order statistics
      const orderStats = {
        total: orders.length,
        pending: orders.filter((o: any) => o.status === 'pending').length,
        processing: orders.filter((o: any) => o.status === 'processing').length,
        'in-courier': orders.filter((o: any) => o.status === 'in-courier').length,
        delivered: orders.filter((o: any) => o.status === 'delivered').length,
        cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
        refunded: orders.filter((o: any) => o.status === 'refunded').length
      };

      // Calculate product statistics
      const productStats = {
        total: products.length,
        inStock: products.filter((p: any) => p.stock > 10).length,
        lowStock: products.filter((p: any) => p.stock <= 10 && p.stock > 0).length,
        outOfStock: products.filter((p: any) => p.stock === 0).length
      };

      // Calculate revenue
      const revenueStats = {
        today: orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString();
        }).reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        thisWeek: orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        }).reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        thisMonth: orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        }).reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        total: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
      };

      // Calculate customer statistics
      const uniqueCustomers = new Set(orders.map((o: any) => o.phone));
      const customerStats = {
        total: uniqueCustomers.size,
        newThisMonth: orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        }).filter((o: any, index: number, arr: any[]) => 
          arr.findIndex((order: any) => order.phone === o.phone) === index
        ).length,
        active: orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        }).filter((o: any, index: number, arr: any[]) => 
          arr.findIndex((order: any) => order.phone === o.phone) === index
        ).length
      };

      // Get recent orders
      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((order: any) => ({
          id: order.id,
          customerName: order.customerName || 'Unknown',
          amount: order.total || 0,
          status: order.status,
          date: new Date(order.createdAt).toLocaleDateString()
        }));

      // Get low stock products
      const lowStockProducts = products
        .filter((p: any) => p.stock <= 10 && p.stock > 0)
        .slice(0, 5)
        .map((product: any) => ({
          id: product.id,
          name: product.name,
          currentStock: product.stock || 0,
          minStock: 10,
          price: product.price || 0
        }));

      // Get top selling products
      const topSellingProducts = products
        .slice(0, 5)
        .map((product: any, index: number) => ({
          id: product.id,
          name: product.name,
          soldCount: Math.floor(Math.random() * 100) + 10,
          revenue: (Math.floor(Math.random() * 100) + 10) * (product.price || 1000)
        }))
        .sort((a: any, b: any) => b.soldCount - a.soldCount);

      // Update data silently without loading states
      setDashboardData(prevData => ({
        ...prevData,
        orders: orderStats,
        products: productStats,
        revenue: revenueStats,
        customers: customerStats,
        recentOrders,
        lowStockProducts,
        topSellingProducts
      }));

    } catch (error) {
      console.error('Error silently refreshing dashboard data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'in-courier': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
             {/* Page Header */}
       <div className="bg-white rounded-lg shadow-sm border p-6">
         <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
         <p className="text-gray-600 mt-2">Real-time insights into your e-commerce business</p>
       </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.orders.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.orders.pending} pending, {dashboardData.orders.delivered} delivered
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCartIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.products.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.products.inStock} in stock, {dashboardData.products.lowStock} low stock
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CubeIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(dashboardData.revenue.today)}</p>
              <p className="text-xs text-gray-500 mt-1">
                This month: {formatCurrency(dashboardData.revenue.thisMonth)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <CurrencyDollarIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.customers.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.customers.newThisMonth} new this month
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <UsersIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{dashboardData.orders.pending}</div>
            <div className="text-sm text-blue-600 font-medium">Pending</div>
            <ClockIcon className="w-6 h-6 text-blue-500 mx-auto mt-2" />
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{dashboardData.orders.processing}</div>
            <div className="text-sm text-indigo-600 font-medium">Processing</div>
            <ArrowPathIcon className="w-6 h-6 text-indigo-500 mx-auto mt-2" />
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{dashboardData.orders['in-courier']}</div>
            <div className="text-sm text-purple-600 font-medium">In Courier</div>
            <TruckIcon className="w-6 h-6 text-purple-500 mx-auto mt-2" />
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{dashboardData.orders.delivered}</div>
            <div className="text-sm text-green-600 font-medium">Delivered</div>
            <CheckCircleIcon className="w-6 h-6 text-green-500 mx-auto mt-2" />
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{dashboardData.orders.cancelled}</div>
            <div className="text-sm text-red-600 font-medium">Cancelled</div>
            <XCircleIcon className="w-6 h-6 text-red-500 mx-auto mt-2" />
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{dashboardData.orders.refunded}</div>
            <div className="text-sm text-gray-600 font-medium">Refunded</div>
            <ArrowPathIcon className="w-6 h-6 text-gray-500 mx-auto mt-2" />
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">{dashboardData.orders.total}</div>
            <div className="text-sm text-emerald-600 font-medium">Total</div>
            <ShoppingCartIcon className="w-6 h-6 text-emerald-500 mx-auto mt-2" />
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Today</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(dashboardData.revenue.today)}</p>
              </div>
                             <ArrowTrendingUpIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">This Week</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(dashboardData.revenue.thisWeek)}</p>
              </div>
                             <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">This Month</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(dashboardData.revenue.thisMonth)}</p>
              </div>
                             <ArrowTrendingUpIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(dashboardData.revenue.total)}</p>
              </div>
                             <ArrowTrendingUpIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <button 
              onClick={fetchDashboardData}
              className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {dashboardData.recentOrders.length > 0 ? (
              dashboardData.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">#{order.id}</p>
                    <p className="text-sm text-gray-500">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(order.amount)}</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No orders yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div className="space-y-3">
            {dashboardData.lowStockProducts.length > 0 ? (
              dashboardData.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-red-600">
                      Stock: {product.currentStock} (Min: {product.minStock})
                    </p>
                    <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
                  </div>
                  <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                    Restock
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-green-300" />
                <p>All products well stocked</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.topSellingProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.soldCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(product.revenue)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                                             <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600 font-medium">
                        {Math.floor(Math.random() * 30) + 10}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-center transition-colors">
            <ShoppingCartIcon className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">View Orders</p>
          </button>
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
            <CubeIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-700">Manage Products</p>
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
            <UsersIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-700">View Customers</p>
          </button>
          <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition-colors">
            <ChartBarIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-yellow-700">Analytics</p>
          </button>
        </div>
      </div>
    </div>
  );
}
