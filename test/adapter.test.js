const cds = require('@sap/cds')
const net = require('net')
const { expect } = cds.test().in(__dirname + '/app')

/**
 * Fast TCP probe so Postgres/Redis suites skip when the store is not running
 * locally (docker matrix still covers them).
 */
function canReach(host, port, timeoutMs = 250) {
    return new Promise((resolve) => {
        const socket = net.connect({ host, port })
        const done = (ok) => {
            socket.removeAllListeners()
            socket.destroy()
            resolve(ok)
        }
        socket.setTimeout(timeoutMs)
        socket.once('connect', () => done(true))
        socket.once('error', () => done(false))
        socket.once('timeout', () => done(false))
    })
}

function describeIf(condition, title, fn) {
    if (!condition) {
        console.warn(`[adapter] skipping ${title}: store not reachable`)
    }
    ;(condition ? describe : describe.skip)(title, fn)
}

// Probes run once at load so describe.skip is decided before the suite registers.
const postgresReachable = await canReach('localhost', 5432)
const redisReachable = await canReach('localhost', 6379)

describe('Adapter Tests', () => {

    describeIf(postgresReachable, 'Postgres Adapter', () => {
        let cache;

        beforeEach(async () => {
            cache = await cds.connect.to("caching-postgres");

            await cache.clear();
        })

        it('support the basic operations', async () => {
            await cache.set("key", "value");
            const value = await cache.get("key");
            expect(value).to.eql("value");
        })

        afterEach(async () => {
            await cache.disconnect();
        })
    })

    describeIf(redisReachable, 'Redis Adapter', () => {
        let cache;

        beforeEach(async () => {
            cache = await cds.connect.to("caching-redis");

            await cache.clear();
        })

        it('support the basic operations', async () => {
            await cache.set("key", "value");
            const value = await cache.get("key");
            expect(value).to.eql("value");
        })


        afterEach(async () => {
            await cache.disconnect();
        })
        
    })

    describe('SQLite Adapter', () => {
        let cache;

        beforeEach(async () => {
            cache = await cds.connect.to("caching-sqlite");

            await cache.clear();
        })

        it('support the basic operations', async () => {
            await cache.set("key", "value");
            const value = await cache.get("key");
            expect(value).to.eql("value");
        })
        
        afterEach(async () => {
            await cache.disconnect();
        })
    })

    describe('In-Memory Adapter', () => {
        let cache;

        beforeEach(async () => {
            cache = await cds.connect.to("caching-in-memory");

            await cache.clear();
        })

        it('support the basic operations', async () => {
            await cache.set("key", "value");
            const value = await cache.get("key");
            expect(value).to.eql("value");
        })
        
        afterEach(async () => {
            await cache.disconnect();
        })
    })

})
