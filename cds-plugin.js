const cds = require('@sap/cds')
const CachingService = require('./lib/CachingService')
const { scanCachingAnnotations } = require('./lib/util')

cds.on('served', scanCachingAnnotations)

module.exports = cds.service.impl(CachingService)