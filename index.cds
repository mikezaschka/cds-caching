using from './db/statistics';

context plugin.cds_caching {

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
