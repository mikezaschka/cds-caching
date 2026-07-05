/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.RootContainer_layout.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.RootContainer_layout
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Settings for the layout of the root container
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
	 * @alias sap.viz.ui5.types.RootContainer_layout
	 */
	var RootContainer_layout = BaseStructuredType.extend("sap.viz.ui5.types.RootContainer_layout", /** @lends sap.viz.ui5.types.RootContainer_layout.prototype */ { metadata: {

		library: "sap.viz",


		properties : {

			/**
			 * Indicates the layout adjust policy
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			adjustPolicy : {type : "string", deprecated: true},

			/**
			 * Set the universal padding value. This single value is applied to all sides of the chart. Individual settings for each edge are also supported.
			 */
			padding : {type : "int", defaultValue : 24},

			/**
			 * Set the padding value for the top side
			 */
			paddingTop : {type : "int"},

			/**
			 * Set the padding value for the left side
			 */
			paddingLeft : {type : "int"},

			/**
			 * Set the padding value for the right side
			 */
			paddingRight : {type : "int"},

			/**
			 * Set the padding value for the bottom side
			 */
			paddingBottom : {type : "int"},

			/**
			 * Vertical gap value between UI components
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			vgap : {type : "int", defaultValue : 8, deprecated: true},

			/**
			 * Horizontal gap value between UI components
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			hgap : {type : "int", defaultValue : 8, deprecated: true},

			/**
			 * Hide axis title firstly if the space is limited.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			hideAxisTitleFirst : {type : "boolean", defaultValue : true, deprecated: true}
		}
	}});


	return RootContainer_layout;

});
