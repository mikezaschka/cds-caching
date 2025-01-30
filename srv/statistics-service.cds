using {cds_caching as stats} from '../index.cds';

@path    : 'cache-stats'
@requires: 'cache-admin'
service StatisticsService {
    @readonly
    entity Statistics as projection on stats.Statistics;

    @readonly
    @cds.persistence.skip
    entity CurrentStats {
        key ID        : String default 'current';
        key cache     : String;
            hits      : Integer default 0;
            misses    : Integer default 0;
            sets      : Integer default 0;
            deletes   : Integer default 0;
            errors    : Integer default 0;
            latencies : array of Double; // Rolling window of recent latencies
    }

    // Action to get stats for a specific time range
    function getStats(period : String enum {
        hourly;
        daily;
        monthly;
    },
                      from : DateTime,
                      to : DateTime) returns array of Statistics;

    // Action to get current statistics
    function getCurrentStats()       returns CurrentStats;
    // Action to manually trigger stats persistence
    action   persistStats()          returns Boolean;
}
