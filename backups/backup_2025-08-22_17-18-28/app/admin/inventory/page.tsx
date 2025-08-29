"use client";
import { useState, useEffect } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface InventoryItem {
  id: string;
  productName: string;
  category: string;
  categoryId?: number;
  buyPrice?: number;
  currency?: string;
  currentStock: number;
  lowStockThreshold: number;
  lastUpdated: string;
  images?: string[];
  slug?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "low-stock", "updates"
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;



  // Load active tab from localStorage on component mount
  useEffect(() => {
    const savedActiveTab = localStorage.getItem('nexus-shop-inventory-active-tab');
    if (savedActiveTab && ['overview', 'low-stock', 'updates'].includes(savedActiveTab)) {
      setActiveTab(savedActiveTab);
    }
  }, []);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nexus-shop-inventory-active-tab', activeTab);
  }, [activeTab]);

  // Load inventory data from localStorage on component mount
  useEffect(() => {
    console.log('Inventory page mounted, loading data...');
    
    // Try to load from API first, fallback to localStorage
    loadInventoryFromAPI();
    // Load categories for filter dropdown
    loadCategories();
  }, []);

  // Load categories for dropdown
  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  // Load inventory data from API
  const loadInventoryFromAPI = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/inventory', { cache: 'no-store' });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Inventory loaded from API:', data);
        
        const inventoryData: InventoryItem[] = data.map((item: any) => ({
          id: item.id?.toString() || item.productId?.toString(),
          productName: item.productName,
          category: item.categoryName || item.product?.category?.name || "Unknown",
          categoryId: item.categoryId || item.product?.category?.id,
          buyPrice: item.buyPrice,
          currency: item.currency,
          currentStock: item.stock,
          lowStockThreshold: item.lowStockThreshold,
          lastUpdated: new Date().toISOString(),
          images: item.productImage ? [item.productImage] : [],
          slug: item.productSlug || item.product?.slug || "",
        }));
        
        setInventory(inventoryData);
      } else {
        console.error('Failed to load inventory from API');
        // Fallback to localStorage
        loadInventoryFromProducts();
      }
    } catch (error) {
      console.error('Error loading inventory from API:', error);
      // Fallback to localStorage
      loadInventoryFromProducts();
    } finally {
      setIsLoading(false);
    }
  };

  // Load inventory data from products (fallback)
  const loadInventoryFromProducts = () => {
    const savedProducts = localStorage.getItem('nexus-shop-products');
    if (savedProducts) {
      try {
        const products = JSON.parse(savedProducts);
        console.log('Products found:', products.length);
        
        const inventoryData: InventoryItem[] = products.map((product: any) => ({
          id: product.id?.toString(),
          productName: product.name,
          category: product.categoryName || "Unknown",
          categoryId: product.categoryId,
          currentStock: product.inventory?.stock || 0,
          lowStockThreshold: product.inventory?.lowStockThreshold || 5,
          lastUpdated: new Date().toISOString(),
          // Always load fresh images from products for display
          images: product.images || [],
          slug: product.slug || "",
        }));
        
        console.log('Inventory data created:', inventoryData.length);
        console.log('Sample product images:', inventoryData[0]?.images);
        setInventory(inventoryData);
        
        // Save lightweight inventory data (without images) to save space
        const lightweightData = inventoryData.map(item => ({
          id: item.id,
          productName: item.productName,
          category: item.category,
          currentStock: item.currentStock,
          lowStockThreshold: item.lowStockThreshold,
          lastUpdated: item.lastUpdated,
          slug: item.slug,
          // Remove images to save space
          images: undefined
        }));
        
        try {
          // Check data size before saving
          const dataSize = JSON.stringify(lightweightData).length;
          if (dataSize > 1000000) { // 1MB limit
            console.warn('Lightweight inventory data too large, skipping localStorage save');
            return;
          }
          
          localStorage.setItem('nexus-shop-inventory', JSON.stringify(lightweightData));
          console.log('Lightweight inventory data saved successfully');
        } catch (storageError) {
          console.warn('Could not save inventory to localStorage:', storageError);
        }
      } catch (error) {
        console.error('Error loading inventory from products:', error);
        setInventory([]);
      }
    } else {
      console.log('No products found in localStorage');
      setInventory([]);
    }
  };

  // Save inventory changes to localStorage and sync with products
  useEffect(() => {
    if (inventory.length > 0) {
      try {
        // Create lightweight inventory data (without images) to save space
        const lightweightInventory = inventory.map(item => ({
          id: item.id,
          productName: item.productName,
          category: item.category,
          currentStock: item.currentStock,
          lowStockThreshold: item.lowStockThreshold,
          lastUpdated: item.lastUpdated,
          slug: item.slug,
          // Remove images to save space
          images: undefined
        }));
        
        // Check data size before saving
        const dataSize = JSON.stringify(lightweightInventory).length;
        if (dataSize > 1000000) { // 1MB limit
          console.warn('Inventory data too large, skipping localStorage save');
          return;
        }
        
        localStorage.setItem('nexus-shop-inventory', JSON.stringify(lightweightInventory));
        
        // Sync inventory changes with products
        const savedProducts = localStorage.getItem('nexus-shop-products');
        if (savedProducts) {
          try {
            const products = JSON.parse(savedProducts);
            const updatedProducts = products.map((product: any) => {
              const inventoryItem = inventory.find(item => item.id === product.id);
              if (inventoryItem) {
                return {
                  ...product,
                  inventory: {
                    stock: inventoryItem.currentStock,
                    lowStockThreshold: inventoryItem.lowStockThreshold
                  }
                };
              }
              return product;
            });
            
            // Check products data size before saving
            const productsDataSize = JSON.stringify(updatedProducts).length;
            if (productsDataSize > 5000000) { // 5MB limit
              console.warn('Products data too large, skipping localStorage save');
              return;
            }
            
            localStorage.setItem('nexus-shop-products', JSON.stringify(updatedProducts));
          } catch (error) {
            console.error('Error syncing inventory with products:', error);
          }
        }
      } catch (error) {
        console.error('Error saving inventory to localStorage:', error);
      }
    }
  }, [inventory]);

  // Filters
  useEffect(() => {
    let filtered = [...inventory];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(q) ||
        (item.slug || "").toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => String(item.categoryId) === categoryFilter);
    }

    // Stock filter
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(item => item.currentStock > 0);
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter(item => item.currentStock === 0);
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter(item => item.currentStock > 0 && item.currentStock <= (item.lowStockThreshold || 5));
    }

    setFilteredInventory(filtered);
    setCurrentPage(1);
  }, [inventory, searchQuery, categoryFilter, stockFilter]);

  const updateStock = async (id: string, change: number) => {
    // Optimistic UI update
    let newStock = 0;
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const updatedStock = Math.max(0, item.currentStock + change);
        newStock = updatedStock;
        return {
          ...item,
          currentStock: updatedStock,
          lastUpdated: new Date().toISOString()
        };
      }
      return item;
    }));

    // Persist to server
    try {
      setIsUpdatingStock(true);
      await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, stock: newStock })
      });
      // Re-fetch to ensure persistence and bypass any cache
      await loadInventoryFromAPI();
    } catch (e) {
      console.error('Failed to update stock on server', e);
      // Best-effort refresh from API to recover actual state
      try { await loadInventoryFromAPI(); } catch {}
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const updateLowStockThreshold = (id: string, threshold: number) => {
    // Optimistic UI update
    let currentStockForItem = 0;
    const newThreshold = Math.max(1, threshold);
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        currentStockForItem = item.currentStock;
        return {
          ...item,
          lowStockThreshold: newThreshold,
          lastUpdated: new Date().toISOString()
        };
      }
      return item;
    }));

    // Persist to server (API requires stock as well)
    (async () => {
      try {
        await fetch('/api/inventory', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: id, stock: currentStockForItem, lowStockThreshold: newThreshold })
        });
        await loadInventoryFromAPI();
      } catch (e) {
        console.error('Failed to update threshold on server', e);
      }
    })();
  };

  // Function to sync inventory changes with products
  const syncInventoryWithProducts = () => {
    const savedProducts = localStorage.getItem('nexus-shop-products');
    if (savedProducts) {
      try {
        const products = JSON.parse(savedProducts);
        const updatedProducts = products.map((product: any) => {
          const inventoryItem = inventory.find(item => item.id === product.id);
          if (inventoryItem) {
            return {
              ...product,
              inventory: {
                stock: inventoryItem.currentStock,
                lowStockThreshold: inventoryItem.lowStockThreshold
              }
            };
          }
          return product;
        });
        
        // Check data size before saving
        const dataSize = JSON.stringify(updatedProducts).length;
        if (dataSize > 5000000) { // 5MB limit
          console.warn('Products data too large during sync, skipping localStorage save');
          return;
        }
        
        localStorage.setItem('nexus-shop-products', JSON.stringify(updatedProducts));
      } catch (error) {
        console.error('Error syncing inventory with products:', error);
      }
    }
  };

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return "text-red-600 font-semibold";
    if (stock <= threshold) return "text-orange-600 font-semibold";
    return "text-green-600";
  };

  const getStatusBadge = (stock: number, threshold: number) => {
    if (stock === 0) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Out of Stock</span>;
    } else if (stock <= threshold) {
      return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">Low Stock</span>;
    } else {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">In Stock</span>;
    }
  };

  // Pagination helpers
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredInventory.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Inventory Management</h1>
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">Add some products first to manage inventory.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventory Management</h1>
          <p className="text-gray-600">Monitor and update stock levels</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="low-stock">Low Stock</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {filteredInventory.length} items found
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buy Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Low Stock Threshold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {item.images && item.images[0] ? (
                      <img
                        className="h-12 w-12 rounded-lg object-cover mr-3"
                        src={item.images[0]}
                        alt={item.productName}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-500">ID: {item.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.category || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {item.buyPrice !== undefined ? `${item.buyPrice} ${item.currency || ''}` : '—'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${getStockStatus(item.currentStock, item.lowStockThreshold)}`}>
                  {item.currentStock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="1"
                    value={item.lowStockThreshold}
                    onChange={(e) => updateLowStockThreshold(item.id, parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(item.currentStock, item.lowStockThreshold)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {item.buyPrice !== undefined ? `${(item.buyPrice * item.currentStock).toFixed(2)} ${item.currency || ''}` : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStock(item.id, 1)}
                      disabled={isUpdatingStock}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateStock(item.id, -1)}
                      disabled={item.currentStock === 0 || isUpdatingStock}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => updateStock(item.id, 5)}
                      disabled={isUpdatingStock}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +5
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredInventory.length)} of {filteredInventory.length} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Quick Stock Update</h3>
        <p className="text-sm text-blue-700">
          Use the +1, -1, and +5 buttons to quickly update stock levels. Changes are automatically saved to the database.
        </p>
      </div>
    </div>
  );
}
