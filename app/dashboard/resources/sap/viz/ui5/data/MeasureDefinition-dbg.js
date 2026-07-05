/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.viz.ui5.data.MeasureDefinition.
sap.ui.define(['sap/ui/core/Element','sap/viz/library'],
	function(Element, library) {
	"use strict";

	/**
	 * Constructor for a new ui5/data/MeasureDefinition.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Definition of a single Measure
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @alias sap.viz.ui5.data.MeasureDefinition
	 */
	var MeasureDefinition = Element.extend("sap.viz.ui5.data.MeasureDefinition", /** @lends sap.viz.ui5.data.MeasureDefinition.prototype */ { metadata : {

		library : "sap.viz",
		properties : {

			/**
			 * Measure group this measure belongs to. Order is significant, number should start from 1.
			 * Skip this property when use VizFrame.
			 */
			group : {type : "int", group : "Misc", defaultValue : 1},

			/**
			 * Value for the measure. Usually bound to some model field.
			 */
			value : {type : "any", group : "Data", defaultValue : null},

			/**
			 * Name of the measure as displayed in the chart
			 */
			name : {type : "string", group : "Misc", defaultValue : null},

			/**
			 * Id of the measure as displayed in the chart
			 */
			identity : {type : "string", group : "Misc", defaultValue : null},

			/**
			 * Format pattern for values of the measure
			 */
			format: {type: "any", group: "Misc", defaultValue: null},
			/**
			 * Value range
			 */
			range: {type: "any[]", group: "Misc", defaultValue: []},
			/**
			 * Unit of measure
			 */
			unit: {type: "string", group: "Misc", defaultValue: null}
		}
	}});

	MeasureDefinition.prototype._getAdapter = function() {
		var that = this,
		  oBindingInfo = this.getBindingInfo("value"),
		  oValue, sPath, oType, fnFormatter;

		// if there is no binding info, then the value is constant
		if ( !oBindingInfo ) {
			oValue = this.getValue();
			return function() {
				return oValue;
			};
		}

		fnFormatter = oBindingInfo.formatter;
		// otherwise ensure a simple property binding for now
		if ( oBindingInfo.parts.length > 1 ) {
		    if (fnFormatter){
		        return function(oContext) {
		            var oValues = [];
		            oBindingInfo.parts.forEach(function(oInfo, i){
		                var oValue = oContext.getProperty(oInfo.path);
		                if (oType) {
		                    oValue = oType.formatValue(oValue, "string"); //TODO discuss internal type
		                }
		                oValues.push(oValue);
	                });
		            return fnFormatter.call(that, oValues, oContext);
		        };
		    } else {
		        throw new Error("MeasureDefinition doesn't support calculated bindings yet");
		    }
		} else {

			sPath = oBindingInfo.parts[0].path;
			oType = oBindingInfo.parts[0].type;

			// for simple binding just resolve the value
			if ( !(oType || fnFormatter) ) {
				return function(oContext) {
					return oContext.getProperty(sPath);
			};
			}

			// else apply type and/or formatter
			return function(oContext) {
				var oValue = oContext.getProperty(sPath);
				if (oType) {
					oValue = oType.formatValue(oValue, "string"); //TODO discuss internal type
				}
				if (fnFormatter) {
					oValue = fnFormatter.call(that, oValue, oContext);
				}
				return oValue;
			};
		}
	};

	MeasureDefinition.prototype._setUnitBinding = function(sVal) {
		this._sUnitBinding = sVal;
	};

	MeasureDefinition.prototype._getUnitBinding = function() {
		return this._sUnitBinding;
	};

	return MeasureDefinition;

});
