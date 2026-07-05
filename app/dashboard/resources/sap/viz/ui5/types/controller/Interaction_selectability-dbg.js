/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.controller.Interaction_selectability.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.controller.Interaction_selectability
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Settings for selectability
	 * @extends sap.viz.ui5.core.BaseStructuredType
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
	 * Charting API is not finished yet and might change completely.
	 * @alias sap.viz.ui5.types.controller.Interaction_selectability
	 */
	var Interaction_selectability = BaseStructuredType.extend("sap.viz.ui5.types.controller.Interaction_selectability", /** @lends sap.viz.ui5.types.controller.Interaction_selectability.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Set the selection mode. If this value is set to 'exclusive' or 'single', only one set of data points can be selected at once. If this value is set to 'inclusive' or 'multiple', multiple sets of data points can be selected at once. If this value is set to 'none', no sets of data points can be selected. The values 'single' and 'multiple' are deprecated; please remove them from your chart.
			 */
			mode : {type : "sap.viz.ui5.types.controller.Interaction_selectability_mode", defaultValue : sap.viz.ui5.types.controller.Interaction_selectability_mode.inclusive},

			/**
			 * Set whether axis labels can be selected
			 */
			axisLabelSelection : {type : "boolean", defaultValue : true},

			/**
			 * Set whether the legend can be selected
			 */
			legendSelection : {type : "boolean", defaultValue : true},

			/**
			 * Set whether lasso selection can be used in the plot area
			 */
			plotLassoSelection : {type : "boolean", defaultValue : true},

			/**
			 * Set whether selection can be done in the plot area by clicking and tapping
			 */
			plotStdSelection : {type : "boolean", defaultValue : true},

			/**
			 * Set whether the user must hold the ctrl key to use lasso selection
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			lassoWithCtrlKey : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set whether data points can be cached. If it's true, data points might be cached by Interaction for better performance.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			dataPointsCacheable : {type : "boolean", defaultValue : true, deprecated: true}
		}
	}});


	return Interaction_selectability;

});
