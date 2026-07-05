/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/thirdparty/URI"
], function(
	URI
) {
	"use strict";
	/*global Map, Promise */

	/**
	 * Singleton instance
	 * @private
	 */
	var oTextArrangementReadInstance;

	/**
	 * Utility class to handle TextArrangement OData read requests and cache them. It takes care that if the same read
	 * request is send twice the first request send is reused without having to send another one to the backend.
	 *
	 * NOTE: Cross model/application caching. If the first request is send from "Model A" and the second request is based
	 * on "Model B" the TextArrangementRead will test if "Model B" has the value list data loaded in the local model and
	 * based on that will proceed either with skipping or it will send the request regardless of cache availability to
	 * ensure the data is available in "Model B".
	 *
	 * Creating an instance of this class using the "new" keyword always results in the same instance (Singleton).
	 *
	 * @class
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @constructor
	 * @private
	 * @since 1.98.0
	 * @alias sap.ui.comp.smartfield.TextArrangementRead
	 */
	var TextArrangementRead = function () {
		if (!oTextArrangementReadInstance) {
			oTextArrangementReadInstance = this;

			this.mRequests = new Map();

			// The maximum VL requests we will cache
			this._iMaxRequests = 1000;

			// Cache can be disabled via URL parameter only for test files and debugging purposes
			if (window.location.search.indexOf("data-sap-ui-xx-disableTextArrangementReadCache=true") !== -1) {
				// We replace the read which has caching with method calling the direct request creation so every time
				// read is called a new request will be created practically disabling the cache.
				this.read = function (oODataModel, sPath, oDataModelReadSettings) {
					return this._createReadPromise({
						model: oODataModel,
						path: sPath,
						settings: oDataModelReadSettings
					});
				}.bind(this);
			}
		}

		// As this is a singleton we always return the same instance
		return oTextArrangementReadInstance;
	};

	/**
	 * Returns a read promise either by creating a new one or reusing identical one already created.
	 * @param {sap.ui.model.odata.v2.ODataModel} oODataModel the instance of the oData model
	 * @param {string} sPath EntitySet path
	 * @param {object} oDataModelReadSettings object
	 * @returns {Promise} the model read promise
	 */
	TextArrangementRead.prototype.read = function (oODataModel, sPath, oDataModelReadSettings) {
		var sKey,
			oData = {
				model: oODataModel,
				path: sPath,
				settings: oDataModelReadSettings
			};

		try {
			sKey = this._calculateCacheKey(oData);
		} catch (e) {
			// We failed to create complex key so we opt-out of cache directly making the request
			return this._createReadPromise(oData);
		}

		// We test if we have a stored promise for the request key and if not we create it
		return this._getPromise(sKey, oData);
	};

	/**
	 * Retrieves a promise for the provided key by either retrieving from cache a valid entry or creating a new request.
	 * @param {string} sKey
	 * @param {object} oData
	 * @returns {Promise}
	 * @private
	 */
	TextArrangementRead.prototype._getPromise = function (sKey, oData) {
		var oCache,
			vValid;

		if (this.mRequests.has(sKey)) {
			oCache = this.mRequests.get(sKey);
			vValid = this._validateCache(sKey, oCache, oData);

			if (vValid === true) {
				return oCache.promise;
			}

			if (vValid instanceof Promise) {
				return vValid;
			}
		}

		return this._createReadPromise(oData, sKey);
	};

	/**
	 * Stores a promise in the cache ensuring the timestamp is stored with it
	 * @param {string} sKey
	 * @param {Promise} oPromise
	 * @param {object} oData
	 * @param oPromise
	 * @private
	 */
	TextArrangementRead.prototype._setPromise = function (sKey, oPromise, oData) {
		var sRequestKey;

		this.mRequests.set(sKey, {
			modelId: oData.model.getId(), // We also store model ID so we can probe for loaded data if ID is different
			promise: oPromise
		});

		// Keeping cache up to certain limit of distinct VL requests to not run out of memory
		if (this.mRequests.size > this._iMaxRequests) {
			// Get the first key corresponding to the oldest created record
			sRequestKey = this.mRequests.getKeys().next().value;
			if (sRequestKey) {
				this.mRequests.delete(sRequestKey);
			}
		}
	};

	/**
	 * Validates a cache entry by checking its creation timestamp has not breached the maximum cache life
	 * @param {string} sKey
	 * @param {object} oCache
	 * @param {object} oData
	 * @returns {boolean|Promise}
	 * @private
	 */
	TextArrangementRead.prototype._validateCache = function (sKey, oCache, oData) {
		// TODO: Remove all this validations when SmartFields start to work directly with description text vs binding path
		if (oData && oData.model) {

			if (oCache.modelId === oData.model.getId()) {
				// Same model situation so we assume the data is already loaded in the local model
				return true;
			}

			return new Promise(function (fnResolve/*, fnReject */) {
				oCache.promise.then(function (oResponseData) {
					if (
						oResponseData &&
						Array.isArray(oResponseData.results) &&
						this._probeLocalModelForLoadedData(oData, oResponseData)
					) {
						fnResolve(oCache.promise);
					} else {
						fnResolve(this._createReadPromise(oData, sKey));
					}
				}.bind(this));
			}.bind(this));
		}

		return true;
	};

	/**
	 * Probes the local model for loaded value list data depending on the key generated from the cached response
	 * @param {object} oData
	 * @param {object} oResponseData
	 * @returns {boolean}
	 * @private
	 */
	TextArrangementRead.prototype._probeLocalModelForLoadedData = function (oData, oResponseData) {
		var sKey = oData.model.getKey(oResponseData.results[0]);
		if (sKey) {
			return !!oData.model.getProperty("/" + sKey);
		}
		return false;
	};

	/**
	 * Lifecycle method for cleanup
	 */
	TextArrangementRead.prototype.exit = function () {
		this.mRequests.clear();
	};

	/**
	 * Clear the cache
	 */
	TextArrangementRead.prototype.clearCache = function () {
		this.mRequests.clear();
	};

	/**
	 * Creates a promisified read request
	 * @param {object} oData
	 * @param {string} [sKey=undefined] if key is provided the new promise is cached
	 * @returns {Promise} promisified read request
	 * @private
	 */
	TextArrangementRead.prototype._createReadPromise = function (oData, sKey) {
		var oPromise = new Promise(function (fnSuccess, fnError) {
				oData.settings.success = fnSuccess;
				oData.settings.error = fnError;

				oData.model.read(oData.path, oData.settings);
			})
			.then(function(oResponseData){
				var bValidResponse = oResponseData && Array.isArray(oResponseData.results) && oResponseData.results.length === 1;

				if (sKey && !bValidResponse) {
					this.mRequests.delete(sKey);
				}

				return oResponseData;
			}.bind(this));

		if (sKey) {
			this._setPromise(sKey, oPromise, oData);
		}

		return oPromise;
	};

	/**
	 * Tries to create a complex key object which remains readable for debugging reasons by combining several available
	 * sources of information while retaining repeatability for identical requests:
	 *
	 * {
	 *     path: "EntitySet path",
	 *     service: "The service URL from the ODataModel relative to document base",
	 *     urlParams: ["list of url parameters part of the service URL from ODataModel"],
	 *     filters: [
	 *         {
	 *             p: "Property",
	 *             v: "Filter value"
	 *         }
	 *         ...
	 *     ]
	 * }
	 *
	 * NOTE: Currently all filters are combined with "AND" relation and have operation "EQ" so this info is left
	 * out of the key structure as it's not needed.
	 *
	 * @param {object} oData
	 * @returns {string} The
	 * @throws {TypeError} if key creating is unsuccessful
	 * @private
	 */
	TextArrangementRead.prototype._calculateCacheKey = function (oData) {
		// TODO: sServiceUrl and aUrlParams should be derived from model public API when provided
		var oKeyObject,
			sServiceUrl = oData.model.sServiceUrl,
			aUrlParams = oData.model.aUrlParams;

		if (!sServiceUrl) {
			throw "Can't access service URL. Opt out of value list caching.";
		}

		// Make service URL absolute to document base
		sServiceUrl = new URI(sServiceUrl).absoluteTo(document.baseURI).pathname().toString();

		// Build key object
		oKeyObject = {
			path: oData.path, // Value list path
			service: sServiceUrl, // Service URL,
			filters: this._flattenFilters(oData.settings.filters) // Flattened array of filters
		};

		// Add service URL parameters to the key only if significant
		if (Array.isArray(aUrlParams) && aUrlParams.length) {
			oKeyObject["urlParams"] = aUrlParams;
		}

		return JSON.stringify(oKeyObject);
	};

	/**
	 * Flattens the nested filter objects to a one dimensional array object.
	 *
	 * @param {object} oFilters
	 * @returns {array}
	 * @private
	 */
	TextArrangementRead.prototype._flattenFilters = function (oFilters) {
		var aFilters = [],
			fnIterate = function (oFilter) {
				if (oFilter.sPath) {
					// We assume that for description requests currently all the filters are combined with "and" and
					// all the operations are "EQ". This might need to be enhanced in the future.
					aFilters.push({
						p: oFilter.sPath,
						v: oFilter.oValue1
					});
				}
				if (Array.isArray(oFilter.aFilters)) {
					oFilter.aFilters.forEach(fnIterate);
				}
			};

		fnIterate(oFilters[0]);

		return aFilters;
	};

	return TextArrangementRead;
}, false /* No global export required */);
