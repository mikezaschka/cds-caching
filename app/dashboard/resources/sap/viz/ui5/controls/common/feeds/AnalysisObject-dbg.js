/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.viz.ui5.controls.common.feeds.AnalysisObject.
sap.ui.define(['sap/ui/core/Element','sap/viz/library'],
	function(Element, library) {
	"use strict";

	/**
	 * Constructor for a new ui5/controls/common/feeds/AnalysisObject.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * AnalysisObject Class
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @since 1.21.0
	 * @name sap.viz.ui5.controls.common.feeds.AnalysisObject
	 */
	var AnalysisObject = Element.extend("sap.viz.ui5.controls.common.feeds.AnalysisObject", /** @lends sap.viz.ui5.controls.common.feeds.AnalysisObject.prototype */ { metadata : {

		library : "sap.viz",
		properties : {

			/**
			 * Uid of analysis object
			 */
			uid : {type : "string", group : "Misc", defaultValue : null},

			/**
			 * Name of an analysis object.
			 */
			name : {type : "string", group : "Misc", defaultValue : null},

			/**
			 * Type of an analysis object. Enumeration: Measure, Dimension
			 */
			type : {type : "string", group : "Misc", defaultValue : null},

			/**
			 * Data type of an analysis object. Enumeration: string, number, date
			 */
			dataType : {type : "string", group : "Misc", defaultValue : null}
		}
	}});

	///**
	// * This file defines behavior for the control,
	// */
	AnalysisObject.prototype._toInnerFmt = function(generator) {
		var uid = this.getProperty('uid');
		var type = this.getProperty('type');
		if (uid && type) {
			return new generator(uid, this.getProperty('name'), type, this.getProperty('dataType'), this._inResult());
		}
	};

	/**
	 * to set the analysis object is inresult or not to let BVR services to handle adding mnd automaully,
	 * for now, the inresult is not intended to be exposed
	**/
	AnalysisObject.prototype._inResult = function(bInResult){
		if (!arguments.length){
			return !!this._bInResult;
		} else {
			this._bInResult = bInResult;
			return this;
		}

	};

	AnalysisObject.toVizControlsFmt = function(analysisObjects) {
		return Array.prototype.map.call(analysisObjects, function(analysisObject) {
			return analysisObject._toInnerFmt(function(id, name, type, dataType) {
				type = type ? type.toLowerCase() : type;
				dataType = dataType ? dataType.toLowerCase() : dataType;
				return new sap.viz.controls.common.feeds.AnalysisObject(id, name, type, dataType);
			});
		});
	};

	AnalysisObject.fromVizControlsFmt = function(instances) {
		return Array.prototype.map.call(instances, function(instance) {
			return new AnalysisObject({
				'uid': instance.id(),
				'name': instance.name(),
				'type': instance.type(),
				'dataType' : instance.dataType()
			});
		});
	};

	AnalysisObject.toLightWeightFmt = function(analysisObjects) {
		return Array.prototype.map.call(analysisObjects, function(analysisObject) {
			return analysisObject._toInnerFmt(function(id, name, type, dataType, inResult) {
				dataType = _lwDataTypeMapping[dataType] || dataType;
				type = _lwTypeMapping[type] || type;
				if (dataType || dataType.length) {
					return {
						'id' : id,
						'type' : type,
						'inResult': inResult,
						'dataType' : dataType
					};
				} else {
					return {
						'id' : id,
						'type' : type,
						'inResult': inResult
					};
				}
			});
		});
	};

	AnalysisObject.fromLightWeightFmt = function(analysisObjectsLightWeightFmt) {
		return Array.prototype.map.call(analysisObjectsLightWeightFmt, function(instance) {
			return (new AnalysisObject({
				'uid': instance.id,
				'name': instance.id,
				'type': instance.type,
				'dataType' : _invertLwDataTypeMapping[instance.dataType] || instance.dataType
			}))._inResult(instance.inResult);
		});
	};
	var _invert = function(object) {
		var result = {};
		for (var key in object) {
			var value = object[key];
			result[value] = key;
		}
		return result;
	};

	var _lwDataTypeMapping = {
		'string' : 'String',
		'number' : 'Number',
		'date' : 'Date'
	};
	var _lwTypeMapping = {
		'measure' : 'Measure',
		'dimension' : 'Dimension'
	};
	var _invertLwDataTypeMapping = _invert(_lwDataTypeMapping);


	return AnalysisObject;

});
