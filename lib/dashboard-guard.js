const cds = require('@sap/cds')

/**
 * Express guard requiring an authenticated user.
 *
 * The dashboard is served as static files outside CAP's service adapters, so it
 * inherits no authorization from the model. Restricting `CachingApiService` alone
 * would leave this route open.
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {Function} next - Downstream handler
 */
function requireAuthenticatedUser(req, res, next) {
    const user = cds.context?.user
    if (user?.is?.('authenticated-user')) return next()

    res.status(401).set('WWW-Authenticate', 'Basic realm="cds-caching"').end()
}

/**
 * CAP's own request middlewares (context, trace, auth, model), flattened and
 * compacted so they can be spread into an `app.use()` call. These populate
 * `cds.context.user`, which the guard above depends on.
 *
 * @returns {Function[]}
 */
function capRequestMiddlewares() {
    return (cds.middlewares?.before ?? []).flat().filter(Boolean)
}

module.exports = { requireAuthenticatedUser, capRequestMiddlewares }
