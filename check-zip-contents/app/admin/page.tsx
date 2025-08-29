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
import Reveal from "@/components/Reveal";
import Link from "next/link";
import { CpuChipIcon } from "@heroicons/react/24/outline";
import { formatPrice, onCurrencyChange, getCurrentCurrency } from "@/lib/currency";

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
  const [currentCurrency, setCurrentCurrency] = useState<string>('BDT');
  // AI analysis UI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiResult, setAiResult] = useState<{ summary: string; bullets: string[]; next_actions: string[] } | null>(null);

  const buildLocalAdvice = (): { summary: string; bullets: string[]; next_actions: string[] } => {
    const revenue = Number(profit.revenue || 0);
    const cogs = Number(profit.cogs || 0);
    const delivery = Number(profit.deliveryCost || 0);
    const others = Number(profit.otherExpenses || 0);
    const returnsDamages = Number(profit.returnsDamages || 0);
    const net = Number(profit.netProfit || 0);
    const gm = revenue - cogs;
    const gmPct = revenue > 0 ? (gm / revenue) * 100 : 0;
    const deliveryPct = revenue > 0 ? (delivery / revenue) * 100 : 0;
    const returnsPct = revenue > 0 ? (returnsDamages / revenue) * 100 : 0;
    const othersPct = revenue > 0 ? (others / revenue) * 100 : 0;
    const summary = `এই মাসে রেভিনিউ ${revenue.toFixed(0)}, গ্রস মার্জিন ${gm.toFixed(0)} (${gmPct.toFixed(1)}%), নেট ${net.toFixed(0)} (${monthlyPct.toFixed(1)}%).`;
    const bullets: string[] = [];
    if (gmPct < 30) bullets.push('গ্রস মার্জিন কম — কেনাকাটা মূল্য/প্রাইসিং পুনর্বিবেচনা (≥ 35-40%).');
    if (deliveryPct > 10) bullets.push('ডেলিভারি কস্ট বেশি — কুরিয়ার রেট/রাউট অপ্টিমাইজ করুন।');
    if (returnsPct > 5) bullets.push('রিটার্ন/ড্যামেজ বেশি — PDP কপি/ছবি/সাইজ গাইড/QA উন্নত করুন।');
    if (othersPct > 8) bullets.push('অন্যান্য খরচ বেশি — কম ROI ক্যাম্পেইন pause, অপেক্স রিভিউ করুন।');
    if (bullets.length === 0) bullets.push('মোটামুটি স্বাস্থ্যকর — উচ্চ কনভার্টিং প্রোডাক্টে বাজেট স্কেল করুন।');
    const next_actions = [
      'শীর্ষ ২-৩ প্রোডাক্টে +১৫% বাজেট ও নতুন ক্রিয়েটিভ A/B টেস্ট',
      'বাম্প অফার/বান্ডল দিয়ে AOV বাড়ান',
      'কুরিয়ার SLA/চার্জ স্ল্যাব রিভিউ',
      'লো মার্জিন SKU-তে মিন-প্রফিট থ্রেশহোল্ড প্রয়োগ'
    ];
    return { summary, bullets, next_actions };
  };
  type ProfitSummary = {
    revenue: number;
    cogs: number;
    deliveryCost: number;
    otherExpenses: number;
    returnsDamages: number;
    grossProfit: number;
    netProfit: number;
  };
  const [profit, setProfit] = useState<ProfitSummary>({
    revenue: 0,
    cogs: 0,
    deliveryCost: 0,
    otherExpenses: 0,
    returnsDamages: 0,
    grossProfit: 0,
    netProfit: 0
  });

  // Load current currency and listen for changes
  useEffect(() => {
    // Set initial currency
    setCurrentCurrency(getCurrentCurrency());
    
    // Listen for currency changes
    const cleanup = onCurrencyChange((newCurrency) => {
      setCurrentCurrency(newCurrency);
    });
    
    return cleanup;
  }, []);

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
      
      // Fetch aggregated stats from new endpoints
      const [orderStatsRes, productStatsRes, revenueRes, recentOrdersRes, profitRes] = await Promise.all([
        fetch('/api/orders/stats?status=processing'),
        fetch('/api/products/stats'),
        fetch('/api/revenue/summary'),
        fetch('/api/orders'),
        fetch('/api/finance/profit-summary')
      ]);

      const orderStatsJson = orderStatsRes.ok ? await orderStatsRes.json() : { total: 0 };
      const productStatsJson = productStatsRes.ok ? await productStatsRes.json() : { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };
      const revenueJson = revenueRes.ok ? await revenueRes.json() : { today: 0, thisWeek: 0, thisMonth: 0, total: 0 };
      const orders = recentOrdersRes.ok ? await recentOrdersRes.json() : [];
      const profitJson = profitRes.ok ? await profitRes.json() : { revenue: 0, cogs: 0, deliveryCost: 0, otherExpenses: 0, returnsDamages: 0, grossProfit: 0, netProfit: 0 };

      // Map to dashboardData
      const orderStats = {
        total: orderStatsJson.total || 0,
        pending: 0,
        processing: 0,
        'in-courier': 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0
      };

      const productStats = productStatsJson;

      const revenueStats = {
        today: revenueJson.today || 0,
        thisWeek: revenueJson.thisWeek || 0,
        thisMonth: revenueJson.thisMonth || 0,
        total: revenueJson.total || 0
      };

      const uniqueCustomers = new Set(Array.isArray(orders) ? orders.map((o: any) => o.phone) : []);
      const customerStats = {
        total: uniqueCustomers.size,
        newThisMonth: 0,
        active: 0
      };

      const recentOrders = (Array.isArray(orders) ? orders : [])
        .sort((a: any, b: any) => new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime())
        .slice(0, 5)
        .map((order: any) => ({
          id: order.id || order.orderNo || String(order.id),
          customerName: order.customerName || order.userEmail || 'Unknown',
          amount: order.total || 0,
          status: order.status || 'processing',
          date: new Date(order.createdAt || order.orderDate || Date.now()).toLocaleDateString()
        }));

      const lowStockProducts = [] as any[]; // can be filled via /api/products/stats (extended)
      const topSellingProducts = [] as any[];

      setDashboardData({
        orders: orderStats,
        products: productStats,
        revenue: revenueStats,
        customers: customerStats,
        recentOrders,
        lowStockProducts,
        topSellingProducts
      });
      setProfit({
        revenue: Number(profitJson.revenue || 0),
        cogs: Number(profitJson.cogs || 0),
        deliveryCost: Number(profitJson.deliveryCost || 0),
        otherExpenses: Number(profitJson.otherExpenses || 0),
        returnsDamages: Number(profitJson.returnsDamages || 0),
        grossProfit: Number(profitJson.grossProfit || 0),
        netProfit: Number(profitJson.netProfit || 0)
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
      const ordersResponse = await fetch('/api/orders/recent?limit=5');
      let orders = [];
      if (ordersResponse.ok) {
        try {
          const ordersData = await ordersResponse.json();
          orders = Array.isArray(ordersData) ? ordersData : [];
        } catch (e) {
          console.error('Error parsing orders silently:', e);
          orders = [];
        }
      }
      
      // Fetch products
      const productsResponse = await fetch('/api/products/low-stock?threshold=10&limit=5');
      let products = [];
      if (productsResponse.ok) {
        try {
          const productsData = await productsResponse.json();
          products = Array.isArray(productsData) ? productsData : [];
        } catch (e) {
          console.error('Error parsing products silently:', e);
          products = [];
        }
      }
      
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
        total: (await (await fetch('/api/products')).json()).length || 0,
        inStock: 0,
        lowStock: products.length,
        outOfStock: 0
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
      const recentOrders = orders.map((order: any) => ({
        id: order.id,
        customerName: order.customerName || 'Unknown',
        amount: order.amount || 0,
        status: order.status,
        date: new Date(order.date).toLocaleDateString()
      }));

      // Get low stock products
      const lowStockProducts = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        currentStock: p.currentStock,
        minStock: p.minStock,
        price: p.price
      }));

      // Get top selling products
      const topSellingProducts = await (await fetch('/api/products/top-selling?days=30&limit=5')).json();

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

      // refresh profit silently
      try {
        const res = await fetch('/api/finance/profit-summary');
        if (res.ok) {
          const pj = await res.json();
          setProfit({
            revenue: Number(pj.revenue || 0),
            cogs: Number(pj.cogs || 0),
            deliveryCost: Number(pj.deliveryCost || 0),
            otherExpenses: Number(pj.otherExpenses || 0),
            returnsDamages: Number(pj.returnsDamages || 0),
            grossProfit: Number(pj.grossProfit || 0),
            netProfit: Number(pj.netProfit || 0)
          });
        }
      } catch {}

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

  // Remove local formatCurrency as we're using global one from currency utility

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const isLoss = profit.netProfit < 0;
  const monthlyPct = profit.revenue > 0 ? (profit.netProfit / profit.revenue) * 100 : 0;

  return (
    <div className="space-y-6">
             {/* Page Header */}
      <div className="hidden"></div>

      {/* Profit/Loss Summary (large circle) */}
      <Reveal className="bg-white rounded-lg shadow-sm border p-6" from="scale">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
          {/* Left: title */}
          <div className="order-1">
            <h2 className="text-lg font-semibold text-gray-900">{isLoss ? 'Current Loss' : 'Current Profit'}</h2>
            <p className="text-sm text-gray-600">This month</p>
          </div>
          {/* Middle: AI Analysis Box */}
          <div className="order-2">
            <div className="relative rounded-lg border p-4 bg-gray-50 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CpuChipIcon className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-semibold text-gray-900">AI Analysis</h4>
                </div>
                <button
                  className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={aiLoading}
                  onClick={async () => {
                    setAiResult(null);
                    setAiLoading(true);
                    setAiProgress(1);
                    let i: any = null;
                    try {
                      // Simulated progressive indicator while waiting for API
                      i = setInterval(() => {
                        setAiProgress((p) => Math.min(p + Math.floor(5 + Math.random() * 10), 90));
                      }, 300);
                      const res = await fetch('/api/ai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          mode: 'business-summary',
                          metrics: {
                            revenue: profit.revenue,
                            cogs: profit.cogs,
                            deliveryCost: profit.deliveryCost,
                            otherExpenses: profit.otherExpenses,
                            returnsDamages: profit.returnsDamages,
                            netProfit: profit.netProfit,
                            netProfitPct: monthlyPct
                          }
                        })
                      });
                      let json: any = null;
                      try { json = await res.json(); } catch {}
                      if (json && (json.summary || json.bullets || json.next_actions)) {
                        setAiResult({
                          summary: json.summary || buildLocalAdvice().summary,
                          bullets: Array.isArray(json.bullets) && json.bullets.length ? json.bullets : buildLocalAdvice().bullets,
                          next_actions: Array.isArray(json.next_actions) && json.next_actions.length ? json.next_actions : buildLocalAdvice().next_actions
                        });
                      } else {
                        setAiResult(buildLocalAdvice());
                      }
                      setAiProgress(100);
                    } catch (e) {
                      console.error('AI analysis error', e);
                      setAiResult(buildLocalAdvice());
                      setAiProgress(100);
                    } finally {
                      if (i) clearInterval(i);
                      setAiLoading(false);
                    }
                  }}
                >{aiLoading ? 'Analyzing…' : 'Analyze'}</button>
              </div>
              {/* Border progress around the box */}
              {aiLoading && (
                <>
                  <div className="pointer-events-none absolute top-0 left-0 h-1 bg-emerald-500" style={{ width: `${(Math.min(aiProgress, 25) / 25) * 100}%` }} />
                  <div className="pointer-events-none absolute top-0 right-0 w-1 bg-emerald-500" style={{ height: `${(Math.max(0, Math.min(aiProgress - 25, 25)) / 25) * 100}%` }} />
                  <div className="pointer-events-none absolute bottom-0 right-0 h-1 bg-emerald-500" style={{ width: `${(Math.max(0, Math.min(aiProgress - 50, 25)) / 25) * 100}%` }} />
                  <div className="pointer-events-none absolute bottom-0 left-0 w-1 bg-emerald-500" style={{ height: `${(Math.max(0, Math.min(aiProgress - 75, 25)) / 25) * 100}%` }} />
                  <p className="text-xs text-gray-600 mt-1">Analyzing… {aiProgress}%</p>
                </>
              )}
              {!aiLoading && aiResult && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-800">{aiResult.summary}</p>
                  {aiResult.bullets.length > 0 && (
                    <ul className="list-disc pl-5 text-sm text-gray-700">
                      {aiResult.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {aiResult.next_actions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mt-2">Next actions</p>
                      <ul className="list-decimal pl-5 text-sm text-gray-700">
                        {aiResult.next_actions.map((n, idx) => (
                          <li key={idx}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {!aiLoading && !aiResult && (
                <p className="text-sm text-gray-700">এই মাসের রেভিনিউ, খরচ ও মার্জিন ধরে এআই সংক্ষেপে কারণ ও করণীয় সাজেশন দেবে।</p>
              )}
            </div>
          </div>
          {/* Right: round circle */}
          <div className={`${isLoss ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'} relative h-40 w-40 rounded-full border-4 flex items-center justify-center order-3 mx-auto lg:justify-self-end`}>
            <div className="text-center">
              <div className={`${isLoss ? 'text-red-700' : 'text-emerald-700'} text-2xl font-bold`}>{formatPrice(Math.abs(profit.netProfit), currentCurrency)}</div>
              <div className={`${isLoss ? 'text-red-600' : 'text-emerald-600'} text-sm font-medium`}>{Math.abs(Math.round(monthlyPct))}%</div>
            </div>
          </div>
        </div>
      </Reveal>
 
      {/* Compact Circular Stats removed per request */}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <Reveal className="bg-white p-6 rounded-lg shadow-sm border transition-transform duration-300 hover:shadow-lg hover:-translate-y-1" delayMs={50}>
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
        </Reveal>

        {/* Total Products */}
        <Reveal className="bg-white p-6 rounded-lg shadow-sm border transition-transform duration-300 hover:shadow-lg hover:-translate-y-1" delayMs={100}>
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
        </Reveal>

        {/* Today's Revenue */}
        <Reveal className="bg-white p-6 rounded-lg shadow-sm border transition-transform duration-300 hover:shadow-lg hover:-translate-y-1" delayMs={150}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatPrice(dashboardData.revenue.today, currentCurrency)}</p>
              <p className="text-xs text-gray-500 mt-1">
                This month: {formatPrice(dashboardData.revenue.thisMonth, currentCurrency)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <CurrencyDollarIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </Reveal>

        {/* Total Customers */}
        <Reveal className="bg-white p-6 rounded-lg shadow-sm border transition-transform duration-300 hover:shadow-lg hover:-translate-y-1" delayMs={200}>
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
        </Reveal>
      </div>

      {/* Order Status Breakdown */}
      <Reveal className="bg-white rounded-lg shadow-sm border p-6 transition-transform duration-300 hover:shadow-lg hover:-translate-y-1" from="up">
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
      </Reveal>

      {/* Revenue Overview */}
      <Reveal className="bg-white rounded-lg shadow-sm border p-6 transition-transform duration-300 hover:shadow-lg hover:-translate-y-1" from="up" delayMs={100}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Today</p>
                <p className="text-2xl font-bold text-blue-900">{formatPrice(dashboardData.revenue.today, currentCurrency)}</p>
              </div>
                             <ArrowTrendingUpIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">This Week</p>
                <p className="text-2xl font-bold text-green-900">{formatPrice(dashboardData.revenue.thisWeek, currentCurrency)}</p>
              </div>
                             <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">This Month</p>
                <p className="text-2xl font-bold text-yellow-900">{formatPrice(dashboardData.revenue.thisMonth, currentCurrency)}</p>
              </div>
                             <ArrowTrendingUpIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total</p>
                <p className="text-2xl font-bold text-purple-900">{formatPrice(dashboardData.revenue.total, currentCurrency)}</p>
              </div>
                             <ArrowTrendingUpIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Reveal className="bg-white rounded-lg shadow-sm border p-6 transition-transform duration-300 hover:shadow-lg hover:-translate-y-1" delayMs={50}>
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
                    <p className="font-medium text-gray-900">{formatPrice(order.amount, currentCurrency)}</p>
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
        </Reveal>

        {/* Low Stock Alert */}
        <Reveal className="bg-white rounded-lg shadow-sm border p-6 transition-transform duration-300 hover:shadow-lg hover:-translate-y-1" delayMs={100}>
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
                    <p className="text-xs text-gray-500">{formatPrice(product.price, currentCurrency)}</p>
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
        </Reveal>
      </div>

      {/* Top Selling Products */}
      <Reveal className="bg-white rounded-lg shadow-sm border p-6 transition-transform duration-300 hover:shadow-lg hover:-translate-y-1" from="up">
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
                    <div className="text-sm font-medium text-gray-900">{formatPrice(product.revenue, currentCurrency)}</div>
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
      </Reveal>

      {/* Quick Actions */}
      <Reveal className="bg-white rounded-lg shadow-sm border p-6 transition-transform duration-300 hover:shadow-lg hover:-translate-y-1" from="up" delayMs={50}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/orders" className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-center transition-colors block">
            <ShoppingCartIcon className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">View Orders</p>
          </Link>
          <Link href="/admin/products" className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors block">
            <CubeIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-700">Manage Products</p>
          </Link>
          <Link href="/admin/user" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors block">
            <UsersIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-700">View Customers</p>
          </Link>
          <Link href="/admin/analytics" className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition-colors block">
            <ChartBarIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-yellow-700">Analytics</p>
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
