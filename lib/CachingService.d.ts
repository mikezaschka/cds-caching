import { Service, cds } from '@sap/cds';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CacheTag {
  template: string;
  data?: string;
  prefix?: string;
  suffix?: string;
  value?: string; 
}

export interface CacheOptions {
  ttl?: number;
  tags?: CacheTag[] | string[];
  key?: string | object;
  params?: Record<string, any>;
}

export interface CacheMetadata {
  value: any;
  tags: CacheTag[]; 
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

export interface ReadThroughResult<T = any> {
  result: T;
  cacheKey: string;
  metadata: {
    hit: boolean;
    latency: number;
  };
}

export interface CacheAnnotatedFunction {
  name: string;
  options: CachableFunctionOptions;
}

// ============================================================================
// Read Through Operations Interface
// ============================================================================

export interface ReadThroughOperations {
  /**
   * Send a request with caching with read-through capabilities
   */
  send(request: any, service: Service, options?: CacheOptions): Promise<ReadThroughResult>;

  /**
   * Run a cached operation with automatic key generation
   */
  run(req: any, service: Service, options?: CacheOptions): Promise<ReadThroughResult>;

  /**
   * Wraps an async function and caches the result
   */
  wrap<T extends (...args: any[]) => Promise<any>>(
    key: string,
    asyncFunction: T,
    options?: CacheOptions
  ): (...args: Parameters<T>) => Promise<ReadThroughResult<Awaited<ReturnType<T>>>>;

  /**
   * Executes an async function and caches its result
   */
  exec<T>(
    key: string,
    asyncFunction: () => Promise<T>,
    options?: CacheOptions
  ): Promise<ReadThroughResult<T>>;
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
    throwOnErrors?: boolean;
    /**
     * When enabled, basic operations (`get`, `set`, `delete`, ...) run in a dedicated cache transaction.
     * This isolates cache access from the caller's request transaction (useful for concurrent BEFORE handlers).
     */
    transactionalOperations?: boolean;
  };
  
  private cacheAnnotatedFunctions: {
    bound: CacheAnnotatedFunction[];
    unbound: CacheAnnotatedFunction[];
  };

  // Read-through operations
  readonly rt: ReadThroughOperations;

  // ============================================================================
  // Core Cache Operations
  // ============================================================================

  /**
   * Create a cache key from various inputs
   */
  createKey(...args: any[]): string;

  /**
   * Set a value in the cache
   */
  set(key: string | object, value: any, options?: CacheOptions, tx?: any): Promise<void>;

  /**
   * Get a value from the cache
   */
  get(key: string | object, tx?: any): Promise<any>;

  /**
   * Check if a key exists in the cache
   */
  has(key: string | object, tx?: any): Promise<boolean>;

  /**
   * Delete a key from the cache
   */
  delete(key: string | object, tx?: any): Promise<boolean>;

  /**
   * Clear all cache entries
   */
  clear(tx?: any): Promise<void>;

  /**
   * Delete all keys that have a specific tag
   */
  deleteByTag(tag: string, tx?: any): Promise<void>;

  /**
   * Get metadata for a key
   */
  metadata(key: string | object, tx?: any): Promise<CacheMetadata | null>;

  /**
   * Get tags for a key
   */
  tags(key: string | object, tx?: any): Promise<string[]>;

  /**
   * Iterator for all cache entries
   */
  iterator(tx?: any): AsyncIterableIterator<[string, CacheMetadata]>;

  /**
   * Get a raw value from the cache without statistics tracking
   */
  getRaw(key: string | object, tx?: any): Promise<any>;

  // ============================================================================
  // Deprecated CAP Operations (for backward compatibility)
  // ============================================================================

  /**
   * @deprecated Use cache.rt.send() instead. The rt.send() method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.
   */
  send(arg1: any, service: any, options?: CacheOptions): Promise<any>;

  /**
   * @deprecated Use cache.rt.run() instead. The rt.run() method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.
   */
  run(req: any, handler?: Function, options?: CacheOptions): Promise<any>;

  /**
   * @deprecated Use cache.rt.wrap() instead. The rt.wrap() method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.
   */
  wrap<T extends (...args: any[]) => Promise<any>>(
    key: string,
    asyncFunction: T,
    options?: CacheOptions
  ): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>;

  /**
   * @deprecated Use cache.rt.exec() instead. The rt.exec() method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.
   */
  exec<T>(
    key: string,
    asyncFunction: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T>;

  // ============================================================================
  // Tag Resolution
  // ============================================================================

  /**
   * Resolve tags for a given query
   */
  resolveTags(...args: any[]): Promise<any>;

  // ============================================================================
  // Statistics and Metrics
  // ============================================================================

  /**
   * Get statistics for a specific period
   */
  getMetrics(from: Date, to: Date): Promise<CacheStatistics>;

  /**
   * Get key-specific metrics for a specific period
   */
  getKeyMetrics(key: string, from: Date, to: Date): Promise<CacheKeyMetrics>;

  /**
   * Get current statistics
   */
  getCurrentMetrics(): Promise<CacheStatistics>;

  /**
   * Get current key metrics
   */
  getCurrentKeyMetrics(): Promise<CacheKeyMetrics>;

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
   * Persist metrics to database
   */
  persistMetrics(): Promise<void>;

  // ============================================================================
  // Configuration Management
  // ============================================================================

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