// Data service layer to replace localStorage usage
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  aiDescription?: string;
  regularPrice: number;
  salePrice?: number;
  buyPrice: number;
  currency: string;
  sku?: string;
  status: string;
  categoryId: number;
  categoryName: string;
  images: string[];
  stock: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  parentId?: number;
  productCount: number;
  children: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNo: string;
  customerName?: string;
  userEmail?: string;
  phone?: string;
  status: string;
  paymentStatus: string;
  shippingMethod?: string;
  shippingCost?: number;
  subtotal: number;
  total: number;
  currency: string;
  fbEventId?: string;
  ttEventId?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

// API base URL
const API_BASE = '/api';

// Performance optimization: Cache for better performance
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Error handling
class DataServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'DataServiceError';
  }
}

// Generic API call function
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DataServiceError(
        errorData.error || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof DataServiceError) {
      throw error;
    }
    throw new DataServiceError(
      error instanceof Error ? error.message : 'Network error occurred'
    );
  }
}

// Cache management functions
function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCache<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Optimized API call with caching
async function cachedApiCall<T>(endpoint: string, options?: RequestInit, ttl?: number): Promise<T> {
  const cacheKey = `${endpoint}-${JSON.stringify(options || {})}`;
  
  // Try to get from cache first
  const cached = getFromCache<T>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // If not in cache, fetch from API
  const data = await apiCall<T>(endpoint, options);
  
  // Store in cache
  setCache(cacheKey, data, ttl);
  
  return data;
}

// Products API
export const productsApi = {
  async getAll(): Promise<Product[]> {
    return cachedApiCall<Product[]>('/products');
  },

  async getById(id: string): Promise<Product> {
    return cachedApiCall<Product>(`/products/${id}`);
  },

  async getBySlug(slug: string): Promise<Product> {
    // API route shape: /api/products/[slug]
    return cachedApiCall<Product>(`/products/${slug}`);
  },

  async create(productData: Partial<Product>): Promise<Product> {
    return apiCall<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async update(id: string, productData: Partial<Product>): Promise<Product> {
    return apiCall<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Categories API
export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    return cachedApiCall<Category[]>('/categories');
  },

  async getById(id: string): Promise<Category> {
    return cachedApiCall<Category>(`/categories/by-id?id=${id}`);
  },

  async getBySlug(slug: string): Promise<Category> {
    return cachedApiCall<Category>(`/categories/${slug}`);
  },

  async create(categoryData: Partial<Category>): Promise<Category> {
    return apiCall<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  async update(id: string, categoryData: Partial<Category>): Promise<Category> {
    return apiCall<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Orders API
export const ordersApi = {
  async getAll(): Promise<Order[]> {
    return apiCall<Order[]>('/orders');
  },

  async getById(id: string): Promise<Order> {
    return apiCall<Order>(`/orders/${id}`);
  },

  async create(orderData: Partial<Order>): Promise<Order> {
    return apiCall<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async updateStatus(id: string, status: string): Promise<Order> {
    return apiCall<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Cache management
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// Cached API calls
export const cachedApi = {
  async getProducts(): Promise<Product[]> {
    const cacheKey = 'products';
    let products = cacheManager.get(cacheKey);
    
    if (!products) {
      products = await productsApi.getAll();
      cacheManager.set(cacheKey, products, 2 * 60 * 1000); // 2 minutes
    }
    
    return products;
  },

  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories';
    let categories = cacheManager.get(cacheKey);
    
    if (!categories) {
      categories = await categoriesApi.getAll();
      cacheManager.set(cacheKey, categories, 5 * 60 * 1000); // 5 minutes
    }
    
    return categories;
  },

  invalidateProducts(): void {
    cacheManager.invalidate('products');
  },

  invalidateCategories(): void {
    cacheManager.invalidate('categories');
  },
};
