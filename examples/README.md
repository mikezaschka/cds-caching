

## Deploy
```
cd app
cds deploy
```

## Run Dashboard (including backend)

```
cd dashboard
DEBUG=cds-caching npm start
```

## Open the dashboard

http://localhost:8080/index.html

## Activate key tracking 

* Activate metrics for cache `caching` and `caching-northwind`

## Start caching

* Use requests.http file to create requests that trigger the cache
* Inside of the `app` folder use `cds repl --run cds-caching-example-app` to start a terminal and interact with the caching services

### Basic Operations

```javascript
// Set a value
await caching.set("mykey", "myvalue")

// Read the value
await caching.get("mykey")

// Delete the value
await caching.delete("mykey")

// Provide a ttl
await caching.set("mykey", "myvalue", { ttl: 5000 }) // 5 seconds

```

### Key Management

```javascript

// Set the context
cds.context = { user: { id: "mike" }, tentant: "t1", locale: "de"  }

// Create a user-specific key
await caching.set("mykey", "myvalue", { key: "{hash}:{user}" })

```


### Read-Through query execution

```javascript

// Read through query execution
let { result:foos, cacheKey:fooKey, metadata:fooMetadata } = await caching.rt.run(SELECT.from("AppService.Foo"), db)

const products_1 = await caching.rt.run(SELECT.from("AppService.Products"), AppService, { ttl: 10_000 })
const products_2 = await caching.rt.run(SELECT.from("AppService.Products"), AppService, { ttl: 10_000 })

```

