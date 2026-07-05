import MessageBox from "sap/m/MessageBox";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";

export interface CacheStatistics {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;

    // Overall latency metrics
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    minLatency: number;
    maxLatency: number;

    // Hit-specific latency metrics
    avgHitLatency: number;
    p95HitLatency: number;
    p99HitLatency: number;
    minHitLatency: number;
    maxHitLatency: number;

    // Miss-specific latency metrics
    avgMissLatency: number;
    p95MissLatency: number;
    p99MissLatency: number;
    minMissLatency: number;
    maxMissLatency: number;

    // Set/Delete latency metrics
    avgSetLatency: number;
    avgDeleteLatency: number;

    // Performance metrics
    memoryUsage: number;
    itemCount: number;
    hitRatio: number;
    throughput: number;
    errorRate: number;
    cacheEfficiency: number;
    uptimeMs: number;
    uniqueKeys: number;
    topKeys: KeyAccess[];
    coldKeys: KeyAccess[];
    lastPersisted: string;
}

export interface KeyAccess {
    keyName: string;
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    total: number;
    lastAccess: string;
    dataType: string;
    serviceName: string;
    entityName: string;
    operation: string;
    metadata: string;
}

export interface HistoricalStatistics {
    ID: string;
    cache: string;
    timestamp: string;
    period: string;
    
            // Read-through metrics (high value with latencies)
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
    totalRequests: number;

            // Read-through latency metrics
    avgHitLatency: number;
    p95HitLatency: number;
    p99HitLatency: number;
    minHitLatency: number;
    maxHitLatency: number;
    avgMissLatency: number;
    p95MissLatency: number;
    p99MissLatency: number;
    minMissLatency: number;
    maxMissLatency: number;
    avgSetLatency: number;
    avgDeleteLatency: number;

            // Read-through performance metrics
    hitRatio: number;
    throughput: number;
    errorRate: number;
    cacheEfficiency: number;

    // Native function metrics (basic counts only)
    nativeSets: number;
    nativeGets: number;
    nativeDeletes: number;
    nativeClears: number;
    nativeDeleteByTags: number;
    nativeErrors: number;
    totalNativeOperations: number;

    // Native function performance metrics
    nativeThroughput: number;
    nativeErrorRate: number;

    // Common metrics
    memoryUsage: number;
    itemCount: number;
    uptimeMs: number;
}

/**
 * Service class for interacting with the Cache Statistics API using OData V4
 */
export default class CacheStatisticsService {
    private model: ODataModel;

    constructor(model?: ODataModel) {
        this.model = model || new ODataModel({
            serviceUrl: "/odata/v4/caching/",
            autoExpandSelect: true,
            groupId: "$auto"
        });
    }

    /**
     * Get the OData model instance
     */
    getModel(): ODataModel {
        return this.model;
    }

    /**
     * Get current cache metrics using entity set
     */
    async getCurrentMetrics(cacheName: string): Promise<CacheStatistics | null> {
        try {
            const binding = this.model.bindList("/Metrics", undefined, undefined, undefined, {
                $filter: `period eq 'hourly' and cache eq '${cacheName}'`,
                $orderby: "timestamp desc"
            });

            const data = await binding.requestContexts();
            const results = data.map((item: any) => item.getObject());

            if (results && results.length > 0) {
                return this.transformStatistics(results[0]);
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching current metrics:", error);
            MessageBox.error("Failed to load current metrics");
            return null;
        }
    }

    /**
     * Get historical metrics using entity set
     */
    async getHistoricalMetrics(cacheName: string, period: string = "hourly", from?: string, to?: string): Promise<HistoricalStatistics[]> {
        try {
            let filter = `period eq '${period}' and cache eq '${cacheName}'`;
            if (from) {
                filter += ` and timestamp ge ${from}`;
            }
            if (to) {
                filter += ` and timestamp le ${to}`;
            }

            const binding = this.model.bindList("/Metrics", undefined, undefined, undefined, {
                $filter: filter,
                $orderby: "timestamp desc"
            });

            const data = await binding.requestContexts();
            return data.map((item: any) => item.getObject());
        } catch (error) {
            console.error("Error fetching historical metrics:", error);
            MessageBox.error("Failed to load historical metrics");
            return [];
        }
    }

    /**
     * Get top accessed keys using entity set
     */
    async getTopKeys(cacheName: string, limit: number = 10): Promise<KeyAccess[]> {
        try {
            const binding = this.model.bindList("/KeyMetrics", undefined, undefined, undefined, {
                $filter: `period eq 'current' and cache eq '${cacheName}'`,
                $orderby: "totalRequests desc"
            });

            const data = await binding.requestContexts();
            return data.map((item: any) => item.getObject());
        } catch (error) {
            console.error("Error fetching top keys:", error);
            MessageBox.error("Failed to load top keys");
            return [];
        }
    }

    /**
     * Get cold keys using entity set
     */
    async getColdKeys(cacheName: string, limit: number = 10): Promise<KeyAccess[]> {
        try {
            const binding = this.model.bindList("/KeyMetrics", undefined, undefined, undefined, {
                $filter: `period eq 'current' and cache eq '${cacheName}'`,
                $orderby: "lastAccess asc"
            });

            const data = await binding.requestContexts();
            return data.map((item: any) => item.getObject());
        } catch (error) {
            console.error("Error fetching cold keys:", error);
            MessageBox.error("Failed to load cold keys");
            return [];
        }
    }

    /**
     * Persist statistics using action
     */
    async persistStatistics(cacheName: string): Promise<boolean> {
        try {
            // For actions, we'll use a simple approach with the model's submitBatch
            const context = this.model.bindContext("/persistStatistics(...)");

            return new Promise((resolve, reject) => {
                // Execute the action
                context.execute().then(() => {
                    resolve(true);
                }).catch((error: any) => {
                    console.error("Error persisting statistics:", error);
                    MessageBox.error("Failed to persist statistics");
                    reject(error);
                });
            });
        } catch (error) {
            console.error("Error persisting statistics:", error);
            MessageBox.error("Failed to persist statistics");
            return false;
        }
    }

    /**
     * Transform statistics data from API format to internal format
     */
    private transformStatistics(data: any): CacheStatistics {
        return {
            hits: data.hits || 0,
            misses: data.misses || 0,
            sets: data.sets || 0,
            deletes: data.deletes || 0,
            errors: data.errors || 0,

            // Overall latency metrics
            avgLatency: data.avgLatency || 0,
            p95Latency: data.p95Latency || 0,
            p99Latency: data.p99Latency || 0,
            minLatency: data.minLatency || 0,
            maxLatency: data.maxLatency || 0,

            // Hit-specific latency metrics
            avgHitLatency: data.avgHitLatency || 0,
            p95HitLatency: data.p95HitLatency || 0,
            p99HitLatency: data.p99HitLatency || 0,
            minHitLatency: data.minHitLatency || 0,
            maxHitLatency: data.maxHitLatency || 0,

            // Miss-specific latency metrics
            avgMissLatency: data.avgMissLatency || 0,
            p95MissLatency: data.p95MissLatency || 0,
            p99MissLatency: data.p99MissLatency || 0,
            minMissLatency: data.minMissLatency || 0,
            maxMissLatency: data.maxMissLatency || 0,

            // Set/Delete latency metrics
            avgSetLatency: data.avgSetLatency || 0,
            avgDeleteLatency: data.avgDeleteLatency || 0,

            // Performance metrics
            memoryUsage: data.memoryUsage || 0,
            itemCount: data.itemCount || 0,
            hitRatio: data.hitRatio || 0,
            throughput: data.throughput || 0,
            errorRate: data.errorRate || 0,
            cacheEfficiency: data.cacheEfficiency || 0,
            uptimeMs: data.uptimeMs || 0,
            uniqueKeys: 0,
            topKeys: [],
            coldKeys: [],
            lastPersisted: data.lastPersisted || new Date().toISOString()
        };
    }

    /**
     * Get all available metrics for a cache
     */
    async getAvailableMetrics(cacheName: string): Promise<any[]> {
        try {
            const binding = this.model.bindList("/Metrics", undefined, undefined, undefined, {
                $filter: `cache eq '${cacheName}'`,
                $orderby: "timestamp desc"
            });

            const data = await binding.requestContexts();
            return data.map((item: any) => item.getObject());
        } catch (error) {
            console.error("Error fetching available metrics:", error);
            MessageBox.error("Failed to load available metrics");
            return [];
        }
    }

    /**
     * Get a specific metric by ID
     */
    async getMetricById(cacheName: string, metricId: string): Promise<CacheStatistics | null> {
        try {
            const binding = this.model.bindList("/Metrics", undefined, undefined, undefined, {
                $filter: `ID eq '${metricId}' and cache eq '${cacheName}'`
            });

            const data = await binding.requestContexts();
            const results = data.map((item: any) => item.getObject());

            if (results && results.length > 0) {
                return this.transformStatistics(results[0]);
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching metric by ID:", error);
            MessageBox.error("Failed to load metric");
            return null;
        }
    }

    /**
     * Set metrics enabled/disabled
     */
    async setMetricsEnabled(cacheName: string, enabled: boolean): Promise<boolean> {
        try {
            const context = this.model.bindContext(`/setMetricsEnabled(...)`);
            context.setParameter("cache", cacheName);
            context.setParameter("enabled", enabled);
            
            return new Promise((resolve, reject) => {
                context.execute().then(() => {
                    resolve(true);
                }).catch((error: any) => {
                    console.error("Error setting metrics enabled:", error);
                    MessageBox.error("Failed to update metrics configuration");
                    reject(error);
                });
            });
        } catch (error) {
            console.error("Error setting metrics enabled:", error);
            MessageBox.error("Failed to update metrics configuration");
            return false;
        }
    }

    /**
     * Set key metrics enabled/disabled
     */
    async setKeyMetricsEnabled(cacheName: string, enabled: boolean): Promise<boolean> {
        try {
            const context = this.model.bindContext(`/setKeyMetricsEnabled(...)`);
            context.setParameter("cache", cacheName);
            context.setParameter("enabled", enabled);
            
            return new Promise((resolve, reject) => {
                context.execute().then(() => {
                    resolve(true);
                }).catch((error: any) => {
                    console.error("Error setting key metrics enabled:", error);
                    MessageBox.error("Failed to update key metrics configuration");
                    reject(error);
                });
            });
        } catch (error) {
            console.error("Error setting key metrics enabled:", error);
            MessageBox.error("Failed to update key metrics configuration");
            return false;
        }
    }
} 