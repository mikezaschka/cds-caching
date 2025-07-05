# cds-caching Programmatic API Reference

This document provides a comprehensive reference for the cds-caching programmatic API, including all methods, parameters, and usage examples.

## Table of Contents

1. [Overview](#overview)
2. [Core Cache Operations](#core-cache-operations)
3. [Read-Through Operations](#read-through-operations)
4. [Utility Methods](#utility-methods)
5. [Metrics and Statistics](#metrics-and-statistics)
6. [Configuration Methods](#configuration-methods)

## Overview

The cds-caching programmatic API provides a rich set of methods for managing cache operations directly in your CAP application code. This API is designed to be intuitive and follows CAP conventions.

### Getting Started

```javascript
// Connect to the caching service
const cache = await cds.connect.to("caching")

// Basic operations
await cache.set("key", "value")
const value = await cache.get("key")
const exists = await cache.has("key")
await cache.delete("key")
```

## Core Cache Operations

### `cache.createKey(key: any)` : `string`

Creates a key from a string or an object. This method is used internally when passing keys to the cache methods, so you don't need to call it directly other than to retrieve the dynamically generated key for a given object.

#### Parameters

- `key: any` - The key to create the key from. The key can be a string or an object. If an object is used, it will be hashed to a string key using MD5. cds.Requests are handled explicitly as the dynamically generated key includes the user, tenant and locale and query hash.

#### Returns

A string key.

#### Examples

```javascript
// String key
const key1 = cache.createKey("user:123")
// Returns: "user:123"

// Object key (CQN query)
const query = SELECT.from('Users').where({ id: 123 })
const key2 = cache.createKey(query)
// Returns: "bd3f3690d3e96a569bd89d9e207a89af"

// Request key
const request = new Request({ event: 'READ', target: 'Users' })
const key3 = cache.createKey(request)
// Returns: "user-john.doe-tenant-acme-locale-en-US-bd3f3690d3e96a569bd89d9e207a89af"
```

---

### `await cache.set(key: any, value: any[, options: object])`

Sets a value in the cache.

#### Parameters

- `key: any` - The key to store the value under. The key handling is the same as for the `createKey` method.
- `value: any` - The value to store in the cache. The value will be serialized to a string using `JSON.stringify` (unless the value is already a string).
- `options: object` (optional) - Object literal containing cache options.

#### Options

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `ttl` | number | Time-to-live in milliseconds | `1000` |
| `key` | object | Key override for full control over key management | `{template: 'user-{user}', value: '123'}` |
| `tags` | array | Array of tags to associate with the value | `[{template: 'user-{user}', value: '123'}]` |

#### Examples

```javascript
// Basic set
await cache.set("user:123", { name: "John Doe", email: "john@example.com" })

// Set with TTL
await cache.set("user:123", userData, { ttl: 3600000 }) // 1 hour

// Set with custom key
await cache.set(query, result, { 
  key: { template: "query:{user}:{hash}" },
  ttl: 1800000 
})

// Set with tags
await cache.set("user:123", userData, { 
  tags: [
    { value: "user-123" },
    { template: "user-{user}" },
    { data: "id", prefix: "user-" }
  ]
})
```

---

### `await cache.get(key: any)`

Gets a value from the cache.

#### Parameters

- `key: any` - The key to retrieve the value from. The key handling is the same as for the `createKey` method.

#### Returns

The deserialized value from the cache or `undefined` if the value does not exist.

#### Examples

```javascript
// Get by string key
const user = await cache.get("user:123")

// Get by query
const query = SELECT.from('Users').where({ id: 123 })
const users = await cache.get(query)

// Get by request
const request = new Request({ event: 'READ', target: 'Users' })
const result = await cache.get(request)
```

---

### `await cache.has(key: any)`

Checks if a value exists in the cache.

#### Parameters

- `key: any` - The key to check for existence. The key handling is the same as for the `createKey` method.

#### Returns

`true` if the value exists in the cache, `false` otherwise.

#### Examples

```javascript
// Check if key exists
const exists = await cache.has("user:123")

// Check if query result is cached
const query = SELECT.from('Users').where({ id: 123 })
const isCached = await cache.has(query)
```

---

### `await cache.delete(key: any)`

Deletes a value from the cache.

#### Parameters

- `key: any` - The key to delete the value from. The key handling is the same as for the `createKey` method.

#### Returns

`true` if the key was deleted, `false` if the key didn't exist.

#### Examples

```javascript
// Delete by key
await cache.delete("user:123")

// Delete by query
const query = SELECT.from('Users').where({ id: 123 })
await cache.delete(query)
```

---

### `await cache.clear()`

Clears the whole cache.

#### Examples

```javascript
// Clear all cache entries
await cache.clear()
```

---

### `await cache.deleteByTag(tag: string)`

Deletes all values from the cache that are associated with the given tag.

#### Parameters

- `tag: string` - The tag to delete the values from.

#### Examples

```javascript
// Delete all user-related cache entries
await cache.deleteByTag("user-123")

// Delete all entries for a specific tenant
await cache.deleteByTag("tenant-acme")

// Delete all product cache entries
await cache.deleteByTag("products")
```

## Read-Through Operations

The read-through operations provide convenient methods for caching the results of service operations.

### `await cache.rt.run(query: cds.CQN, service: cds.Service, options: object)`

Runs a query against the provided service and caches the result for all further requests. This method is useful for read-through caching.

#### Parameters

- `query: cds.CQN` - The CQN query to run.
- `service: cds.Service` - The service to run the query on.
- `options: object` (optional) - The options to use for the cache.

#### Returns

The result of the query, either from the cache or the service.

#### Examples

```javascript
// Cache database query
const query = SELECT.from('Users').where({ active: true })
const users = await cache.rt.run(query, db, { ttl: 3600000 })

// Cache with custom key
const result = await cache.rt.run(query, db, { 
  key: { template: "active-users:{tenant}" },
  ttl: 1800000 
})

// Cache with tags
const result = await cache.rt.run(query, db, { 
  tags: [{ value: "active-users" }],
  ttl: 3600000 
})
```

---

### `await cache.rt.send(request: cds.Request, service: cds.Service, options: object)`

Sends a request to a cds.Service and caches the result. In contrast to the `run` method, this method is useful for caching full cds.Requests.

#### Parameters

- `request: cds.Request` - The request to send.
- `service: cds.Service` - The service to send the request to.
- `options: object` (optional) - The options to use for the cache.

#### Returns

The result of the request, either from the cache or the service.

#### Examples

```javascript
// Cache remote service request
const request = new Request({ event: 'READ', target: 'BusinessPartners' })
const partners = await cache.rt.send(request, remoteService, { ttl: 3600000 })

// Cache with user-specific key
const result = await cache.rt.send(request, remoteService, { 
  key: { template: "bp:{user}:{hash}" },
  ttl: 1800000 
})
```

---

### `await cache.rt.wrap(key: any, fn: async function, options: object)`

Wraps a function in a cache. Returns a cached version of the function that checks the cache first and only executes if there's a cache miss. **The cache key is automatically generated based on function arguments to ensure parameter-specific caching.**

#### Parameters

- `key: any` - The base key to store the cached function under. The actual cache key will include function arguments.
- `fn: async function` - The async function to wrap in a cache.
- `options: object` (optional) - The options to use for the cache.
  - `detailed: boolean` (optional) - If `true`, returns an object with `{ result, cacheKey, metadata }` instead of just the result.

#### Key Generation

The cache key is automatically generated to include function arguments, ensuring that different parameter combinations are cached separately:

- **Automatic**: By default, the key format is `{baseKey}:{arg0}:{arg1}:...:{hash}`
- **Template-based**: You can provide a custom template using `options.key.template`
- **Context-aware**: Keys can include user, tenant, and locale context

#### Returns

By default, returns the function result. If `options.detailed` is `true`, returns an object with:
- `result: any` - The function result
- `cacheKey: string` - The generated cache key
- `metadata: object` - Additional metadata including `hit` (boolean) and `latency` (number)

#### Examples

```javascript
// Basic usage - automatic argument-based key generation
const expensiveOperation = async (userId, filter) => {
  // ... expensive computation
  return result
}

const cachedOperation = cache.rt.wrap("expensive-op", expensiveOperation, { 
  ttl: 3600000,
  tags: ['computation']
})

// Use the cached function - each parameter combination gets its own cache entry
const result1 = await cachedOperation("user-123", "active")
const result2 = await cachedOperation("user-456", "inactive") // Different cache entry
const result3 = await cachedOperation("user-123", "active")   // Cache hit

// Detailed mode - get cache key and metadata
const cachedOperationDetailed = cache.rt.wrap("expensive-op", expensiveOperation, { 
  ttl: 3600000,
  tags: ['computation'],
  detailed: true
})

const { result, cacheKey, metadata } = await cachedOperationDetailed("user-123", "active")
console.log('Cache key:', cacheKey) // e.g., "expensive-op:user-123:active:a1b2c3d4"
console.log('Cache hit:', metadata.hit) // true/false
console.log('Latency:', metadata.latency) // milliseconds

// Custom template-based key generation
const cachedOperation2 = cache.rt.wrap("user-data", expensiveOperation, {
  key: { template: "user:{args[0]}:{args[1]}:{hash}" },
  ttl: 1800000
})

// Context-aware key generation
const cachedOperation3 = cache.rt.wrap("tenant-data", expensiveOperation, {
  key: { template: "{tenant}:{user}:{args[0]}:{hash}" },
  ttl: 3600000
})
```

---

### `await cache.rt.exec(key: any, fn: async function, args: Array, options: object)`

Executes a function and caches the result. This method is useful for one-off executions with caching. **The cache key is automatically generated based on function arguments to ensure parameter-specific caching.**

#### Parameters

- `key: any` - The base key to store the cached function under. The actual cache key will include function arguments.
- `fn: async function` - The async function to execute.
- `args: Array` - The arguments to pass to the function.
- `options: object` (optional) - The options to use for the cache.
  - `detailed: boolean` (optional) - If `true`, returns an object with `{ result, cacheKey, metadata }` instead of just the result.

#### Key Generation

The cache key is automatically generated to include function arguments, ensuring that different parameter combinations are cached separately:

- **Automatic**: By default, the key format is `{baseKey}:{arg0}:{arg1}:...:{hash}`
- **Template-based**: You can provide a custom template using `options.key.template`
- **Context-aware**: Keys can include user, tenant, and locale context

#### Returns

By default, returns the function result. If `options.detailed` is `true`, returns an object with:
- `result: any` - The function result
- `cacheKey: string` - The generated cache key
- `metadata: object` - Additional metadata including `hit` (boolean) and `latency` (number)

#### Examples

```javascript
// Basic usage - automatic argument-based key generation
const result = await cache.rt.exec("data-processing", async (param1, param2) => {
  // ... data processing
  return processedData
}, ["value1", "value2"], { 
  ttl: 1800000,
  tags: ['processing']
})

// Detailed mode - get cache key and metadata
const { result, cacheKey, metadata } = await cache.rt.exec("data-processing", async (param1, param2) => {
  // ... data processing
  return processedData
}, ["value1", "value2"], { 
  ttl: 1800000,
  tags: ['processing'],
  detailed: true
})

console.log('Cache key:', cacheKey) // e.g., "data-processing:value1:value2:a1b2c3d4"
console.log('Cache hit:', metadata.hit) // true/false
console.log('Latency:', metadata.latency) // milliseconds

// Custom template-based key generation
const result2 = await cache.rt.exec("user-profile", async (userId, includeDetails) => {
  // ... fetch user profile
  return profile
}, ["user-123", true], {
  key: { template: "profile:{args[0]}:{args[1]}:{hash}" },
  ttl: 3600000
})

// Context-aware key generation
const result3 = await cache.rt.exec("tenant-data", async (dataId) => {
  // ... fetch tenant-specific data
  return data
}, ["data-456"], {
  key: { template: "{tenant}:{user}:{args[0]}:{hash}" },
  ttl: 1800000
})
```

## Utility Methods

### `await cache.iterator()` : `AsyncIterator<{ key: string, value: { value: any, tags: string[], timestamp: number } }>`

Returns an iterator over all cache entries.

#### Returns

An iterator over all cache entries.

#### Examples

```javascript
// Iterate over all cache entries
const iterator = await cache.iterator()

for await (const entry of iterator) {
  console.log(`Key: ${entry.key}`)
  console.log(`Value: ${entry.value.value}`)
  console.log(`Tags: ${entry.value.tags}`)
  console.log(`Timestamp: ${entry.value.timestamp}`)
}

// Find entries by pattern
const iterator = await cache.iterator()
const userEntries = []

for await (const entry of iterator) {
  if (entry.key.startsWith('user:')) {
    userEntries.push(entry)
  }
}
```

---

### `await cache.tags(key: any)` : `string[]`

Returns the tags for a given key.

#### Parameters

- `key: any` - The key to get the tags for. The key handling is the same as for the `createKey` method.

#### Returns

An array of tags. If the key does not exist, an empty array is returned.

#### Examples

```javascript
// Get tags for a key
const tags = await cache.tags("user:123")
console.log(tags) // ["user-123", "user-john.doe"]

// Check if key has specific tag
const tags = await cache.tags("user:123")
const hasUserTag = tags.includes("user-123")
```

---

### `await cache.metadata(key: any)` : `{ tags: string[], timestamp: number } | undefined`

Returns the metadata for a given key.

#### Parameters

- `key: any` - The key to get the metadata for. The key handling is the same as for the `createKey` method.

#### Returns

An object containing the metadata for the given key or `undefined` if the key does not exist. The metadata object contains the following properties:

- `tags`: An array of tags.
- `timestamp`: The timestamp of the cache entry.

#### Examples

```javascript
// Get metadata for a key
const metadata = await cache.metadata("user:123")

if (metadata) {
  console.log(`Tags: ${metadata.tags}`)
  console.log(`Created: ${new Date(metadata.timestamp)}`)
}

// Check cache age
const metadata = await cache.metadata("user:123")
if (metadata) {
  const age = Date.now() - metadata.timestamp
  const ageMinutes = Math.floor(age / 60000)
  console.log(`Cache entry is ${ageMinutes} minutes old`)
}
```

## Metrics and Statistics

### `await cache.getCurrentStats()`

Gets the current statistics for the cache.

#### Returns

An object containing current cache statistics or `null` if metrics are disabled.

#### Examples

```javascript
// Get current statistics
const stats = await cache.getCurrentStats()

if (stats) {
  console.log(`Hit ratio: ${stats.hitRatio}`)
  console.log(`Total requests: ${stats.totalRequests}`)
  console.log(`Average hit latency: ${stats.avgHitLatency}ms`)
  console.log(`Memory usage: ${stats.memoryUsage} bytes`)
}
```

---

### `await cache.getCurrentKeyMetrics()`

Gets the current key-level metrics.

#### Returns

A Map containing key-level metrics or an empty Map if key metrics are disabled.

#### Examples

```javascript
// Get key metrics
const keyMetrics = await cache.getCurrentKeyMetrics()

for (const [key, metrics] of keyMetrics) {
  console.log(`Key: ${key}`)
  console.log(`  Hits: ${metrics.hits}`)
  console.log(`  Misses: ${metrics.misses}`)
  console.log(`  Hit ratio: ${metrics.hitRatio}`)
  console.log(`  Average hit latency: ${metrics.avgHitLatency}ms`)
}
```

---

### `await cache.getMetrics(from: Date, to: Date)`

Gets historical metrics for a specific time period.

#### Parameters

- `from: Date` - Start date for the metrics period.
- `to: Date` - End date for the metrics period.

#### Returns

An array of historical metrics data.

#### Examples

```javascript
// Get metrics for last 24 hours
const from = new Date(Date.now() - 24 * 60 * 60 * 1000)
const to = new Date()
const metrics = await cache.getMetrics(from, to)

console.log(`Found ${metrics.length} metrics records`)
```

---

### `await cache.getKeyMetrics(key: string, from: Date, to: Date)`

Gets historical key-level metrics for a specific key and time period.

#### Parameters

- `key: string` - The key to get metrics for.
- `from: Date` - Start date for the metrics period.
- `to: Date` - End date for the metrics period.

#### Returns

An array of historical key metrics data.

#### Examples

```javascript
// Get key metrics for last week
const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
const to = new Date()
const keyMetrics = await cache.getKeyMetrics("user:123", from, to)

console.log(`Found ${keyMetrics.length} key metrics records`)
```

## Configuration Methods

### `await cache.setMetricsEnabled(enabled: boolean)`

Enables or disables general metrics collection.

#### Parameters

- `enabled: boolean` - Whether to enable metrics collection.

#### Examples

```javascript
// Enable metrics
await cache.setMetricsEnabled(true)

// Disable metrics
await cache.setMetricsEnabled(false)
```

---

### `await cache.setKeyMetricsEnabled(enabled: boolean)`

Enables or disables key-level metrics collection.

#### Parameters

- `enabled: boolean` - Whether to enable key metrics collection.

#### Examples

```javascript
// Enable key metrics
await cache.setKeyMetricsEnabled(true)

// Disable key metrics
await cache.setKeyMetricsEnabled(false)
```

---

### `await cache.getRuntimeConfiguration()`

Gets the current runtime configuration.

#### Returns

An object containing the current configuration.

#### Examples

```javascript
// Get current configuration
const config = await cache.getRuntimeConfiguration()

console.log(`Metrics enabled: ${config.metricsEnabled}`)
console.log(`Key metrics enabled: ${config.keyMetricsEnabled}`)
console.log(`Store type: ${config.store}`)
console.log(`Compression: ${config.compression}`)
```

---

### `await cache.clearMetrics()`

Clears all general metrics data.

#### Examples

```javascript
// Clear metrics
await cache.clearMetrics()
```

---

### `await cache.clearKeyMetrics()`

Clears all key-level metrics data.

#### Examples

```javascript
// Clear key metrics
await cache.clearKeyMetrics()
```

---

### `await cache.reloadRuntimeConfiguration()`

Reloads the runtime configuration from the database.

#### Examples

```javascript
// Reload configuration
await cache.reloadRuntimeConfiguration()
```
