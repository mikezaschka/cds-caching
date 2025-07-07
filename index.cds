context plugin.cds_caching {

    entity Caches {
        key name              : String;
            config            : String;
            metricsEnabled    : Boolean default false;
            keyMetricsEnabled : Boolean default false;
            metrics           : Composition of many Metrics
                                    on metrics.cache = $self.name;
            keyMetrics        : Composition of many KeyMetrics
                                    on keyMetrics.cache = $self.name;
    }

    entity Metrics {
        key ID                    : String; // e.g., 'daily:2024-03-20' or 'hourly:2024-03-20-15'
        key cache                 : String;
            timestamp             : DateTime;
            period                : String enum {
                hourly;
                daily;
                monthly;
            }; // Granularity

            // Read-through metrics (hits and misses only)
            hits                  : Integer default 0;
            misses                : Integer default 0;
            errors                : Integer default 0;
            totalRequests         : Integer default 0;
            // Read-through latency metrics
            avgHitLatency         : Double; // average hit latency in milliseconds
            minHitLatency         : Double; // minimum hit latency
            maxHitLatency         : Double; // maximum hit latency
            avgMissLatency        : Double; // average miss latency in milliseconds
            minMissLatency        : Double; // minimum miss latency
            maxMissLatency        : Double; // maximum miss latency
            avgReadThroughLatency : Double; // average read through latency in milliseconds

            // Read-through performance metrics
            hitRatio              : Double; // hit ratio as percentage
            throughput            : Double; // requests per second
            errorRate             : Double; // error rate as percentage
            cacheEfficiency       : Double; // ratio of miss latency to hit latency

            // Native function metrics (basic counts only)
            nativeSets            : Integer default 0;
            nativeGets            : Integer default 0;
            nativeDeletes         : Integer default 0;
            nativeClears          : Integer default 0;
            nativeDeleteByTags    : Integer default 0;
            nativeErrors          : Integer default 0;
            totalNativeOperations : Integer default 0;
            // Native function performance metrics
            nativeThroughput      : Double; // native operations per second
            nativeErrorRate       : Double; // native operation error rate

            // Common metrics
            memoryUsage           : Integer; // in bytes
            itemCount             : Integer;
            uptimeMs              : Integer; // uptime in milliseconds
    }

    entity KeyMetrics {
        key ID                    : String;
        key cache                 : String;
        key keyName               : String;
            lastAccess            : DateTime;
            period                : String enum {
                current;
                hourly;
                daily;
            };

            // Operation type tracking
            operationType         : String enum {
                read_through;
                native;
                mixed;
            };

            // Read-through metrics (hits and misses only)
            hits                  : Integer default 0;
            misses                : Integer default 0;
            errors                : Integer default 0;
            totalRequests         : Integer default 0;
            hitRatio              : Double; // hit ratio as percentage
            cacheEfficiency       : Double; // ratio of miss latency to hit latency

            // Read-through latency metrics
            avgHitLatency         : Double; // average hit latency in milliseconds
            minHitLatency         : Double; // minimum hit latency
            maxHitLatency         : Double; // maximum hit latency
            avgMissLatency        : Double; // average miss latency in milliseconds
            minMissLatency        : Double; // minimum miss latency
            maxMissLatency        : Double; // maximum miss latency
            avgReadThroughLatency : Double; // average read through latency in milliseconds

            // Read-through performance metrics
            throughput            : Double; // requests per second
            errorRate             : Double; // error rate as percentage

            // Native function metrics (counts only)
            nativeHits            : Integer default 0;
            nativeMisses          : Integer default 0;
            nativeSets            : Integer default 0;
            nativeDeletes         : Integer default 0;
            nativeClears          : Integer default 0;
            nativeDeleteByTags    : Integer default 0;
            nativeErrors          : Integer default 0;
            totalNativeOperations : Integer default 0;
            // Native function performance metrics
            nativeThroughput      : Double; // native operations per second
            nativeErrorRate       : Double; // native operation error rate

            // Metadata fields
            dataType              : String;
            operation             : String; // concatenated cache service operations (e.g., SET, GET, WRAP, RUN...)
            metadata              : LargeString; // JSON string for additional metadata
            // Enhanced context information
            context               : String; // JSON string with detailed context
            query                 : LargeString; // CQL query text if applicable
            subject               : LargeString; // JSON string with subject information
            target                : String; // Target information
            tenant                : String; // Tenant information
            user                  : String; // User information
            locale                : String; // Locale information
            timestamp             : DateTime; // When this key was first accessed
            cacheOptions          : String; // JSON string with cache options
    }


    @impl: 'cds-caching/srv/caching-api-service'
    service CachingApiService {

        entity Caches     as projection on plugin.cds_caching.Caches
            actions {

                function getEntries()                                          returns array of {
                    entryKey  : String;
                    value     : String;
                    timestamp : DateTime;
                    tags      : array of String;
                };

                function getEntry(key : String)                                returns {
                    value     : String;
                    timestamp : DateTime;
                    tags      : array of String;
                };

                action   setEntry(key : String, value : String, ttl : Integer) returns Boolean;
                action   deleteEntry(key : String)                             returns Boolean;
                action   clear()                                               returns Boolean;
                action   clearMetrics()                                        returns Boolean;
                action   clearKeyMetrics()                                     returns Boolean;
                action   setMetricsEnabled(enabled : Boolean)                  returns Boolean;
                action   setKeyMetricsEnabled(enabled : Boolean)               returns Boolean;
            };

        @readonly
        entity Metrics    as projection on plugin.cds_caching.Metrics;

        @readonly
        entity KeyMetrics as projection on plugin.cds_caching.KeyMetrics;

    }
}
