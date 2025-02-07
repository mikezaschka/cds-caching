# Welcome to cds-caching

## Overview

This plugin for the [SAP Cloud Application Programming Model (CAP)](https://cap.cloud.sap/docs/) provides a caching service to improve performance in CAP applications.
While CAP in general performs well for most use cases, caching can help with:
- Slow remote service calls
- Complex calculations
- Heavy queries
- External API integration 

While caching can help with these, it also adds complexity and should be used judiciously.

Please also read the introduction blog post in the SAP Community: [Boosting performance in SAP Cloud Application Programming Model (CAP) applications with cds-caching](https://community.sap.com/t5/technology-blogs-by-members/boosting-performance-in-sap-cloud-application-programming-model-cap/ba-p/14002015).

### Caching vs. Replication

It's important to understand the difference between **caching** and **data replication**:

* **Caching** temporarily stores data to reduce latency and improve response times. It's ideal for read-heavy workloads but does not maintain data integrity or understand data semantics.

* **Replication** creates full, persistent copies of remote data within your application to ensure availability and enable seamless data sharing across systems. It focuses on resilience rather than performance optimization.

cds-caching is specifically designed for efficient caching, not data replication.

### Key Features

* **Flexible Key-Value Store** – Store and retrieve data using simple key-based access.
* **CachingService** – A CALESI-compliant cds.Service implementation with an intuitive API for seamless integration.
* **Event Handling** – Monitor and react to cache events, such as before/after storage and retrieval.
* **CAP-specific Caching** – Effortlessly cache CQN queries or CAP cds.Requests using code or the @cache annotation.
* **TTL Support** – Automatically manage data expiration with configurable time-to-live (TTL) settings.
* **Tag Support** – Use dynamic tags for flexible cache invalidation options.
* **Pluggable Storage Options** – Choose between in-memory caching or Redis.
* **Compression** – Compress cached data to save memory using LZ4 or GZIP.
* **Integrated Statistics** – Monitor cache performance with hit rates, latencies, and more.

### Installation

Installing and using cds-caching is straightforward since it's a CAP plugin. Simply run:

```bash
npm install cds-caching
```

Next, add a caching service configuration to your package.json. You can even define **multiple caching services**, which is recommended if you need to cache different types of data within your application.

```javascript
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "namespace": "my::app::caching"
      },
      // Optional: Define a specific caching service for Business Partner API
      "bp-caching": {
        "impl": "cds-caching",
        "namespace": "my::app::bp-caching"
      }
    }
  }
}
```

### Advanced Configuration

For more control, you can specify additional options:

```javascript
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "namespace": "my::app::caching",
        "store": "in-memory", // "in-memory" or "redis"
        "compression": "lz4", // "lz4" or "gzip"
        "credentials": { // if store is redis
          "host": "localhost",
          "port": 6379,
          "password": "optional",
          "url": "redis://..." // Alternative: Redis connection URI
        },
        "statistics": {
          "enabled": true,
          "persistenceInterval": 60000, // Optional: Interval for statistics persistence
          "maxLatencies": 1000 // Optional: Maximum number of latencies to track
        }
      }
    }
  }
}
```

### Usage Patterns

The caching service provides a flexible API for caching data in CAP applications. Here are the key usage patterns:
#### 1. Low-Level Key-Value API

The most basic way to use cds-caching is through its key-value API:

```javascript
// Connect to the caching service
const cache = await cds.connect.to("caching")

// Store a value (can be any object)
await cache.set("key", "value")

// Retrieve the value
await cache.get("key") // => value

// Check if the key exists
await cache.has("key") // => true/false

// Delete the key
await cache.delete("key")

// Clear the whole cache
await cache.clear()
```

#### 2. CQN Query Caching

For more advanced CAP integration, cache CAP's CQN queries directly. By passing in the query, a dynamic key is generated based on the CQN structure of the query. Note, that passing in queries with dynamic parameters (e.g. `SELECT.from(Foo).where({id: 1})`) will result in a different key for each query execution.

```javascript
// Create and execute a CQN query
const query = SELECT.from(Foo)
const result = await db.run(query)

// Cache the result
await cache.set(query, result)

// Retrieve from cache using the same query
const cachedResult = await cache.get(query)
```
Handling the cache manually via read-aside pattern is possible, but the caching service provides a more convenient way to cache and retrieve CQN queries. By using the `run` method, the caching service will transparently cache the result of the query and return the cached result if available for all further requests.

```javascript
const query = SELECT.from(Foo)

// Runs the query internally and caches the result
const result = await cache.run(query, db)
```

This will transparently cache the result of the query and return the cached result if available for all further requests.

#### 3. Request-Level Caching

Cache entire CAP requests with context awareness (e.g. user, tenant, locale, etc.), which is useful for caching slow remote service calls. The caching service will automatically generate a key for the request based on the request object and the current user, tenant and locale.

```javascript
this.on('READ', BusinessPartners, async (req, next) => {
  const bupa = await cds.connect.to('API_BUSINESS_PARTNER')
  let value = await cache.get(req)
  if(!value) {
    value = await bupa.run(req)
    await cache.set(req, value, { ttl: 3600 })
  }
  return value
})
```

Alternatively use read-through caching via the `run` method to let the caching service handle the caching transparently:

```javascript
const bupa = await cds.connect.to('API_BUSINESS_PARTNER')
const result = await cache.run(req, bupa)
```

This will transparently cache the result of the request and return the cached result if available for all further requests.

#### 4. Declarative Caching with Annotations

Use annotations to enable caching on service entities or OData functions. The caching service will automatically generate a key for the request based on the request object and the current user, tenant and locale. 

**Caching an entire entity should be used with caution, as it will cache all permutations of requests ($filter, $expand, $orderby, etc.) on the entity, which will lead to a huge number of cache entries. Use this only for entities where you can guarantee a low number of different queries.**

```
service MyService {
  @cache: {     
    ttl: 3600
  }
  entity BusinessPartners as projection on BusinessPartner {
    // ... entity definition
  }


  @cache: {
    ttl: 1800,
    tags: [{
      template: 'user-{user}'
    }]
  }
  function getUserPreferences() returns array of Preferences;
}
```

#### 5. Function Caching

While not directly related to CAP functionality, the caching service provides two methods for read-through caching of JavaScript functions:

```javascript
// Using wrap() to create a cached version of a function
const expensiveOperation = async (value) => {
  // ... some expensive computation
  return result
}

// Creates a cached version of the function
const cachedOperation = cache.wrap("key", expensiveOperation, { 
  ttl: 3600,
  tags: ['computation']
})

// Each call checks cache first, only executes if cache miss
const result = await cachedOperation("input")

// Using exec() for immediate execution with caching
const result = await cache.exec("key", async () => {
  // ... some expensive computation
  return result
}, { 
  ttl: 3600,
  tags: ['computation']
})
```

The key differences between `wrap()` and `exec()`:
- `wrap()` returns a new function that includes caching logic
- `exec()` immediately executes the function and caches the result
- Use `wrap()` when you need to reuse the cached function multiple times
- Use `exec()` for one-off executions with caching

### Cache Invalidation Strategies

The caching service provides different strategies to invalidate cached values.

**IMPORTANT: You should not use cds-caching without a proper invalidation strategy.**

#### 1. Time-Based (TTL)

The most basic strategy is to use a time-to-live (TTL) for the cache. The caching service will automatically delete the value from the cache after the specified TTL has expired.
The TTL can be specified for individually through all cache methods (e.g. `set`, `run`, `send`, `wrap`, `exec`).

```javascript
// Store with 60 seconds TTL
await cache.set("key", "value", { ttl: 60000 })

// Run with 30 seconds TTL
const result = await cache.run(query, db, { ttl: 30000 })

// Send with 10 seconds TTL
const result = await cache.send(request, service, { ttl: 10000 })

// Wrap with 10 seconds TTL
const cachedOperation = cache.wrap("key", expensiveOperation, { ttl: 10000 })

// Exec with 10 seconds TTL
const result = await cache.exec("key", async () => {
  // ... some expensive computation
  return result
}, { 
  ttl: 10000
})
```

#### 2. Tag-Based

Tags are a way to invalidate cache entries based on a specific tag. Tags need to be provided explicitly when storing a value in the cache and are supported for all cache methods (e.g. `set`, `run`, `send`, `wrap`, `exec`).
Tags can be provided as an array of strings or as an array of objects with the following properties:
- `value`: The value to use for the tag.
- `data`: A field from the value to use for the tag. This is working for objects and arrays of objects.
- `prefix`: A prefix that will be added to the tag.
- `suffix`: A suffix that will be added to the tag.
- `template`: A template string that will be used to generate the tag (e.g. `{tenant}-{locale}-{user}-{hash}`). This is useful for dynamic tags based on cds.Requests. 
Templates support the following properties:
  - `{user}`: The current user
  - `{tenant}`: The current tenant
  - `{locale}`: The current locale
  - `{hash}`: The hash of the current query



```javascript

// Store with tags
await cache.set("key", "value", { 
  tags: [{ value: "user-123" }] 
})

// Invalidate by tag
await cache.deleteByTag('user-123')
```
This is really useful for invalidating cache entries based on a specific attribute or context.

#### 3. Dynamic Tags

Dynamic tags using data `data` property are a way to invalidate cache entries based on the data itself. The caching service will automatically generate a tag for the value and invalidate the cache entry when the value changes.

```javascript

const businessPartners = [
  {
    businessPartner: 1,
    name: 'John Doe'
  },
  {
    businessPartner: 2,
    name: 'Jane Doe'
  }
]

// Store with dynamic tags
await cache.set("key", businessPartners, { 
  tags: [
    { data: 'businessPartner', prefix: 'bp-' },
    { value: "businessPartner" }
  ]
})

// Introspect the tags
const tags = await cache.tags("key") // => ["bp-1", "bp-2", "businessPartner"]

// Invalidate by tag
await cache.deleteByTag('bp-1')
await cache.deleteByTag('bp-2')
```

This is really usefull for caching results with multiple rows where you can't predict the tags beforehand or when you want to invalidate cache entries based on the data itself. This is also possible for the `run` method.

```javascript
const result = await cache.run(query, db, { 
  tags: [{ data: 'businessPartner', prefix: 'bp-' }]
})
```

This will transparently cache the result of the query and create a tag for each business partner in the result. If you use the same technique in other places and you want to invalidate the cache entries for a specific business partner, you can do this by simply invalidating the tag `bp-1`.

### Cache Iteration

The caching service provides an iterator interface to traverse all cache entries:

```javascript
const iterator = await cache.iterator()

for await (const entry of iterator) {
  console.log(entry)
}
```

This will return an iterator over all cache entries. You can use this to traverse all cache entries and invalidate them based on a specific condition. You should only use this for small caches (e.g. by using multiple caching services with different namespaces).

### OData Service Caching Considerations

While caching individual requests can improve performance, **caching an entire OData service is generally not recommended**. Here's why:

1. **Data Consistency**: OData services expose live business data that frequently changes. Caching responses without an appropriate invalidation strategy can lead to outdated or incorrect data being served.

2. **Query Complexity**: OData allows dynamic query parameters ($filter, $expand, $orderby, etc.), making it difficult to cache efficiently without storing excessive variations.

3. **Payload Size**: Full OData responses can be significantly large, consuming cache memory inefficiently compared to caching targeted CQN queries or specific request results.

Instead of caching entire OData service responses, focus on:
- Specific queries or request results
- Static master data
- Computed results
- Remote service calls with stable data

### Best Practices

1. **Cache Selectively**: Not all data benefits from caching. Focus on:
   - Frequently accessed, rarely changed data
   - Computationally expensive operations
   - Remote service calls with stable data

2. **Use Appropriate TTLs**: Set TTLs based on data volatility:
   - Short TTLs (seconds/minutes) for frequently changing data
   - Longer TTLs (hours/days) for stable reference data

3. **Implement Cache Tags**: Use tags for granular cache invalidation:
   - Group related cache entries
   - Enable targeted invalidation
   - Use dynamic tags for user/tenant-specific caching

4. **Monitor Cache Performance**: Regularly check cache statistics:
   - Hit rates
   - Memory usage
   - Response times
   - Error rates

### Limitations and Considerations

1. **Memory Usage**: Monitor cache size, especially with in-memory storage
2. **Consistency**: Consider data freshness requirements when setting TTLs
3. **Multi-Tenant**: Use appropriate namespacing and key strategies
4. **Redis Setup**: Ensure proper configuration for production use

## Full API

### `cache.createKey(key: any)` : `string`

Creates a key from a string or an object. This method is used internally when passing keys to the cache methods, so you don't need to call it directly other then to retrieve the dynamic generated key for a given object.

#### `key: any`

The key to create the key from. The key can be a string or an object. If an object is used, it will be hashed to a string key using MD5. cds.Requests are handled explicitly as the dynamic generated key includes the user, tenant and locale and query hash.

#### Returns

A string key.

---

### `await cache.set(key: any, value: any[, options: object])`

Sets a value in the cache.

#### `key: any`

The key to store the value under. The key handling is the same as for the `≈` method.

#### `value: any`

The value to store in the cache. The value will be serialized to a string using `JSON.stringify` (unless the value is already a string).

#### `options: object`

Object literal containing cache options.

The following properties are accepted:

| Property      | Description   | Example  |
| ------------- | ------------- | ----------
| ttl           | Time-to-live in milliseconds. | `1000`
| tags          | Array of tags to associate with the value. Tags can be dynamic based on the given value (see chapter Cache Invalidation Strategies) | `[{template: 'user-{user}', value: '123'}]`

---

### `await cache.get(key: any)`

Gets a value from the cache.

#### `key: any`

The key to retrieve the value from. The key handling is the same as for the `createKey` method.

#### Returns

The deserialized value from the cache or `undefined` if the value does not exist.

---

### `await cache.has(key: any)`

Checks if a value exists in the cache.

#### `key: any`

The key to check for existence. The key handling is the same as for the `createKey` method.

#### Returns

`true` if the value exists in the cache, `false` otherwise.

---

### `await cache.delete(key: any)`

Deletes a value from the cache. 

#### `key: any`

The key to delete the value from. The key handling is the same as for the `createKey` method.

--- 

### `await cache.clear()`

Clears the whole cache.

---

### `await cache.deleteByTag(tag: string)`

Deletes all values from the cache that are associated with the given tag.

#### `tag: string`

The tag to delete the values from.

--- 

### `await cache.run(query: cds.CQN , service: cds.Service)`

Runs a query against the provided service and caches the result for all further requests. This method is useful for read-through caching. (see Usage Patterns and [CAP docs](https://cap.cloud.sap/docs/node.js/core-services#srv-run-query) for more information)

#### `object: cds.CQN`

The CQN query to run.

#### `service: cds.Service`

The service to run the query on.

#### Returns

The result of the query, either from the cache or the service.

---

### `await cache.send(request: cds.Request, service: cds.Service)`

Sends a request to a cds.Service and caches the result. In contrast to the `run` method, this method is useful for caching full cds.Requests.

#### `request: cds.Request`

The request to send.  

#### `service: cds.Service  `

The service to send the request to.

#### Returns

The result of the request, either from the cache or the service.

---

### `await cache.wrap(key: any, fn: async function, options: object)`

Wraps a function in a cache.

#### `key: any` 

The key to store the cached function under. The key handling is the same as for the `createKey` method. 

#### `fn: async function`

The async function to wrap in a cache.

#### `options: object`

The options to use for the cache.

#### Returns

A cached version of the function. The cached function will check the cache first and only execute the function if the cache miss.

---

### `await cache.exec(key: any, fn: async function, options: object)`

Executes a function and caches the result. This method is useful for one-off executions with caching.

#### `key: any`

The key to store the cached function under. The key handling is the same as for the `createKey` method. 

#### `fn: async function`

The async function to execute.

#### `options: object`

The options to use for the cache. 

#### Returns

The result of the function.

--- 

### `await cache.iterator()`

Returns an iterator over all cache entries.

#### Returns  

An iterator over all cache entries.

---


### Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

### License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.