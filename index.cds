using from './db/statistics';

context plugin.cds_caching {

    /**
     * Management API for cache entries and metrics.
     *
     * Guarded with `authenticated-user` by default, because these operations can
     * read and flush cache contents. Override in your own model to require a
     * dedicated role instead:
     *
     *   annotate plugin.cds_caching.CachingApiService with @requires: 'CacheAdmin';
     */
    @impl    : 'cds-caching/srv/caching-api-service'
    @requires: 'authenticated-user'
    service CachingApiService {

        // Writes go through the bound actions below, never through CRUD, so that
        // config rows (metricsEnabled, config) cannot be tampered with directly.
        @readonly
        entity Caches     as projection on plugin.cds_caching.Caches
            actions {

                function getEntries(top : Integer, skip : Integer)             returns array of {
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
