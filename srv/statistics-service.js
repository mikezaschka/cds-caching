const cds = require('@sap/cds')

class StatisticsService extends cds.ApplicationService {
    async init() {
        const { Statistics, Current } = this.entities

        // Get reference to cache service
        const cache = await cds.connect.to('caching')
        
        // Handle getStats function
        this.on('getStats', async (req) => {
            const { period, from, to } = req.data
            return cache.getStats(period, from, to)
        })

        // Handle getCurrentStats function
        this.on('getCurrentStats', async () => {
            const stats = await cache.getCurrentStats()
            if (!stats) return null

            // Convert to CurrentStats entity format
            return {
                id: 'current',
                hits: stats.hits,
                misses: stats.misses,
                sets: stats.sets,
                deletes: stats.deletes,
                errors: stats.errors,
                latencies: stats.latencies
            }
        })

        // Handle persistStats action
        this.on('persistStats', async (req) => {
            if (!cache.statistics?.persistStats) {
                req.warn('Statistics are not enabled')
                return false
            }

            await cache.statistics.persistStats()
            return true
        })

        // Add custom handlers for the entities if needed
        this.before('READ', 'Statistics', req => {
            if (!cache.statistics) {
                req.warn('Statistics are not enabled')
                return []
            }
        })

        this.on('READ', 'CurrentStats', async req => {
            const stats = await cache.getCurrentStats()
            if (!stats) return []

            // Convert to CurrentStats entity format
            return {
                id: 'current',
                hits: stats.hits,
                misses: stats.misses,
                sets: stats.sets,
                deletes: stats.deletes,
                errors: stats.errors,
                latencies: stats.latencies
            }
        })

        await super.init()
    }
}

module.exports = StatisticsService 