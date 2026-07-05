import MessageBox from "sap/m/MessageBox";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Sorter from "sap/ui/model/Sorter";
import Context from "sap/ui/model/odata/v4/Context";
import { cacheAndIdFilter, cacheNameFilter, periodFilter } from "../model/filters";

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

    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
    totalRequests: number;

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

    hitRatio: number;
    throughput: number;
    errorRate: number;
    cacheEfficiency: number;

    nativeSets: number;
    nativeGets: number;
    nativeDeletes: number;
    nativeClears: number;
    nativeDeleteByTags: number;
    nativeErrors: number;
    totalNativeOperations: number;

    nativeThroughput: number;
    nativeErrorRate: number;

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

    getModel(): ODataModel {
        return this.model;
    }

    async getCurrentMetrics(cacheName: string): Promise<CacheStatistics | null> {
        try {
            const binding = this.model.bindList(
                "/Metrics",
                undefined,
                [new Sorter({ path: "timestamp", descending: true })],
                [periodFilter("hourly"), cacheNameFilter(cacheName)]
            );

            const data = await binding.requestContexts();
            const results = data.map((item: Context) => item.getObject());

            if (results.length > 0) {
                return this.transformStatistics(results[0]);
            }
            return null;
        } catch (error) {
            console.error("Error fetching current metrics:", error);
            MessageBox.error("Failed to load current metrics");
            return null;
        }
    }

    async getHistoricalMetrics(cacheName: string, period: string = "hourly", from?: string, to?: string): Promise<HistoricalStatistics[]> {
        try {
            const filters: Filter[] = [periodFilter(period), cacheNameFilter(cacheName)];
            if (from) {
                filters.push(new Filter({ path: "timestamp", operator: FilterOperator.GE, value1: from }));
            }
            if (to) {
                filters.push(new Filter({ path: "timestamp", operator: FilterOperator.LE, value1: to }));
            }

            const binding = this.model.bindList(
                "/Metrics",
                undefined,
                [new Sorter({ path: "timestamp", descending: true })],
                filters
            );

            const data = await binding.requestContexts();
            return data.map((item: Context) => item.getObject());
        } catch (error) {
            console.error("Error fetching historical metrics:", error);
            MessageBox.error("Failed to load historical metrics");
            return [];
        }
    }

    async getTopKeys(cacheName: string): Promise<KeyAccess[]> {
        try {
            const binding = this.model.bindList(
                "/KeyMetrics",
                undefined,
                [new Sorter({ path: "totalRequests", descending: true })],
                [periodFilter("current"), cacheNameFilter(cacheName)]
            );

            const data = await binding.requestContexts();
            return data.map((item: Context) => item.getObject());
        } catch (error) {
            console.error("Error fetching top keys:", error);
            MessageBox.error("Failed to load top keys");
            return [];
        }
    }

    async getColdKeys(cacheName: string): Promise<KeyAccess[]> {
        try {
            const binding = this.model.bindList(
                "/KeyMetrics",
                undefined,
                [new Sorter({ path: "lastAccess", descending: false })],
                [periodFilter("current"), cacheNameFilter(cacheName)]
            );

            const data = await binding.requestContexts();
            return data.map((item: Context) => item.getObject());
        } catch (error) {
            console.error("Error fetching cold keys:", error);
            MessageBox.error("Failed to load cold keys");
            return [];
        }
    }

    async persistStatistics(): Promise<boolean> {
        try {
            const context = this.model.bindContext("/persistStatistics(...)");
            await context.invoke();
            return true;
        } catch (error) {
            console.error("Error persisting statistics:", error);
            MessageBox.error("Failed to persist statistics");
            return false;
        }
    }

    private transformStatistics(data: Record<string, unknown>): CacheStatistics {
        return {
            hits: (data.hits as number) || 0,
            misses: (data.misses as number) || 0,
            sets: (data.sets as number) || 0,
            deletes: (data.deletes as number) || 0,
            errors: (data.errors as number) || 0,

            avgLatency: (data.avgLatency as number) || 0,
            p95Latency: (data.p95Latency as number) || 0,
            p99Latency: (data.p99Latency as number) || 0,
            minLatency: (data.minLatency as number) || 0,
            maxLatency: (data.maxLatency as number) || 0,

            avgHitLatency: (data.avgHitLatency as number) || 0,
            p95HitLatency: (data.p95HitLatency as number) || 0,
            p99HitLatency: (data.p99HitLatency as number) || 0,
            minHitLatency: (data.minHitLatency as number) || 0,
            maxHitLatency: (data.maxHitLatency as number) || 0,

            avgMissLatency: (data.avgMissLatency as number) || 0,
            p95MissLatency: (data.p95MissLatency as number) || 0,
            p99MissLatency: (data.p99MissLatency as number) || 0,
            minMissLatency: (data.minMissLatency as number) || 0,
            maxMissLatency: (data.maxMissLatency as number) || 0,

            avgSetLatency: (data.avgSetLatency as number) || 0,
            avgDeleteLatency: (data.avgDeleteLatency as number) || 0,

            memoryUsage: (data.memoryUsage as number) || 0,
            itemCount: (data.itemCount as number) || 0,
            hitRatio: (data.hitRatio as number) || 0,
            throughput: (data.throughput as number) || 0,
            errorRate: (data.errorRate as number) || 0,
            cacheEfficiency: (data.cacheEfficiency as number) || 0,
            uptimeMs: (data.uptimeMs as number) || 0,
            uniqueKeys: 0,
            topKeys: [],
            coldKeys: [],
            lastPersisted: (data.lastPersisted as string) || new Date().toISOString()
        };
    }

    async getAvailableMetrics(cacheName: string): Promise<Record<string, unknown>[]> {
        try {
            const binding = this.model.bindList(
                "/Metrics",
                undefined,
                [new Sorter({ path: "timestamp", descending: true })],
                [cacheNameFilter(cacheName)]
            );

            const data = await binding.requestContexts();
            return data.map((item: Context) => item.getObject());
        } catch (error) {
            console.error("Error fetching available metrics:", error);
            MessageBox.error("Failed to load available metrics");
            return [];
        }
    }

    async getMetricById(cacheName: string, metricId: string): Promise<CacheStatistics | null> {
        try {
            const binding = this.model.bindList(
                "/Metrics",
                undefined,
                undefined,
                cacheAndIdFilter(cacheName, metricId)
            );

            const data = await binding.requestContexts();
            const results = data.map((item: Context) => item.getObject());

            if (results.length > 0) {
                return this.transformStatistics(results[0]);
            }
            return null;
        } catch (error) {
            console.error("Error fetching metric by ID:", error);
            MessageBox.error("Failed to load metric");
            return null;
        }
    }

    async setMetricsEnabled(cacheName: string, enabled: boolean): Promise<boolean> {
        try {
            const context = this.model.bindContext("/setMetricsEnabled(...)");
            context.setParameter("cache", cacheName);
            context.setParameter("enabled", enabled);
            await context.invoke();
            return true;
        } catch (error) {
            console.error("Error setting metrics enabled:", error);
            MessageBox.error("Failed to update metrics configuration");
            return false;
        }
    }

    async setKeyMetricsEnabled(cacheName: string, enabled: boolean): Promise<boolean> {
        try {
            const context = this.model.bindContext("/setKeyMetricsEnabled(...)");
            context.setParameter("cache", cacheName);
            context.setParameter("enabled", enabled);
            await context.invoke();
            return true;
        } catch (error) {
            console.error("Error setting key metrics enabled:", error);
            MessageBox.error("Failed to update key metrics configuration");
            return false;
        }
    }
}
