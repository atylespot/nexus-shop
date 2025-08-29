"use client";
import { useState, useEffect } from "react";
import { ChartBarIcon, CubeIcon, ArrowTrendingUpIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface BudgetEntry {
  id: number;
  month: string;
  year: number;
  expenseType: string;
  amount: number;
  currency: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export default function BusinessGrowthPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [budgetForm, setBudgetForm] = useState({
    month: '',
    year: new Date().getFullYear(),
    expenseType: '',
    amount: '',
    currency: 'BDT',
    note: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Fetch budget entries on component mount
  useEffect(() => {
    fetchBudgetEntries();
  }, []);

  const fetchBudgetEntries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/budget');
      if (response.ok) {
        const data = await response.json();
        setBudgetEntries(data);
      } else {
        console.error('Failed to fetch budget entries');
      }
    } catch (error) {
      console.error('Error fetching budget entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { id: 'budget', label: 'Budget', icon: ChartBarIcon },
    { id: 'ad-products', label: 'Ad Products', icon: CubeIcon },
    { id: 'selling-targets', label: 'Selling Targets', icon: ArrowTrendingUpIcon }
  ];

  const expenseTypes = [
    'Salary',
    'Rent',
    'Utilities',
    'Marketing',
    'Inventory',
    'Equipment',
    'Insurance',
    'Maintenance',
    'Other'
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Selling Targets: keep a per-entry month & year selection
  const [targetMonthByEntry, setTargetMonthByEntry] = useState<Record<number, string>>({});
  const [targetYearByEntry, setTargetYearByEntry] = useState<Record<number, number>>({});

  const getDaysInMonthByName = (monthName: string): number => {
    const idx = months.indexOf(monthName);
    if (idx === -1) return 30;
    const year = new Date().getFullYear();
    return new Date(year, idx + 1, 0).getDate();
  };

  const currencies = [
    'BDT', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'
  ];

  // Selling Targets - sub tab product and per-day draft inputs
  const [activeSellingProductId, setActiveSellingProductId] = useState<number | null>(null);
  type DayTarget = { planned?: string; sold?: string; note?: string };

  // Dashboard month/year selection
  const [dashboardMonth, setDashboardMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [dashboardYear, setDashboardYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();
  const [sellingTargetsDraft, setSellingTargetsDraft] = useState<Record<string, DayTarget>>({});
  const [isSoldModalOpen, setIsSoldModalOpen] = useState(false);
  const [soldModalKey, setSoldModalKey] = useState<string | null>(null);
  const [soldModalInput, setSoldModalInput] = useState<string>('');
  // AI Coach state
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<{ summary: string; bullets: string[]; next_actions: string[] } | null>(null);

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!budgetForm.month || !budgetForm.expenseType || !budgetForm.amount) {
      alert('Please fill all fields');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetForm),
      });

      if (response.ok) {
        const newEntry = await response.json();
        setBudgetEntries(prev => [newEntry, ...prev]);
        
        // Update monthly budgets for ad products in the same month/year if budget entry was added
        await updateMonthlyBudgetsForMonth(newEntry.month, newEntry.year);
        
        setBudgetForm({ month: '', year: new Date().getFullYear(), expenseType: '', amount: '', currency: 'BDT', note: '' });
        setIsBudgetModalOpen(false);
        setCurrentPage(1);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating budget entry:', error);
      alert('Failed to create budget entry');
    } finally {
      setIsLoading(false);
    }
  };

  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Ad Products state
  const [isAdProductModalOpen, setIsAdProductModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [products, setProducts] = useState<{id: number, name: string, description?: string, image?: string, images?: string[], buyingPrice?: number, buyPrice?: number, sellingPrice?: number, regularPrice?: number, categoryName?: string}[]>([]);
  const [adProductForm, setAdProductForm] = useState({
    categoryId: '',
    productId: '',
    productName: '',
    productImage: '',
    buyingPrice: '',
    sellingPrice: '',
    fbAdCost: '',
    deliveryCost: '',
    returnParcelQty: '',
    damagedProductQty: '',
    targetMonth: new Date().toLocaleString('default', { month: 'long' }), // Set default to current month
    targetYear: new Date().getFullYear().toString(),
    desiredProfitPercent: '10'
  });
  const [selectedProduct, setSelectedProduct] = useState<{id: number, name: string, description?: string, image?: string, images?: string[], buyingPrice?: number, buyPrice?: number, sellingPrice?: number, regularPrice?: number, categoryName?: string} | null>(null);
  const [selectedMonthBudget, setSelectedMonthBudget] = useState<number>(0);
  type AdProductEntry = {
    id: number;
    month: string;
    year?: number;
    productId?: number | null;
    productName: string;
    productImage?: string | null;
    buyingPrice: number;
    sellingPrice?: number | null;
    fbAdCost: number;
    deliveryCost: number;
    returnParcelQty: number;
    returnCost: number;
    damagedProductQty: number;
    damagedCost: number;
    monthlyBudget: number;
    desiredProfitPct?: number | null;
    requiredMonthlyUnits?: number | null;
    requiredDailyUnits?: number | null;
    createdAt: string;
    updatedAt: string;
  };
  const [adProductEntries, setAdProductEntries] = useState<AdProductEntry[]>([]);
  const [viewAdEntry, setViewAdEntry] = useState<AdProductEntry | null>(null);
  const [isAdEntryViewOpen, setIsAdEntryViewOpen] = useState(false);
  const [editingAdEntry, setEditingAdEntry] = useState<AdProductEntry | null>(null);
  const [isAdEntryEditOpen, setIsAdEntryEditOpen] = useState(false);
  const [adEntryEditForm, setAdEntryEditForm] = useState({
    fbAdCost: '',
    deliveryCost: '',
    returnParcelQty: '',
    damagedProductQty: '',
    monthlyBudget: '',
    desiredProfitPct: ''
  });

  // Selling Targets state
  type SellingTargetEntry = {
    id: number;
    adProductEntryId: number;
    date: string;
    targetUnits: number;
    soldUnits: number;
    createdAt: string;
    updatedAt: string;
    adProductEntry: {
      id: number;
      productName: string;
      productImage: string | null;
      month: string;
      year: number;
      requiredDailyUnits: number | null;
    };
  };
  const [sellingTargetEntries, setSellingTargetEntries] = useState<SellingTargetEntry[]>([]);

  // Helper to compute estimated per-piece cost
  const getEstimatedCost = () => {
    const buying = parseFloat(adProductForm.buyingPrice) || 0;
    const fb = parseFloat(adProductForm.fbAdCost) || 0;
    const delivery = parseFloat(adProductForm.deliveryCost) || 0;

    return buying + fb + delivery;
  };

  // Helper to compute estimated monthly cost
  const getEstimatedMonthlyCost = () => {
    const returnParcel = parseFloat(adProductForm.returnParcelQty) || 0;
    const damagedProduct = parseFloat(adProductForm.damagedProductQty) || 0;
    const buying = parseFloat(adProductForm.buyingPrice) || 0;
    const delivery = parseFloat(adProductForm.deliveryCost) || 0;

    return (returnParcel * delivery) + (damagedProduct * (buying + delivery));
  };

  // Helper: how many products already added for selected month/year (include current as +1)
  const getProductsCountForTargetMonth = (): number => {
    const monthName = adProductForm.targetMonth;
    if (!monthName) return 1;
    const year = parseInt(adProductForm.targetYear || `${new Date().getFullYear()}`);
    const existing = adProductEntries.filter((e) => e.month === monthName && (typeof e.year === 'number' ? e.year === year : true)).length;
    return Math.max(1, existing + 1);
  };

  // Helper: per-product share of selected month budget based on products count
  const getPerProductMonthlyBudget = (): number => {
    const count = getProductsCountForTargetMonth();
    const base = selectedMonthBudget || 0;
    return count > 0 ? base / count : base;
  };

  // Helper: get per-product budget for a specific month/year combination
  const getPerProductMonthlyBudgetForMonth = (month: string, year: number): number => {
    const totalBudget = budgetEntries
      .filter((b) => b.month === month && b.year === year)
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    const productCount = adProductEntries.filter((e) => e.month === month && e.year === year).length;
    return productCount > 0 ? totalBudget / productCount : totalBudget;
  };

  // Build metrics and call AI growth coach
  const generateCoachAdvice = async () => {
    try {
      setCoachLoading(true);
      // Month context
      const monthName = dashboardMonth;
      const year = dashboardYear;
      const monthIdx = months.indexOf(monthName);
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      const now = new Date();
      const isCurrentSelected = (now.toLocaleString('default', { month: 'long' }) === monthName) && (now.getFullYear() === year);
      const elapsedDays = isCurrentSelected ? now.getDate() : daysInMonth;

      // Selected entries and sold data
      const selectedEntries = adProductEntries.filter(e => e.month === monthName && e.year === year);
      const monthlyTarget = selectedEntries.reduce((sum, e) => sum + (e.requiredMonthlyUnits || 0), 0);
      const soldThisMonth = sellingTargetEntries
        .filter(t => t.adProductEntry.month === monthName && t.adProductEntry.year === year)
        .reduce((sum, t) => sum + (t.soldUnits || 0), 0);
      const currentAvgPerDay = elapsedDays > 0 ? Math.round((soldThisMonth / elapsedDays) * 100) / 100 : 0;
      const remainingDays = Math.max(0, daysInMonth - elapsedDays);
      const requiredPerDay = remainingDays > 0
        ? Math.ceil(Math.max(0, (monthlyTarget - soldThisMonth)) / remainingDays)
        : 0;
      const monthlyBudget = budgetEntries
        .filter(b => b.month === monthName && b.year === year)
        .reduce((s, b) => s + (b.amount || 0), 0);

      const productSnap = selectedEntries.map(e => ({
        id: e.id,
        name: e.productName,
        requiredMonthlyUnits: e.requiredMonthlyUnits,
        requiredDailyUnits: e.requiredDailyUnits,
        soldToDate: sellingTargetEntries.filter(t => t.adProductEntryId === e.id).reduce((s, t) => s + (t.soldUnits || 0), 0)
      }));

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'growth-coach',
          metrics: {
            month: monthName,
            year,
            daysInMonth,
            elapsedDays,
            remainingDays,
            monthlyTarget,
            soldToDate: soldThisMonth,
            currentAvgPerDay,
            requiredPerDay,
            monthlyBudget,
            products: productSnap
          }
        })
      });
      if (res.ok) {
        const json = await res.json();
        setCoachAdvice({
          summary: json.summary || '',
          bullets: Array.isArray(json.bullets) ? json.bullets : [],
          next_actions: Array.isArray(json.next_actions) ? json.next_actions : []
        });
      }
    } catch (e) {
      console.error('AI coach error', e);
    } finally {
      setCoachLoading(false);
    }
  };

  // Update monthly budgets and recompute targets for all products in a specific month/year
  const updateMonthlyBudgetsForMonth = async (month: string, year: number) => {
    try {
      console.log(`🔄 Starting monthly budget update for ${month} ${year}`);
      
      // First, fetch fresh data from the database to get current state
      const [freshAdProducts, freshBudgetEntries] = await Promise.all([
        fetch('/api/ad-products').then(res => res.ok ? res.json() : []),
        fetch('/api/budget').then(res => res.ok ? res.json() : [])
      ]);
      
      console.log(`📊 Fresh data fetched: ${freshAdProducts.length} products, ${freshBudgetEntries.length} budget entries`);
      
      // Calculate new per-product budget based on fresh data
      const totalBudget = freshBudgetEntries
        .filter((b: BudgetEntry) => b.month === month && b.year === year)
        .reduce((sum: number, b: BudgetEntry) => sum + (b.amount || 0), 0);
      
      const productsInMonth = freshAdProducts.filter((e: any) => e.month === month && e.year === year);
      const newPerProductBudget = productsInMonth.length > 0 ? totalBudget / productsInMonth.length : totalBudget;
      
      console.log(`💰 Total budget for ${month} ${year}: ${totalBudget}, Products: ${productsInMonth.length}, New per-product budget: ${newPerProductBudget}`);
      
      // Helper: get days in this month/year
      const monthIdx = months.indexOf(month);
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

      // Update each product's monthly budget and recomputed targets in the database
      // Use Promise.all for parallel updates to improve performance
      const updatePromises = productsInMonth.map(async (product: any) => {
        try {
          const buyingPrice = Number(product.buyingPrice) || 0;
          const fbAdCost = Number(product.fbAdCost) || 0;
          const deliveryCost = Number(product.deliveryCost) || 0;
          const returnCost = Number(product.returnCost) || 0;
          const damagedCost = Number(product.damagedCost) || 0;
          const sellingPrice = Number(product.sellingPrice) || 0;
          const desiredPct = Number(product.desiredProfitPct || 0);

          const perPieceCost = buyingPrice + fbAdCost + deliveryCost;
          const fixedMonthly = newPerProductBudget + returnCost + damagedCost;
          const p = Math.max(desiredPct, 0) / 100;
          const denominator = sellingPrice - perPieceCost * (1 + p);
          const requiredMonthlyUnits = denominator > 0 ? Math.ceil(((1 + p) * fixedMonthly) / denominator) : 0;
          const requiredDailyUnits = requiredMonthlyUnits > 0 ? Math.ceil(requiredMonthlyUnits / daysInMonth) : 0;

          const response = await fetch(`/api/ad-products?id=${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: product.id,
              monthlyBudget: newPerProductBudget,
              requiredMonthlyUnits,
              requiredDailyUnits
            })
          });
          
          if (!response.ok) {
            console.error(`❌ Failed to update monthly budget for product ${product.id}`);
            return false;
          } else {
            console.log(`✅ Updated product ${product.id}: budget=${newPerProductBudget}, monthly=${requiredMonthlyUnits}, daily=${requiredDailyUnits}`);
            return true;
          }
        } catch (error) {
          console.error(`❌ Error updating monthly budget for product ${product.id}:`, error);
          return false;
        }
      });
      
      // Execute all updates in parallel
      const updateResults = await Promise.all(updatePromises);
      const successCount = updateResults.filter(Boolean).length;
      
      console.log(`✅ Successfully updated ${successCount}/${productsInMonth.length} products in ${month} ${year}. New budget per product: ${newPerProductBudget}`);
      
      // Update local state with fresh data
      setAdProductEntries(freshAdProducts);
      setBudgetEntries(freshBudgetEntries);
      
      // Force a re-render by updating the state again after a short delay
      setTimeout(() => {
        setAdProductEntries(prev => [...prev]);
        setBudgetEntries(prev => [...prev]);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error updating monthly budgets:', error);
    }
  };

  const getDaysInTargetMonth = (): number => {
    const monthName = adProductForm.targetMonth;
    const idx = months.indexOf(monthName);
    if (idx === -1) {
      console.warn(`⚠️ Month "${monthName}" not found in months array, using default 30 days`);
      return 30;
    }
    const year = parseInt(adProductForm.targetYear || `${new Date().getFullYear()}`);
    const days = new Date(year, idx + 1, 0).getDate();
    console.log(`📅 Days in ${monthName} ${year}: ${days}`);
    return days;
  };

  // Fetch categories and products on component mount
  useEffect(() => {
    fetchBudgetEntries();
    fetchCategories();
    fetchAdProductEntries();
    fetchSellingTargetEntries();
    
    // Set up periodic refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchSellingTargetEntries();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAdProductEntries = async () => {
    try {
      const res = await fetch('/api/ad-products');
      if (res.ok) {
        const data = await res.json();
        setAdProductEntries(data);
      }
    } catch (error) {
      console.error('Failed to fetch ad product entries:', error);
    }
  };

  // Fetch categories when component mounts
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch products by category
  const fetchProductsByCategory = async (categoryId: string) => {
    if (!categoryId) return;
    try {
      console.log('🔍 Fetching products for category:', categoryId);
      const response = await fetch(`/api/products?categoryId=${categoryId}`);
      if (response.ok) {
        const data: {id: number, name: string, description?: string, image?: string, images?: string[], buyingPrice?: number, buyPrice?: number, sellingPrice?: number, regularPrice?: number, categoryName?: string}[] = await response.json();
        console.log('📦 Products received:', data);
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Fetch selling targets
  const fetchSellingTargetEntries = async () => {
    try {
      const response = await fetch('/api/selling-targets');
      if (response.ok) {
        const data = await response.json();
        setSellingTargetEntries(data);
      }
    } catch (error) {
      console.error('Error fetching selling targets:', error);
    }
  };

  // Update selling target entry
  const updateSellingTarget = async (adProductEntryId: number, date: string, targetUnits: number, soldUnits: number) => {
    try {
      const response = await fetch('/api/selling-targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adProductEntryId,
          date,
          targetUnits,
          soldUnits
        }),
      });

      if (response.ok) {
        // Refresh selling targets to get updated data
        await fetchSellingTargetEntries();
        return true;
      } else {
        console.error('Failed to update selling target');
        return false;
      }
    } catch (error) {
      console.error('Error updating selling target:', error);
      return false;
    }
  };

  // Redistribute remaining daily targets dynamically for the rest of the month
  const redistributeRemainingTargets = async (
    adProductEntryId: number,
    monthName: string,
    year: number,
    currentDay: number
  ) => {
    try {
      const monthIdx = months.indexOf(monthName);
      if (monthIdx === -1) return;
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      const entry = adProductEntries.find(e => e.id === adProductEntryId);
      if (!entry) return;
      const monthlyTarget = entry.requiredMonthlyUnits || 0;

      // Sum sold up to and including currentDay
      const soldToDate = sellingTargetEntries
        .filter(t => t.adProductEntryId === adProductEntryId)
        .filter(t => {
          const [y, m, d] = t.date.split('-').map(n => parseInt(n, 10));
          return y === year && m === (monthIdx + 1) && d <= currentDay;
        })
        .reduce((sum, t) => sum + (t.soldUnits || 0), 0);

      const remainingDays = Array.from({ length: Math.max(0, daysInMonth - currentDay) }, (_, i) => currentDay + 1 + i);
      const remainingDaysCount = remainingDays.length;
      if (remainingDaysCount === 0) return;

      const remainingNeeded = Math.max(0, monthlyTarget - soldToDate);
      const base = Math.floor(remainingNeeded / remainingDaysCount);
      const extra = remainingNeeded % remainingDaysCount;

      const promises = remainingDays.map((d, idx) => {
        const plannedUnits = base + (idx < extra ? 1 : 0);
        const date = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const existing = sellingTargetEntries.find(t => t.adProductEntryId === adProductEntryId && t.date === date);
        const soldUnits = existing?.soldUnits || 0;
        return updateSellingTarget(adProductEntryId, date, plannedUnits, soldUnits);
      });

      await Promise.all(promises);
      await fetchSellingTargetEntries();
    } catch (error) {
      console.error('Error redistributing remaining targets:', error);
    }
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setAdProductForm(prev => ({ ...prev, categoryId, productId: '' }));
    setSelectedProduct(null);
    if (categoryId) {
      fetchProductsByCategory(categoryId);
    } else {
      setProducts([]);
    }
  };

  // Handle product change
  const handleProductChange = (productId: string) => {
    console.log('🔄 Product changed to:', productId);
    const product = products.find((p) => p.id.toString() === productId);
    console.log('📦 Selected product:', product);
    setSelectedProduct(product || null);
    if (product) {
      setAdProductForm(prev => ({
        ...prev,
        productId,
        productName: product.name,
        productImage: product.image || product.images?.[0] || '',
        buyingPrice: product.buyingPrice?.toString() || product.buyPrice?.toString() || '',
        sellingPrice: product.sellingPrice?.toString() || product.regularPrice?.toString() || ''
      }));
      console.log('💰 Product details set:', {
        productId,
        productName: product.name,
        productImage: product.image || product.images?.[0] || '',
        buyingPrice: product.buyingPrice?.toString() || product.buyPrice?.toString() || '',
        sellingPrice: product.sellingPrice?.toString() || product.regularPrice?.toString() || ''
      });
    }
  };

  // Handle month change and fetch budget for that month
  const handleMonthChange = async (month: string) => {
    setAdProductForm(prev => ({ ...prev, targetMonth: month }));
    
    if (month) {
      try {
        const response = await fetch('/api/budget');
        const budgetEntries = await response.json();
        
        // Calculate total budget for the selected month and year
        const targetYear = parseInt(adProductForm.targetYear || `${new Date().getFullYear()}`);
        const monthBudget = budgetEntries
          .filter((entry: BudgetEntry) => entry.month === month && entry.year === targetYear)
          .reduce((total: number, entry: BudgetEntry) => total + entry.amount, 0);
        
        setSelectedMonthBudget(monthBudget);
      } catch (error) {
        console.error('Error fetching budget:', error);
        setSelectedMonthBudget(0);
      }
    } else {
      setSelectedMonthBudget(0);
    }
  };

  // Handle Ad Product form submission
  const handleAdProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adProductForm.productId || !adProductForm.productName) {
      alert('Please select a product');
      return;
    }

    // Additional validation
    if (!adProductForm.targetMonth || !adProductForm.targetYear) {
      alert('Please select month and year');
      return;
    }

    if (!adProductForm.buyingPrice || !adProductForm.sellingPrice) {
      alert('Please ensure buying price and selling price are set');
      return;
    }

    // Check if budget exists for selected month/year
    const targetYear = parseInt(adProductForm.targetYear);
    const monthBudget = budgetEntries
      .filter((entry: BudgetEntry) => entry.month === adProductForm.targetMonth && entry.year === targetYear)
      .reduce((total: number, entry: BudgetEntry) => total + entry.amount, 0);
    
    if (monthBudget === 0) {
      alert(`No budget found for ${adProductForm.targetMonth} ${targetYear}. Please add a budget first.`);
      return;
    }

    // Update selectedMonthBudget for this submission
    setSelectedMonthBudget(monthBudget);
    
    console.log('💰 Budget validation:', {
      targetMonth: adProductForm.targetMonth,
      targetYear,
      monthBudget,
      budgetEntriesCount: budgetEntries.length,
      matchingEntries: budgetEntries.filter((entry: BudgetEntry) => entry.month === adProductForm.targetMonth && entry.year === targetYear)
    });

    setIsSubmitting(true);
    
    try {
      // Calculate required units for profit target (profit over total costs including per-piece cost)
      const baseBudget = getPerProductMonthlyBudget();
      const variableMonthly = getEstimatedMonthlyCost();
      const fixedMonthly = baseBudget + variableMonthly; // per-product share + monthly return/damaged
      const perPiece = getEstimatedCost(); // buying + fb + delivery
      const sellingPriceValue = parseFloat(adProductForm.sellingPrice || '0');
      const desiredPct = parseFloat(adProductForm.desiredProfitPercent || '0');
      const p = Math.max(desiredPct, 0) / 100;
      const denominator = sellingPriceValue - perPiece * (1 + p);
      const requiredMonthlyUnits = denominator > 0 ? Math.ceil(((1 + p) * fixedMonthly) / denominator) : 0;
      const requiredDailyUnits = requiredMonthlyUnits > 0 ? Math.ceil(requiredMonthlyUnits / getDaysInTargetMonth()) : 0;

      // For debugging: show calculated values
      console.log(`🧮 Calculated targets for new product:`, {
        baseBudget,
        variableMonthly,
        fixedMonthly,
        perPiece,
        sellingPrice: sellingPriceValue,
        desiredPct,
        p,
        denominator,
        requiredMonthlyUnits,
        requiredDailyUnits,
        daysInMonth: getDaysInTargetMonth()
      });

      // Ensure all numeric values are valid numbers for productData
      const buyingPriceForData = parseFloat(adProductForm.buyingPrice) || 0;
      const sellingPriceForData = parseFloat(adProductForm.sellingPrice) || 0;
      const fbAdCostForData = parseFloat(adProductForm.fbAdCost) || 0;
      const deliveryCostForData = parseFloat(adProductForm.deliveryCost) || 0;
      const returnParcelQtyForData = parseInt(adProductForm.returnParcelQty) || 0;
      const damagedProductQtyForData = parseInt(adProductForm.damagedProductQty) || 0;
      const returnCostForData = returnParcelQtyForData * deliveryCostForData;
      const damagedCostForData = damagedProductQtyForData * (buyingPriceForData + deliveryCostForData);
      const monthlyBudgetForData = getPerProductMonthlyBudget();
      const desiredProfitPctForData = parseFloat(adProductForm.desiredProfitPercent) || 0;

      const productData = {
        month: adProductForm.targetMonth,
        year: adProductForm.targetYear,
        productId: adProductForm.productId,
        productName: adProductForm.productName,
        productImage: adProductForm.productImage,
        buyingPrice: buyingPriceForData.toString(),
        sellingPrice: sellingPriceForData.toString(),
        fbAdCost: fbAdCostForData.toString(),
        deliveryCost: deliveryCostForData.toString(),
        returnParcelQty: returnParcelQtyForData.toString(),
        returnCost: returnCostForData.toString(),
        damagedProductQty: damagedProductQtyForData.toString(),
        damagedCost: damagedCostForData.toString(),
        monthlyBudget: monthlyBudgetForData.toString(),
        desiredProfitPct: desiredProfitPctForData.toString(),
        requiredMonthlyUnits,
        requiredDailyUnits
      };

      console.log('📤 Submitting product data:', productData);
      console.log('🔍 Validation check - month:', productData.month, 'productName:', productData.productName);
      console.log('🔍 Numeric values check:', {
        buyingPrice: productData.buyingPrice,
        sellingPrice: productData.sellingPrice,
        fbAdCost: productData.fbAdCost,
        deliveryCost: productData.deliveryCost,
        returnParcelQty: productData.returnParcelQty,
        returnCost: productData.returnCost,
        damagedProductQty: productData.damagedProductQty,
        damagedCost: productData.damagedCost,
        monthlyBudget: productData.monthlyBudget,
        desiredProfitPct: productData.desiredProfitPct,
        requiredMonthlyUnits: productData.requiredMonthlyUnits,
        requiredDailyUnits: productData.requiredDailyUnits
      });
      console.log('🔍 Calculated values check:', {
        buyingPriceForData,
        sellingPriceForData,
        fbAdCostForData,
        deliveryCostForData,
        returnParcelQtyForData,
        returnCostForData,
        damagedProductQtyForData,
        damagedCostForData,
        monthlyBudgetForData,
        desiredProfitPctForData
      });

      const response = await fetch('/api/ad-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const addedProduct = await response.json();
      console.log('✅ Product added successfully:', addedProduct);

      // Close modal immediately for better UX
      setIsAdProductModalOpen(false);
      
      // Reset form
      setAdProductForm({
        categoryId: '',
        productId: '',
        productName: '',
        productImage: '',
        buyingPrice: '',
        sellingPrice: '',
        fbAdCost: '',
        deliveryCost: '',
        returnParcelQty: '',
        damagedProductQty: '',
        targetMonth: new Date().toLocaleString('default', { month: 'long' }),
        targetYear: new Date().getFullYear().toString(),
        desiredProfitPercent: '10'
      });

      // Show success message
      alert('Product added successfully!');

      // Update data in background (non-blocking) - simplified approach
      setTimeout(async () => {
        try {
          // Just refresh the main data - let the system handle the rest automatically
          await fetchAdProductEntries();
          
          // Update monthly budgets for the month to ensure proper distribution
          await updateMonthlyBudgetsForMonth(addedProduct.month, addedProduct.year);
          
          console.log('✅ Background refresh and budget update completed');
        } catch (error) {
          console.error('⚠️ Background refresh failed:', error);
          // Don't show error to user since product was already added successfully
        }
      }, 100);

    } catch (error) {
      console.error('❌ Error adding product:', error);
      alert(`Error adding product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBudgetEntry = async (id: number) => {
    try {
      setIsLoading(true);
      
      // Get the budget entry details before deletion for budget recalculation
      const budgetEntryToDelete = budgetEntries.find(entry => entry.id === id);
      
      const response = await fetch(`/api/budget?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBudgetEntries(prev => prev.filter(entry => entry.id !== id));
        
        // Reset to first page if current page becomes empty
        const remainingEntries = budgetEntries.filter(entry => entry.id !== id);
        const newTotalPages = Math.ceil(remainingEntries.length / entriesPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
        
        // Update monthly budgets for ad products in the same month/year if budget entry was deleted
        if (budgetEntryToDelete) {
          await updateMonthlyBudgetsForMonth(budgetEntryToDelete.month, budgetEntryToDelete.year);
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting budget entry:', error);
      alert('Failed to delete budget entry');
    } finally {
      setIsLoading(false);
    }
  };

  const editBudgetEntry = (entry: BudgetEntry) => {
    setEditingEntry(entry);
    setBudgetForm({
      month: entry.month,
      year: entry.year,
      expenseType: entry.expenseType,
      amount: entry.amount.toString(),
      currency: entry.currency,
      note: entry.note
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEntry) return;

    if (!budgetForm.month || !budgetForm.expenseType || !budgetForm.amount) {
      alert('Please fill all fields');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/budget', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingEntry.id,
          ...budgetForm
        }),
      });

      if (response.ok) {
        const updatedEntry = await response.json();
        setBudgetEntries(prev => prev.map(entry => 
          entry.id === editingEntry.id ? updatedEntry : entry
        ));
        
        // Update monthly budgets for ad products in the same month/year if budget entry was modified
        await updateMonthlyBudgetsForMonth(updatedEntry.month, updatedEntry.year);
        
        setBudgetForm({ month: '', year: new Date().getFullYear(), expenseType: '', amount: '', currency: 'BDT', note: '' });
        setEditingEntry(null);
        setIsEditModalOpen(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating budget entry:', error);
      alert('Failed to update budget entry');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter budget entries by selected month and year
  const filteredEntries = budgetEntries.filter(entry => {
    const monthMatch = !budgetForm.month || entry.month === budgetForm.month;
    const yearMatch = entry.year === (budgetForm.year || new Date().getFullYear());
    return monthMatch && yearMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border pt-2">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4 pt-2" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                    isActive
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Business Growth Dashboard</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Overview of all products, costs, and profit targets
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">View:</span>
                    <select 
                      value={dashboardMonth} 
                      onChange={(e) => setDashboardMonth(e.target.value)}
                      className="text-sm px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <select 
                      value={dashboardYear} 
                      onChange={(e) => setDashboardYear(parseInt(e.target.value))}
                      className="text-sm px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {Array.from({ length: 15 }, (_, i) => currentYear - 10 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={async () => {
                      console.log('🔄 Manual refresh triggered');
                      await fetchAdProductEntries();
                      await fetchBudgetEntries();
                      await fetchSellingTargetEntries();
                      try { await generateCoachAdvice(); } catch {}
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>

                            {/* Sales Progress Dashboard */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-200 mb-3">
                <h4 className="text-base font-semibold text-emerald-900 mb-3">Sales Progress & Achievement</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Overall Progress Card */}
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-emerald-700">Overall Progress</p>
                      <div className="p-1.5 bg-emerald-100 rounded">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    
                    {(() => {
                      const selectedMonthEntries = adProductEntries.filter(entry => 
                        entry.month === dashboardMonth && entry.year === dashboardYear
                      );
                      const totalMonthlyTarget = selectedMonthEntries.reduce((sum, entry) => sum + (entry.requiredMonthlyUnits || 0), 0);
                      const totalSold = sellingTargetEntries
                        .filter(entry => entry.adProductEntry.month === dashboardMonth && entry.adProductEntry.year === dashboardYear)
                        .reduce((sum, entry) => sum + (entry.soldUnits || 0), 0);
                      const progressPercentage = totalMonthlyTarget > 0 ? (totalSold / totalMonthlyTarget) * 100 : 0;
                      
                      return (
                        <>
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-emerald-600">Target: {totalMonthlyTarget.toLocaleString()} pcs</span>
                              <span className="text-emerald-600">{progressPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-emerald-100 rounded-full h-3">
                              <div 
                                className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-emerald-900">{totalSold.toLocaleString()}</p>
                            <p className="text-sm text-emerald-600">{dashboardMonth} {dashboardYear}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Monthly Achievement Card */}
                  <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-blue-700">Current Month</p>
                      <div className="p-1.5 bg-blue-100 rounded">
                        <ChartBarIcon className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>

                    {(() => {
                      const selectedMonthTarget = adProductEntries
                        .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                        .reduce((sum, entry) => sum + (entry.requiredMonthlyUnits || 0), 0);
                      const selectedMonthSold = sellingTargetEntries
                        .filter(entry => entry.adProductEntry.month === dashboardMonth && entry.adProductEntry.year === dashboardYear)
                        .reduce((sum, entry) => sum + (entry.soldUnits || 0), 0);
                      const selectedProgress = selectedMonthTarget > 0 ? (selectedMonthSold / selectedMonthTarget) * 100 : 0;

                      return (
                        <>
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-blue-600">Target: {selectedMonthTarget.toLocaleString()} pcs</span>
                              <span className="text-blue-600">{selectedProgress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-blue-100 rounded-full h-3">
                              <div
                                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(selectedProgress, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-blue-900">{selectedMonthSold.toLocaleString()}</p>
                            <p className="text-sm text-blue-600">{dashboardMonth} {dashboardYear}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Profit Progress Card */}
                  <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-purple-700">Profit Progress</p>
                      <div className="p-1.5 bg-purple-100 rounded">
                        <ChartBarIcon className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>

                    {(() => {
                      // Filter by selected month/year for dashboard
                      const selectedMonthEntries = adProductEntries.filter(entry => 
                        entry.month === dashboardMonth && entry.year === dashboardYear
                      );
                      const selectedMonthBudget = budgetEntries
                        .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                        .reduce((sum, entry) => sum + entry.amount, 0);

                      // Calculate total business costs for selected month (budget + all product costs)
                      const totalProductCosts = selectedMonthEntries.reduce((sum, entry) => {
                        const monthlyTarget = entry.requiredMonthlyUnits || 0;
                        const perPieceCost = (entry.buyingPrice || 0) + (entry.fbAdCost || 0) + (entry.deliveryCost || 0);
                        const monthlyReturnCost = (entry.returnCost || 0);
                        const monthlyDamagedCost = (entry.damagedCost || 0);
                        return sum + (perPieceCost * monthlyTarget) + monthlyReturnCost + monthlyDamagedCost;
                      }, 0);
                      
                      const totalBusinessCosts = selectedMonthBudget + totalProductCosts;
                      
                      // Calculate total expected revenue for selected month
                      const totalRevenue = selectedMonthEntries.reduce((sum, entry) => {
                        const monthlyTarget = entry.requiredMonthlyUnits || 0;
                        const sellingPrice = entry.sellingPrice || 0;
                        return sum + (sellingPrice * monthlyTarget);
                      }, 0);
                      
                      // Calculate target profit based on desired profit percentage
                      const totalTargetProfit = selectedMonthEntries.reduce((sum, entry) => {
                        const monthlyTarget = entry.requiredMonthlyUnits || 0;
                        const perPieceCost = (entry.buyingPrice || 0) + (entry.fbAdCost || 0) + (entry.deliveryCost || 0);
                        const monthlyReturnCost = (entry.returnCost || 0);
                        const monthlyDamagedCost = (entry.damagedCost || 0);
                        const totalCosts = (perPieceCost * monthlyTarget) + monthlyReturnCost + monthlyDamagedCost;
                        const desiredProfit = entry.desiredProfitPct || 0;
                        return sum + (totalCosts * (desiredProfit / 100));
                      }, 0);
                      
                      // Calculate actual profit (revenue - total business costs)
                      const actualProfit = totalRevenue - totalBusinessCosts;
                      const profitPercentage = totalTargetProfit > 0 ? ((actualProfit / totalTargetProfit) * 100) : 0;

                      return (
                        <>
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-purple-600">Target: {totalTargetProfit.toLocaleString()} BDT</span>
                              <span className={`${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-purple-100 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all duration-300 ${actualProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(Math.abs(profitPercentage), 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className={`text-xl font-bold ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {actualProfit >= 0 ? '+' : ''}{actualProfit.toLocaleString()}
                            </p>
                            <p className="text-sm text-purple-600">Net Profit (BDT)</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {dashboardMonth} {dashboardYear} • After all costs
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Real-time Net Profit (MTD) */}
                  <div className="bg-white p-3 rounded-lg border border-rose-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-rose-700">Real-time Net Profit (MTD)</p>
                      <div className="p-1.5 bg-rose-100 rounded">
                        <ChartBarIcon className="w-4 h-4 text-rose-600" />
                      </div>
                    </div>

                    {(() => {
                      const selectedEntries = adProductEntries.filter(e => e.month === dashboardMonth && e.year === dashboardYear);
                      const monthIdx = months.indexOf(dashboardMonth);
                      const daysInMonth = new Date(dashboardYear, monthIdx + 1, 0).getDate();
                      const now = new Date();
                      const isCurrentSelected = (now.toLocaleString('default', { month: 'long' }) === dashboardMonth) && (now.getFullYear() === dashboardYear);
                      const elapsedDays = isCurrentSelected ? now.getDate() : daysInMonth;
                      const proRateFactor = daysInMonth > 0 ? (elapsedDays / daysInMonth) : 1;

                      // Map for quick lookup
                      const entryById: Record<number, typeof selectedEntries[number]> = Object.fromEntries(selectedEntries.map(e => [e.id, e]));

                      const soldTargetsForMonth = sellingTargetEntries.filter(t => t.adProductEntry.month === dashboardMonth && t.adProductEntry.year === dashboardYear);

                      const revenueToDate = soldTargetsForMonth.reduce((sum, t) => {
                        const e = entryById[t.adProductEntryId];
                        const price = e?.sellingPrice || 0;
                        return sum + price * (t.soldUnits || 0);
                      }, 0);

                      const perPieceCostToDate = soldTargetsForMonth.reduce((sum, t) => {
                        const e = entryById[t.adProductEntryId];
                        if (!e) return sum;
                        const unitCost = (e.buyingPrice || 0) + (e.fbAdCost || 0) + (e.deliveryCost || 0);
                        return sum + unitCost * (t.soldUnits || 0);
                      }, 0);

                      const monthBudget = budgetEntries
                        .filter(b => b.month === dashboardMonth && b.year === dashboardYear)
                        .reduce((s, b) => s + (b.amount || 0), 0);
                      const variableMonthly = selectedEntries.reduce((s, e) => s + (e.returnCost || 0) + (e.damagedCost || 0), 0);
                      const overheadToDate = (monthBudget + variableMonthly) * proRateFactor;

                      const realizedUnitProfit = revenueToDate - perPieceCostToDate;
                      const netProfitMTD = realizedUnitProfit - overheadToDate;

                      const positive = netProfitMTD >= 0;
                      const percent = overheadToDate > 0 ? (netProfitMTD / overheadToDate) * 100 : (positive ? 100 : -100);

                      return (
                        <>
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-rose-600">Overhead (to date): {overheadToDate.toLocaleString()} BDT</span>
                              <span className={`${positive ? 'text-green-600' : 'text-red-600'}`}>{percent >= 0 ? '+' : ''}{percent.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-rose-100 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all duration-300 ${positive ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(100, Math.abs(percent))}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className={`text-2xl font-bold ${positive ? 'text-green-600' : 'text-red-600'}`}>{positive ? '+' : ''}{netProfitMTD.toLocaleString()} BDT</p>
                            <p className="text-sm text-rose-700">Net Profit (Month-to-date)</p>
                            <p className="text-xs text-gray-500 mt-1">Revenue: {revenueToDate.toLocaleString()} • Cost: {(perPieceCostToDate + overheadToDate).toLocaleString()}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Smart AI Coach */}
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Smart AI Coach</h4>
                  <button
                    onClick={async () => { try { await generateCoachAdvice(); } catch {} }}
                    className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    disabled={coachLoading}
                  >{coachLoading ? 'Analyzing…' : 'Analyze Now'}</button>
                </div>
                {coachAdvice ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-800">{coachAdvice.summary}</p>
                    {coachAdvice.bullets?.length > 0 && (
                      <ul className="list-disc pl-5 text-sm text-gray-700">
                        {coachAdvice.bullets.map((b, i) => (<li key={i}>{b}</li>))}
                      </ul>
                    )}
                    {coachAdvice.next_actions?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Next actions</p>
                        <ul className="list-decimal pl-5 text-sm text-gray-700">
                          {coachAdvice.next_actions.map((a, i) => (<li key={i}>{a}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">মাসিক টার্গেট, বিক্রি ও বাজেট দেখে এআই সাজেশন পেতে “Analyze Now” চাপুন।</p>
                )}
              </div>

              {/* Business Budget vs Selling Comparison Dashboard */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-base font-semibold text-blue-900 mb-3">Business Budget vs Selling Comparison - {dashboardMonth} {dashboardYear}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Total Budget Card */}
                  <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-blue-600">Total Budget</p>
                      <div className="p-1 bg-blue-100 rounded">
                        <ChartBarIcon className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-lg font-bold text-blue-900">
                      {(() => {
                        return budgetEntries
                          .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                          .reduce((sum, entry) => sum + entry.amount, 0)
                          .toLocaleString();
                      })()} BDT
                    </p>
                  </div>

                  {/* All Business Costs Card */}
                  <div className="bg-white p-3 rounded-lg border border-red-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-red-600">All Business Costs</p>
                      <div className="p-1 bg-red-100 rounded">
                        <ChartBarIcon className="w-4 h-4 text-red-600" />
                      </div>
                    </div>
                    <p className="text-lg font-bold text-red-900">
                      {(() => {
                        const selectedMonthEntries = adProductEntries.filter(entry => 
                          entry.month === dashboardMonth && entry.year === dashboardYear
                        );
                        const totalProductCost = selectedMonthEntries.reduce((sum, entry) => sum + (entry.buyingPrice * (entry.requiredMonthlyUnits || 0)), 0);
                        const totalFbAdCost = selectedMonthEntries.reduce((sum, entry) => sum + (entry.fbAdCost * (entry.requiredMonthlyUnits || 0)), 0);
                        const totalDeliveryCost = selectedMonthEntries.reduce((sum, entry) => sum + (entry.deliveryCost * (entry.requiredMonthlyUnits || 0)), 0);
                        return (totalProductCost + totalFbAdCost + totalDeliveryCost).toLocaleString();
                      })()} BDT
                    </p>
                    <p className="text-xs text-red-500 mt-1">Product + FB + Delivery</p>
                  </div>

                  {/* Total Revenue Card */}
                  <div className="bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-green-600">Total Revenue</p>
                      <div className="p-1 bg-blue-100 rounded">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-900">
                      {(() => {
                        const selectedMonthEntries = adProductEntries.filter(entry => 
                          entry.month === dashboardMonth && entry.year === dashboardYear
                        );
                        const totalRevenue = selectedMonthEntries.reduce((sum, entry) => {
                          const monthlyTarget = entry.requiredMonthlyUnits || 0;
                          const sellingPrice = entry.sellingPrice || 0;
                          return sum + (sellingPrice * monthlyTarget);
                        }, 0);
                        return totalRevenue.toLocaleString();
                      })()} BDT
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      {(() => {
                        const selectedMonthEntries = adProductEntries.filter(entry => 
                          entry.month === dashboardMonth && entry.year === dashboardYear
                        );
                        return selectedMonthEntries.reduce((sum, entry) => sum + (entry.requiredMonthlyUnits || 0), 0);
                      })()} pieces
                    </p>
                  </div>

                  {/* Profit Analysis Card */}
                  <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-purple-600">Net Profit</p>
                      <div className="p-1 bg-purple-100 rounded">
                        <ChartBarIcon className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                    <p className={`text-lg font-bold ${(() => {
                      const selectedMonthBudget = budgetEntries
                        .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                        .reduce((sum, entry) => sum + entry.amount, 0);
                      const selectedMonthEntries = adProductEntries.filter(entry => 
                        entry.month === dashboardMonth && entry.year === dashboardYear
                      );
                      const totalProductCosts = selectedMonthEntries.reduce((sum, entry) => {
                        const monthlyTarget = entry.requiredMonthlyUnits || 0;
                        const perPieceCost = (entry.buyingPrice || 0) + (entry.fbAdCost || 0) + (entry.deliveryCost || 0);
                        const monthlyReturnCost = (entry.returnCost || 0);
                        const monthlyDamagedCost = (entry.damagedCost || 0);
                        return sum + (perPieceCost * monthlyTarget) + monthlyReturnCost + monthlyDamagedCost;
                      }, 0);
                      const totalBusinessCosts = selectedMonthBudget + totalProductCosts;
                      const totalRevenue = selectedMonthEntries.reduce((sum, entry) => {
                        const monthlyTarget = entry.requiredMonthlyUnits || 0;
                        const sellingPrice = entry.sellingPrice || 0;
                        return sum + (sellingPrice * monthlyTarget);
                      }, 0);
                      const profit = totalRevenue - totalBusinessCosts;
                      return profit >= 0 ? 'text-green-600' : 'text-red-600';
                    })()}`}>
                      {(() => {
                        const selectedMonthBudget = budgetEntries
                          .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                          .reduce((sum, entry) => sum + entry.amount, 0);
                        const selectedMonthEntries = adProductEntries.filter(entry => 
                          entry.month === dashboardMonth && entry.year === dashboardYear
                        );
                        const totalProductCosts = selectedMonthEntries.reduce((sum, entry) => {
                          const monthlyTarget = entry.requiredMonthlyUnits || 0;
                          const perPieceCost = (entry.buyingPrice || 0) + (entry.fbAdCost || 0) + (entry.deliveryCost || 0);
                          const monthlyReturnCost = (entry.returnCost || 0);
                          const monthlyDamagedCost = (entry.damagedCost || 0);
                          return sum + (perPieceCost * monthlyTarget) + monthlyReturnCost + monthlyDamagedCost;
                        }, 0);
                        const totalBusinessCosts = selectedMonthBudget + totalProductCosts;
                        const totalRevenue = selectedMonthEntries.reduce((sum, entry) => {
                          const monthlyTarget = entry.requiredMonthlyUnits || 0;
                          const sellingPrice = entry.sellingPrice || 0;
                          return sum + (sellingPrice * monthlyTarget);
                        }, 0);
                        const profit = totalRevenue - totalBusinessCosts;
                        return profit.toLocaleString();
                      })()} BDT
                    </p>
                    <p className={`text-xs mt-1 ${(() => {
                      const selectedMonthBudget = budgetEntries
                        .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                        .reduce((sum, entry) => sum + entry.amount, 0);
                      const selectedMonthEntries = adProductEntries.filter(entry => 
                        entry.month === dashboardMonth && entry.year === dashboardYear
                      );
                                              const totalProductCosts = selectedMonthEntries.reduce((sum, entry) => {
                          const monthlyTarget = entry.requiredMonthlyUnits || 0;
                          const perPieceCost = (entry.buyingPrice || 0) + (entry.fbAdCost || 0) + (entry.deliveryCost || 0);
                          const monthlyReturnCost = (entry.returnCost || 0);
                          const monthlyDamagedCost = (entry.damagedCost || 0);
                          return sum + (perPieceCost * monthlyTarget) + monthlyReturnCost + monthlyDamagedCost;
                        }, 0);
                      const totalBusinessCosts = selectedMonthBudget + totalProductCosts;
                      const totalRevenue = selectedMonthEntries.reduce((sum, entry) => {
                        const monthlyTarget = entry.requiredMonthlyUnits || 0;
                        const sellingPrice = entry.sellingPrice || 0;
                        return sum + (sellingPrice * monthlyTarget);
                      }, 0);
                      const profit = totalRevenue - totalBusinessCosts;
                      const profitPercentage = totalBusinessCosts > 0 ? ((profit / totalBusinessCosts) * 100) : 0;
                      return profit >= 0 ? 'text-green-500' : 'text-red-500';
                    })()}`}>
                      {(() => {
                        const selectedMonthBudget = budgetEntries
                          .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                          .reduce((sum, entry) => sum + entry.amount, 0);
                        const selectedMonthEntries = adProductEntries.filter(entry => 
                          entry.month === dashboardMonth && entry.year === dashboardYear
                        );
                        const totalProductCosts = selectedMonthEntries.reduce((sum, entry) => {
                          const monthlyTarget = entry.requiredMonthlyUnits || 0;
                          const perPieceCost = (entry.buyingPrice || 0) + (entry.fbAdCost || 0) + (entry.deliveryCost || 0);
                          const monthlyReturnCost = (entry.returnCost || 0);
                          const monthlyDamagedCost = (entry.damagedCost || 0);
                          return sum + (perPieceCost * monthlyTarget) + monthlyReturnCost + monthlyDamagedCost;
                        }, 0);
                        const totalBusinessCosts = selectedMonthBudget + totalProductCosts;
                        const totalRevenue = selectedMonthEntries.reduce((sum, entry) => {
                          const monthlyTarget = entry.requiredMonthlyUnits || 0;
                          const sellingPrice = entry.sellingPrice || 0;
                          return sum + (sellingPrice * monthlyTarget);
                        }, 0);
                        const profit = totalRevenue - totalBusinessCosts;
                        const profitPercentage = totalBusinessCosts > 0 ? ((profit / totalBusinessCosts) * 100) : 0;
                        return profit >= 0 ? `+${profitPercentage.toFixed(1)}%` : `${profitPercentage.toFixed(1)}%`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {adProductEntries.filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear).length}
                      </p>
                      <p className="text-xs text-gray-500">{dashboardMonth} {dashboardYear}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CubeIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Investment</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {adProductEntries
                          .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                          .reduce((sum, entry) => sum + (entry.buyingPrice * (entry.requiredMonthlyUnits || 0)), 0)
                          .toLocaleString()} BDT
                      </p>
                      <p className="text-xs text-gray-500">{dashboardMonth} {dashboardYear}</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <ChartBarIcon className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total FB Ad Cost</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {adProductEntries
                          .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                          .reduce((sum, entry) => sum + (entry.fbAdCost * (entry.requiredMonthlyUnits || 0)), 0)
                          .toLocaleString()} BDT
                      </p>
                      <p className="text-xs text-gray-500">{dashboardMonth} {dashboardYear}</p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <ChartBarIcon className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Monthly Target</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {adProductEntries
                          .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                          .reduce((sum, entry) => sum + (entry.requiredMonthlyUnits || 0), 0)} pcs
                      </p>
                      <p className="text-xs text-gray-500">{dashboardMonth} {dashboardYear}</p>
                    </div>
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <ArrowTrendingUpIcon className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Overview Table */}
              {adProductEntries.length > 0 ? (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900">Products Overview</h4>
                    <p className="text-sm text-gray-500">Detailed breakdown of costs, targets, and expected profits</p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buying Cost</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FB Ad Cost</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Cost</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Target</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit %</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adProductEntries
                          .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                          .map((entry) => {
                          const monthlyTarget = entry.requiredMonthlyUnits || 0;
                          const perPieceCost = entry.buyingPrice + entry.fbAdCost + entry.deliveryCost;
                          const totalBuyingCost = entry.buyingPrice * monthlyTarget;
                          const totalFbAdCost = entry.fbAdCost * monthlyTarget;
                          const totalDeliveryCost = entry.deliveryCost * monthlyTarget;
                          const totalCost = totalBuyingCost + totalFbAdCost + totalDeliveryCost;
                          const sellingPrice = entry.sellingPrice || 0;
                          const expectedRevenue = sellingPrice * monthlyTarget;
                          const profit = expectedRevenue - totalCost;
                          const profitPercentage = totalCost > 0 ? ((profit / totalCost) * 100) : 0;
                          
                          // For debugging: show target values in Dashboard
                          console.log(`📊 Dashboard ${entry.productName}:`, {
                            requiredMonthlyUnits: entry.requiredMonthlyUnits,
                            requiredDailyUnits: entry.requiredDailyUnits,
                            monthlyTarget,
                            dailyTarget: entry.requiredDailyUnits || 0
                          });

                          return (
                            <tr key={entry.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  {entry.productImage && (
                                    <img src={entry.productImage} alt={entry.productName} className="w-10 h-10 object-cover rounded" />
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{entry.productName}</div>
                                    <div className="text-sm text-gray-500">ID: {entry.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.month} {entry.year}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {totalBuyingCost.toLocaleString()} BDT
                                <div className="text-xs text-gray-500">({entry.buyingPrice.toFixed(2)} × {monthlyTarget})</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {totalFbAdCost.toLocaleString()} BDT
                                <div className="text-xs text-gray-500">({entry.fbAdCost.toFixed(2)} × {monthlyTarget})</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {totalDeliveryCost.toLocaleString()} BDT
                                <div className="text-xs text-gray-500">({entry.deliveryCost.toFixed(2)} × {monthlyTarget})</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="text-center">
                                  <div className="font-medium">{monthlyTarget} pcs</div>
                                  <div className="text-xs text-gray-500">
                                    {entry.requiredDailyUnits || 0} pcs/day
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(() => {
                                  const productSold = sellingTargetEntries
                                    .filter(target => target.adProductEntryId === entry.id)
                                    .reduce((sum, target) => sum + (target.soldUnits || 0), 0);
                                  const progressPercentage = monthlyTarget > 0 ? (productSold / monthlyTarget) * 100 : 0;
                                  
                                  return (
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Sold: {productSold}</span>
                                        <span className="text-gray-600">{progressPercentage.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            progressPercentage >= 100 ? 'bg-green-500' : 
                                            progressPercentage >= 75 ? 'bg-blue-500' : 
                                            progressPercentage >= 50 ? 'bg-yellow-500' : 
                                            progressPercentage >= 25 ? 'bg-orange-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {monthlyTarget - productSold} remaining
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {expectedRevenue.toLocaleString()} BDT
                                <div className="text-xs text-gray-500">({sellingPrice.toFixed(2)} × {monthlyTarget})</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {totalCost.toLocaleString()} BDT
                                <div className="text-xs text-gray-500">Per piece: {perPieceCost.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {profit >= 0 ? '+' : ''}{profit.toLocaleString()} BDT
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <CubeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Products for {dashboardMonth} {dashboardYear}</h3>
                  <p className="text-gray-500 mb-6">Add products for this month/year in the Ad Products tab to see dashboard overview.</p>
                  <button
                    onClick={() => setActiveTab('ad-products')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg"
                  >
                    Go to Ad Products
                  </button>
                </div>
              )}

              {/* Profit Analysis Summary */}
              {adProductEntries.filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear).length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Profit Analysis Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {(() => {
                          const monthBudget = budgetEntries
                            .filter(b => b.month === dashboardMonth && b.year === dashboardYear)
                            .reduce((s, b) => s + (b.amount || 0), 0);
                          const entries = adProductEntries.filter(e => e.month === dashboardMonth && e.year === dashboardYear);
                          const totalRevenue = entries.reduce((s, e) => {
                            const units = e.requiredMonthlyUnits || 0;
                            const sp = e.sellingPrice || 0;
                            return s + (sp * units);
                          }, 0);
                          const perPieceCosts = entries.reduce((s, e) => {
                            const units = e.requiredMonthlyUnits || 0;
                            const unitCost = (e.buyingPrice || 0) + (e.fbAdCost || 0) + (e.deliveryCost || 0);
                            return s + (unitCost * units);
                          }, 0);
                          const monthlyVariable = entries.reduce((s, e) => s + (e.returnCost || 0) + (e.damagedCost || 0), 0);
                          const totalBusinessCosts = monthBudget + perPieceCosts + monthlyVariable;
                          const netProfit = totalRevenue - totalBusinessCosts;
                          return netProfit.toLocaleString();
                        })()} BDT
                      </div>
                      <div className="text-sm text-gray-500">Net Profit - {dashboardMonth} {dashboardYear}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {(() => {
                          const monthBudget = budgetEntries
                            .filter(b => b.month === dashboardMonth && b.year === dashboardYear)
                            .reduce((s, b) => s + (b.amount || 0), 0);
                          const entries = adProductEntries.filter(e => e.month === dashboardMonth && e.year === dashboardYear);
                          const totalRevenue = entries.reduce((s, e) => {
                            const units = e.requiredMonthlyUnits || 0;
                            const sp = e.sellingPrice || 0;
                            return s + (sp * units);
                          }, 0);
                          const perPieceCosts = entries.reduce((s, e) => {
                            const units = e.requiredMonthlyUnits || 0;
                            const unitCost = (e.buyingPrice || 0) + (e.fbAdCost || 0) + (e.deliveryCost || 0);
                            return s + (unitCost * units);
                          }, 0);
                          const monthlyVariable = entries.reduce((s, e) => s + (e.returnCost || 0) + (e.damagedCost || 0), 0);
                          const totalBusinessCosts = monthBudget + perPieceCosts + monthlyVariable;
                          const netProfit = totalRevenue - totalBusinessCosts;
                          return totalBusinessCosts > 0 ? (netProfit / totalBusinessCosts * 100) : 0;
                        })().toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Overall Profit Margin - {dashboardMonth} {dashboardYear}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {adProductEntries
                          .filter(entry => entry.month === dashboardMonth && entry.year === dashboardYear)
                          .reduce((sum, entry) => sum + (entry.requiredMonthlyUnits || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-500">Total Monthly Target Units</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-6">
                             {/* Budget Header with Summary Dashboard and Add Button */}
               <div className="space-y-4">
                 {/* Header Row */}
                 <div className="flex justify-between items-center">
                   <h3 className="text-xl font-semibold text-gray-900">Monthly Budget Management</h3>
                   <div className="flex items-center space-x-4">
                     {/* Month-Year Selector */}
                     <div className="flex items-center space-x-2">
                                                <select
                           value={`${budgetForm.month || 'current'}`}
                           onChange={(e) => {
                             if (e.target.value === 'current') {
                               // Show current month data
                               setBudgetForm(prev => ({ ...prev, month: '' }));
                             } else {
                               // Filter by selected month
                               setBudgetForm(prev => ({ ...prev, month: e.target.value }));
                             }
                             // Reset to first page when filtering
                             setCurrentPage(1);
                           }}
                           className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                         >
                         <option value="current">Current Month</option>
                         {months.map((month) => (
                           <option key={month} value={month}>{month}</option>
                         ))}
                       </select>
                       {(() => {
                         const currentYear = new Date().getFullYear();
                         const years = Array.from({ length: 15 }, (_, i) => currentYear - 10 + i);
                         return (
                           <select
                             value={budgetForm.year || currentYear}
                             className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                             onChange={(e) => {
                               setBudgetForm(prev => ({ ...prev, year: parseInt(e.target.value) }));
                               setCurrentPage(1);
                             }}
                           >
                             {years.map((y) => (
                               <option key={y} value={y}>{y}</option>
                             ))}
                           </select>
                         );
                       })()}
                     </div>
                     
                     {/* Add Budget Entry Button */}
                     <button
                       onClick={() => setIsBudgetModalOpen(true)}
                       disabled={isLoading}
                       className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                         isLoading 
                           ? 'bg-gray-400 cursor-not-allowed' 
                           : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                       }`}
                     >
                       <PlusIcon className="w-5 h-5" />
                       <span>{isLoading ? 'Loading...' : 'Add Budget Entry'}</span>
                     </button>
                   </div>
                 </div>

                 {/* Summary Dashboard Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   {/* Previous Month Budget */}
                   <div className="bg-white p-4 rounded-lg border shadow-sm">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-gray-600">Previous Month Budget</p>
                         <p className="text-2xl font-bold text-gray-900">
                           {(() => {
                             const currentMonthIndex = new Date().getMonth();
                             const previousMonth = months[currentMonthIndex === 0 ? 11 : currentMonthIndex - 1];
                             const previousMonthEntries = budgetEntries.filter(entry => 
                               entry.month === previousMonth && entry.year === (budgetForm.year || new Date().getFullYear())
                             );
                             const total = previousMonthEntries.reduce((sum, entry) => sum + entry.amount, 0);
                             return total.toLocaleString();
                           })()}
                         </p>
                         <p className="text-sm text-gray-500">
                           {(() => {
                             const currentMonthIndex = new Date().getMonth();
                             return months[currentMonthIndex === 0 ? 11 : currentMonthIndex - 1];
                           })()}
                         </p>
                       </div>
                       <div className="p-2 bg-gray-100 rounded-lg">
                         <ChartBarIcon className="w-6 h-6 text-gray-600" />
                       </div>
                     </div>
                   </div>

                   {/* Current Month Budget */}
                   <div className="bg-white p-4 rounded-lg border shadow-sm">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-gray-600">Current Month Budget</p>
                         <p className="text-2xl font-bold text-gray-900">
                           {(() => {
                             const currentMonth = new Date().toLocaleString('default', { month: 'long' });
                             const currentMonthEntries = budgetEntries.filter(entry => 
                               entry.month === currentMonth && entry.year === (budgetForm.year || new Date().getFullYear())
                             );
                             const total = currentMonthEntries.reduce((sum, entry) => sum + entry.amount, 0);
                             return total.toLocaleString();
                           })()}
                         </p>
                         <p className="text-sm text-gray-500">
                           {new Date().toLocaleString('default', { month: 'long' })}
                         </p>
                       </div>
                       <div className="p-2 bg-emerald-100 rounded-lg">
                         <ChartBarIcon className="w-6 h-6 text-emerald-600" />
                       </div>
                     </div>
                   </div>

                   {/* Next Month Budget */}
                   <div className="bg-white p-4 rounded-lg border shadow-sm">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-gray-600">Next Month Budget</p>
                         <p className="text-2xl font-bold text-gray-900">
                           {(() => {
                             const currentMonthIndex = new Date().getMonth();
                             const nextMonth = months[currentMonthIndex === 11 ? 0 : currentMonthIndex + 1];
                             const nextMonthEntries = budgetEntries.filter(entry => 
                               entry.month === nextMonth && entry.year === (budgetForm.year || new Date().getFullYear())
                             );
                             const total = nextMonthEntries.reduce((sum, entry) => sum + entry.amount, 0);
                             return total.toLocaleString();
                           })()}
                         </p>
                         <p className="text-sm text-gray-500">
                           {(() => {
                             const currentMonthIndex = new Date().getMonth();
                             return months[currentMonthIndex === 11 ? 0 : currentMonthIndex + 1];
                           })()}
                         </p>
                       </div>
                       <div className="p-2 bg-blue-100 rounded-lg">
                         <ChartBarIcon className="w-6 h-6 text-blue-600" />
                       </div>
                     </div>
                   </div>

                   {/* Total Entries */}
                   <div className="bg-white p-4 rounded-lg border shadow-sm">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-gray-600">Total Entries</p>
                         <p className="text-2xl font-bold text-gray-900">
                           {budgetEntries
                             .filter(entry => 
                               (!budgetForm.month || entry.month === budgetForm.month) && 
                               entry.year === (budgetForm.year || new Date().getFullYear())
                             )
                             .length
                           }
                         </p>
                         <p className="text-sm text-gray-500">This Period</p>
                       </div>
                       <div className="p-2 bg-purple-100 rounded-lg">
                         <ChartBarIcon className="w-6 h-6 text-purple-600" />
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

              {/* Budget Table */}
              {budgetEntries.length > 0 ? (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                                         <thead className="bg-gray-50">
                       <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Type</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                       </tr>
                     </thead>
                                         <tbody className="bg-white divide-y divide-gray-200">
                       {currentEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.month}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.expenseType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.currency}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={entry.note}>
                              {entry.note || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => editBudgetEntry(entry)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteBudgetEntry(entry.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                       ))}
                     </tbody>
                                     </table>
                   
                   {/* Pagination */}
                   {totalPages > 1 && (
                     <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                         <span className="text-sm text-gray-700">
                           Showing {startIndex + 1} to {Math.min(endIndex, filteredEntries.length)} of {filteredEntries.length} entries
                           {budgetForm.month && ` (${budgetForm.month} ${budgetForm.year || new Date().getFullYear()})`}
                         </span>
                       </div>
                       
                       <div className="flex items-center space-x-2">
                         {/* Previous Button */}
                         <button
                           onClick={goToPreviousPage}
                           disabled={currentPage === 1}
                           className={`px-3 py-1 text-sm font-medium rounded-md ${
                             currentPage === 1
                               ? 'text-gray-400 cursor-not-allowed'
                               : 'text-gray-700 hover:bg-gray-100'
                           }`}
                         >
                           Previous
                         </button>
                         
                         {/* Page Numbers */}
                         <div className="flex items-center space-x-1">
                           {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                             <button
                               key={page}
                               onClick={() => goToPage(page)}
                               className={`px-3 py-1 text-sm font-medium rounded-md ${
                                 currentPage === page
                                   ? 'bg-emerald-600 text-white'
                                   : 'text-gray-700 hover:bg-gray-100'
                               }`}
                             >
                               {page}
                             </button>
                           ))}
                         </div>
                         
                         {/* Next Button */}
                         <button
                           onClick={goToNextPage}
                           disabled={currentPage === totalPages}
                           className={`px-3 py-1 text-sm font-medium rounded-md ${
                             currentPage === totalPages
                               ? 'text-gray-400 cursor-not-allowed'
                               : 'text-gray-700 hover:bg-gray-100'
                           }`}
                         >
                           Next
                         </button>
                       </div>
                     </div>
                   )}
                 </div>
               ) : (
                                 <div className="text-center py-12 bg-gray-50 rounded-lg">
                   <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-medium text-gray-900 mb-2">
                     {budgetForm.month ? `No Budget Entries for ${budgetForm.month}` : 'No Budget Entries Yet'}
                   </h3>
                   <p className="text-gray-500 mb-4">
                     {budgetForm.month 
                       ? `No budget entries found for ${budgetForm.month}. Try selecting a different month or add new entries.`
                       : 'Start by adding your monthly budget entries'
                     }
                   </p>
                   <div className="flex justify-center space-x-3">
                     {budgetForm.month && (
                       <button
                         onClick={() => {
                           setBudgetForm(prev => ({ ...prev, month: '' }));
                           setCurrentPage(1);
                         }}
                         className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                       >
                         Show All Months
                       </button>
                     )}
                     <button
                       onClick={() => setIsBudgetModalOpen(true)}
                       className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                     >
                       Add New Entry
                     </button>
                   </div>
                 </div>
              )}
            </div>
          )}

          {activeTab === 'ad-products' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Ad Products Management</h3>
                <button
                  onClick={() => setIsAdProductModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center space-x-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Add Ad Product</span>
                </button>
              </div>

              {/* Entries Table */}
              {adProductEntries.length > 0 ? (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buying Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FB Ad Cost</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Cost</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Cost</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Damaged Cost</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Budget</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {adProductEntries.map((entry, idx) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center space-x-3">
                              {entry.productImage && (
                                <img src={entry.productImage} alt={entry.productName} className="w-10 h-10 object-cover rounded" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                              )}
                              <span>{entry.productName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.buyingPrice?.toFixed(2)} BDT</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.fbAdCost?.toFixed(2)} BDT</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.deliveryCost?.toFixed(2)} BDT</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.returnCost?.toFixed(2)} BDT</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.damagedCost?.toFixed(2)} BDT</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {entry.monthlyBudget?.toFixed(2)} BDT
                            <div className="text-xs text-gray-500">
                              (ID: {entry.id}, Month: {entry.month}, Year: {entry.year || 'N/A'})
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="flex items-center space-x-3">
                              <button className="text-blue-600 hover:text-blue-800" onClick={() => { setViewAdEntry(entry); setIsAdEntryViewOpen(true); }}>View</button>
                              <button className="text-emerald-600 hover:text-emerald-800" onClick={() => { setEditingAdEntry(entry); setAdEntryEditForm({ fbAdCost: String(entry.fbAdCost), deliveryCost: String(entry.deliveryCost), returnParcelQty: String(entry.returnParcelQty), damagedProductQty: String(entry.damagedProductQty), monthlyBudget: String(entry.monthlyBudget), desiredProfitPct: entry.desiredProfitPct != null ? String(entry.desiredProfitPct) : '' }); setIsAdEntryEditOpen(true); }}>Edit</button>
                              <button className="text-red-600 hover:text-red-800" onClick={async () => {
                                const ok = confirm('Delete this entry?');
                                if (!ok) return;
                                
                                // Store month and year before deletion for budget recalculation
                                const deletedMonth = entry.month;
                                const deletedYear = entry.year || new Date().getFullYear();
                                
                                console.log(`🗑️ Deleting product ${entry.id} from ${deletedMonth} ${deletedYear}`);
                                
                                const res = await fetch(`/api/ad-products?id=${entry.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  console.log(`✅ Product deleted successfully, updating monthly budgets...`);
                                  
                                  // Remove from local state
                                  setAdProductEntries(prev => prev.filter(e => e.id !== entry.id));
                                  
                                  // Update monthly budgets for remaining products in the same month/year
                                  await updateMonthlyBudgetsForMonth(deletedMonth, deletedYear);
                                  
                                  console.log(`✅ Monthly budgets updated after deletion`);
                                } else {
                                  alert('Failed to delete');
                                }
                              }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <CubeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Ad Products Yet</h3>
                  <p className="text-gray-500 mb-6">Start by adding your first ad product to track business growth targets.</p>
                  <button
                    onClick={() => setIsAdProductModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg"
                  >
                    Add Your First Product
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'selling-targets' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Selling Targets</h3>
              {adProductEntries.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <p className="text-gray-500">No products found. Add products in the Ad Products tab to set selling targets.</p>
                </div>
              ) : (
                <>
                  {/* Sub-tabs: one for each product */}
                  <div className="border-b">
                    <div className="flex flex-wrap gap-2">
                      {adProductEntries.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setActiveSellingProductId(p.id)}
                          className={`px-3 py-1.5 rounded-t-md text-sm border ${activeSellingProductId === p.id || (!activeSellingProductId && adProductEntries[0]?.id === p.id) ? 'bg-white border-b-white text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {p.productName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const current = adProductEntries.find(p => p.id === (activeSellingProductId ?? adProductEntries[0]?.id));
                    if (!current) return null;
                    const monthName = targetMonthByEntry[current.id] || current.month;
                    const year = targetYearByEntry[current.id] || new Date().getFullYear();
                    const days = getDaysInMonthByName(monthName);
                    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
                    
                    // Use the monthlyBudget field from the current product (updated by API)
                    const perProductBudgetShare = current.monthlyBudget || 0;
                    
                    // For debugging: also calculate the theoretical share
                    const totalMonthBudget = budgetEntries
                      .filter((b) => b.month === monthName && b.year === year)
                      .reduce((sum, b) => sum + (b.amount || 0), 0);
                    const productsInMonth = Math.max(
                      adProductEntries.filter((e) => e.month === monthName && e.year === year).length,
                      1
                    );
                    const theoreticalShare = productsInMonth > 0 ? totalMonthBudget / productsInMonth : 0;
                    
                    console.log(`🎯 Selling Targets for ${current.productName}:`, {
                      monthName,
                      year,
                      currentMonthlyBudget: current.monthlyBudget,
                      perProductBudgetShare,
                      theoreticalShare,
                      totalMonthBudget,
                      productsInMonth
                    });

                    // Calculate costs and profit
                    const perPieceEstimatedCost = parseFloat((current.buyingPrice + current.fbAdCost + current.deliveryCost).toFixed(2));
                    const sellingPrice = current.sellingPrice || 0;
                    const profitPerUnit = sellingPrice - perPieceEstimatedCost;
                    
                    // Variable monthly costs (return + damaged)
                    const variableMonthlyCost = (current.returnCost || 0) + (current.damagedCost || 0);
                    
                    // Base monthly budget for this product
                    const baseMonthlyBudget = perProductBudgetShare + variableMonthlyCost;
                    
                    // Use the stored target values from AdProductEntry instead of recalculating
                    const monthlyTarget = current.requiredMonthlyUnits || 0;
                    const perDayTarget = current.requiredDailyUnits || 0;
                    
                    // For debugging: show target values
                    console.log(`🎯 Targets for ${current.productName}:`, {
                      requiredMonthlyUnits: current.requiredMonthlyUnits,
                      requiredDailyUnits: current.requiredDailyUnits,
                      desiredProfitPct: current.desiredProfitPct,
                      monthlyTarget,
                      perDayTarget
                    });
                    
                    // For debugging: show if targets are missing
                    if (monthlyTarget === 0 || perDayTarget === 0) {
                      console.warn(`⚠️ Missing targets for ${current.productName}:`, {
                        requiredMonthlyUnits: current.requiredMonthlyUnits,
                        requiredDailyUnits: current.requiredDailyUnits,
                        desiredProfitPct: current.desiredProfitPct
                      });
                    }
                    
                    const estimatedMonthlyProductCost = parseFloat((monthlyTarget * perPieceEstimatedCost).toFixed(2));
                    
                    // Stats: progress based on draft sold entries (simple sum)
                    const soldSoFar = Object.entries(sellingTargetsDraft)
                      .filter(([k]) => k.startsWith(`${current.id}:${monthName}:`))
                      .reduce((sum, [, v]) => sum + (v.sold ? parseFloat(v.sold) : 0), 0);
                    const soldPercent = monthlyTarget > 0 ? Math.min(100, Math.round((soldSoFar / monthlyTarget) * 100)) : 0;
                    return (
                      <div className="bg-white border rounded-b-lg p-4">
                        <div className="flex items-start gap-6">
                          {/* Left dashboard column */}
                          <div className="w-full lg:w-64 space-y-3">
                            <div className="p-3 rounded-lg border bg-emerald-50">
                              <p className="text-xs text-emerald-800">Daily Target</p>
                              <p className="text-2xl font-semibold text-emerald-700">{perDayTarget || '-'} pcs</p>
                              <p className="text-[11px] text-emerald-700 mt-1">From Ad Product settings</p>
                            </div>
                            <div className="p-3 rounded-lg border bg-indigo-50">
                              <p className="text-xs text-indigo-800">Monthly Budget (per product)</p>
                              <p className="text-lg font-semibold text-indigo-700">{perProductBudgetShare.toFixed(2)} BDT</p>
                              <p className="text-[11px] text-indigo-700 mt-1">Products this month (including current): {productsInMonth}</p>
                            </div>
                            <div className="p-3 rounded-lg border bg-amber-50">
                              <p className="text-xs text-amber-800">Monthly Target</p>
                              <p className="text-lg font-semibold text-amber-700">{monthlyTarget || '-'} pcs</p>
                              <p className="text-[11px] text-amber-700 mt-1">Per-piece est. cost: {perPieceEstimatedCost.toFixed(2)} BDT</p>
                              <p className="text-[11px] text-amber-700">Estimated monthly cost: {estimatedMonthlyProductCost.toFixed(2)} BDT</p>
                              <p className="text-[11px] text-amber-700">FB Ad Cost per piece: {current.fbAdCost.toFixed(2)} BDT</p>
                            </div>
                            <div className="p-3 rounded-lg border bg-blue-50">
                              <p className="text-xs text-blue-800">Progress</p>
                              <p className="text-sm text-blue-700 mb-1">Sold so far: <span className="font-semibold">{soldSoFar}</span> / {monthlyTarget}</p>
                              <div className="w-full h-2 bg-blue-100 rounded">
                                <div className="h-2 bg-blue-600 rounded" style={{ width: `${soldPercent}%` }} />
                              </div>
                              <p className="text-[11px] text-blue-700 mt-1">{soldPercent}% of monthly target</p>
                            </div>
                          </div>

                          {/* Right calendar column */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {current.productImage && (
                                <img src={current.productImage} alt={current.productName} className="w-10 h-10 rounded object-cover" />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">{current.productName}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                  value={monthName}
                                  onChange={(e) => setTargetMonthByEntry((prev) => ({ ...prev, [current.id]: e.target.value }))}
                                >
                                  {months.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                  value={year}
                                  onChange={(e) => setTargetYearByEntry((prev) => ({ ...prev, [current.id]: parseInt(e.target.value || `${new Date().getFullYear()}`) }))}
                                />
                              </div>
                            </div>

                            {/* Genuine calendar: weekday header and aligned days */}
                            {(() => {
                              const weekdayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                              const monthIdx = months.indexOf(monthName);
                              const firstDow = new Date(year, monthIdx, 1).getDay(); // 0=Sun
                              const totalCells = firstDow + days;
                              const cells = Array.from({ length: totalCells }, (_, i) => (i < firstDow ? null : i - firstDow + 1));

                              return (
                                <>
                                  {/* Weekday header */}
                                  <div className="grid grid-cols-7 gap-3 mb-2">
                                    {weekdayNames.map((w, idx) => (
                                      <div key={w} className={`text-center text-xs font-medium px-2 py-1 rounded ${idx === 5 ? 'bg-amber-100 text-amber-800' : idx === 6 ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'}`}>{w}</div>
                                    ))}
                                  </div>

                                  {/* Calendar grid */}
                                  <div className="grid grid-cols-7 gap-3">
                                    {cells.map((d, idx) => {
                                      if (!d) {
                                        return <div key={`empty-${idx}`} className="rounded-md p-2" />;
                                      }
                                      const key = `${current.id}:${monthName}:${d}`;
                                      const val = sellingTargetsDraft[key] || {};
                                      const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                      const persisted = sellingTargetEntries.find(t => t.adProductEntryId === current.id && t.date === dateStr);
                                      const plannedPersisted = (persisted?.targetUnits ?? (perDayTarget || 0));
                                      const soldPersisted = (persisted?.soldUnits ?? 0);
                                      const planned = val.planned ? parseFloat(val.planned) : plannedPersisted;
                                      const sold = val.sold ? parseFloat(val.sold) : soldPersisted;
                                      const diff = sold - planned;
                                      const profitPerUnit = (current.sellingPrice ?? 0) - perPieceEstimatedCost;
                                      const dailyProfit = sold * profitPerUnit;
                                      const targetProfitForDay = planned * profitPerUnit;
                                      const profitPercent = targetProfitForDay !== 0 ? Math.round((dailyProfit / targetProfitForDay) * 100) : 0;
                                      const barWidth = Math.max(0, Math.min(100, Math.abs(profitPercent)));
                                      const dateDow = new Date(year, monthIdx, d).getDay();
                                      const dowClass = dateDow === 5 ? 'bg-amber-200 text-amber-900' : dateDow === 6 ? 'bg-rose-200 text-rose-900' : 'bg-gray-100 text-gray-700';
                                      const isGain = profitPerUnit >= 0 ? diff >= 0 : diff <= 0;
                                      return (
                                        <div key={d} className={`rounded-md border hover:shadow-sm transition-shadow ${isGain ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                          <div className={`flex items-center justify-between text-[11px] px-2 py-1 rounded-t ${dowClass}`}>
                                            <span className="font-medium">{weekdayNames[dateDow]} {d}</span>
                                            <button
                                              type="button"
                                              onClick={() => { setSoldModalKey(key); setSoldModalInput((sellingTargetsDraft[key]?.sold) || String(soldPersisted || '')); setIsSoldModalOpen(true); }}
                                              className="underline"
                                            >
                                              Sold
                                            </button>
                                          </div>
                                          <div className="p-2 text-[11px] text-gray-700 overflow-auto max-h-28">
                                            <div>Target: <span className="font-semibold">{planned}</span></div>
                                            <div>Sold: <span className="font-semibold">{sold}</span></div>
                                            <div>Diff: <span className={`font-semibold ${isGain ? 'text-green-700' : 'text-red-700'}`}>{diff}</span></div>
                                            <div className="mt-1">Profit: <span className={`font-semibold ${dailyProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{dailyProfit.toFixed(2)} BDT</span></div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <div className="flex-1 h-1.5 bg-gray-200 rounded">
                                                <div className={`h-1.5 rounded ${dailyProfit >= 0 ? 'bg-green-600' : 'bg-red-600'}`} style={{ width: `${barWidth}%` }} />
                                              </div>
                                              <span className={`min-w-[36px] text-right ${dailyProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{profitPercent}%</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sold Entry Modal (Selling Targets) */}
      {isSoldModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm mx-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-gray-900">Add Sold Quantity</h3>
              <button onClick={() => setIsSoldModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="number"
                value={soldModalInput}
                onChange={(e) => setSoldModalInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., 5"
                min="0"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsSoldModalOpen(false)} className="px-3 py-1.5 border rounded-md">Cancel</button>
                <button
                  onClick={async () => {
                    if (!soldModalKey) return;
                    const [idStr, monthName, dayStr] = soldModalKey.split(':');
                    const adProductEntryId = parseInt(idStr, 10);
                    const day = parseInt(dayStr, 10);
                    const year = targetYearByEntry[adProductEntryId] || new Date().getFullYear();
                    const monthIndex = months.indexOf(monthName);
                    const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const entry = adProductEntries.find(e => e.id === adProductEntryId);
                    const plannedUnits = (() => {
                      const draftPlanned = sellingTargetsDraft[soldModalKey]?.planned;
                      if (draftPlanned != null && draftPlanned !== '') return parseFloat(String(draftPlanned)) || 0;
                      return entry?.requiredDailyUnits || 0;
                    })();
                    const soldUnits = parseFloat(soldModalInput || '0') || 0;
                    const ok = await updateSellingTarget(adProductEntryId, date, plannedUnits, soldUnits);
                    if (ok) {
                      setSellingTargetsDraft(prev => ({ ...prev, [soldModalKey]: { ...(prev[soldModalKey] || {}), sold: soldModalInput } }));
                      // After saving today's sold, redistribute remaining targets across the rest of the month
                      await redistributeRemainingTargets(adProductEntryId, monthName, year, day);
                    }
                    setIsSoldModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Budget Entry</h3>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={budgetForm.month}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, month: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Month</option>
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              {/* Year Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={budgetForm.year || new Date().getFullYear()}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const years = Array.from({ length: 15 }, (_, i) => currentYear - 10 + i);
                    return years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ));
                  })()}
                </select>
              </div>

              {/* Expense Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
                <select
                  value={budgetForm.expenseType}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, expenseType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Expense Type</option>
                  {expenseTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

                             {/* Amount */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Budget Amount</label>
                 <input
                   type="number"
                   value={budgetForm.amount}
                   onChange={(e) => setBudgetForm(prev => ({ ...prev, amount: e.target.value }))}
                   placeholder="0.00"
                   step="0.01"
                   min="0"
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   required
                 />
               </div>

                              {/* Currency */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                 <select
                   value={budgetForm.currency}
                   onChange={(e) => setBudgetForm(prev => ({ ...prev, currency: e.target.value }))}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   required
                 >
                   {currencies.map((currency) => (
                     <option key={currency} value={currency}>{currency}</option>
                   ))}
                 </select>
               </div>

               {/* Note */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                 <textarea
                   value={budgetForm.note}
                   onChange={(e) => setBudgetForm(prev => ({ ...prev, note: e.target.value }))}
                   placeholder="e.g., Facebook Ads, Google Ads, Instagram Marketing, etc."
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                 />
               </div>

               {/* Form Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
                 </div>
       )}

       {/* Edit Budget Modal */}
       {isEditModalOpen && editingEntry && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Edit Budget Entry</h3>
               <button
                                    onClick={() => {
                     setIsEditModalOpen(false);
                     setEditingEntry(null);
                     setBudgetForm({ month: '', year: new Date().getFullYear(), expenseType: '', amount: '', currency: 'BDT', note: '' });
                   }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>

             <form onSubmit={handleEditSubmit} className="space-y-4">
               {/* Month Selection */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                 <select
                   value={budgetForm.month}
                   onChange={(e) => setBudgetForm(prev => ({ ...prev, month: e.target.value }))}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   required
                 >
                   <option value="">Select Month</option>
                   {months.map((month) => (
                     <option key={month} value={month}>{month}</option>
                   ))}
                 </select>
               </div>

               {/* Year Selection */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                 <select
                   value={budgetForm.year || new Date().getFullYear()}
                   onChange={(e) => setBudgetForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   required
                 >
                   {(() => {
                     const currentYear = new Date().getFullYear();
                     const years = Array.from({ length: 15 }, (_, i) => currentYear - 10 + i);
                     return years.map((y) => (
                       <option key={y} value={y}>{y}</option>
                     ));
                   })()}
                 </select>
               </div>

               {/* Expense Type */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
                 <select
                   value={budgetForm.expenseType}
                   onChange={(e) => setBudgetForm(prev => ({ ...prev, expenseType: e.target.value }))}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   required
                 >
                   <option value="">Select Expense Type</option>
                   {expenseTypes.map((type) => (
                     <option key={type} value={type}>{type}</option>
                   ))}
                 </select>
               </div>

               {/* Amount */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Budget Amount</label>
                 <input
                   type="number"
                   value={budgetForm.amount}
                   onChange={(e) => setBudgetForm(prev => ({ ...prev, amount: e.target.value }))}
                   placeholder="0.00"
                   step="0.01"
                   min="0"
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   required
                 />
               </div>

               {/* Currency */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                 <select
                   value={budgetForm.currency}
                   onChange={(e) => setBudgetForm(prev => ({ ...prev, currency: e.target.value }))}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                   required
                 >
                   {currencies.map((currency) => (
                     <option key={currency} value={currency}>{currency}</option>
                   ))}
                 </select>
               </div>

               {/* Note */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                 <textarea
                   value={budgetForm.note}
                   onChange={(e) => setBudgetForm(prev => ({ ...prev, note: e.target.value }))}
                   placeholder="e.g., Facebook Ads, Google Ads, Instagram Marketing, etc."
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                 />
               </div>

               {/* Form Actions */}
               <div className="flex space-x-3 pt-4">
                 <button
                   type="button"
                   onClick={() => {
                     setIsEditModalOpen(false);
                     setEditingEntry(null);
                     setBudgetForm({ month: '', year: new Date().getFullYear(), expenseType: '', amount: '', currency: 'BDT', note: '' });
                   }}
                   className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                 >
                   Update Entry
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

       {/* Ad Products Modal */}
       {isAdProductModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-4 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-semibold text-gray-900">Add Ad Product</h3>
               <button
                 onClick={() => {
                   setIsAdProductModalOpen(false);
                   setAdProductForm({
                     categoryId: '',
                     productId: '',
                     productName: '',
                     productImage: '',
                     buyingPrice: '',
                     sellingPrice: '',
                     fbAdCost: '',
                     deliveryCost: '',
                     returnParcelQty: '',
                     damagedProductQty: '',
                     targetMonth: '',
                     targetYear: '',
                     desiredProfitPercent: ''
                   });
                   setSelectedProduct(null);
                   setSelectedMonthBudget(0);
                 }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>

             <form onSubmit={handleAdProductSubmit} className="space-y-4">
                                 {/* Target Month Selection */}
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Target Month *</label>
                   <div className="grid grid-cols-3 gap-2">
                     <div className="col-span-2">
                       <select
                         value={adProductForm.targetMonth}
                         onChange={(e) => handleMonthChange(e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                         required
                       >
                         <option value="">Select Month</option>
                         {months.map((m) => (
                           <option key={m} value={m}>{m}</option>
                         ))}
                       </select>
                     </div>
                     <div>
                       <input
                         type="number"
                         value={adProductForm.targetYear}
                         onChange={(e) => setAdProductForm(prev => ({ ...prev, targetYear: e.target.value }))}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                         min="2000"
                         max="2100"
                         required
                       />
                     </div>
                   </div>
                 </div>

                 {/* Category + Product (two columns) */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {/* Category Selection */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                     <select
                       value={adProductForm.categoryId}
                       onChange={(e) => handleCategoryChange(e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                       required
                     >
                       <option value="">Select Category</option>
                       {categories.map((category: {id: number, name: string}) => (
                         <option key={category.id} value={category.id}>{category.name}</option>
                       ))}
                     </select>
                   </div>

                   {/* Product Selection */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                     <select
                       value={adProductForm.productId}
                       onChange={(e) => handleProductChange(e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                       required
                       disabled={!adProductForm.categoryId}
                     >
                       <option value="">Select Product</option>
                       {products.map((product: {id: number, name: string}) => (
                         <option key={product.id} value={product.id}>{product.name}</option>
                       ))}
                     </select>
                   </div>
                 </div>

                {/* Selected Product Display */}
                {selectedProduct && (
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      {selectedProduct.image && (
                        <img 
                          src={selectedProduct.image} 
                          alt={selectedProduct.name}
                          className="w-14 h-14 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      {selectedProduct.images && selectedProduct.images.length > 0 && !selectedProduct.image && (
                        <img 
                          src={selectedProduct.images[0]} 
                          alt={selectedProduct.name}
                          className="w-14 h-14 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{selectedProduct.name}</h4>
                        <p className="text-xs text-gray-500">{selectedProduct.description || 'No description available'}</p>
                        <p className="text-xs text-gray-400 mt-1">Category: {selectedProduct.categoryName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Two Partition Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Partition: Per Piece Costs */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Per Piece Costs</h4>
                    
                    {/* Buying Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buying Price *</label>
                      <input
                        type="number"
                        value={adProductForm.buyingPrice}
                        onChange={(e) => setAdProductForm(prev => ({ ...prev, buyingPrice: e.target.value }))}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                        readOnly={!!selectedProduct}
                        disabled={!!selectedProduct}
                        title={selectedProduct ? 'Edit from product page' : undefined}
                      />
                    </div>

                    {/* Selling Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                      <input
                        type="number"
                        value={adProductForm.sellingPrice}
                        onChange={(e) => setAdProductForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                        readOnly={!!selectedProduct}
                        disabled={!!selectedProduct}
                        title={selectedProduct ? 'Edit from product page' : undefined}
                      />
                    </div>

                    

                    {/* FB Ad Cost */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">FB Ad Cost *</label>
                      <input
                        type="number"
                        value={adProductForm.fbAdCost}
                        onChange={(e) => setAdProductForm(prev => ({ ...prev, fbAdCost: e.target.value }))}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Delivery Cost */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Cost *</label>
                      <input
                        type="number"
                        value={adProductForm.deliveryCost}
                        onChange={(e) => setAdProductForm(prev => ({ ...prev, deliveryCost: e.target.value }))}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Estimated Product Cost (per piece) */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-emerald-900">Estimated Product Cost (per piece)</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {getEstimatedCost().toFixed(2)} BDT
                      </p>
                      <p className="text-xs text-emerald-800 mt-1">Buying Price + FB Ad Cost + Delivery Cost</p>
                    </div>
                  </div>

                                     {/* Right Partition: Monthly Quantities */}
                   <div className="space-y-4">
                     <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Monthly Quantities</h4>
                     
                     {/* Monthly Budget Display */}
                     {adProductForm.targetMonth && (
                       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                         <p className="text-sm font-medium text-yellow-900">
                           {adProductForm.targetMonth} Budget
                         </p>
                         <p className="text-xl font-bold text-yellow-700">
                           {selectedMonthBudget.toFixed(2)} BDT
                         </p>
                         <p className="text-xs text-yellow-800 mt-1">
                           Total budget allocated for {adProductForm.targetMonth}
                         </p>
                       </div>
                     )}
                    
                    {/* Return Parcel */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Parcel Quantity</label>
                        <input
                          type="number"
                          value={adProductForm.returnParcelQty || ''}
                          onChange={(e) => setAdProductForm(prev => ({ ...prev, returnParcelQty: e.target.value }))}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Cost (Auto)</label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700">
                          {(parseFloat(adProductForm.returnParcelQty || '0') * parseFloat(adProductForm.deliveryCost || '0')).toFixed(2)} BDT
                        </div>
                      </div>
                    </div>

                    {/* Damaged Product */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Damaged Product Quantity</label>
                        <input
                          type="number"
                          value={adProductForm.damagedProductQty || ''}
                          onChange={(e) => setAdProductForm(prev => ({ ...prev, damagedProductQty: e.target.value }))}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Damaged Cost (Auto)</label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700">
                          {(parseFloat(adProductForm.damagedProductQty || '0') * (parseFloat(adProductForm.buyingPrice || '0') + parseFloat(adProductForm.deliveryCost || '0'))).toFixed(2)} BDT
                        </div>
                      </div>
                    </div>

                                         {/* Total Monthly Budget */}
                     <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                       <p className="text-sm font-medium text-purple-900">Total Monthly Budget</p>
                       <p className="text-xl font-bold text-purple-700">
                         {(getEstimatedMonthlyCost() + getPerProductMonthlyBudget()).toFixed(2)} BDT
                       </p>
                       <p className="text-xs text-purple-800 mt-1">
                         Return Parcel Cost + Damaged Product Cost + Per-product share of {adProductForm.targetMonth} Budget
                       </p>
                     </div>
                  </div>
                </div>



              {/* Monthly Profit Target (Overall) */}
              <div className="rounded-lg border p-4 mt-2">
                <h4 className="text-md font-medium text-gray-900 mb-2">Monthly Profit Target</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desired Profit (%)</label>
                    <input
                      type="number"
                      value={adProductForm.desiredProfitPercent}
                      onChange={(e) => setAdProductForm(prev => ({ ...prev, desiredProfitPercent: e.target.value }))}
                      placeholder="e.g., 30"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  {(() => {
                    const baseBudget = getPerProductMonthlyBudget();
                    const variableMonthly = getEstimatedMonthlyCost();
                    const totalMonthlyBudget = baseBudget + variableMonthly;
                    const perPiece = getEstimatedCost();
                    const sellingPrice = parseFloat(adProductForm.sellingPrice || '0');
                    const desiredPct = parseFloat(adProductForm.desiredProfitPercent || '0');
                    const profitPerPiece = Math.max(sellingPrice - perPiece, 0);
                    const targetProfitAmount = desiredPct > 0 ? (totalMonthlyBudget * desiredPct) / 100 : 0;
                    const numerator = totalMonthlyBudget + targetProfitAmount;
                    const requiredMonthlyUnits = profitPerPiece > 0 ? Math.ceil(numerator / profitPerPiece) : 0;
                    const requiredDailyUnits = requiredMonthlyUnits > 0 ? Math.ceil(requiredMonthlyUnits / getDaysInTargetMonth()) : 0;
                    return (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Required Monthly Units</label>
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700">{requiredMonthlyUnits}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Required Daily Units</label>
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700">{requiredDailyUnits}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <p className="text-xs text-gray-500 mt-2">Formula: Total Budget = Selected Month Budget + Estimated Monthly Cost; Target Profit = Total Budget × Profit%; Required Units = ceil((Total Budget + Target Profit) ÷ (Selling − Estimated Cost)). Daily units use days in month.</p>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdProductModalOpen(false);
                    setAdProductForm({
                      categoryId: '',
                      productId: '',
                      productName: '',
                      productImage: '',
                      buyingPrice: '',
                      sellingPrice: '',
                      fbAdCost: '',
                      deliveryCost: '',
                      returnParcelQty: '',
                      damagedProductQty: '',
                      targetMonth: '',
                      targetYear: '',
                      desiredProfitPercent: ''
                    });
                    setSelectedProduct(null);
                    setSelectedMonthBudget(0);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
           </div>
         </div>
       )}

       {/* View Ad Product Entry Modal */}
       {isAdEntryViewOpen && viewAdEntry && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Ad Product Entry</h3>
               <button onClick={() => { setIsAdEntryViewOpen(false); setViewAdEntry(null); }} className="text-gray-400 hover:text-gray-600">
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>
             <div className="space-y-3 text-sm">
               <div className="flex items-center space-x-3">
                 {viewAdEntry.productImage && (
                   <img src={viewAdEntry.productImage} alt={viewAdEntry.productName} className="w-12 h-12 rounded object-cover" />
                 )}
                 <div>
                   <p className="font-medium text-gray-900">{viewAdEntry.productName}</p>
                   <p className="text-gray-500">Month: {viewAdEntry.month}</p>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>Buying: <span className="font-medium">{viewAdEntry.buyingPrice.toFixed(2)} BDT</span></div>
                 <div>Selling: <span className="font-medium">{(viewAdEntry.sellingPrice ?? 0).toFixed(2)} BDT</span></div>
                 <div>FB Ad: <span className="font-medium">{viewAdEntry.fbAdCost.toFixed(2)} BDT</span></div>
                 <div>Delivery: <span className="font-medium">{viewAdEntry.deliveryCost.toFixed(2)} BDT</span></div>
                 <div>Return Cost: <span className="font-medium">{viewAdEntry.returnCost.toFixed(2)} BDT</span></div>
                 <div>Damaged Cost: <span className="font-medium">{viewAdEntry.damagedCost.toFixed(2)} BDT</span></div>
                 <div>Monthly Budget: <span className="font-medium">{viewAdEntry.monthlyBudget.toFixed(2)} BDT</span></div>
                 {viewAdEntry.desiredProfitPct != null && (
                   <div>Desired Profit: <span className="font-medium">{viewAdEntry.desiredProfitPct}%</span></div>
                 )}
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Edit Ad Product Entry Modal */}
       {isAdEntryEditOpen && editingAdEntry && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Edit Ad Product Entry</h3>
               <button onClick={() => { setIsAdEntryEditOpen(false); setEditingAdEntry(null); }} className="text-gray-400 hover:text-gray-600">
                 <XMarkIcon className="w-6 h-6" />
               </button>
             </div>
             <form className="space-y-3" onSubmit={async (e) => {
               e.preventDefault();
               if (!editingAdEntry) return;
               const payload = {
                 id: editingAdEntry.id,
                 fbAdCost: Number(adEntryEditForm.fbAdCost) || 0,
                 deliveryCost: Number(adEntryEditForm.deliveryCost) || 0,
                 returnParcelQty: Number(adEntryEditForm.returnParcelQty) || 0,
                 damagedProductQty: Number(adEntryEditForm.damagedProductQty) || 0,
                 monthlyBudget: Number(adEntryEditForm.monthlyBudget) || 0,
                 desiredProfitPct: adEntryEditForm.desiredProfitPct === '' ? null : Number(adEntryEditForm.desiredProfitPct)
               };
               const res = await fetch('/api/ad-products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
               if (res.ok) {
                 const updated = await res.json();
                 console.log(`✅ Ad Product updated successfully, updating monthly budgets...`);
                 
                 setAdProductEntries(prev => prev.map(p => p.id === updated.id ? updated : p));
                 
                 // Update monthly budgets for all products in the same month/year after editing
                 const editedMonth = editingAdEntry.month;
                 const editedYear = editingAdEntry.year || new Date().getFullYear();
                 await updateMonthlyBudgetsForMonth(editedMonth, editedYear);
                 
                 console.log(`✅ Monthly budgets updated after editing`);
                 
                 setIsAdEntryEditOpen(false);
                 setEditingAdEntry(null);
               } else {
                 alert('Failed to update');
               }
             }}>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-xs text-gray-600 mb-1">FB Ad Cost</label>
                   <input type="number" className="w-full px-3 py-2 border rounded" value={adEntryEditForm.fbAdCost} onChange={(e) => setAdEntryEditForm(prev => ({ ...prev, fbAdCost: e.target.value }))} />
                 </div>
                 <div>
                   <label className="block text-xs text-gray-600 mb-1">Delivery Cost</label>
                   <input type="number" className="w-full px-3 py-2 border rounded" value={adEntryEditForm.deliveryCost} onChange={(e) => setAdEntryEditForm(prev => ({ ...prev, deliveryCost: e.target.value }))} />
                 </div>
                 <div>
                   <label className="block text-xs text-gray-600 mb-1">Return Parcel Qty</label>
                   <input type="number" className="w-full px-3 py-2 border rounded" value={adEntryEditForm.returnParcelQty} onChange={(e) => setAdEntryEditForm(prev => ({ ...prev, returnParcelQty: e.target.value }))} />
                 </div>
                 <div>
                   <label className="block text-xs text-gray-600 mb-1">Damaged Product Qty</label>
                   <input type="number" className="w-full px-3 py-2 border rounded" value={adEntryEditForm.damagedProductQty} onChange={(e) => setAdEntryEditForm(prev => ({ ...prev, damagedProductQty: e.target.value }))} />
                 </div>
                 <div>
                   <label className="block text-xs text-gray-600 mb-1">Monthly Budget</label>
                   <input type="number" className="w-full px-3 py-2 border rounded" value={adEntryEditForm.monthlyBudget} onChange={(e) => setAdEntryEditForm(prev => ({ ...prev, monthlyBudget: e.target.value }))} />
                 </div>
                 <div>
                   <label className="block text-xs text-gray-600 mb-1">Desired Profit (%)</label>
                   <input type="number" className="w-full px-3 py-2 border rounded" value={adEntryEditForm.desiredProfitPct} onChange={(e) => setAdEntryEditForm(prev => ({ ...prev, desiredProfitPct: e.target.value }))} />
                 </div>
               </div>
               <div className="flex justify-end space-x-2 pt-3">
                 <button type="button" onClick={() => { setIsAdEntryEditOpen(false); setEditingAdEntry(null); }} className="px-4 py-2 border rounded">Cancel</button>
                 <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Save</button>
               </div>
             </form>
           </div>
         </div>
       )}
     </div>
   );
 }
