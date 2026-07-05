/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(["sap/ui/comp/odata/SideEffects"], function(SideEffects) {
	"use strict";

	/**
	 * Creates a new instance.
	 *
	 * This module is only for internal use!
	 *
	 * @param {sap.ui.core.Control} oParent the parent control
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.31.0
	 * @class
	 * Analyzes OData Side-Effects annotation in the SmartField.
	 * @private
	 * @alias sap.ui.comp.odata.SideEffects
	 */
	var SideEffectUtil = function(oParent) {
		this._oParent = oParent;
		this._oSideEffects = new SideEffects();
	};

	/**
	 * Calculates the field group IDs according to the side effects annotation.
	 *
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @param {sap.ui.core.mvc.View} oView the current view
	 * @returns {array} the IDs of the field groups
	 * @public
	 */
	SideEffectUtil.prototype.getFieldGroupIDs = function(oMetaData, oView) {
		var oMeta, oComplex, sTypePath, mSideEffects;

		if (oMetaData.property && oMetaData.property.complex) {
			oComplex = oMetaData.property.parents[0];
			sTypePath = this._toTypePath(oMetaData.path, oComplex);
		}

		oMeta = {
			entitySet: oMetaData.entitySet,
			entityType: oMetaData.entityType,
			complexType: oComplex
		};

		mSideEffects = this._oSideEffects.getSideEffects(oMetaData.path, sTypePath, oMeta);
		return this._calcFieldGroups(mSideEffects, oMetaData, oView);
	};

	/**
	 * Calculates the field group definitions and returns the IDs of the field group.
	 *
	 * @param {map} mSideEffects the given side effects
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @param {sap.ui.core.mvc.View} oView the current view
	 * @returns {array} the field group IDs
	 * @private
	 */
	SideEffectUtil.prototype._calcFieldGroups = function(mSideEffects, oMetaData, oView) {
		var sContextPath, aSideEffects, i, len, aGroupIDs = [], oContext;

		aSideEffects = this._getSideEffects(mSideEffects, oMetaData, oView);
		len = aSideEffects.length;
		oContext = this._oParent.getBindingContext();
		sContextPath = oContext.getPath();

		for (i = 0; i < len; i++) {
			this._calcFieldGroups2(aSideEffects[i], aGroupIDs, oView, sContextPath, oContext);
		}

		return aGroupIDs.length > 0 ? aGroupIDs : null;
	};

	/**
	 * Calculates the field group definitions and returns the IDs of the field group for side effects
	 * that have been collected for entity set, entity type or complex type.
	 *
	 * @param {map} oSideEffects the given side effects
	 * @param {array} aGroupIDs all available field group IDs
	 * @param {sap.ui.core.mvc.View} oView the current view
	 * @param {string} sContextPath the given binding context path
	 * @private
	 */
	SideEffectUtil.prototype._calcFieldGroups2 = function(oSideEffects, aGroupIDs, oView, sContextPath, oContext) {
		var sUUID, sID, oID, that = this;

		oSideEffects.sideEffects.forEach(function(oItem) {
			oID = {
				name: oItem.name,
				originType: oItem.originType,
				originName: oSideEffects.origin.name,
				originNamespace: oSideEffects.origin.namespace,
				context: sContextPath
			};

			sID = JSON.stringify(oID);
			sID = sID.substring(1, sID.length - 2); //remove "{ ... }" because sID will be set to a property, where the JSON curly bracket { will be interpreted as binding...
			sUUID = oView.data(sID);

			if (!sUUID) {
				sUUID = that.createUUID();
				oID.contextObject = oContext; // BCP: 1970418311 object is needed for message handling validation FE scenario
				oView.data(sUUID, oID);
				oView.data(sID, sUUID);
			}

			aGroupIDs.push(sUUID);
		});
	};

	/**
	 * Returns side effects.
	 *
	 * @param {map} mSideEffects the given side effects
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @returns {array} the side effects
	 * @private
	 */
	SideEffectUtil.prototype._getSideEffects = function(mSideEffects, oMetaData) {
		var aResult = [];

		// check entity set
		var oResult = {};
		oResult.sideEffects = this._getSideEffectsFromEntity("entitySet", mSideEffects);

		if (oResult.sideEffects && oResult.sideEffects.length) {
			oResult.origin = oMetaData.entitySet;
			aResult.push(oResult);
		}

		// check entity type
		oResult = {};
		oResult.sideEffects = this._getSideEffectsFromEntity("entityType", mSideEffects);

		if (oResult.sideEffects && oResult.sideEffects.length) {
			oResult.origin = oMetaData.entityType;
			aResult.push(oResult);
		}

		// check complex type
		oResult = {};
		oResult.sideEffects = this._getSideEffectsFromEntity("complexType", mSideEffects);

		if (oResult.sideEffects && oResult.sideEffects.length) {
			oResult.origin = oMetaData.property.parents[0];
			aResult.push(oResult);
		}

		return aResult;
	};

	/**
	 * Returns the side effect in the map.
	 *
	 * @param {string} sName the name of the map
	 * @param {map} mSideEffects the given side effects
	 * @returns {array} the side effects in the map
	 * @private
	 */
	SideEffectUtil.prototype._getSideEffectsFromEntity = function(sName, mSideEffects) {
		var n,
			aSideEffects = [];

		if (mSideEffects[sName]) {
			for (n in mSideEffects[sName]) {
				aSideEffects.push({
					name: n,
					originType: sName,
					sideEffect: mSideEffects[sName][n]
				});
			}
		}

		return aSideEffects;
	};

	/**
	 * Converts a given path to the type path.
	 *
	 * @param {string} sPath the given path
	 * @param {object} oComplexType the given complex type
	 * @returns {string} the type path.
	 * @private
	 */
	SideEffectUtil.prototype._toTypePath = function(sPath, oComplexType) {
		var aProp = sPath.split("/");
		return sPath.replace(aProp[0], oComplexType.name);
	};

	/**
	 * Creates a new UUID.
	 *
	 * @returns {string} the new UUID.
	 * @public
	 */
	SideEffectUtil.prototype.createUUID = function() {
		var d = new Date().getTime();
		var uuid = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/[x]/g, function(c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c === "x" ? r : (r & 0x7 | 0x8)).toString(16);
		});
		return uuid;
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 *
	 * @public
	 */
	SideEffectUtil.prototype.destroy = function() {
		if (this._oSideEffects) {
			this._oSideEffects.destroy();
		}

		this._oSideEffects = null;
	};

	return SideEffectUtil;

}, true);
