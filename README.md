# Welcome to cds-caching

## Overview

This plugin for the [SAP Cloud Application Programming Model (CAP)](https://cap.cloud.sap/docs/) provides a robust caching service for CAP applications, addressing common performance challenges in distributed systems.

By reducing database requests and accelerating response times, caching is ideal for handling expensive operations like complex queries/calculations or external API calls. However, it introduces another layer of complexity and should be used with caution.

### Key Features

- **Flexible Key-Value Store**: Easily store and retrieve data by key.
- **High-Level Caching**: Cache results of CQN queries or requests with minimal effort (via code or `@cache` annotation).
- **Low-Level Control**: Fine-tune caching processes with full control using the cache service.
- **Event Handling**: Monitor cache events (e.g., pre/post storage or retrieval).
- **TTL Support**: Set data expiration automatically with time-to-live configurations.
- **Pluggable Stores**: Choose between in-memory caching or external solutions like Redis.
- **Tag-Based Invalidation**: Group related cache entries and invalidate them together.
- **Compression**: Optional LZ4 or GZIP compression for cached data.

## Caching vs. Replication

Caching and replication are two common strategies for improving performance in distributed systems. While both involve storing duplcated data, they serve different purposes and have distinct characteristics:

- **Caching**: Temporarily stores frequently accessed data to reduce latency and improve response times. Caching is ideal for read-heavy workloads and can be used to store the results of expensive operations (e.g., complex queries, calculations, or external API calls), but it is __stupid__ and does not know about the data semantics.
- **Replication**: Copies data across services to ensure high availability, fault tolerance and allows to fully make use of CAP's powerful database and OData features.

`cds_caching` is a caching solution providing a flexible and efficient way to cache data and accelerate response times, however, it is not a replication solution (which may be implemented in the future as it's own plugin).

## Getting started

### Installation

```bash
npm install cds-caching
```

### Configuration

Add the following configuration to your `package.json`:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "namespace": "my::app::caching"
      }
    }
  }
}
```

### Advanced Configuration

For more control, you can specify additional options:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "namespace": "my::app::caching",
        "options": {
          "store": "memory",  // "memory" or "redis"
          "compression": "lz4",  // "lz4", "gzip", or false
          "ttl": 3600,  // default TTL in seconds
          "maxSize": 1000,  // maximum number of items (memory store only)
          "maxMemory": 104857600,  // maximum memory usage in bytes (memory store only)
          "redis": {
            "host": "localhost",
            "port": 6379,
            "password": "optional",
          }
        }
      }
    }
  }
}
```

# Usage

## Low level caching

Low level caching allows you to store and retrieve any data at any time. This can be useful if you want to cache data that is not directly related to a CQN query or a request in CAP, such as the result of a complex calculation. While low level caching is more flexible, high level caching is easier to use and is recommended for most use cases.

```javascript
    // Connect to the caching service 
    const cache = await cds.connect.to("caching")

    // Store a value 
    await cache.set("key", "value")

    // Retrieve the value
    await cache.get("key") // => value

    // Delete the value
    await cache.delete("key")

    // Check if the value exists
    await cache.has("key") // => false

    // Store a value with a TTL of 1000ms
    await cache.set("key", "value", 1000)

    // If the TTL is over
    await cache.get("key") // => undefined

    // Clear the cache
    await cache.clear()
```

## Event handling

You can listen to cache events, such as before and after storing or retrieving data. This can be useful if you want to log cache events or perform additional actions when data is stored or retrieved. You can also use event handling to implement custom cache policies, such as cache invalidation or cache eviction.

```javascript
const cache = await cds.connect.to("caching")

cache.before("CLEAR", () => {
    console.log("Cache is about to be cleared")
})

// Log before storing data
cache.before("SET", (event) => {
    console.log(`Storing key: ${event.data.key} with value: ${event.data.value}`)
})

// Log after storing data
cache.after("SET", (event) => {
    console.log(`Stored key: ${event.data.key}`)
})

// Log before retrieving data
cache.before("GET", (event) => {
    console.log(`Retrieving key: ${event.data.key}`)
})

// Log after retrieving data
cache.after("GET", (event) => {
    console.log(`Retrieved key: ${event.data.key} with value: ${event.data.value}`)
})

// Store and retrieve a value to see the logs
await cache.set("key", "value")
await cache.get("key")
```


## High level caching

High level caching provides easy-to-use caching mechanisms through annotations and wrapper functions. This approach is recommended for most use cases as it requires minimal code changes and integrates seamlessly with CAP.

### Using Annotations

You can enable caching for your services using the `@cache` annotation:

```cds
@cache.ttl: 3600  // Cache for 1 hour
@cache.tags: ['products']
entity Products as projection on my.Products {
    key ID: UUID;
    name: String;
    price: Decimal;
}

service CatalogService {
    // Cache the entire entity
    @cache.ttl: 3600
    @cache.tags: ['catalog']
    entity Products as projection on my.Products;

    // Cache specific actions/functions
    @cache.ttl: 1800
    @cache.tags: ['calculations']
    action calculateTotal(items: array of {
        productId: UUID;
        quantity: Integer;
    }) returns Decimal;
}
```

### Using the Cache Wrapper

For more dynamic caching needs, you can use the cache wrapper:

```javascript
const cache = await cds.connect.to("caching")

// Cache any async operation
const result = await cache.wrap(
    async () => {
        // Your expensive operation here
        return expensiveCalculation()
    },
    {
        key: 'calculation-result',
        ttl: 3600,
        tags: ['calculations']
    }
)

// Cache with dynamic keys
const userProfile = await cache.wrap(
    async () => fetchUserProfile(userId),
    {
        key: `user-profile-${userId}`,
        ttl: 1800,
        tags: [`user:${userId}`, 'profiles']
    }
)
```

### Cache Invalidation

You can invalidate cache entries using tags:

```javascript
const cache = await cds.connect.to("caching")

// Invalidate all products
await cache.invalidateByTag('products')

// Invalidate specific user's data
await cache.invalidateByTag(`user:${userId}`)

// Get cache metadata
const metadata = await cache.getMeta('my-key')
// Returns: { tags: ['tag1', 'tag2'], timestamp: 1234567890 }

// Get just the tags
const tags = await cache.getTags('my-key')
// Returns: ['tag1', 'tag2']
```

### Request Caching

Cache entire HTTP requests with customizable options:

```javascript
module.exports = async (srv) => {
    srv.before('READ', 'Products', async (req) => {
        const cache = await cds.connect.to("caching")
        
        await cache.cacheRequest(req, {
            ttl: 3600,
            tags: ['products'],
            isolation: 'tenant'  // 'global' | 'tenant' | 'user'
        })
    })
}
```

## Compression

The caching service supports two compression algorithms:

- **LZ4**: Fast compression/decompression, good for most use cases
- **GZIP**: Better compression ratio but slower, good for text-heavy data

Configure compression globally:

```javascript
{
  "options": {
    "compression": "lz4"
  }
}

## Best Practices

1. **Choose Appropriate TTL**
   - Set shorter TTLs for frequently changing data
   - Use longer TTLs for static content
   - Consider business requirements when setting expiration times

2. **Use Tags Effectively**
   - Group related cache entries with common tags
   - Use hierarchical tags (e.g., 'products:electronics')
   - Include user/tenant IDs in tags when appropriate

3. **Cache Invalidation**
   - Implement cache invalidation strategies based on your data update patterns
   - Use tags to invalidate related cache entries
   - Consider implementing cache warming for critical data

4. **Monitor Cache Performance**
   - Track cache hit/miss ratios
   - Monitor memory usage
   - Set up alerts for cache-related issues

## Configuration Options

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "namespace": "my::app::caching",
        "options": {
          "store": "memory",  // or "redis"
          "compression": "lz4",  // or "gzip" or false
          "ttl": 3600,  // default TTL in seconds
          "redis": {
            "host": "localhost",
            "port": 6379,
            "password": "optional"
          }
        }
      }
    }
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for detail