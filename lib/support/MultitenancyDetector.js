const cds = require('@sap/cds');

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

module.exports = { isMultitenantMode, hasTenantContext };
