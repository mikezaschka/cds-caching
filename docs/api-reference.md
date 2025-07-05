# cds-caching OData API Reference

This document provides a comprehensive reference for the cds-caching OData API, including all endpoints, request/response formats, and usage examples.

## Table of Contents

1. [Overview](#overview)
2. [Service Definition](#service-definition)
3. [Cache Management Endpoints](#cache-management-endpoints)
4. [Metrics Management Endpoints](#metrics-management-endpoints)
5. [Error Handling](#error-handling)
6. [Security Considerations](#security-considerations)
7. [Integration Examples](#integration-examples)

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

### Get All Cache Entries !! Performane Warning !!

**GET** `/Caches('{cacheName}')/getEntries()`

Retrieves all cache entries for a specific cache instance. A word of warning, there is no pagination support and all values will be shown. So, please use this wisely.

#### Path Parameters

- `cacheName` - The name of the cache instance (e.g., 'caching', 'bp-caching')

#### Response

```json
{
  "value": [
    {
      "entryKey": "user:123",
      "value": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}",
      "timestamp": "2024-01-15T10:30:00Z",
      "tags": ["user-123", "user-john.doe"]
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
    "name": "John Doe",
    "email": "john@example.com"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "tags": ["user-123", "user-john.doe"]
}
```

#### Example Request

```http
### Get specific cache entry
GET /odata/v4/caching-api/Caches('caching')/getEntry(key='user:123')
```

### Create/Update Cache Entry

**POST** `/Caches('{cacheName}')/setEntry`

Creates a new cache entry or updates an existing one.

#### Request Body

```json
{
  "key": "user:123",
  "value": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}",
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
  "key": "user:123",
  "value": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}",
  "ttl": 3600000
}
```

### Delete Cache Entry

**POST** `/Caches('{cacheName}')/deleteEntry`

Deletes a specific cache entry.

#### Request Body

```json
{
  "key": "user:123"
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
  "key": "user:123"
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
      "ID": "current:user:123",
      "cache": "caching",
      "keyName": "user:123",
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
      "serviceName": "UserService",
      "entityName": "UserPreferences",
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