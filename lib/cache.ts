import Redis from 'ioredis';

// Safe caching utility with fallback to memory cache
class SafeCache {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { data: any; expiry: number }>();
  private readonly MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Only initialize Redis if environment variable is set
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
        
        this.redis.on('error', (error) => {
          console.warn('Redis connection failed, falling back to memory cache:', error.message);
          this.redis = null;
        });
        
        this.redis.on('connect', () => {
          console.log('Redis cache connected successfully');
        });
      } catch (error) {
        console.warn('Redis initialization failed, using memory cache:', error);
        this.redis = null;
      }
    }
  }

  // Safe get method with fallback
  async get(key: string): Promise<any | null> {
    try {
      // Try Redis first
      if (this.redis) {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data);
        }
      }
    } catch (error) {
      console.warn('Redis get failed, trying memory cache:', error);
    }

    // Fallback to memory cache
    return this.getFromMemory(key);
  }

  // Safe set method with fallback
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      // Try Redis first
      if (this.redis) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
        return;
      }
    } catch (error) {
      console.warn('Redis set failed, using memory cache:', error);
    }

    // Fallback to memory cache
    this.setInMemory(key, value, ttlSeconds * 1000);
  }

  // Safe delete method
  async delete(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      }
    } catch (error) {
      console.warn('Redis delete failed:', error);
    }

    // Also delete from memory cache
    this.memoryCache.delete(key);
  }

  // Memory cache fallback methods
  private getFromMemory(key: string): any | null {
    const item = this.memoryCache.get(key);
    if (item && Date.now() < item.expiry) {
      return item.data;
    }
    
    if (item) {
      this.memoryCache.delete(key); // Clean up expired item
    }
    
    return null;
  }

  private setInMemory(key: string, value: any, ttlMs: number): void {
    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + ttlMs
    });

    // Clean up expired items periodically
    if (this.memoryCache.size > 100) {
      this.cleanupMemoryCache();
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (now >= item.expiry) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; type: string }> {
    if (this.redis) {
      try {
        await this.redis.ping();
        return { status: 'healthy', type: 'redis' };
      } catch (error) {
        return { status: 'unhealthy', type: 'redis' };
      }
    }
    
    return { status: 'healthy', type: 'memory' };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        console.warn('Redis shutdown error:', error);
      }
    }
    
    this.memoryCache.clear();
  }
}

// Export singleton instance
export const safeCache = new SafeCache();

// Safe cache decorator for functions
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttlSeconds: number = 300
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const cacheKey = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = await safeCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    const result = await fn(...args);
    await safeCache.set(cacheKey, result, ttlSeconds);
    
    return result;
  }) as T;
}
