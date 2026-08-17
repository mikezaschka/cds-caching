const cds = require('@sap/cds');

/** Tenant id used when not in MTX, or when no tenant is on the context. */
const DEFAULT_TENANT = '_default';

/**
 * Detects whether the application is running in multi-tenant mode (MTX)
 * and whether a tenant context is currently available.
 */

/**
 * Check if the application is configured for multi-tenancy.
 * Returns true when @sap/cds-mtxs sets cds.env.requires.multitenancy.
 * @returns {boolean}
 */
function isMultitenantMode() {
    return !!(cds.env.requires?.multitenancy || cds.env.requires?.['cds.xt.SaasProvisioningService']);
}

/**
 * Check if a tenant context is currently available (i.e., we are inside a tenant request).
 * @returns {boolean}
 */
function hasTenantContext() {
    return !!cds.context?.tenant;
}

/**
 * Effective tenant id for metrics / cache partitioning.
 * In MTX with a request context, returns cds.context.tenant.
 * Otherwise returns {@link DEFAULT_TENANT}.
 * @returns {string}
 */
function currentTenant() {
    return cds.context?.tenant || DEFAULT_TENANT;
}

module.exports = { isMultitenantMode, hasTenantContext, currentTenant, DEFAULT_TENANT };
