/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([], function() {
	"use strict";

	/**
	 * Creates a new instance.
	 *
	 * @private
	 * @class
	 * @classdesc Analyzes OData Side-Effects annotation.
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.31.0
	 * @alias sap.ui.comp.odata.SideEffects
	 */
	var SideEffects = function() {

	};

	/**
	 * Calculates the available side effect annotations for a given path.
	 *
	 * @param {string} sPath the path
	 * @param {string} sTypePath the path identifying a property on a complex type
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.complexType the OData property definition
	 * @returns {map} the available side effects ordered by their origin, e.g. the entity set.
	 * @public
	*/
	SideEffects.prototype.getSideEffects = function(sPath, sTypePath, oMetaData) {
		var mResult = {};

		if (oMetaData) {
			if (sPath) {
				if (oMetaData.entitySet) {
					mResult.entitySet = this._getForPath(oMetaData.entitySet, sPath);
				}

				if (oMetaData.entityType) {
					mResult.entityType = this._getForPath(oMetaData.entityType, sPath);
				}
			}

			if (sTypePath && oMetaData.complexType) {
				mResult.complexType = this._getForPath(oMetaData.complexType, sTypePath);
			}
		}

		return mResult;
	};

	/**
	 * Returns the side effects available on an entity for a given path.
	 *
	 * @param {object} oEntity the given entity, which can be a complex type, entity type or entity set
	 * @param {string} sPath the path
	 * @returns {map} the available side effects
	 * @private
	 */
	SideEffects.prototype._getForPath = function(oEntity, sPath) {
		var n, oSideEffect, mResult = {};

		for (n in oEntity) {
			if (n.indexOf && n.indexOf("com.sap.vocabularies.Common.v1.SideEffects") === 0) {
				oSideEffect = oEntity[n];

				if (this._checkSourceProperties(oSideEffect, sPath)) {
					mResult[n] = oSideEffect;
				}

				if (this._checkSourceEntities(oSideEffect, sPath)) {
					mResult[n] = oSideEffect;
				}
			}
		}

		return mResult;
	};

	/**
	 * Checks a given side effect annotation for the given path.
	 *
	 * @param {object} oSideEffect the given side effect annotation
	 * @param {string} sPath the given path
	 * @returns {boolean} <code>true</code>, if the given side effect annotation contains the given path in its source properties, <code>false</code> otherwise.
	 * @private
	 */
	SideEffects.prototype._checkSourceProperties = function(oSideEffect, sPath) {
		var i, len;

		if (oSideEffect.SourceProperties) {
			len = oSideEffect.SourceProperties.length;

			for (i = 0; i < len; i++) {
				if (oSideEffect.SourceProperties[i].PropertyPath === sPath) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Checks a given side effect annotation for the given path.
	 *
	 * @param {object} oSideEffect the given side effect annotation
	 * @param {string} sPath the given path
	 * @returns {boolean} <code>true</code>, if the given side effect annotation contains the given path in its source properties, <code>false</code> otherwise.
	 * @private
	 */
	SideEffects.prototype._checkSourceEntities = function(oSideEffect, sPath) {
		var i, len;

		if (oSideEffect.SourceEntities && oSideEffect.SourceEntities.Collection) {
			len = oSideEffect.SourceEntities.Collection.length;

			for (i = 0; i < len; i++) {
				if (oSideEffect.SourceEntities.Collection[i].NavigationPropertyPath === sPath) {
					return true;
				}
			}
		} else if (oSideEffect.SourceEntities && Array.isArray(oSideEffect.SourceEntities)) {
			len = oSideEffect.SourceEntities.length;

			for (i = 0; i < len; i++) {
				if (oSideEffect.SourceEntities[i].NavigationPropertyPath === sPath) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 *
	 * @public
	 */
	SideEffects.prototype.destroy = function() {

	};

	return SideEffects;

}, true);