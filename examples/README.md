
## Install




## Deploy
```
cd examples/app
cds deploy
```

## Run the example (backend + dashboard)

```
cd examples/app
DEBUG=cds-caching cds watch
```

## Open the dashboard

http://localhost:4004/caching-dashboard/index.html

## Activate key tracking 

* Activate metrics for cache `caching` and `caching-northwind`

## Start caching

* Use requests.http file to create requests that trigger the cache
* Inside of the `examples/app` folder use `cds repl --run cds-caching-example-app` to start a terminal and interact with the caching services



```
cds repl --run cds-caching-example-app

const caching = await cds.connect.to("caching")

```

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


### Read-Through query execution

```javascript

// Read through query execution
await caching.run(SELECT.from("AppService.Foo"), db, { ttl: 5000 })

// Read through query execution with exteded return values
await caching.rt.run(SELECT.from("AppService.Foo"), db, { ttl: 5000 })

// Set the context
cds.context = { user: { id: "mike" }, tentant: "t1", locale: "de"  }

// Apply a different key
await caching.rt.run(SELECT.from("AppService.Foo"), db, { ttl: 5000, key: "{locale}:{user}:{hash}" })
```

### Read-Through requests

``` javascript

// Request local data
await caching.rt.run(SELECT.from("AppService.Foo"), AppService, { ttl: 5_000 })

// Request products from remote service through the app service
await caching.rt.run(SELECT.from("AppService.Products"), AppService, { ttl: 5_000 })

// Directly call the remote service
await caching.rt.run(SELECT("Products").limit(2), Northwind);

// Send a REST request
await caching.rt.send({ method: 'GET', path: '/Products' }, Northwind);
```

## Dashboard UI development

To work on the TypeScript dashboard sources in `app/dashboard-src/`, run the example backend and the UI5 dev server in separate terminals:

```
cd examples/app && cds watch
npm run start:dashboard
```

Open http://localhost:8080/index.html for live TypeScript development (CAP API proxied from port 4004).
