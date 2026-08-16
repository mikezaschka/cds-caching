
## Install

```
cd examples/app
npm install
```

The `cds-caching` dependency resolves to this repository (`node_modules/cds-caching` is a symlink to the repo root), so the example always runs the working tree rather than a published release.

## Prerequisites

The `caching` service in `examples/app/package.json` uses `store: "redis"`, so Redis has to be reachable on `localhost:6379`:

```
docker run --rm -p 6379:6379 redis
```

Without it, requests against cached entities hang while the Redis client retries. To try the example without Redis, change that service to `"store": "memory"`.

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

The dashboard and the caching API require an authenticated user, so the browser asks for credentials. With CAP's mocked authentication any of its default users works — log in as `alice` with an empty password. Define your own under `cds.requires.auth.users` to try role-based restrictions.

The dashboard loads UI5 from `https://ui5.sap.com`, so the browser needs internet access. Point `metrics.ui5Url` at a UI5 runtime you serve yourself if it does not have any.

## Try encrypted values at rest

Generate a key and add it to the `caching-northwind` service in `package.json` (it is backed by SQLite, so you can inspect the stored rows):

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```json
"caching-northwind": {
  "impl": "cds-caching",
  "store": "sqlite",
  "encryption": { "key": "<the generated key>" }
}
```

Cached values are then stored as `enc:v1:…` envelopes while tags and timestamps stay readable. Keep real keys out of committed files — see [Encrypting cached values](../docs/security.md#encrypting-cached-values).

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
