sap.ui.define(["sap/m/MessageBox", "sap/ui/model/odata/v4/ODataModel", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/Sorter", "../model/filters"], function (MessageBox, ODataModel, Filter, FilterOperator, Sorter, ___model_filters) {
  "use strict";

  const cacheAndIdFilter = ___model_filters["cacheAndIdFilter"];
  const cacheNameFilter = ___model_filters["cacheNameFilter"];
  const periodFilter = ___model_filters["periodFilter"];
  /**
   * Service class for interacting with the Cache Statistics API using OData V4
   */
  class CacheStatisticsService {
    constructor(model) {
      this.model = model || new ODataModel({
        serviceUrl: "/odata/v4/caching/",
        autoExpandSelect: true,
        groupId: "$auto"
      });
    }
    getModel() {
      return this.model;
    }
    async getCurrentMetrics(cacheName) {
      try {
        const binding = this.model.bindList("/Metrics", undefined, [new Sorter({
          path: "timestamp",
          descending: true
        })], [periodFilter("hourly"), cacheNameFilter(cacheName)]);
        const data = await binding.requestContexts();
        const results = data.map(item => item.getObject());
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
    async getHistoricalMetrics(cacheName, period = "hourly", from, to) {
      try {
        const filters = [periodFilter(period), cacheNameFilter(cacheName)];
        if (from) {
          filters.push(new Filter({
            path: "timestamp",
            operator: FilterOperator.GE,
            value1: from
          }));
        }
        if (to) {
          filters.push(new Filter({
            path: "timestamp",
            operator: FilterOperator.LE,
            value1: to
          }));
        }
        const binding = this.model.bindList("/Metrics", undefined, [new Sorter({
          path: "timestamp",
          descending: true
        })], filters);
        const data = await binding.requestContexts();
        return data.map(item => item.getObject());
      } catch (error) {
        console.error("Error fetching historical metrics:", error);
        MessageBox.error("Failed to load historical metrics");
        return [];
      }
    }
    async getTopKeys(cacheName) {
      try {
        const binding = this.model.bindList("/KeyMetrics", undefined, [new Sorter({
          path: "totalRequests",
          descending: true
        })], [periodFilter("current"), cacheNameFilter(cacheName)]);
        const data = await binding.requestContexts();
        return data.map(item => item.getObject());
      } catch (error) {
        console.error("Error fetching top keys:", error);
        MessageBox.error("Failed to load top keys");
        return [];
      }
    }
    async getColdKeys(cacheName) {
      try {
        const binding = this.model.bindList("/KeyMetrics", undefined, [new Sorter({
          path: "lastAccess",
          descending: false
        })], [periodFilter("current"), cacheNameFilter(cacheName)]);
        const data = await binding.requestContexts();
        return data.map(item => item.getObject());
      } catch (error) {
        console.error("Error fetching cold keys:", error);
        MessageBox.error("Failed to load cold keys");
        return [];
      }
    }
    async persistStatistics() {
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
    transformStatistics(data) {
      return {
        hits: data.hits || 0,
        misses: data.misses || 0,
        sets: data.sets || 0,
        deletes: data.deletes || 0,
        errors: data.errors || 0,
        avgLatency: data.avgLatency || 0,
        p95Latency: data.p95Latency || 0,
        p99Latency: data.p99Latency || 0,
        minLatency: data.minLatency || 0,
        maxLatency: data.maxLatency || 0,
        avgHitLatency: data.avgHitLatency || 0,
        p95HitLatency: data.p95HitLatency || 0,
        p99HitLatency: data.p99HitLatency || 0,
        minHitLatency: data.minHitLatency || 0,
        maxHitLatency: data.maxHitLatency || 0,
        avgMissLatency: data.avgMissLatency || 0,
        p95MissLatency: data.p95MissLatency || 0,
        p99MissLatency: data.p99MissLatency || 0,
        minMissLatency: data.minMissLatency || 0,
        maxMissLatency: data.maxMissLatency || 0,
        avgSetLatency: data.avgSetLatency || 0,
        avgDeleteLatency: data.avgDeleteLatency || 0,
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
    async getAvailableMetrics(cacheName) {
      try {
        const binding = this.model.bindList("/Metrics", undefined, [new Sorter({
          path: "timestamp",
          descending: true
        })], [cacheNameFilter(cacheName)]);
        const data = await binding.requestContexts();
        return data.map(item => item.getObject());
      } catch (error) {
        console.error("Error fetching available metrics:", error);
        MessageBox.error("Failed to load available metrics");
        return [];
      }
    }
    async getMetricById(cacheName, metricId) {
      try {
        const binding = this.model.bindList("/Metrics", undefined, undefined, cacheAndIdFilter(cacheName, metricId));
        const data = await binding.requestContexts();
        const results = data.map(item => item.getObject());
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
    async setMetricsEnabled(cacheName, enabled) {
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
    async setKeyMetricsEnabled(cacheName, enabled) {
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
  return CacheStatisticsService;
});
//# sourceMappingURL=CacheStatisticsService-dbg.js.map
