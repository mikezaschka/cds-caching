/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.viz.ui5.core.BaseStructuredType.
sap.ui.define([
	'sap/ui/core/Element',
	'sap/viz/library',
	'./BaseChartMetadata',
	"sap/base/util/ObjectPath",
	"sap/base/Log"
],
	function(Element, library, BaseChartMetadata, ObjectPath, Log) {
	"use strict";

	/**
	 * Constructor for a new ui5/core/BaseStructuredType.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Abstract base class for all elements that represent VIZ modules or complex property types
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely
	 * @alias sap.viz.ui5.core.BaseStructuredType
	 */
	var BaseStructuredType = Element.extend("sap.viz.ui5.core.BaseStructuredType", /** @lends sap.viz.ui5.core.BaseStructuredType.prototype */ {
		metadata : {
			"abstract" : true,
			library : "sap.viz"
		}
	}, BaseChartMetadata);

	BaseStructuredType.prototype._getOrCreate = function(sName) {
		var o = this.getAggregation(sName);
		if ( !o ) {
			var oMetadata = this.getMetadata(),
				oAggregation = oMetadata.getAggregation(sName);

			if ( oAggregation && oAggregation._oParent === oMetadata ) {
				//TODO: global jquery call found
				jQuery.sap.require(oAggregation.type);
				var FNClass = ObjectPath.get(oAggregation.type || "");
				o = new FNClass();
				this.setAggregation(sName, o);
			}
		}
		return o;
	};

	BaseStructuredType.prototype._getOptions = function(bIncludeDefaults) {

		var oMetadata = this.getMetadata(),
				mOptions = {},
				mProps,mDefaults,mAggrs,n,oValue;

		// HACK: convert UI5 wrapper names back to VIZ names
		function tovizKey(n) {
		  n = (n === 'toolTip' ? 'tooltip' : n);
			return n;
		}

		function tovizValue(n){
		  var result = n;
		  switch (n){
		  case 'triangleUp' :
		    result = 'triangle-up';
		    break;
		  case 'triangleDown' :
		    result = 'triangle-down';
		    break;
		  case 'triangleLeft' :
		    result = 'triangle-left';
		    break;
		  case 'triangleRight' :
		    result = 'triangle-right';
		    break;
		  }
	    return result;
		}

		// enforce enrichment of metadata
		oMetadata.getJSONKeys();

		// collect non-default values for all VIZ properties with a simple type
		var mProps = oMetadata.getAllProperties();
		var mDefaults = oMetadata.getPropertyDefaults();
		for (n in mProps) {
			// assumption: a property is a VIZ property if and only if it has been introduced by this class
			// This check needs to be enhanced as soon as inheritance is reflected in the wrappers
			if ( mProps[n]._oParent === oMetadata ) {
		    oValue = this.getProperty(n);
		    // use values only for non-default values
		    if (oValue instanceof Array){
		      if (bIncludeDefaults || !mDefaults[n] || oValue.toString() !== mDefaults[n].toString()){
		        mOptions[tovizKey(n)] = tovizValue(oValue);
		      }
		    } else if ( bIncludeDefaults || oValue !== mDefaults[n] ) {
					mOptions[tovizKey(n)] = tovizValue(oValue);
				}
			}
		}

		// collect non-null values for all VIZ properties with a complex type
		var mAggrs = oMetadata.getAllAggregations();
		for (n in mAggrs) {
			// assumption: an aggregation is a VIZ aggregation if and only if it has been introduced by this class
			// This check needs to be enhanced as soon as inheritance is reflected in the wrappers
			if ( mAggrs[n]._oParent == oMetadata ) {
		    oValue = this.getAggregation(n, null);
		    if ( oValue !== null ) {
					// transitively retrieve options
					mOptions[tovizKey(n)] = oValue._getOptions(bIncludeDefaults);
		    }
			}
		}

		return mOptions;
	};

	/**
	 * Helper method to convert a given object into an object of the type expected by the given aggregation.
	 * Used to mediate between old and new Interaction APIs.
	 *
	 * Although this is a static method, <code>this</code> must be the object that will aggregate the given
	 * object. <code>this</code> will be used to determine the metadata of the aggregation
	 *
	 * @return {object} the converted object or - if not applicable - the given object
	 */
	BaseStructuredType._convertAggregatedObject = function(sAggregationName, oObject, bMultiple) {
		if ( oObject != null ) {
			// get aggregation information
			var oAggregation = this.getMetadata().getAllAggregations()[sAggregationName];
			// get class name of the given object
			var sClassName = oObject.getMetadata && oObject.getMetadata().getName();
			if ( oAggregation && sClassName !== oAggregation.type ) { // TODO inheritance?
				// ensure that the class for the type is loaded
				//TODO: global jquery call found
				jQuery.sap.require(oAggregation.type);
				// create a new instance of the desired class with the options of the current one
				var fnClass = ObjectPath.get(oAggregation.type || "");
				oObject = new fnClass(oObject._getOptions(true)); // also include default values as they might differ between types
				Log.warning("[Deprecated] Type of aggregation '" + this.getMetadata().getName() + "." + sAggregationName + " has been changed from '" + sClassName + "' to '" + oAggregation.type + "'.");
			}
		}
		return oObject;
	};

	BaseStructuredType.prototype.validateProperty = function(sPropertyName, oValue) {
		if ( /^(lineSize|size)$/.test(sPropertyName) ) {
			var oProperty = this.getMetadata().getAllProperties()[sPropertyName];
			if ( oProperty && oProperty.type === "int" && typeof oValue !== "number" ) {
				oValue = oValue ? parseInt(oValue) : null;
			}
		}
		return Element.prototype.validateProperty.call(this, sPropertyName, oValue);
	};

	BaseStructuredType.prototype.validateAggregation = function(sAggregationName, oObject, bMultiple) {
		if ( sAggregationName === "selectability" ) {
			// can convert types in the following two cases
			// - if a behaviors.Interaction receives a controller.Interaction_selectability (e.g. chart.GetInteraction().setSelectability(...) in old code)
			// - if a controller.Interaction receives a behaviors.Interaction_selectability
			oObject = BaseStructuredType._convertAggregatedObject.call(this, sAggregationName, oObject, bMultiple);
		}
		return Element.prototype.validateAggregation.call(this, sAggregationName, oObject, bMultiple);
	};

	return BaseStructuredType;
});
