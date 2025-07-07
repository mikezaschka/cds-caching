# Key Management

This document explains how cache keys are automatically generated for all cache operations and how you can customize this behavior through global configuration and template overrides.

## Overview

All persisting cache operations (including read-through methods `rt.run`, `rt.send`, `rt.wrap`, `rt.exec`) automatically generate cache keys based on the input parameters and global configuration. This ensures that different function calls or queries with different parameters are cached separately, preventing cache pollution.

The automatic generation of cache keys by default does not respect the context (user, language, tenant). But this can be overwritten per cache operation or on a global level.

## Return Format

**Important**: All read-through `rt.xxx` methods return an object with the following structure by default:

```javascript
{
  result: any,           // The actual result from the operation
  cacheKey: string,      // The dynamically generated cache key
  metadata: object       // Cache metadata (hit/miss, latency, etc.)
}
```

This is because the key may be dynamically created at runtime based on the provided inputs.

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

## Global Configuration

### Package.json Configuration

The default key generation behavior can be configured globally in your `package.json`:

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

**Important**: This configuration applies to **all cache operations**, not just read-through functions.

### When to Use Context Awareness

#### User Awareness (`isUserAware: true`)
Use when your data is user-specific or you apply row-based access rules.

```javascript
// Example: User-specific data
const myAccessibleData = await cache.rt.run(
  SELECT.from('BusinessPartners').where({ salesOrganization: cds.context.user.salesOrg }), 
  db,
  { key: "{user}:{hash}"}
)
// Cache key includes user ID to prevent cross-user data sharing
```

#### Tenant Awareness (`isTenantAware: true`)
Use in multi-tenant applications, where the same functionaltiy has to be cached in a different tenant context.

```javascript
// Example: Tenant-specific data
const tenantConfig = await cache.rt.run(
  SELECT.from('SalesOrganizations'), 
  db,
  { key: "{tenant}:{hash}" }
)
// Cache key includes tenant ID to prevent cross-tenant data sharing

```

#### Locale Awareness (`isLocaleAware: true`)
Use for internationalized applications with localized data.

```javascript
// Example: Localized content
const localizedContent = await cache.rt.run(
  SELECT.from('ProductDescriptions').where({ locale: cds.context.locale }), 
  db,
  { key: "{locale}:{hash}" }
)
// Cache key includes locale to prevent mixing different language content
```

### Generated Default Templates

Based on the global configuration, the system generates default templates:

**Example configurations and resulting templates:**

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

## Default Key Generation

### rt.run() - CQN Query Caching (Primary Method)

The `rt.run()` method is the most important read-through method for CAP applications, as it handles CQN (Core Query Notation) queries and ODataRequests. 

#### Query-Based Caching

For CQN queries, the cache key is generated based on the complete query structure and global configuration:

```javascript
const query = SELECT.from('Users').where({ id: 123 })
const { result } = await cache.rt.run(query, db)
// Cache key includes: query structure
```

**Key components hashed as md5:**
- **Query structure**: SELECT, FROM, WHERE, ORDER BY, LIMIT, etc.
- **Query parameters**: Filter values, limit, offset, expand parameters

#### Request-Based Caching

For CAP requests (cds.Requests), the cache key includes the request details:

```javascript
// In a service handler
this.on('READ', Users, async (req, next) => {
  const { result } = await cache.rt.run(req, next)
  return result
})
```

**Key components hased as md5:**
- **Request params and data**: GET, POST, PUT, DELETE
- **Target entity**: The entity being accessed
- **Query parameters**: $filter, $select, $expand, $orderby, etc.

### rt.send() - Remote Service Requests

For remote service requests, the cache key includes the request details and global context:

```javascript
const request = { method: "GET", path: "Products?$top=10" }
const { result } = await cache.rt.send(request, service)
// Cache key includes: method + path + global context + hash
```

**Key components:**
- HTTP method
- Request path with query parameters
- Global context (user, tenant, locale based on configuration)
- Hash: MD5 hash of the request structure

### rt.wrap() - Function Wrapping

For wrapped functions, the cache key is generated based on function arguments and global context:

```javascript
const fetchBusinessPartnerData = async (businessPartnerId, includeAddresses) => {
  // ... expensive computation to fetch BP data
  return businessPartnerData
}

const cachedOperation = cache.rt.wrap("bp-data", fetchBusinessPartnerData)

// Different calls generate different keys
await cachedOperation("1000001", true)   // Key: "bp-data:1000001:true" (if no global context)
await cachedOperation("1000002", false)  // Key: "bp-data:1000002:false" (if no global context)
```

**Default template:** `{baseKey}:{args[0]}:{args[1]}:...:{args[n]}` (if no global context enabled)

**Note:** When global context is enabled, it's prepended to the template.

### rt.exec() - Function Execution

Similar to `rt.wrap()`, but for immediate execution:

```javascript
const result = await cache.rt.exec("bp-data", fetchBusinessPartnerData, ["1000001", true])
// Cache key: "bp-data:1000001:true" (if no global context)
```

**Note:** Same key generation as `rt.wrap()`.

## Content Hash Generation

The hash is generated only from the **content being cached**, not from the context:

- **Queries**: Hash includes only the query structure (SELECT, FROM, WHERE, etc.)
- **Requests**: Hash includes only the request information (method, path, parameters)
- **Functions**: No hash needed since all context is available in the template

This ensures that:
- Same query/request from different users gets different keys (via global context)
- But the hash remains consistent for the same content
- Cache invalidation works properly (same query = same hash)

## Custom Key Templates

You can override the default key generation by providing a custom template in the options:

### Template Variables

The following variables are available in key templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{hash}` | MD5 hash of the content being cached | `"a1b2c3d4..."` |
| `{user}` | Current user ID | `"john.doe"` |
| `{tenant}` | Current tenant | `"acme"` |
| `{locale}` | Current locale | `"en-US"` |
| `{baseKey}` | The base key provided to the method (only for `rt.wrap` and `rt.exec`) | `"user-data"` |
| `{args[0]}`, `{args[1]}`, etc. | Function arguments ((only for `rt.wrap` and `rt.exec`) | `"user1"`, `"true"` |

### Examples

#### Custom Function Key Template

```javascript
const cachedOperation = cache.rt.wrap("bp-profile", fetchBusinessPartnerData, {
  key: "profile:{args[0]}:{args[1]}"
})

await cachedOperation("1000001", true)
// Cache key: "profile:1000001:true"
```

#### User-Specific Caching

```javascript
const cachedOperation = cache.rt.wrap("bp-data", fetchBusinessPartnerData, {
  key: "user:{user}:{args[0]}"
})

// Different users get different cache keys
// User "john" -> "user:john:1000001"
// User "jane" -> "user:jane:1000001"
```

#### Tenant-Aware Caching

```javascript
const cachedOperation = cache.rt.wrap("sales-org-data", fetchSalesOrganizationData, {
  key: "tenant:{tenant}:{args[0]}"
})

// Different tenants get different cache keys
// Tenant "acme" -> "tenant:acme:1000"
// Tenant "corp" -> "tenant:corp:2000"
```

#### Complex Template

```javascript
const cachedOperation = cache.rt.wrap("complex", fetchProductData, {
  key: "{baseKey}:{user}:{tenant}:{args[0]}:{args[1]}"
})

await cachedOperation("1000001", "pricing")
// Cache key: "complex:john.doe:acme:1000001:pricing"
```

#### Override Global Configuration for Specific Operations

```javascript
// Even if global config has user awareness enabled, you can override for specific operations
const cachedOperation = cache.rt.wrap("public-product-data", fetchProductData, {
  key: "{baseKey}:{args[0]}" // No user context, even if globally enabled
})

await cachedOperation("1000001")
// Cache key: "public-product-data:1000001" (no user context)
```

## Key Generation Process

1. **Global Configuration Check**: System reads the global configuration from package.json
2. **Default Template Generation**: Creates default template based on global awareness settings
3. **Template Resolution**: If a custom template is provided, it's used; otherwise, the default template is applied
4. **Variable Substitution**: All template variables are replaced with actual values
5. **Content Hashing**: A hash is generated from the content being cached (not context)
6. **Final Key**: The resolved template becomes the final cache key

## Best Practices

### 1. Configure Global Settings Appropriately

```json
{
  "cds-caching": {
    "keyManagement": {
      "isUserAware": true,      // Enable for user-specific data
      "isTenantAware": true,    // Enable for multi-tenant apps
      "isLocaleAware": false    // Disable if not needed
    }
  }
}
```

### 2. Use Descriptive Base Keys

```javascript
// Good
cache.rt.wrap("bp-profile-data", fetchBusinessPartnerData)

// Avoid
cache.rt.wrap("key", expensiveOperation)
```

### 3. Override Templates When Needed

```javascript
// For public data that shouldn't be user-specific
cache.rt.wrap("public-product-data", fetchProductData, {
  key: "{baseKey}:{args[0]}" // Override global user awareness
})

// For highly specific caching
cache.rt.wrap("bp-data", fetchBusinessPartnerData, {
  key: "user:{user}:{tenant}:{args[0]}" // Explicit template
})
```

### 4. Keep Templates Simple

```javascript
// Good - simple and clear
key: "user:{user}:{args[0]}"

// Avoid - overly complex
key: "{baseKey}:{user}:{tenant}:{locale}:{args[0]}:{args[1]}:{args[2]}"
```

### 5. Test Key Generation

You can verify key generation by inspecting the returned `cacheKey`:

```javascript
const { result, cacheKey, metadata } = await cache.rt.exec("test", fetchBusinessPartnerData, ["1000001"])

console.log("Generated cache key:", cacheKey)
```
