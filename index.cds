namespace cds_caching;

entity Statistics {
    key ID          : String; // e.g., 'daily:2024-03-20' or 'hourly:2024-03-20-15'
    key cache       : String;
        timestamp   : DateTime;
        period      : String enum {
            hourly;
            daily;
            monthly;
        }; // Granularity
        hits        : Integer default 0;
        misses      : Integer default 0;
        sets        : Integer default 0;
        deletes     : Integer default 0;
        errors      : Integer default 0;
        avgLatency  : Double; // in milliseconds
        p95Latency  : Double; // 95th percentile latency
        memoryUsage : Integer; // in bytes
        itemCount   : Integer;
}
