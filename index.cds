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
        // config rows and metrics overrides cannot be tampered with directly.
        //
        // metricsEnabled / keyMetricsEnabled / tagMetricsEnabled on the entity are
        // nullable operator overrides (null = follow package.json). OData READ
        // rewrites them to the *effective* value and exposes config/override
        // provenance via virtual fields and getConfigView().
        @readonly
        entity Caches     as projection on plugin.cds_caching.Caches {
            *,
            // CDS 8 needs `virtual null as name` (not `virtual name : Type`).
            virtual null as metricsEnabledConfig       : Boolean,
            virtual null as metricsEnabledOverride     : Boolean,
            virtual null as keyMetricsEnabledConfig    : Boolean,
            virtual null as keyMetricsEnabledOverride  : Boolean,
            virtual null as tagMetricsEnabledConfig    : Boolean,
            virtual null as tagMetricsEnabledOverride  : Boolean
        }
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

                /**
                 * Config seed, operator override, and effective value for each metrics flag.
                 */
                function getConfigView()                                       returns {
                    metrics : {
                        config    : Boolean;
                        override  : Boolean;
                        effective : Boolean;
                    };
                    keyMetrics : {
                        config    : Boolean;
                        override  : Boolean;
                        effective : Boolean;
                    };
                    tagMetrics : {
                        config    : Boolean;
                        override  : Boolean;
                        effective : Boolean;
                    };
                };

                action   setEntry(key : String, value : String, ttl : Integer) returns Boolean;
                action   deleteEntry(key : String)                             returns Boolean;
                action   clear()                                               returns Boolean;
                action   clearMetrics()                                        returns Boolean;
                action   clearKeyMetrics()                                     returns Boolean;
                action   clearTagMetrics()                                     returns Boolean;
                // Pass null to clear the operator override and fall back to package.json.
                action   setMetricsEnabled(enabled : Boolean)                  returns Boolean;
                action   setKeyMetricsEnabled(enabled : Boolean)               returns Boolean;
                action   setTagMetricsEnabled(enabled : Boolean)               returns Boolean;
            };

        @readonly
        entity Metrics    as projection on plugin.cds_caching.Metrics;

        @readonly
        entity KeyMetrics as projection on plugin.cds_caching.KeyMetrics;

        @readonly
        entity TagMetrics as projection on plugin.cds_caching.TagMetrics;

    }
}
