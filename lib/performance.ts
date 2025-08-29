// Safe Performance Monitoring Utility
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  startTimer(operation: string): string {
    const timerId = `${operation}_${Date.now()}_${Math.random()}`;
    const startTime = performance.now();
    
    // Store start time in a way that won't interfere with existing functionality
    (globalThis as any)[`timer_${timerId}`] = startTime;
    
    return timerId;
  }

  // End timing and record metric
  endTimer(timerId: string, operation: string): number {
    const startTime = (globalThis as any)[`timer_${timerId}`];
    if (!startTime) {
      console.warn(`⚠️ Timer ${timerId} not found for operation ${operation}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Clean up timer
    delete (globalThis as any)[`timer_${timerId}`];

    // Record metric
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
    
    console.log(`🎯 Performance recorded: ${operation} took ${duration.toFixed(2)}ms`);

    // Keep only last 100 measurements
    const measurements = this.metrics.get(operation)!;
    if (measurements.length > 100) {
      measurements.splice(0, measurements.length - 100);
    }

    return duration;
  }

  // Get performance statistics for an operation
  getStats(operation: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    last: number;
  } {
    const measurements = this.metrics.get(operation) || [];
    
    if (measurements.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, last: 0 };
    }

    const sum = measurements.reduce((a, b) => a + b, 0);
    const average = sum / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    const last = measurements[measurements.length - 1];

    return { count: measurements.length, average, min, max, last };
  }

  // Get all performance statistics
  getAllStats(): Record<string, {
    count: number;
    average: number;
    min: number;
    max: number;
    last: number;
  }> {
    console.log(`📊 getAllStats called, metrics size: ${this.metrics.size}`);
    console.log(`📊 Available operations:`, Array.from(this.metrics.keys()));
    
    const stats: Record<string, any> = {};
    
    for (const [operation] of this.metrics) {
      stats[operation] = this.getStats(operation);
      console.log(`📊 Stats for ${operation}:`, stats[operation]);
    }
    
    console.log(`📊 Final stats object:`, stats);
    return stats;
  }

  // Clear all metrics (safe cleanup)
  clearMetrics(): void {
    this.metrics.clear();
  }

  // Performance decorator for functions
  static monitor<T extends (...args: any[]) => Promise<any>>(
    operation: string,
    fn: T
  ): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const monitor = PerformanceMonitor.getInstance();
      const timerId = monitor.startTimer(operation);
      
      try {
        const result = await fn(...args);
        monitor.endTimer(timerId, operation);
        return result;
      } catch (error) {
        monitor.endTimer(timerId, operation);
        throw error;
      }
    }) as T;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Safe performance wrapper for API routes
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return PerformanceMonitor.monitor(operation, fn);
}
