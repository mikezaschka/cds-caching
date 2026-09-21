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

                function getEntries(top: Integer, skip: Integer)            returns array of {
                    entryKey  : String;
                    value     : String;
                    timestamp : DateTime;
                    tags      : array of String;
                };

                function getEntry(key: String)                              returns {
                    value     : String;
                    timestamp : DateTime;
                    tags      : array of String;
                };

                action   setEntry(key: String, value: String, ttl: Integer) returns Boolean;
                action   deleteEntry(key: String)                           returns Boolean;
                action   clear()                                            returns Boolean;
                action   clearTagMetrics()                                  returns Boolean;
                action   setTagMetricsEnabled(enabled: Boolean)             returns Boolean;
                @Common.SideEffects: {
                    $Type         : 'Common.SideEffectsType',
                    TargetEntities: [in.Metrics]
                }
                action   clearMetrics()                                     returns Boolean;
                @Common.SideEffects: {
                    $Type         : 'Common.SideEffectsType',
                    TargetEntities: [in.keyMetrics]
                }
                action   clearKeyMetrics()                                  returns Boolean;
                @Common.SideEffects: {
                    $Type         : 'Common.SideEffectsType',
                    TargetEntities: [in]
                }
                action   setMetricsEnabled(enabled: Boolean)                returns Boolean;
                @Common.SideEffects: {
                    $Type         : 'Common.SideEffectsType',
                    TargetEntities: [in]
                }
                action   setKeyMetricsEnabled(enabled: Boolean)             returns Boolean;
            };

        @readonly
        entity Metrics    as projection on plugin.cds_caching.Metrics;

        @readonly
        entity KeyMetrics as projection on plugin.cds_caching.KeyMetrics;

        @readonly
        entity TagMetrics as projection on plugin.cds_caching.TagMetrics;

    }
}

annotate plugin.cds_caching.CachingApiService.Caches with @(
    UI.LineItem      : [
        {
            $Type: 'UI.DataField',
            Value: name,
        },
        {
            $Type: 'UI.DataField',
            Value: metricsEnabled,
        },
        {
            $Type: 'UI.DataField',
            Value: keyMetricsEnabled,
        },
    ],
    UI.Identification: [
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'plugin.cds_caching.CachingApiService.setMetricsEnabled',
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'plugin.cds_caching.CachingApiService.setKeyMetricsEnabled',
        },
    ],
    UI.Facets        : [{
        $Type : 'UI.ReferenceFacet',
        Target: 'metrics/@UI.LineItem',
    }, ]
);

annotate plugin.cds_caching.CachingApiService.Metrics with @(UI.LineItem: [
    {
        $Type: 'UI.DataField',
        Value: timestamp,
    },
    {
        $Type: 'UI.DataField',
        Value: avgHitLatency,
    },
    {
        $Type: 'UI.DataField',
        Value: avgMissLatency,
    },
    {
        $Type: 'UI.DataField',
        Value: errors,
    },
    {
        $Type: 'UI.DataField',
        Value: totalRequests,
    },
    {
        $Type: 'UI.DataField',
        Value: hitRatio,
    },
    {
        $Type: 'UI.DataField',
        Value: throughput,
    },
    {
        $Type: 'UI.DataField',
        Value: errorRate,
    },
    {
        $Type: 'UI.DataField',
        Value: cacheEfficiency,
    },
    {
        $Type: 'UI.DataField',
        Value: avgReadThroughLatency,
    },
    {
        $Type: 'UI.DataField',
        Value: avgHitLatency,
    },
    {
        $Type: 'UI.DataField',
        Value: avgMissLatency,
    },
    {
        $Type: 'UI.DataField',
        Value: hits,
    },
    {
        $Type: 'UI.DataField',
        Value: misses,
    },
    {
        $Type: 'UI.DataField',
        Value: name,
    },
    {
        $Type: 'UI.DataField',
        Value: timestamp,
    },
]);
