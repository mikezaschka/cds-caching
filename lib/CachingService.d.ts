import { Service } from '@sap/cds';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  key?: string | object;
  params?: Record<string, any>;
}

export interface CacheMetadata {
  value: any;
  tags: string[];
  timestamp: number;
}

export interface StatisticsMetadata {
  dataType: string;
  serviceName: string;
  operation: string;
  metadata: string;
  entityName?: string;
  queryInfo?: string;
}

export interface RuntimeConfiguration {
  enableStatistics: boolean;
  enableKeyTracking: boolean;
}

export interface CacheStatistics {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  averageLatency: number;
  totalLatency: number;
}

export interface CacheKeyMetrics {
  key: string;
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  averageLatency: number;
  lastAccessed: Date;
}

export interface CachableFunctionOptions {
  '@cache.ttl'?: number;
  '@cache.key'?: string | object;
  '@cache.tags'?: string[];
}

// ============================================================================
// CachingService Class Definition
// ============================================================================

export declare class CachingService extends Service {
  // Properties
  readonly name: string;
  readonly options: {
    store: any;
    compression: any;
    credentials: Record<string, any>;
    namespace?: string;
  };
  
  private cacheAnnotatedFunctions: {
    bound: Array<{ name: string; options: CachableFunctionOptions }>;
    unbound: Array<{ name: string; options: CachableFunctionOptions }>;
  };

  // ============================================================================
  // Core Cache Operations
  // ============================================================================

  /**
   * Set a value in the cache
   */
  set(key: string | object, value: any, options?: CacheOptions): Promise<void>;

  /**
   * Get a value from the cache
   */
  get(key: string | object): Promise<any>;

  /**
   * Check if a key exists in the cache
   */
  has(key: string | object): Promise<boolean>;

  /**
   * Delete a key from the cache
   */
  delete(key: string | object): Promise<boolean>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;

  /**
   * Delete all keys that have a specific tag
   */
  deleteByTag(tag: string): Promise<void>;

  /**
   * Get metadata for a key
   */
  metadata(key: string | object): Promise<CacheMetadata | null>;

  /**
   * Get tags for a key
   */
  tags(key: string | object): Promise<string[]>;

  /**
   * Iterator for all cache entries
   */
  iterator(): AsyncIterableIterator<[string, CacheMetadata]>;

  // ============================================================================
  // CAP Operations
  // ============================================================================

  /**
   * Send a request with caching (CDS Service method)
   */
  send(arg1: any, service: any, options?: CacheOptions): Promise<any>;

  /**
   * Run a cached operation with automatic key generation
   */
  run(req: any, handler?: Function, options?: CacheOptions): Promise<any>;

  // ============================================================================
  // Async Operations
  // ============================================================================

  /**
   * Wraps an async function and caches the result
   */
  wrap<T extends (...args: any[]) => Promise<any>>(
    key: string,
    asyncFunction: T,
    options?: CacheOptions
  ): T;

  /**
   * Executes an async function and caches its result
   */
  exec<T>(
    key: string,
    asyncFunction: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T>;

  // ============================================================================
  // Statistics and Configuration
  // ============================================================================

  /**
   * Get statistics for a specific period
   */
  getStats(period: string, from: Date, to: Date): Promise<CacheStatistics>;

  /**
   * Get current statistics
   */
  getCurrentStats(): Promise<CacheStatistics>;

  /**
   * Clear all metrics
   */
  clearMetrics(): Promise<void>;

  /**
   * Clear key metrics
   */
  clearKeyMetrics(): Promise<void>;

  /**
   * Enable or disable statistics at runtime
   */
  setMetricsEnabled(enabled: boolean): Promise<void>;

  /**
   * Enable or disable key tracking at runtime
   */
  setKeyMetricsEnabled(enabled: boolean): Promise<void>;

  /**
   * Get current runtime configuration
   */
  getRuntimeConfiguration(): Promise<RuntimeConfiguration>;

  /**
   * Reload runtime configuration from database
   */
  reloadRuntimeConfiguration(): Promise<void>;

  /**
   * Add a cachable function
   */
  addCachableFunction(
    name: string,
    options: CachableFunctionOptions,
    isBound?: boolean
  ): void;

  /**
   * Dispose of the service
   */
  dispose(): Promise<void>;

  // ============================================================================
  // Private Methods (for internal use)
  // ============================================================================

  private setupStatisticsHooks(): void;
  private loadRuntimeConfiguration(): Promise<void>;
  private getElapsedMs(startTime: [number, number]): number;
  private _getRaw(key: string | object): Promise<any>;
}

// ============================================================================
// Module Export
// ============================================================================

export default CachingService; 