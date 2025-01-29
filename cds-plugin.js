const cds = require('@sap/cds')
const CachingService = require('./srv/CachingService')
const { scanCachingAnnotations } = require('./srv/util')

cds.on('served', scanCachingAnnotations)

module.exports = cds.service.impl(CachingService)