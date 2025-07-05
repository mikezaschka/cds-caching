# cds-caching OData API Reference

This document provides a comprehensive reference for the cds-caching OData API, including all endpoints, request/response formats, and usage examples.

## Table of Contents

1. [Overview](#overview)
2. [Service Definition](#service-definition)
3. [Cache Management Endpoints](#cache-management-endpoints)
4. [Metrics Management Endpoints](#metrics-management-endpoints)
5. [Key Management](#key-management)
6. [Read-Through Operations](#read-through-operations)
7. [Deprecated Methods](#deprecated-methods)
8. [Error Handling](#error-handling)
9. [Security Considerations](#security-considerations)
10. [Integration Examples](#integration-examples)

## Overview

The cds-caching plugin provides a comprehensive OData API for managing cache operations and accessing metrics data. This API allows external applications, monitoring tools, and administrative interfaces to interact with the cache service.

### Base URL

The API is available at the standard CAP service endpoint:

```
http://localhost:4004/odata/v4/caching-api/
```

### Authentication

The API requires authentication. Add the following annotation to your service definition:

```cds
using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';

// Add authentication to the service
annotate CachingApiService with @requires: 'authenticated-user';
```

## Service Definition

The OData service provides the following entity sets and functions:

### Entity Sets

- `Caches` - Manage cache instances and their operations
- `Metrics` - Access general cache statistics
- `KeyMetrics` - Access key-level performance metrics

### Cache Operations

The `Caches` entity provides the following bound operations:
- `getEntries()` - Get all cache entries for a specific cache
- `getEntry(key)` - Get a specific cache entry by key
- `setEntry(key, value, ttl)` - Set a cache entry
- `deleteEntry(key)` - Delete a specific cache entry
- `clear()` - Clear all entries in a cache
- `clearMetrics()` - Clear all metrics data
- `clearKeyMetrics()` - Clear all key-level metrics
- `setMetricsEnabled(enabled)` - Enable/disable general metrics
- `setKeyMetricsEnabled(enabled)` - Enable/disable key-level metrics

## Cache Management Endpoints

### Get All Cache Entries !! Performance Warning !!

**GET** `/Caches('{cacheName}')/getEntries()`

Retrieves all cache entries for a specific cache instance. A word of warning, there is no pagination support and all values will be shown. So, please use this wisely.

#### Path Parameters

- `cacheName` - The name of the cache instance (e.g., 'caching', 'bp-caching')

#### Response

```json
{
  "value": [
    {
      "entryKey": "bp:1000001",
      "value": "{\"businessPartner\":\"1000001\",\"name\":\"Acme Corporation\",\"type\":\"2\"}",
      "timestamp": "2024-01-15T10:30:00Z",
      "tags": ["bp-1000001", "bp-acme"]
    }
  ]
}
```

#### Example Request

```http
### Get all cache entries
GET /odata/v4/caching-api/Caches('caching')/getEntries()
```

### Get Specific Cache Entry

**GET** `/Caches('{cacheName}')/getEntry(key='{key}')`

Retrieves a specific cache entry by key.

#### Path Parameters

- `cacheName` - The name of the cache instance
- `key` - The cache key

#### Response

```json
{
  "value": {
    "businessPartner": "1000001",
    "name": "Acme Corporation",
    "type": "2"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "tags": ["bp-1000001", "bp-acme"]
}
```

#### Example Request

```http
### Get specific cache entry
GET /odata/v4/caching-api/Caches('caching')/getEntry(key='bp:1000001')
```

### Create/Update Cache Entry

**POST** `/Caches('{cacheName}')/setEntry`

Creates a new cache entry or updates an existing one.

#### Request Body

```json
{
  "key": "bp:1000001",
  "value": "{\"businessPartner\":\"1000001\",\"name\":\"Acme Corporation\",\"type\":\"2\"}",
  "ttl": 3600000
}
```

#### Response

```json
{
  "value": true
}
```

#### Example Request

```http
### Create/update cache entry
POST /odata/v4/caching-api/Caches('caching')/setEntry
Content-Type: application/json

{
  "key": "bp:1000001",
  "value": "{\"businessPartner\":\"1000001\",\"name\":\"Acme Corporation\",\"type\":\"2\"}",
  "ttl": 3600000
}
```

### Delete Cache Entry

**POST** `/Caches('{cacheName}')/deleteEntry`

Deletes a specific cache entry.

#### Request Body

```json
{
  "key": "bp:1000001"
}
```

#### Response

```json
{
  "value": true
}
```

#### Example Request

```http
### Delete cache entry
POST /odata/v4/caching-api/Caches('caching')/deleteEntry
Content-Type: application/json

{
  "key": "bp:1000001"
}
```

### Clear All Cache

**POST** `/Caches('{cacheName}')/clear()`

Clears all cache entries for a specific cache instance.

#### Response

```json
{
  "value": true
}
```

#### Example Request

```http
### Clear all cache
POST /odata/v4/caching-api/Caches('caching')/clear()
```

## Metrics Management Endpoints

### Enable/Disable General Metrics

**POST** `/Caches('{cacheName}')/setMetricsEnabled`

Enables or disables general metrics collection.

#### Request Body

```json
{
  "enabled": true
}
```

#### Response

```json
{
  "value": true
}
```

#### Example Request

```http
### Enable metrics
POST /odata/v4/caching-api/Caches('caching')/setMetricsEnabled
Content-Type: application/json

{
  "enabled": true
}
```

### Enable/Disable Key Metrics

**POST** `/Caches('{cacheName}')/setKeyMetricsEnabled`

Enables or disables key-level metrics collection.

#### Request Body

```json
{
  "enabled": true
}
```

#### Response

```json
{
  "value": true
}
```

#### Example Request

```http
### Enable key metrics
POST /odata/v4/caching-api/Caches('caching')/setKeyMetricsEnabled
Content-Type: application/json

{
  "enabled": true
}
```

### Clear Metrics

**POST** `/Caches('{cacheName}')/clearMetrics()`

Clears all general metrics data.

#### Response

```json
{
  "value": true
}
```

#### Example Request

```http
### Clear metrics
POST /odata/v4/caching-api/Caches('caching')/clearMetrics()
```

### Clear Key Metrics

**POST** `/Caches('{cacheName}')/clearKeyMetrics()`

Clears all key-level metrics data.

#### Response

```json
{
  "value": true
}
```

#### Example Request

```http
### Clear key metrics
POST /odata/v4/caching-api/Caches('caching')/clearKeyMetrics()
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

## Read-Through Operations

The read-through API provides enhanced functionality for caching operations with automatic key generation and detailed metadata.

### Return Format

All read-through `rt.xxx` methods return an object with the following structure:

```javascript
{
  result: any,           // The actual result from the operation
  cacheKey: string,      // The dynamically generated cache key
  metadata: object       // Cache metadata (hit/miss, latency, etc.)
}
```

### rt.run() - CQN Query Caching

The primary method for CAP applications, handling CQN queries and ODataRequests.

#### Query-Based Caching

```javascript
const query = SELECT.from('Users').where({ id: 123 })
const { result, cacheKey, metadata } = await cache.rt.run(query, db)
```

**Key components hashed as md5:**
- Query structure: SELECT, FROM, WHERE, ORDER BY, LIMIT, etc.
- Query parameters: Filter values, limit, offset, expand parameters

#### Request-Based Caching

```javascript
// In a service handler
this.on('READ', Users, async (req, next) => {
  const { result, cacheKey, metadata } = await cache.rt.run(req, next)
  return result
})
```

**Key components hashed as md5:**
- Request params and data: GET, POST, PUT, DELETE
- Target entity: The entity being accessed
- Query parameters: $filter, $select, $expand, $orderby, etc.

### rt.send() - Remote Service Requests

For remote service requests with automatic key generation:

```javascript
const request = { method: "GET", path: "Products?$top=10" }
const { result, cacheKey, metadata } = await cache.rt.send(request, service)
```

**Key components:**
- HTTP method
- Request path with query parameters
- Global context (user, tenant, locale based on configuration)
- Hash: MD5 hash of the request structure

### rt.wrap() - Function Wrapping

For wrapping functions with caching:

```javascript
const expensiveOperation = async (userId, includeDetails) => {
  // ... expensive computation
  return result
}

const cachedOperation = cache.rt.wrap("user-data", expensiveOperation)

// Different calls generate different keys
const { result, cacheKey, metadata } = await cachedOperation("user1", true)
```

**Default template:** `{baseKey}:{args[0]}:{args[1]}:...:{args[n]}` (if no global context enabled)

### rt.exec() - Function Execution

For immediate function execution with caching:

```javascript
const { result, cacheKey, metadata } = await cache.rt.exec("user-data", expensiveOperation, ["user1", true])
```

**Note:** Same key generation as `rt.wrap()`.

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

## Metrics Data Access

### Get General Metrics

**GET** `/Metrics`

Retrieves general cache statistics with optional filtering.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `$top` | number | Maximum number of metrics to return | `$top=100` |
| `$skip` | number | Number of metrics to skip | `$skip=50` |
| `$filter` | string | OData filter expression | `$filter=cache eq 'caching'` |
| `$orderby` | string | Sort order | `$orderby=timestamp desc` |

#### Response

```json
{
  "@odata.context": "$metadata#Metrics",
  "value": [
    {
      "ID": "daily:2024-01-15",
      "cache": "caching",
      "timestamp": "2024-01-15T10:30:00Z",
      "period": "daily",
      "hits": 1500,
      "misses": 300,
      "errors": 5,
      "totalRequests": 1800,
      "hitRatio": 0.833,
      "avgHitLatency": 2.5,
      "avgMissLatency": 45.8,
      "throughput": 25.5,
      "errorRate": 0.003,
      "cacheEfficiency": 18.3,
      "memoryUsage": 52428800,
      "itemCount": 150,
      "uptimeMs": 7200000
    }
  ]
}
```

#### Example Request

```http
### Get general metrics
GET /odata/v4/caching-api/Metrics?$filter=cache eq 'caching'&$orderby=timestamp desc
```

### Get Key Metrics

**GET** `/KeyMetrics`

Retrieves key-level performance metrics with optional filtering.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `$top` | number | Maximum number of metrics to return | `$top=100` |
| `$skip` | number | Number of metrics to skip | `$skip=50` |
| `$filter` | string | OData filter expression | `$filter=cache eq 'caching'` |
| `$orderby` | string | Sort order | `$orderby=hits desc` |

#### Response

```json
{
  "@odata.context": "$metadata#KeyMetrics",
  "value": [
    {
      "ID": "current:bp:1000001",
      "cache": "caching",
      "keyName": "bp:1000001",
      "lastAccess": "2024-01-15T10:30:00Z",
      "period": "current",
      "operationType": "read_through",
      "hits": 45,
      "misses": 5,
      "errors": 0,
      "totalRequests": 50,
      "hitRatio": 0.9,
      "avgHitLatency": 1.2,
      "avgMissLatency": 25.4,
      "throughput": 2.5,
      "errorRate": 0.0,
      "cacheEfficiency": 21.2,
      "dataType": "request",
      "serviceName": "BusinessPartnerService",
      "entityName": "BusinessPartners",
      "operation": "READ",
      "timestamp": "2024-01-15T09:00:00Z"
    }
  ]
}
```

#### Example Request

```http
### Get key metrics
GET /odata/v4/caching-api/KeyMetrics?$filter=cache eq 'caching'&$orderby=hits desc
```

## Error Handling

The API returns standard HTTP status codes and error messages:

- `200 OK` - Successful operation
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Cache or entry not found
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "error": {
    "code": "400",
    "message": "Invalid cache key format",
    "details": "Cache key cannot be empty"
  }
}
```

## Security Considerations

1. **Authentication**: Always require authentication for the caching API
2. **Authorization**: Implement proper authorization checks for cache operations
3. **Key Validation**: Validate cache keys to prevent injection attacks
4. **Rate Limiting**: Consider implementing rate limiting for cache operations
5. **Data Encryption**: Sensitive data should be encrypted before caching

## Integration Examples

### JavaScript/Node.js Integration

```javascript
const axios = require('axios');

// Get cache entries
const response = await axios.get('/odata/v4/caching-api/Caches(\'caching\')/getEntries()');

// Set cache entry
await axios.post('/odata/v4/caching-api/Caches(\'caching\')/setEntry', {
  key: 'bp:1000001',
  value: JSON.stringify({ businessPartner: '1000001', name: 'Acme Corporation' }),
  ttl: 3600000
});

// Get metrics
const metrics = await axios.get('/odata/v4/caching-api/Metrics?$filter=cache eq \'caching\'');
```

### Python Integration

```python
import requests

# Get cache entries
response = requests.get('/odata/v4/caching-api/Caches(\'caching\')/getEntries()')

# Set cache entry
requests.post('/odata/v4/caching-api/Caches(\'caching\')/setEntry', json={
    'key': 'user:123',
    'value': json.dumps({'name': 'John Doe'}),
    'ttl': 3600000
})

# Get metrics
metrics = requests.get('/odata/v4/caching-api/Metrics?$filter=cache eq \'caching\'')
```

### cURL Examples

```bash
# Get all cache entries
curl -X GET "http://localhost:4004/odata/v4/caching-api/Caches('caching')/getEntries()"

# Set cache entry
curl -X POST "http://localhost:4004/odata/v4/caching-api/Caches('caching')/setEntry" \
  -H "Content-Type: application/json" \
  -d '{"key": "bp:1000001", "value": "{\"businessPartner\":\"1000001\",\"name\":\"Acme Corporation\"}", "ttl": 3600000}'

# Get metrics
curl -X GET "http://localhost:4004/odata/v4/caching-api/Metrics?\$filter=cache eq 'caching'"
```