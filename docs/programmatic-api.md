# cds-caching Programmatic API Reference

This document provides a comprehensive reference for the cds-caching programmatic API, including all methods, parameters, and usage examples.

## Table of Contents

1. [Overview](#overview)
2. [Core Cache Operations](#core-cache-operations)
3. [Read-Through Operations](#read-through-operations)
4. [Key Management](#key-management)
5. [Deprecated Methods](#deprecated-methods)
6. [Utility Methods](#utility-methods)
7. [Metrics and Statistics](#metrics-and-statistics)
8. [Configuration Methods](#configuration-methods)

## Overview

The cds-caching programmatic API provides a rich set of methods for managing cache operations directly in your CAP application code. This API is designed to be intuitive and follows CAP conventions.

### Adapter packages (Redis / SQLite / Compression)

`cds-caching` only includes the in-memory store. If you configure a different store or compression, install the corresponding adapter package in your consuming project:

```bash
npm install @keyv/redis          # store: "redis"
npm install @keyv/sqlite         # store: "sqlite"
npm install @keyv/compress-lz4   # compression: "lz4"
npm install @keyv/compress-gzip  # compression: "gzip"
```

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

### Transaction isolation for basic operations (optional)

In CAP, multiple `before` handlers can run concurrently. If one handler fails and causes the request transaction to roll back, other concurrent handlers may still be running and can fail when they try to call `cds-caching` using the *request-bound* transaction.

To isolate **basic cache operations** (`get`, `set`, `delete`, `clear`, `deleteByTag`, `metadata`, `tags`, `getRaw`) from the request transaction, you can enable:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "transactionalOperations": true
      }
    }
  }
}
```

When enabled, the caching service will execute those basic operations in a dedicated cache transaction (`cache.tx()`), so they are not affected by rollbacks of the surrounding request.

## Core Cache Operations

### Error Handling

The caching service provides configurable error handling for different operation types:

#### Basic Operations Error Handling

Basic operations (`set`, `get`, `delete`, `has`) behavior depends on the `throwOnErrors` configuration:

```javascript
// With throwOnErrors: false (default)
try {
  const value = await cache.get("key")
  if (value === undefined) {
    // Handle cache miss or error
    console.log("Value not found or cache error occurred")
  }
} catch (error) {
  // Only thrown for non-cache related errors
  console.error("Unexpected error:", error)
}

// With throwOnErrors: true
try {
  const value = await cache.get("key")
  // Value will be undefined if not found, but errors will be thrown
} catch (error) {
  // Errors thrown for connection issues, etc.
  console.error("Cache error:", error)
}
```

#### Read-Through Operations Error Handling

Read-through operations (`rt.run`, `rt.send`, `rt.wrap`, `rt.exec`) never throw errors, regardless of the `throwOnErrors` setting:

```javascript
// Read-through operations always return a result, even on cache errors
const { result, cacheKey, metadata, cacheErrors } = await cache.rt.run(query, db)

if (cacheErrors && cacheErrors.length > 0) {
  console.log("Cache errors occurred:", cacheErrors)
  // Result will be fetched from remote service despite cache errors
}

// The result is always available, regardless of cache errors
return result
```

### `cache.createKey(key: any)` : `string`

Creates a key from a string or an object. This method is used internally when passing keys to the cache methods, so you don't need to call it directly other than to retrieve the dynamically generated key for a given object.

#### Parameters

- `key: any` - The key to create the key from. The key can be a string or an object. If an object is used, it will be hashed to a string key using MD5. cds.Requests are handled explicitly as the dynamically generated key includes the user, tenant and locale and query hash.

#### Returns

A string key.

#### Examples

```javascript
// String key
const key1 = cache.createKey("bp:1000001")
// Returns: "bp:1000001"

// Object key (CQN query)
const query = SELECT.from('BusinessPartners').where({ businessPartner: 1000001 })
const key2 = cache.createKey(query)
// Returns: "bd3f3690d3e96a569bd89d9e207a89af"

// Request key
const request = new Request({ event: 'READ', target: 'BusinessPartners' })
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
| `key` | string | Key template override for full control over key management | `"user:{user}:{hash}"` |
| `tags` | array | Array of tags to associate with the value | `[{template: 'user-{user}', value: '123'}]` |

#### Examples

```javascript
// Basic set
await cache.set("bp:1000001", { businessPartner: 1000001, name: "Acme Corporation", type: "2" })

// Set with TTL
await cache.set("bp:1000001", businessPartnerData, { ttl: 3600000 }) // 1 hour

// Set with custom key template
await cache.set(query, result, { 
  key: "query:{user}:{hash}",
  ttl: 1800000 
})

// Set with tags
await cache.set("bp:1000001", businessPartnerData, { 
  tags: [
    { value: "bp-1000001" },
    { template: "bp-{user}" },
    { data: "businessPartner", prefix: "bp-" }
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
const businessPartner = await cache.get("bp:1000001")

// Get by query
const query = SELECT.from('BusinessPartners').where({ businessPartner: 1000001 })
const businessPartners = await cache.get(query)

// Get by request
const request = new Request({ event: 'READ', target: 'BusinessPartners' })
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
const exists = await cache.has("bp:1000001")

// Check if query result is cached
const query = SELECT.from('BusinessPartners').where({ businessPartner: 1000001 })
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
await cache.delete("bp:1000001")

// Delete by query
const query = SELECT.from('BusinessPartners').where({ businessPartner: 1000001 })
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
// Delete all business partner-related cache entries
await cache.deleteByTag("bp-1000001")

// Delete all entries for a specific tenant
await cache.deleteByTag("tenant-acme")

// Delete all product cache entries
await cache.deleteByTag("products")
```

## Read-Through Operations

The read-through operations provide convenient methods for caching the results of service operations with enhanced functionality including automatic key generation and detailed metadata.

### Return Format

All read-through `rt.xxx` methods return an object with the following structure:

```javascript
{
  result: any,           // The actual result from the operation
  cacheKey: string,      // The dynamically generated cache key
  metadata: object,      // Cache metadata (hit/miss, latency, etc.)
  cacheErrors?: string[] // Array of cache error messages (if any occurred)
}
```

**Error Handling:**

- **Basic Operations** (`set`, `get`, `delete`, `has`): Behavior depends on `throwOnErrors` configuration
  - `throwOnErrors: false` (default): Return `undefined`/`null` on errors
  - `throwOnErrors: true`: Throw errors for connection issues, etc.

- **Read-Through Operations** (`rt.run`, `rt.send`, `rt.wrap`, `rt.exec`): Never throw errors
  - Always return a result (fetched from remote service if cache fails)
  - Include `cacheErrors` array when cache operations fail
  - Log errors for monitoring and debugging

### `await cache.rt.run(query: cds.CQN | cds.Request, service: cds.Service, options: object)`

Runs a query against the provided service and caches the result for all further requests. This method is the primary read-through method for CAP applications, handling CQN queries and ODataRequests.

#### Parameters

- `query: cds.ql | cds.Request` - The CQN query or CAP request to run.
- `service: cds.Service` - The service to run the query on.
- `options: object` (optional) - The options to use for the cache.

#### Key Generation

**For CQN queries:**
- Key components hashed as md5: Query structure (SELECT, FROM, WHERE, ORDER BY, LIMIT, etc.) and query parameters
- Global context (user, tenant, locale based on configuration) is prepended

**For CAP requests:**
- Key components hashed as md5: Request params and data, target entity, query parameters ($filter, $select, $expand, $orderby, etc.)
- Global context (user, tenant, locale based on configuration) is available

#### Returns

An object containing:
- `result: any` - The result of the query, either from the cache or the service
- `cacheKey: string` - The dynamically generated cache key
- `metadata: object` - Cache metadata including `hit` (boolean) and `latency` (number)
- `cacheErrors?: string[]` - Array of cache error messages (if any occurred)

#### Examples

```javascript
// Cache database query
const query = SELECT.from('BusinessPartners').where({ businessPartnerType: '2' })
const { result, cacheKey, metadata } = await cache.rt.run(query, db, { ttl: 3600000 })

// Cache with custom key template
const { result, cacheKey, metadata } = await cache.rt.run(query, db, { 
  key: "active-bps:{tenant}:{hash}",
  ttl: 1800000 
})

// Cache CAP request in service handler
this.on('READ', BusinessPartners, async (req, next) => {
  const { result, cacheKey, metadata } = await cache.rt.run(req, next)
  return result
})

// Cache with tags
const { result, cacheKey, metadata } = await cache.rt.run(query, db, { 
  tags: [{ value: "active-business-partners" }],
  ttl: 3600000 
})

// Handle cache errors
const { result, cacheKey, metadata, cacheErrors } = await cache.rt.run(query, db)

if (cacheErrors && cacheErrors.length > 0) {
  console.log("Cache errors occurred:", cacheErrors)
  // Result is still available from remote service
}

// The result is always available, regardless of cache errors
return result

---

### `await cache.rt.send(request: object, service: cds.Service, options: object)`

Sends a request to a cds.Service and caches the result. This method is useful for caching remote service requests.

#### Parameters

- `request: object` - The request object with method and path.
- `service: cds.Service` - The service to send the request to.
- `options: object` (optional) - The options to use for the cache.

#### Key Generation

**Key components:**
- HTTP method
- Request path with query parameters
- Global context (user, tenant, locale based on configuration)
- Hash: MD5 hash of the request structure

#### Returns

An object containing:
- `result: any` - The result of the request, either from the cache or the service
- `cacheKey: string` - The dynamically generated cache key
- `metadata: object` - Cache metadata including `hit` (boolean) and `latency` (number)
- `cacheErrors?: string[]` - Array of cache error messages (if any occurred)

#### Examples

```javascript
// Cache remote service request
const request = { method: "GET", path: "Products?$top=10" }
const { result, cacheKey, metadata } = await cache.rt.send(request, remoteService, { ttl: 3600000 })

// Cache with user-specific key template
const { result, cacheKey, metadata } = await cache.rt.send(request, remoteService, { 
  key: "bp:{user}:{hash}",
  ttl: 1800000 
})

// Cache with context-aware key
const { result, cacheKey, metadata } = await cache.rt.send(request, remoteService, { 
  key: "{tenant}:{user}:{hash}",
  ttl: 3600000 
})

// Handle cache errors
const { result, cacheKey, metadata, cacheErrors } = await cache.rt.send(request, remoteService)

if (cacheErrors && cacheErrors.length > 0) {
  console.log("Cache errors occurred:", cacheErrors)
  // Result is still available from remote service
}

---

### `cache.rt.wrap(key: any, fn: async function, options: object)`

Wraps a function in a cache. Returns a cached version of the function that checks the cache first and only executes if there's a cache miss. **The cache key is automatically generated based on function arguments to ensure parameter-specific caching.**

#### Parameters

- `key: any` - The base key to store the cached function under. The actual cache key will include function arguments.
- `fn: async function` - The async function to wrap in a cache.
- `options: object` (optional) - The options to use for the cache.

#### Key Generation

The cache key is automatically generated to include function arguments, ensuring that different parameter combinations are cached separately:

- **Default template:** `{baseKey}:{args[0]}:{args[1]}:...:{args[n]}` (if no global context enabled)
- **Template-based:** You can provide a custom template using `options.key` (string)
- **Context-aware:** Keys can include user, tenant, and locale context

#### Returns

A function that returns an object containing:
- `result: any` - The function result
- `cacheKey: string` - The generated cache key
- `metadata: object` - Additional metadata including `hit` (boolean) and `latency` (number)
- `cacheErrors?: string[]` - Array of cache error messages (if any occurred)

#### Examples

```javascript
// Basic usage - automatic argument-based key generation
const fetchBusinessPartnerData = async (businessPartnerId, includeAddresses) => {
  // ... expensive computation to fetch BP data
  return businessPartnerData
}

const cachedOperation = cache.rt.wrap("bp-data", fetchBusinessPartnerData, { 
  ttl: 3600000,
  tags: ['business-partner']
})

// Use the cached function - each parameter combination gets its own cache entry
const { result, cacheKey, metadata } = await cachedOperation("1000001", true)
const { result: result2, cacheKey: key2, metadata: metadata2 } = await cachedOperation("1000002", false) // Different cache entry
const { result: result3, cacheKey: key3, metadata: metadata3 } = await cachedOperation("1000001", true)   // Cache hit

console.log('Cache key:', cacheKey) // e.g., "bp-data:1000001:true:a1b2c3d4"
console.log('Cache hit:', metadata.hit) // true/false
console.log('Latency:', metadata.latency) // milliseconds

// Handle cache errors
const { result, cacheKey, metadata, cacheErrors } = await cachedOperation("1000001", true)

if (cacheErrors && cacheErrors.length > 0) {
  console.log("Cache errors occurred:", cacheErrors)
  // Result is still available from function execution
}

// Custom template-based key generation
const cachedOperation2 = cache.rt.wrap("bp-data", fetchBusinessPartnerData, {
  key: "bp:{args[0]}:{args[1]}:{hash}",
  ttl: 1800000
})

// Context-aware key generation
const cachedOperation3 = cache.rt.wrap("tenant-bp-data", fetchBusinessPartnerData, {
  key: "{tenant}:{user}:{args[0]}:{hash}",
  ttl: 3600000
})

// Override global configuration for specific operations
const cachedOperation4 = cache.rt.wrap("public-bp-data", fetchBusinessPartnerData, {
  key: "{baseKey}:{args[0]}" // No user context, even if globally enabled
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

#### Key Generation

The cache key is automatically generated to include function arguments, ensuring that different parameter combinations are cached separately:

- **Default template:** `{baseKey}:{args[0]}:{args[1]}:...:{args[n]}` (if no global context enabled)
- **Template-based:** You can provide a custom template using `options.key` (string)
- **Context-aware:** Keys can include user, tenant, and locale context

#### Returns

An object containing:
- `result: any` - The function result
- `cacheKey: string` - The generated cache key
- `metadata: object` - Additional metadata including `hit` (boolean) and `latency` (number)
- `cacheErrors?: string[]` - Array of cache error messages (if any occurred)

#### Examples

```javascript
// Basic usage - automatic argument-based key generation
const { result, cacheKey, metadata } = await cache.rt.exec("product-processing", async (productId, includePricing) => {
  // ... product data processing
  return processedProductData
}, ["1000001", true], { 
  ttl: 1800000,
  tags: ['product-processing']
})

console.log('Cache key:', cacheKey) // e.g., "product-processing:1000001:true:a1b2c3d4"
console.log('Cache hit:', metadata.hit) // true/false
console.log('Latency:', metadata.latency) // milliseconds

// Handle cache errors
const { result, cacheKey, metadata, cacheErrors } = await cache.rt.exec("product-processing", async (productId, includePricing) => {
  // ... product data processing
  return processedProductData
}, ["1000001", true], { 
  ttl: 1800000,
  tags: ['product-processing']
})

if (cacheErrors && cacheErrors.length > 0) {
  console.log("Cache errors occurred:", cacheErrors)
  // Result is still available from function execution
}

// Custom template-based key generation
const { result, cacheKey, metadata } = await cache.rt.exec("bp-profile", async (businessPartnerId, includeAddresses) => {
  // ... fetch business partner profile
  return businessPartnerProfile
}, ["1000001", true], {
  key: "bp-profile:{args[0]}:{args[1]}:{hash}",
  ttl: 3600000
})

// Context-aware key generation
const { result, cacheKey, metadata } = await cache.rt.exec("tenant-bp-data", async (businessPartnerId) => {
  // ... fetch tenant-specific business partner data
  return businessPartnerData
}, ["1000001"], {
  key: "{tenant}:{user}:{args[0]}:{hash}",
  ttl: 1800000
})
```

## Key Management

The cds-caching library provides automatic key generation for all cache operations, with support for context awareness and custom templates.

### Global Configuration

Configure key management behavior in your `package.json`:

```json
{
  "cds-caching": {
    "keyManagement": {
      "isUserAware": true,
      "isTenantAware": true,
      "isLocaleAware": false
    }
  }
}
```

**Default behavior** (if not configured):
- `isUserAware`: `false` - Include the logged in user in cache keys
- `isTenantAware`: `false` - Include tenant context in cache keys  
- `isLocaleAware`: `false` - Include locale context in cache keys

### Key Template Variables

The following variables are available in key templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{hash}` | MD5 hash of the content being cached | `"a1b2c3d4..."` |
| `{user}` | Current user ID | `"john.doe"` |
| `{tenant}` | Current tenant | `"acme"` |
| `{locale}` | Current locale | `"en-US"` |
| `{baseKey}` | The base key provided to the method | `"user-data"` |
| `{args[0]}`, `{args[1]}`, etc. | Function arguments | `"user1"`, `"true"` |

### Generated Default Templates

Based on the global configuration, the system generates default templates:

```javascript
// Configuration: { isUserAware: false, isTenantAware: false, isLocaleAware: false }
// Default applied template: "{hash}"
// Result: "a1b2c3d4..." (hash only)

// Configuration: { isUserAware: true, isTenantAware: false, isLocaleAware: false }
// Default applied template: "{user}:{hash}"
// Result: "john.doe:a1b2c3d4..."

// Configuration: { isUserAware: true, isTenantAware: true, isLocaleAware: false }
// Default applied template: "{tenant}:{user}:{hash}"
// Result: "acme:john.doe:a1b2c3d4..."

// Configuration: { isUserAware: true, isTenantAware: true, isLocaleAware: true }
// Default applied template: "{tenant}:{user}:{locale}:{hash}"
// Result: "acme:john.doe:en-US:a1b2c3d4..."
```

### Content Hash Generation

The hash is generated only from the **content being cached**, not from the context:

- **Queries**: Hash includes only the query structure (SELECT, FROM, WHERE, etc.)
- **Requests**: Hash includes only the request information (method, path, parameters)
- **Functions**: No hash needed since all context is available in the template

This ensures that:
- Same query/request from different users gets different keys (via global context)
- But the hash remains consistent for the same content
- Cache invalidation works properly (same query = same hash)

### Custom Key Templates

You can override the default key generation by providing a custom template:

```javascript
// User-specific caching
const cachedOperation = cache.rt.wrap("user-data", expensiveOperation, {
  key: "user:{user}:{args[0]}"
})

// Tenant-aware caching
const cachedOperation = cache.rt.wrap("tenant-data", expensiveOperation, {
  key: "tenant:{tenant}:{args[0]}"
})

// Complex template
const cachedOperation = cache.rt.wrap("complex", expensiveOperation, {
  key: "{baseKey}:{user}:{tenant}:{args[0]}:{args[1]}"
})

// Override global configuration for specific operations
const cachedOperation = cache.rt.wrap("public-data", expensiveOperation, {
  key: "{baseKey}:{args[0]}" // No user context, even if globally enabled
})
```

## Deprecated Methods

The following methods are deprecated and will be removed in future versions. Use the new read-through API instead.

### Deprecated send() Method

**⚠️ Deprecated:** Use `cache.rt.send()` instead.

```javascript
// ❌ Deprecated
const result = await cache.send(request, service)

// ✅ Recommended
const { result, cacheKey, metadata } = await cache.rt.send(request, service)
```

The `rt.send()` method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.

### Deprecated run() Method

**⚠️ Deprecated:** Use `cache.rt.run()` instead.

```javascript
// ❌ Deprecated
const result = await cache.run(query, db)

// ✅ Recommended
const { result, cacheKey, metadata } = await cache.rt.run(query, db)
```

The `rt.run()` method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.

### Deprecated wrap() Method

**⚠️ Deprecated:** Use `cache.rt.wrap()` instead.

```javascript
// ❌ Deprecated
const cachedFunction = cache.wrap("key", expensiveOperation)
const result = await cachedFunction("param1", "param2")

// ✅ Recommended
const cachedFunction = cache.rt.wrap("key", expensiveOperation)
const { result, cacheKey, metadata } = await cachedFunction("param1", "param2")
```

The `rt.wrap()` method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.

### Deprecated exec() Method

**⚠️ Deprecated:** Use `cache.rt.exec()` instead.

```javascript
// ❌ Deprecated
const result = await cache.exec("key", expensiveOperation, ["param1", "param2"])

// ✅ Recommended
const { result, cacheKey, metadata } = await cache.rt.exec("key", expensiveOperation, ["param1", "param2"])
```

The `rt.exec()` method provides enhanced functionality including read-through metadata, dynamic cache keys, and detailed mode options.

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

### `await cache.getCurrentMetrics()`

Gets the current statistics for the cache.

#### Returns

An object containing current cache statistics or `null` if metrics are disabled.

#### Examples

```javascript
// Get current statistics
const stats = await cache.getCurrentMetrics()

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


