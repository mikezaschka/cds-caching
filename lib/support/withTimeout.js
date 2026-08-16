/**
 * Time bound for individual cache operations.
 *
 * A cache that is slow is worse than no cache, and a cache that never answers
 * takes the request path down with it. Stores fail in both ways: an unreachable
 * Redis leaves commands waiting for a connection that is still being retried, and
 * a socket that dies mid-command leaves a promise that neither settles nor
 * errors. Error handling does not help, because a pending promise is not an error.
 *
 * Bounding each operation converts that into an ordinary cache failure, which the
 * callers already degrade from by going to the origin. Recovery is deliberately
 * left to the store's own reconnection: refusing to reconnect would also avoid the
 * hang, at the price of a cache that stays dead for the life of the process after
 * one blip.
 */

const DEFAULT_OPERATION_TIMEOUT = 2000

class CacheTimeoutError extends Error {
    /**
     * @param {string} label - Operation description, e.g. "caching.get"
     * @param {number} timeoutMs - Bound that was exceeded
     */
    constructor(label, timeoutMs) {
        super(`Cache operation ${label} exceeded ${timeoutMs}ms and was abandoned`)
        this.name = 'CacheTimeoutError'
        this.code = 'CACHE_TIMEOUT'
        this.timeoutMs = timeoutMs
    }
}

/**
 * Run an operation under a time bound.
 *
 * The abandoned operation is not cancelled — it cannot be, since the store owns
 * it — but its outcome is consumed either way, so a late rejection cannot surface
 * as an unhandled one.
 *
 * @param {() => Promise<any>} operation - Operation to run
 * @param {number} timeoutMs - Bound in milliseconds; `0` or less disables it
 * @param {string} label - Operation description for the error message
 * @returns {Promise<any>}
 */
function withTimeout(operation, timeoutMs, label = 'operation') {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        return Promise.resolve().then(operation)
    }

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new CacheTimeoutError(label, timeoutMs)), timeoutMs)
        // Never let a pending bound keep the process alive on shutdown.
        timer.unref?.()

        Promise.resolve().then(operation).then(
            value => { clearTimeout(timer); resolve(value) },
            error => { clearTimeout(timer); reject(error) }
        )
    })
}

/**
 * Resolve the configured bound for a cache.
 * @param {object} [options={}] - Cache service options
 * @returns {number} Bound in milliseconds, `0` when disabled
 */
function resolveOperationTimeout(options = {}) {
    const configured = options.operationTimeout

    if (configured === false || configured === 0) return 0
    if (configured === undefined || configured === null) return DEFAULT_OPERATION_TIMEOUT
    if (!Number.isFinite(configured) || configured < 0) return DEFAULT_OPERATION_TIMEOUT

    return configured
}

module.exports = {
    DEFAULT_OPERATION_TIMEOUT,
    CacheTimeoutError,
    withTimeout,
    resolveOperationTimeout,
}
