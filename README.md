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
          "store": "in-memory",  // "in-memory" or "redis"
          "compression": "lz4",  // "lz4", "gzip", or false
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

## TODO:

- [ ] Add more documentation and examples

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for detail