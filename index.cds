context plugin.cds_caching {

    entity Caches {
        key name                 : String;
            config               : String;
            enableStatistics     : Boolean default false;
            enableKeyTracking    : Boolean default false;
            statistics           : Composition of many Statistics
                                       on statistics.cache = $self.name;
            keyAccesses          : Composition of many KeyAccesses
                                       on keyAccesses.cache = $self.name;
            latencyDistributions : Composition of many LatencyDistributions
                                       on latencyDistributions.cache = $self.name;
    }

    entity Statistics {
        key ID               : String; // e.g., 'daily:2024-03-20' or 'hourly:2024-03-20-15'
        key cache            : String;
            timestamp        : DateTime;
            period           : String enum {
                hourly;
                daily;
                monthly;
            }; // Granularity
            hits             : Integer default 0;
            misses           : Integer default 0;
            sets             : Integer default 0;
            deletes          : Integer default 0;
            errors           : Integer default 0;
            // Overall latency metrics
            avgLatency       : Double; // in milliseconds
            p95Latency       : Double; // 95th percentile latency
            p99Latency       : Double; // 99th percentile latency
            minLatency       : Double; // minimum latency
            maxLatency       : Double; // maximum latency

            // Hit-specific latency metrics
            avgHitLatency    : Double; // average hit latency in milliseconds
            p95HitLatency    : Double; // 95th percentile hit latency
            p99HitLatency    : Double; // 99th percentile hit latency
            minHitLatency    : Double; // minimum hit latency
            maxHitLatency    : Double; // maximum hit latency

            // Miss-specific latency metrics
            avgMissLatency   : Double; // average miss latency in milliseconds
            p95MissLatency   : Double; // 95th percentile miss latency
            p99MissLatency   : Double; // 99th percentile miss latency
            minMissLatency   : Double; // minimum miss latency
            maxMissLatency   : Double; // maximum miss latency

            // Set/Delete latency metrics
            avgSetLatency    : Double; // average set latency in milliseconds
            avgDeleteLatency : Double; // average delete latency in milliseconds

            // Performance metrics
            memoryUsage      : Integer; // in bytes
            itemCount        : Integer;
            hitRatio         : Double; // hit ratio as percentage
            throughput       : Double; // requests per second
            errorRate        : Double; // error rate as percentage
            cacheEfficiency  : Double; // ratio of miss latency to hit latency
            uptimeMs         : Integer; // uptime in milliseconds
    }

    entity KeyAccesses {
        key ID          : String;
        key cache       : String;
        key keyName     : String;
            hits        : Integer default 0;
            misses      : Integer default 0;
            sets        : Integer default 0;
            deletes     : Integer default 0;
            total       : Integer default 0;
            lastAccess  : DateTime;
            period      : String enum {
                current;
                hourly;
                daily;
            };
            // Metadata fields
            dataType    : String enum {
                query;
                request;
                function;
                custom;
            };
            serviceName : String;
            entityName  : String;
            operation   : String;
            metadata    : String; // JSON string for additional metadata
    }

    entity LatencyDistributions {
        key ID                : String;
        key cache             : String;
        key operation         : String enum {
                overall;
                hit;
                miss;
                set;
                delete;
            };
        key period            : String enum {
                hourly;
                daily;
            };
            timestamp         : DateTime;
            bucket0_1ms       : Integer default 0; // 0-1ms
            bucket1_5ms       : Integer default 0; // 1-5ms
            bucket5_10ms      : Integer default 0; // 5-10ms
            bucket10_25ms     : Integer default 0; // 10-25ms
            bucket25_50ms     : Integer default 0; // 25-50ms
            bucket50_100ms    : Integer default 0; // 50-100ms
            bucket100_250ms   : Integer default 0; // 100-250ms
            bucket250_500ms   : Integer default 0; // 250-500ms
            bucket500_1000ms  : Integer default 0; // 500-1000ms
            bucket1000ms_plus : Integer default 0; // 1000ms+
            totalRequests     : Integer default 0;
    }

    @impl: 'cds-caching/srv/statistics-service'
    service CachingService {

        @readonly
        entity Caches               as projection on plugin.cds_caching.Caches;

        @readonly
        entity Statistics           as projection on plugin.cds_caching.Statistics;

        @readonly
        entity KeyAccesses          as projection on plugin.cds_caching.KeyAccesses;

        @readonly
        entity LatencyDistributions as projection on plugin.cds_caching.LatencyDistributions;

        function getStatistics(period : String enum {
            hourly;
            daily;
            monthly;
        },
                               from : DateTime,
                               to : DateTime)                             returns array of Statistics;

        function getCurrentStatistics()                                   returns Statistics;
        function getTopKeys(limit : Integer)                              returns array of KeyAccesses;
        function getColdKeys(limit : Integer)                             returns array of KeyAccesses;

        function getLatencyAnalysis(operation : String enum {
            overall;
            hit;
            miss;
            set;
            delete;
        },
                                    period : String enum {
            hourly;
            daily;
        },
                                    from : DateTime,
                                    to : DateTime)                        returns array of LatencyDistributions;

        function getCacheEfficiencyReport(from : DateTime, to : DateTime) returns array of Statistics;

        function getRuntimeConfiguration(cache : String)                                returns {
            enableStatistics  : Boolean;
            enableKeyTracking : Boolean;
        };

        function getPersistenceStatus(cache : String)                                   returns {
            enabled             : Boolean;
            intervalExists      : Boolean;
            lastPersisted       : DateTime;
            persistenceInterval : Integer;
        };
        
        action   persistStatistics()                                      returns Boolean;
        action   setStatisticsEnabled(cache : String, enabled : Boolean)  returns Boolean;
        action   setKeyTrackingEnabled(cache : String, enabled : Boolean) returns Boolean;
        action   triggerPersistence(cache : String)                       returns Boolean;
        action   generateLatencyDistributions()                           returns Boolean;
    }
}
