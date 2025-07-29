# cds-caching Metrics Guide

This guide provides detailed information about the metrics and monitoring capabilities in cds-caching, including configuration, data structures, and best practices for optimizing cache performance.

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Metrics Types](#metrics-types)
4. [Data Structures](#data-structures)
5. [Accessing Metrics](#accessing-metrics)
6. [Performance Impact](#performance-impact)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

cds-caching provides comprehensive metrics collection to help you monitor and optimize cache performance. The metrics system tracks both general cache performance and individual key performance, providing insights into:

- Cache hit rates and efficiency
- Response latencies and throughput
- Memory usage and system performance
- Error rates and failure patterns
- Key-level performance analysis


## Configuration

### Basic Configuration

Metrics are disabled by default to minimize performance impact. They can only be enabled/disabled via the programmatic API or OData API at runtime, not through package.json configuration.

### Enabling Metrics Programmatically

```javascript
// Connect to the caching service
const cache = await cds.connect.to("caching")

// Enable metrics at runtime
await cache.setMetricsEnabled(true)
await cache.setKeyMetricsEnabled(true)
```

### Enabling Metrics via OData API

```http
### Enable general metrics
POST http://localhost:4004/odata/v4/CachingApiService/Caches('caching')/setMetricsEnabled
Content-Type: application/json

{
  "enabled": true
}

### Enable key-level metrics
POST http://localhost:4004/odata/v4/CachingApiService/Caches('caching')/setKeyMetricsEnabled
Content-Type: application/json

{
  "enabled": true
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `metricsEnabled` | boolean | false | Enable general cache metrics (runtime only) |
| `keyMetricsEnabled` | boolean | false | Enable key-level metrics tracking (runtime only) |
| `maxLatencies` | number | 1000 | Maximum number of latency samples to keep in memory |
| `maxKeyMetrics` | number | 100 | Maximum number of keys to track metrics for |

> **Note**: Metrics configuration is only available at runtime via the programmatic API or OData API. The persistence interval is not configurable and uses a fixed default value.

## Metrics Types

### 1. General Cache Metrics

General metrics provide an overview of overall cache performance:

#### Read-Through Metrics
- **hits**: Number of successful cache hits
- **misses**: Number of cache misses
- **errors**: Number of errors during cache operations
- **totalRequests**: Total number of read-through requests

#### Latency Metrics
- **avgHitLatency**: Average latency for cache hits (milliseconds)
- **minHitLatency**: Minimum latency for cache hits
- **maxHitLatency**: Maximum latency for cache hits
- **avgMissLatency**: Average latency for cache misses
- **minMissLatency**: Minimum latency for cache misses
- **maxMissLatency**: Maximum latency for cache misses
- **avgReadThroughLatency**: Average latency for all read-through operations

#### Performance Metrics
- **hitRatio**: Hit rate as a percentage (hits / totalRequests)
- **throughput**: Requests per second
- **errorRate**: Error rate as a percentage
- **cacheEfficiency**: Ratio of miss latency to hit latency

#### Native Operation Metrics
- **nativeSets**: Number of direct set operations
- **nativeGets**: Number of direct get operations
- **nativeDeletes**: Number of direct delete operations
- **nativeClears**: Number of clear operations
- **nativeDeleteByTags**: Number of delete-by-tag operations
- **nativeErrors**: Number of errors in native operations
- **totalNativeOperations**: Total native operations
- **nativeThroughput**: Native operations per second
- **nativeErrorRate**: Native operation error rate

#### System Metrics
- **memoryUsage**: Current memory usage in bytes
- **itemCount**: Number of items in cache
- **uptimeMs**: Cache uptime in milliseconds

### 2. Key-Level Metrics

Key-level metrics provide detailed performance data for individual cache keys:



#### Basic Statistics
- **hits**: Number of hits for this key
- **misses**: Number of misses for this key
- **errors**: Number of errors for this key
- **totalRequests**: Total requests for this key
- **hitRatio**: Hit ratio for this key

#### Latency Metrics
- **avgHitLatency**: Average hit latency for this key
- **minHitLatency**: Minimum hit latency for this key
- **maxHitLatency**: Maximum hit latency for this key
- **avgMissLatency**: Average miss latency for this key
- **minMissLatency**: Minimum miss latency for this key
- **maxMissLatency**: Maximum miss latency for this key
- **avgReadThroughLatency**: Average read-through latency for this key

#### Performance Metrics
- **throughput**: Requests per second for this key
- **errorRate**: Error rate for this key
- **cacheEfficiency**: Cache efficiency for this key

#### Context Information
- **dataType**: Type of data (query, request, function, custom)
- **operation**: Type of operation (READ, WRITE, etc.)
- **operationType**: Operation category (read_through, native, mixed)
- **target**: Target service name

#### Enhanced Metadata
- **metadata**: JSON string with additional metadata
- **context**: JSON string with detailed context
- **query**: CQL query text (if applicable)
- **subject**: JSON string with subject information
- **tenant**: Tenant information
- **user**: User information
- **locale**: Locale information
- **cacheOptions**: JSON string with cache options

#### Timestamps
- **lastAccess**: Last time this key was accessed
- **timestamp**: When this key was first accessed

## Data Structures

### General Metrics Response (Metrics Entity)

```javascript
{
  // Entity identification
  ID: "daily:2024-01-15",           // Unique identifier (period:date)
  cache: "caching",                  // Cache name
  timestamp: "2024-01-15T10:30:00Z", // When metrics were recorded
  period: "daily",                   // Aggregation period (hourly/daily/monthly)
  
  // Read-through metrics
  hits: 1500,                        // Number of cache hits
  misses: 300,                       // Number of cache misses
  errors: 5,                         // Number of errors
  totalRequests: 1800,               // Total read-through requests
  
  // Read-through latency metrics (milliseconds)
  avgHitLatency: 2.5,                // Average hit latency
  minHitLatency: 0.1,                // Minimum hit latency
  maxHitLatency: 15.2,               // Maximum hit latency
  avgMissLatency: 45.8,              // Average miss latency
  minMissLatency: 12.3,              // Minimum miss latency
  maxMissLatency: 120.5,             // Maximum miss latency
  avgReadThroughLatency: 8.9,        // Average read-through latency
  
  // Read-through performance metrics
  hitRatio: 0.833,                   // Hit ratio as percentage (83.3%)
  throughput: 25.5,                  // Requests per second
  errorRate: 0.003,                  // Error rate as percentage (0.3%)
  cacheEfficiency: 18.3,             // Miss latency / hit latency ratio
  
  // Native operation metrics
  nativeSets: 200,                   // Number of direct set operations
  nativeGets: 800,                   // Number of direct get operations
  nativeDeletes: 50,                 // Number of direct delete operations
  nativeClears: 2,                   // Number of clear operations
  nativeDeleteByTags: 10,            // Number of delete-by-tag operations
  nativeErrors: 1,                   // Number of native operation errors
  totalNativeOperations: 1063,       // Total native operations
  nativeThroughput: 17.7,            // Native operations per second
  nativeErrorRate: 0.001,            // Native operation error rate (0.1%)
  
  // System metrics
  memoryUsage: 52428800,             // Memory usage in bytes
  itemCount: 150,                    // Number of items in cache
  uptimeMs: 7200000                  // Cache uptime in milliseconds
}
```

### Key Metrics Response (KeyMetrics Entity)

```javascript
{
  // Entity identification
  ID: "key:user-preferences:123",    // Unique identifier
  cache: "caching",                  // Cache name
  keyName: "user-preferences:123",   // Cache key name
  lastAccess: "2024-01-15T10:30:00Z", // Last access time
  period: "current",                 // Period type (current/hourly/daily)
  operationType: "read_through",     // Operation category (read_through/native/mixed)
  
  // Read-through metrics
  hits: 45,                          // Number of hits for this key
  misses: 5,                         // Number of misses for this key
  errors: 0,                         // Number of errors for this key
  totalRequests: 50,                 // Total requests for this key
  hitRatio: 0.9,                     // Hit ratio for this key (90%)
  cacheEfficiency: 21.2,             // Cache efficiency for this key
  
  // Read-through latency metrics (milliseconds)
  avgHitLatency: 1.2,                // Average hit latency for this key
  minHitLatency: 0.5,                // Minimum hit latency for this key
  maxHitLatency: 3.1,                // Maximum hit latency for this key
  avgMissLatency: 25.4,              // Average miss latency for this key
  minMissLatency: 15.2,              // Minimum miss latency for this key
  maxMissLatency: 45.8,              // Maximum miss latency for this key
  avgReadThroughLatency: 3.8,        // Average read-through latency for this key
  
  // Read-through performance metrics
  throughput: 2.5,                   // Requests per second for this key
  errorRate: 0.0,                    // Error rate for this key (0%)
  
  // Native operation metrics for this key
  nativeHits: 10,                    // Native hits for this key
  nativeMisses: 2,                   // Native misses for this key
  nativeSets: 5,                     // Native sets for this key
  nativeDeletes: 1,                  // Native deletes for this key
  nativeClears: 0,                   // Native clears for this key
  nativeDeleteByTags: 0,             // Native delete-by-tags for this key
  nativeErrors: 0,                   // Native errors for this key
  totalNativeOperations: 18,         // Total native operations for this key
  nativeThroughput: 0.5,             // Native operations per second for this key
  nativeErrorRate: 0.0,              // Native error rate for this key
  
  // Context and metadata
  dataType: "request",               // Type of data (query/request/function/custom)
  operation: "READ",                 // Cache operation type
  metadata: '{"ttl":3600}',          // JSON string with additional metadata
  context: '{"user":"john.doe","tenant":"acme"}', // JSON string with context
  query: "SELECT * FROM UserPreferences WHERE userId = '123'", // CQL query text
  subject: '{"entity":"UserPreferences"}', // JSON string with subject info
  target: "UserService",             // Target service name
  tenant: "acme",                    // Tenant information
  user: "john.doe",                  // User information
  locale: "en-US",                   // Locale information
  cacheOptions: '{"ttl":3600}',      // JSON string with cache options
  timestamp: "2024-01-15T09:00:00Z"  // When this key was first accessed
}
```

## Accessing Metrics

### Programmatic Access

#### Current Statistics

```javascript
const cache = await cds.connect.to("caching")

// Get current statistics
const stats = await cache.getCurrentStats()
console.log('Hit ratio:', stats.hitRatio)
console.log('Average hit latency:', stats.avgHitLatency)
console.log('Throughput:', stats.throughput)

// Get current key metrics
const keyMetrics = await cache.getCurrentKeyMetrics()
for (const [key, metrics] of keyMetrics) {
    console.log(`Key ${key}:`, {
        hits: metrics.hits,
        misses: metrics.misses,
        hitRatio: metrics.hitRatio,
        avgHitLatency: metrics.avgHitLatency
    })
}
```

#### Historical Metrics

```javascript
// Get metrics for a specific time period
const from = new Date('2024-01-01')
const to = new Date('2024-01-31')
const historicalStats = await cache.getMetrics(from, to)

// Get key-specific metrics
const keyStats = await cache.getKeyMetrics('my-cache-key', from, to)
```

#### Runtime Configuration

```javascript
// Enable/disable metrics at runtime
await cache.setMetricsEnabled(true)
await cache.setKeyMetricsEnabled(true)

// Get current configuration
const config = await cache.getRuntimeConfiguration()
console.log('Metrics enabled:', config.metricsEnabled)
console.log('Key metrics enabled:', config.keyMetricsEnabled)

// Clear metrics
await cache.clearMetrics()
await cache.clearKeyMetrics()
```

### API Access

#### Get Current Metrics

```http
### Get general metrics
GET http://localhost:4004/odata/v4/caching-api/Metrics?$filter=cache eq 'caching'&$orderby=timestamp desc&$top=1

### Get key metrics
GET http://localhost:4004/odata/v4/caching-api/KeyMetrics?$filter=cache eq 'caching'&$orderby=lastAccess desc&$top=10
```

#### Enable/Disable Metrics

```http
### Enable metrics
POST http://localhost:4004/odata/v4/caching-api/Caches('caching')/setMetricsEnabled
Content-Type: application/json

{
  "enabled": true
}

### Enable key metrics
POST http://localhost:4004/odata/v4/caching-api/Caches('caching')/setKeyMetricsEnabled
Content-Type: application/json

{
  "enabled": true
}
```

## Performance Impact

### Memory Usage

- **General Metrics**: Minimal impact (~1-2 MB)
- **Key Metrics**: Can be significant for large caches
  - Each tracked key uses ~2-5 KB of memory
  - With 1000 tracked keys: ~2-5 MB additional memory
  - With 10000 tracked keys: ~20-50 MB additional memory

### CPU Impact

- **Metrics Collection**: ~1-5% CPU overhead
- **Persistence**: ~2-10% CPU overhead during persistence intervals
- **Key Tracking**: Additional 1-3% CPU overhead

### Recommendations

1. **Development**: Enable both metrics types for debugging
2. **Staging**: Enable general metrics, disable key metrics
3. **Production**: Enable general metrics only, use key metrics selectively

## Best Practices

### 1. Configuration

> **Note**: Metrics configuration is only available at runtime via the programmatic API or OData API. The persistence interval is not configurable and uses a fixed default value.

```javascript
// Development configuration (runtime)
{
  "metricsEnabled": true,
  "keyMetricsEnabled": true,
  "maxLatencies": 1000,
  "maxKeyMetrics": 100
}

// Production configuration (runtime)
{
  "metricsEnabled": true,
  "keyMetricsEnabled": false,
  "maxLatencies": 500,
  "maxKeyMetrics": 0
}
```

### 2. Monitoring Strategy

#### Key Performance Indicators (KPIs)

1. **Hit Ratio**: Target > 80% for most use cases
2. **Cache Efficiency**: Target > 10x (miss latency >> hit latency)
3. **Error Rate**: Target < 1%
4. **Memory Usage**: Monitor for memory leaks
5. **Throughput**: Ensure adequate performance

#### Alerting Thresholds

```javascript
const thresholds = {
  hitRatio: 0.7,        // Alert if hit ratio < 70%
  errorRate: 0.01,      // Alert if error rate > 1%
  avgMissLatency: 100,  // Alert if miss latency > 100ms
  memoryUsage: 1000000000 // Alert if memory > 1GB
}
```

### 3. Data Retention

- **Hourly Metrics**: Keep for 30 days
- **Daily Metrics**: Keep for 1 year
- **Key Metrics**: Keep for 7 days (high volume)



### 4. Performance Optimization

1. **Selective Key Tracking**: Only track important keys
2. **Appropriate Intervals**: Balance persistence frequency with performance
3. **Memory Management**: Monitor and clear old metrics regularly
4. **Efficient Queries**: Use filters and limits in API queries

## Troubleshooting

### Common Issues

#### 1. High Memory Usage

**Symptoms**: Memory usage growing continuously
**Causes**: Too many keys tracked
**Solutions**:
- Reduce `maxKeyMetrics`
- Clear metrics periodically

#### 2. Low Hit Ratio

**Symptoms**: Hit ratio < 50%
**Causes**: Poor cache key strategy, short TTL, frequent invalidations
**Solutions**:
- Review cache key generation
- Increase TTL values
- Optimize invalidation strategy

#### 3. High Error Rates

**Symptoms**: Error rate > 5%
**Causes**: Storage issues, configuration problems, network connectivity
**Solutions**:
- Check storage connectivity
- Verify configuration
- Review error logs
- Monitor error counts in metrics for patterns

#### 4. Performance Degradation

**Symptoms**: Increased latency, reduced throughput
**Causes**: Metrics overhead, storage issues
**Solutions**:
- Disable metrics temporarily
- Check storage performance
- Optimize configuration



### Debugging Commands

```javascript
// Check metrics status
const config = await cache.getRuntimeConfiguration()
console.log('Metrics configuration:', config)

// Check persistence status
const persistenceStatus = await cache.getPersistenceStatus()
console.log('Persistence status:', persistenceStatus)

// Manually trigger persistence
await cache.triggerPersistence()

// Get detailed key information
const keyDetails = await cache.getKeyDetails('my-key')
console.log('Key details:', keyDetails)

// Check error handling configuration
const config = await cache.getRuntimeConfiguration()
console.log('Throw on errors:', config.throwOnErrors)

// Monitor error counts
const stats = await cache.getCurrentStats()
if (stats.errors > 0) {
  console.log('Cache error count:', stats.errors)
}

### Log Analysis

Enable debug logging to troubleshoot metrics issues:

```javascript
// In your application
cds.log('cds-caching').setLevel('debug')

// Or via environment variable
process.env.CDS_LOG_LEVEL = 'debug'
```

Look for these log patterns:
- `Recorded HIT/MISS for key:` - Metrics collection
- `Starting persistStats` - Persistence operations
- `Metrics enabled/disabled` - Configuration changes
- `Failed to persist metrics` - Persistence errors

### Performance Testing

Use the built-in test suite to verify metrics functionality:

```bash
# Run metrics tests
npm test -- --grep "Metrics"

# Run performance tests
npm test -- --grep "Performance"
```

## Conclusion

The metrics system in cds-caching provides powerful insights into cache performance. By following the best practices outlined in this guide, you can effectively monitor and optimize your cache usage while minimizing performance impact.

Remember to:
- Enable metrics selectively based on your needs
- Monitor key performance indicators regularly
- Use historical data to identify trends and optimize configuration
- Implement appropriate alerting and monitoring
- Regularly review and clean up old metrics data
- Monitor error counts in metrics for cache health
- Configure throwOnErrors based on your application's error tolerance 