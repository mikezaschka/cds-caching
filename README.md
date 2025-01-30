# Welcome to cds-caching

## Overview

This plugin for the [SAP Cloud Application Programming Model (CAP)](https://cap.cloud.sap/docs/) provides a robust caching service for CAP applications, addressing common performance challenges in distributed systems.

By reducing database requests and accelerating response times, caching is ideal for handling expensive operations like complex queries/calculations or external API calls. However, it introduces another layer of complexity and should be used with caution.

### Key Features

* **Flexible Key-Value Store** – Store and retrieve data using simple key-based access.
* **CachingService** – A cds.Service-based implementation with an intuitive API for seamless integration.
* **Event Handling** – Monitor and react to cache events, such as before/after storage and retrieval.
* **CAP-specific Caching** – Effortlessly cache CQN queries or CAP cds.Requests using code or the @cache annotation.
* **TTL Support** – Automatically manage data expiration with configurable time-to-live (TTL) settings.
* **Tag Support** – Use dynamic tags for flexible cache invalidation options.
* **Pluggable Storage Options** – Choose between in-memory caching or Redis.
* **Compression** – Compress cached data to save memory.
* **Integrated Statistics** – Integrated statistics on cache hits, etc.
### Installation

Installing and using cds-caching is straightforward since it’s a CAP plugin. Simply run:

```
npm install cds-caching
```

Next, add a caching service configuration to your package.json. You can even define **multiple caching services**, which is recommended if you need to cache different types of data within your application.

```json

{
	"cds": {
		"requires": {
			"caching": {
				"impl": "cds-caching",
				"namespace": "my::app::caching"
			},
			"bp-caching": {
				"impl": "cds-caching",
				"namespace": "my::app::bp-caching"
			}
		}
	}
}

```
### Advanced Configuration

For more control, you can specify additional options. Some of those will be explained later:

```javascript

{
	"cds": {
		"requires": {
			"caching": {
				"impl": "cds-caching",
				"namespace": "my::app::caching",
				"store": "in-memory", // "in-memory" or "redis"
				"compression": "lz4", // "lz4" or "gzip"
				"statistics": {
					"enabled": true,
					"persistenceInterval": 5000 // interval to save in db
				},
				"credentials": { // if store is redis
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
### Low level  usage

The **cds-caching** plugin provides direct **key-value storage**, allowing fine-grained caching control. Its API follows a familiar pattern, making it easy to use if you have ever worked with other caching solutions and frameworks.
Here’s how you can interact with the cache:

```javascript
// Connect to the caching service
const cache = await cds.connect.to("caching")

// Store a value
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

This **low-level API** is useful when you need direct access to cached data, such as storing configuration values, or precomputed results. While the core API is simple, **cds-caching** also provides **higher-level caching strategies** that are more integrated with CAP.  We will look at those in a minute. Before, let's focus on cache events.
#### Cache Events

The caching service follows the same event-driven principles as cds.Service instances. This means you can hook into events **before** and **after** storing or retrieving data. This is useful for logging, debugging, or performing additional actions when cache operations occur.

Each cache event (event.data.value) contains the following structure:
* **value** – The cached data.
* **tags** – Tags assigned to the cached entry.
* **timestamp** – The timestamp when the cache entry was created. 

Here’s how you can listen for and react to cache events:

```javascript

// Log before the cache is cleared
cache.before("CLEAR", () => {
	console.log("Cache is about to be cleared")
})

// Log before storing data
cache.before("SET", (event) => {
	console.log(`Storing key: ${event.data.key} with value: ${event.data.value}`)
})

// Log after retrieving data
cache.after("GET", (event) => {
	console.log(`Retrieved key: ${event.data.key} with value: ${event.data.value}`)
})


```

This approach allows you to monitor cache activity and, if needed, manipulate data before storage or retrieval.
#### Invalidation via Time-To-Live (TTL)

**cds-caching** supports automatic cache invalidation via **TTL (Time-To-Live)**. Cached values will expire after the specified TTL, preventing stale data from lingering in memory.

```javascript
// Store a value with a ttl
await cache.set("key", "value", { ttl: 6000 }) // 60 seconds

// Retrieve the value in time
await cache.get("key") // => value

await new Promise((resolve) => setTimeout(resolve, 6100)) // wait 61 seonds

// Now the value is not available anymore
await cache.get("key") // => undefined
```

TTL-based invalidation is useful for **temporary data, rate-limiting mechanisms, and frequently updated information**. However, **cds-caching** also supports other invalidation strategies, which will be covered in the advanced section.
#### Compression

To optimize storage, **cds-caching** supports **data compression**. This reduces cache size and can improve performance, especially when caching large datasets. Compression is **applied only when storing data**, meaning applications interact with uncompressed values. Available compression methods include:
* **lz4** – Faster compression and decompression, ideal for performance-critical applications.
* **gzip** – Higher compression ratio, reducing storage footprint at the cost of slightly increased CPU usage.
 
Compression can be configured via package.json:

```json
{
  "cds": {
    "requires": {
      "caching": {
        "impl": "cds-caching",
        "compression": "lz4"
      }
    }
  }
}
```

### Medium level usage

One of the core principles of **cds-caching** is **seamless integration with CAP**, aligning with CAP’s design and query execution model. As a result, **cds-caching** provides **native support** for **CQN (Core Query Notation) queries** and **cds.Requests**.
#### Caching CQN queries

CQN queries are widely used in CAP for **database operations** and **remote service calls (e.g., OData requests)**. Since these queries often involve **repeated data retrieval**, caching them can **significantly reduce response times** and **offload system resources**.

**cds-caching** treats **CQN queries as first-class objects**, allowing them to be passed directly into the caching API. Internally, it generates a unique key based on the CQN query structure, ensuring **consistent retrieval** and **cache integrity**.  

**Example: Caching a CQN Query**

```javascript

// Create the CQN object
const query = SELECT.from(Foo)

// Execute to fetch the result
const result = await cds.run(query) // => [{...}, {...}]

// Store value in the cache
await cache.set(query, result) 

// Retrieve the value from the cache using the same CQN object
const cachedResult = await cache.get(query) // => [{...}, {...}]

// Create the key that is used internally
const key = cache.createKey(query)

// Delete the value from the cache
await cache.delete(query)

```

While **CQN queries** can be cached directly, **cds-caching** also supports **caching full** cds.Requests, including their **request context**.  
#### Caching  cds.Requests

Caching requests is particularly useful when exposing **remote services** through **local CAP services**. For example, if your CAP application proxies an **external API**, caching can significantly reduce redundant requests and improve response times.  

👉 **Use Case:** [Exposing Remote Services](https://cap.cloud.sap/docs/guides/using-services#expose-remote-services)

**cds-caching** automatically includes contextual information in the cache key, making request caching **tenant- and user-aware**. The cache key incorporates:

* req.tenant – Ensures data is scoped per tenant in multi-tenant environments.
* req.user – Allows user-specific caching when necessary.
* req.locale – Supports localized responses when caching multilingual content.

**Example: Caching a cds.Request**

```javascript
this.on('READ', BusinessPartners, async (req, next) => {
	const bupa = await cds.connect.to('API_BUSINESS_PARTNER')
	let value = await cache.get(req)
	if(!value) {
		value = await bupa.run(req)
		await cache.set(req, next, { ttl: 3600 })
	}
	return value;
})
```

**When Not to Cache Full OData Services** 

While caching individual **requests** can improve performance, **caching an entire OData service is generally not recommended**. Here’s why:

1. **Data Inconsistency** – OData services expose **live business data**, which frequently changes. Caching responses without an **appropriate invalidation strategy** can lead to outdated or incorrect data being served.

2. **Complex Query Variations** – OData allows **dynamic query parameters** ($filter, $expand, $orderby, etc.), making it difficult to cache efficiently without storing excessive variations.

3. **Large Payloads** – Full OData responses can be **significantly large**, consuming cache memory inefficiently compared to caching targeted **CQN queries** or specific **request results**.

👉 **Best Practice:** Instead of caching entire OData service responses, cache **specific queries or request results** where the data is frequently accessed and doesn’t change often.

For example, focussing on remote services, **static master data**, or **computed results** is much safer and more efficient than blindly caching full OData responses.

### Read-through CQN queries and cds.Requests

While this API is useful, it follows the **read-aside cache pattern**, meaning **manual cache checks** are required before fetching and storing data. In scenarios where caching logic becomes repetitive, **higher-level caching strategies** can help streamline this process and thanks to the already available CAP API, those are also available in cds-caching.

In **read-through caching**, queries and requests are executed **through the caching service itself**, reducing the need for manual cache handling. **cds-caching** extends CAP’s built-in service methods with two key functions:

* run – Executes **CQN queries** or **requests** against a database or remote OData service.
[CAP Documentation: srv.run(query)](https://cap.cloud.sap/docs/node.js/core-services#srv-run-query)

* send – Sends **custom synchronous requests** (e.g., to REST APIs) with configurable paths and headers.
[CAP Documentation: srv.send(request)](https://cap.cloud.sap/docs/node.js/core-services#srv-send-request)

Using **read-through caching**, the previous read-aside pattern can be reduced to a **single line of code**:

```javascript
this.on('READ', BusinessPartners, async (req, next) => {
	const bupa = await cds.connect.to('API_BUSINESS_PARTNER')
	return cache.run(req, bupa, { ttl: 3600 })
})
```

With this approach, **all requests to the external service will be automatically executed and cached**, eliminating the need for manual cache handling.

Some other examples :

```javascript

// Read-through for a CQN query
const queryResult = await cache.run(SELECT.from("Foo"), db, { ttl: 360 })

// Read-through for a custom REST request
const restService = await cds.connect.to({
	"kind": "rest",
	"credentials": {
		"url": "https://services.odata.org/V3/Northwind/Northwind.svc/"
	}
});
const restResult = await cache.send({ method: "GET", path: "Products" }, restService, { ttl: 3600 });
```

The **read-through strategy** makes caching **cleaner and more maintainable**, as it abstracts cache management entirely. However, **the first request is still slow** (since there’s no cached value yet), but all subsequent requests will be **served instantly from the cache**.
#### Wrapping async complex code

The **read-through approach** can also be applied to **non-CAP-specific** operations. **cds-caching** provides a wrap function that caches the result of **any asynchronous function**.

```javascript
const expensiveFunction = async (param) => { /* Do something complex */ }

// Wrap the function with caching
const cachedExpensiveFunction = await cache.wrap("key", expensiveFunction, { ttl: 360 }) 

// First call executes the function
result = await cachedExpensiveFunction("someParam"); // No cache hit

// Subsequent calls retrieve the result from cache
result = await cachedExpensiveFunction("someParam"); // Cache hit 
```

This is particularly useful for **heavy computations**, ensuring they only need to be executed **once per TTL period**.


## TODO:

- [ ] Add documentation for cache iteration
- [ ] Add documentation for cache invalidation
- [ ] Add documentation for cache annotations
- [ ] Add documentation for cache key generation
- [ ] Add documentation for cache tags
- [ ] Add documentation for cache statistics
- [ ] Add documentation for running locally with redis on docker
- [ ] Add documentation for running with redis on BTP


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for detail