"use client";

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ShoppingCartIcon, 
  CurrencyBangladeshiIcon, 
  UsersIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalPageViews: number;
  orderGrowth: number;
  revenueGrowth: number;
  customerGrowth: number;
  viewGrowth: number;
  topProducts: Array<{
    id: number;
    name: string;
    orders: number;
    revenue: number;
  }>;
  monthlyData: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  landingPageViews: Array<{
    slug: string;
    title: string;
    views: number;
    orders: number;
    conversionRate: number;
  }>;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Last 30 days

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?range=${dateRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-none">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-none">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <p className="text-gray-500">No analytics data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-none">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 p-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-white">📊 Analytics Dashboard</h1>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-medium shadow-lg hover:bg-white/30 transition-all duration-300"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg border-0 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/90 truncate">Total Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">{data.totalOrders}</div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      data.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.orderGrowth >= 0 ? (
                        <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                      ) : (
                        <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                      )}
                      <span className="sr-only">{data.orderGrowth >= 0 ? 'Increased' : 'Decreased'} by</span>
                      {Math.abs(data.orderGrowth)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg border-0 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyBangladeshiIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/90 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">৳{(data.totalRevenue || 0).toLocaleString()}</div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      data.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.revenueGrowth >= 0 ? (
                        <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                      ) : (
                        <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                      )}
                      {Math.abs(data.revenueGrowth)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg border-0 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/90 truncate">Total Customers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">{data.totalCustomers}</div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      data.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.customerGrowth >= 0 ? (
                        <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                      ) : (
                        <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                      )}
                      {Math.abs(data.customerGrowth)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg border-0 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/90 truncate">Page Views</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">{(data.totalPageViews || 0).toLocaleString()}</div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      data.viewGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.viewGrowth >= 0 ? (
                        <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                      ) : (
                        <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                      )}
                      {Math.abs(data.viewGrowth)}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
            <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
              📈 Monthly Revenue Trend
            </h3>
            <div className="h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
              <p className="text-blue-600 font-medium">Chart placeholder - মাসিক রাজস্ব গ্রাফ</p>
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200">
            <h3 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
              🎯 Order Status Distribution
            </h3>
            <div className="space-y-3">
              {data.ordersByStatus.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{status.status}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${status.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{status.count} ({status.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200">
            <div className="px-6 py-4 border-b border-green-200 bg-gradient-to-r from-green-500 to-green-600 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white flex items-center">
                🏆 Top Selling Products
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.orders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                 ৳{(product.revenue || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Landing Page Performance */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-lg border border-indigo-200">
            <div className="px-6 py-4 border-b border-indigo-200 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white flex items-center">
                🌟 Landing Page Performance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.landingPageViews.map((page, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {page.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.views}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.orders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          page.conversionRate > 5 
                            ? 'bg-green-100 text-green-800' 
                            : page.conversionRate > 2 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {page.conversionRate.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
