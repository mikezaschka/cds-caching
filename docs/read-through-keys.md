# Read-Through Key Generation

This document explains how cache keys are automatically generated for read-through (`rt.xxx`) methods and how you can customize this behavior.

## Overview

All read-through methods (`rt.run`, `rt.send`, `rt.wrap`, `rt.exec`) automatically generate cache keys based on the input parameters. This ensures that different function calls or queries with different parameters are cached separately, preventing cache pollution.

## Return Format

**Important**: All `rt.xxx` methods return an object with the following structure by default:

```javascript
{
  result: any,           // The actual result from the operation
  cacheKey: string,      // The dynamically generated cache key
  metadata: object       // Cache metadata (hit/miss, latency, etc.)
}
```

### Examples

```javascript
// rt.run() - CQN query caching
const { result, cacheKey, metadata } = await cache.rt.run(query, db)

// rt.send() - Remote service requests  
const { result, cacheKey, metadata } = await cache.rt.send(request, service)

// rt.wrap() - Function wrapping
const cachedFunction = cache.rt.wrap("key", expensiveOperation)
const { result, cacheKey, metadata } = await cachedFunction("param1", "param2")

// rt.exec() - Function execution
const { result, cacheKey, metadata } = await cache.rt.exec("key", expensiveOperation, ["param1", "param2"])
```

The `cacheKey` is always available, allowing you to inspect the generated key or use it for cache management operations.

## Default Key Generation

### rt.run() - CQN Query Caching (Primary Method)

The `rt.run()` method is the most important read-through method for CAP applications, as it handles CQN (Core Query Notation) queries. This is the primary way to cache database operations in CAP.

#### Query-Based Caching

For CQN queries, the cache key is generated based on the complete query structure and context:

```javascript
const query = SELECT.from('Users').where({ id: 123 })
const { result } = await cache.rt.run(query, db)
// Cache key includes: query structure + parameters + user + tenant + locale + hash
```

**Key components:**
- **Query structure**: SELECT, FROM, WHERE, ORDER BY, LIMIT, etc.
- **Query parameters**: Filter values, limit, offset, expand parameters
- **User context**: Current user ID for user-specific data
- **Tenant context**: Current tenant for multi-tenant applications
- **Locale context**: Current locale for internationalized data
- **Hash**: MD5 hash of the complete query structure for uniqueness

#### Request-Based Caching

For CAP requests (CDS requests), the cache key includes the request details:

```javascript
// In a service handler
this.on('READ', Users, async (req, next) => {
  const { result } = await cache.rt.run(req, next)
  return result
})
```

**Key components:**
- **Request method**: GET, POST, PUT, DELETE
- **Target entity**: The entity being accessed
- **Query parameters**: $filter, $select, $expand, $orderby, etc.
- **User context**: Current user ID
- **Tenant context**: Current tenant
- **Locale context**: Current locale
- **Hash**: MD5 hash of the complete request structure

#### Key Differences: Queries vs Requests

| Aspect | CQN Query | CAP Request |
|--------|-----------|-------------|
| **Input** | `SELECT.from('Users').where({id: 123})` | `req` object from service handler |
| **Context** | Manual context setting | Automatic context from request |
| **Use Case** | Direct database operations | Service layer caching |
| **Key Generation** | Query structure + parameters + context + hash | Request structure + context + hash |

### rt.send() - Remote Service Requests

For remote service requests, the cache key includes the request details:

```javascript
const request = { method: "GET", path: "Products?$top=10" }
const { result } = await cache.rt.send(request, service)
// Cache key includes: method + path + user + tenant + locale
```

**Key components:**
- HTTP method
- Request path with query parameters
- Current user context
- Current tenant context
- Current locale context

### rt.wrap() - Function Wrapping

For wrapped functions, the cache key is generated based on function arguments:

```javascript
const expensiveOperation = async (userId, includeDetails) => {
  // ... expensive computation
  return result
}

const cachedOperation = cache.rt.wrap("user-data", expensiveOperation)

// Different calls generate different keys
await cachedOperation("user1", true)   // Key: "user-data:user1:true"
await cachedOperation("user2", false)  // Key: "user-data:user2:false"
```

**Default template:** `{baseKey}:{args[0]}:{args[1]}:...:{args[n]}`

**Note:** Since all relevant context (arguments, user, tenant, locale) is available in the template, no hash is needed for uniqueness.

### rt.exec() - Function Execution

Similar to `rt.wrap()`, but for immediate execution:

```javascript
const result = await cache.rt.exec("user-data", expensiveOperation, ["user1", true])
// Cache key: "user-data:user1:true"
```

**Note:** Same key generation as `rt.wrap()` - no hash needed since all context is available.

## Custom Key Templates

You can override the default key generation by providing a custom template in the options:

### Template Variables

The following variables are available in key templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{baseKey}` | The base key provided to the method | `"user-data"` |
| `{args[0]}`, `{args[1]}`, etc. | Function arguments (for wrap/exec) | `"user1"`, `"true"` |
| `{hash}` | MD5 hash of the full context | `"a1b2c3d4..."` |
| `{user}` | Current user ID | `"john.doe"` |
| `{tenant}` | Current tenant | `"acme"` |
| `{locale}` | Current locale | `"en-US"` |

### Examples

#### Custom Function Key Template

```javascript
const cachedOperation = cache.rt.wrap("user-profile", expensiveOperation, {
  key: { template: "profile:{args[0]}:{args[1]}" }
})

await cachedOperation("user1", true)
// Cache key: "profile:user1:true"
```

#### User-Specific Caching

```javascript
const cachedOperation = cache.rt.wrap("user-data", expensiveOperation, {
  key: { template: "user:{user}:{args[0]}" }
})

// Different users get different cache keys
// User "john" -> "user:john:data1"
// User "jane" -> "user:jane:data1"
```

#### Tenant-Aware Caching

```javascript
const cachedOperation = cache.rt.wrap("tenant-data", expensiveOperation, {
  key: { template: "tenant:{tenant}:{args[0]}" }
})

// Different tenants get different cache keys
// Tenant "acme" -> "tenant:acme:data1"
// Tenant "corp" -> "tenant:corp:data1"
```

#### Complex Template

```javascript
const cachedOperation = cache.rt.wrap("complex", expensiveOperation, {
  key: { 
    template: "{baseKey}:{user}:{tenant}:{args[0]}:{args[1]}" 
  }
})

await cachedOperation("param1", "param2")
// Cache key: "complex:john.doe:acme:param1:param2"
```

## Key Generation Process

1. **Template Resolution**: If a custom template is provided, it's used; otherwise, the default template is applied
2. **Variable Substitution**: All template variables are replaced with actual values
3. **Context Hashing**: A hash is generated from the full context (arguments, user, tenant, locale)
4. **Final Key**: The resolved template with the hash becomes the final cache key

## Best Practices

### 1. Use Descriptive Base Keys

```javascript
// Good
cache.rt.wrap("user-profile-data", expensiveOperation)

// Avoid
cache.rt.wrap("key", expensiveOperation)
```

### 2. Include User/Tenant Context When Needed

```javascript
// For user-specific data
cache.rt.wrap("user-data", expensiveOperation, {
  key: { template: "user:{user}:{args[0]}" }
})

// For tenant-specific data  
cache.rt.wrap("tenant-data", expensiveOperation, {
  key: { template: "tenant:{tenant}:{args[0]}" }
})
```

### 3. Keep Templates Simple

```javascript
// Good - simple and clear
key: { template: "user:{user}:{args[0]}" }

// Avoid - overly complex
key: { template: "{baseKey}:{user}:{tenant}:{locale}:{args[0]}:{args[1]}:{args[2]}" }
```

### 4. Test Key Generation

You can verify key generation by inspecting the returned `cacheKey`:

```javascript
const { result, cacheKey, metadata } = await cache.rt.exec("test", expensiveOperation, ["param1"])

console.log("Generated cache key:", cacheKey)
```

## Troubleshooting

### Cache Key Collisions

If you experience cache key collisions, ensure your template includes enough unique identifiers:

```javascript
// Add more context to avoid collisions
key: { template: "{baseKey}:{user}:{args[0]}:{args[1]}" }
```

### Performance Considerations

- Keep key templates reasonably short
- Avoid including large objects in arguments
- For `rt.run()` and `rt.send()`, the hash is automatically included for uniqueness
- For `rt.wrap()` and `rt.exec()`, all context is available in the template, so no hash is needed

### Debugging

Inspect generated keys and metadata for debugging:

```javascript
const { cacheKey, metadata } = await cache.rt.exec("debug", expensiveOperation, ["param1"])

console.log("Cache key:", cacheKey)
console.log("Metadata:", metadata)
``` 