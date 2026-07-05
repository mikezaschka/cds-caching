/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides element sap.viz.ui5.types.Datalabel.
sap.ui.define(['sap/viz/library', 'sap/viz/ui5/core/BaseStructuredType'],
	function(library, BaseStructuredType) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.types.Datalabel
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Module sap.viz.ui5.types.Datalabel
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
	 * @alias sap.viz.ui5.types.Datalabel
	 */
	var Datalabel = BaseStructuredType.extend("sap.viz.ui5.types.Datalabel", /** @lends sap.viz.ui5.types.Datalabel.prototype */ { metadata : {

		library: "sap.viz",



		properties: {

			/**
			 * Set whether the data labels are visible
			 */
			visible : {type : "boolean", defaultValue : false},

			/**
			 * Always show all data labels even they are overlapped
			 */
			hideWhenOverlap : {type : "boolean", defaultValue : true},

			/**
			 * Set whether the chart is a donut chart. Use only for donut charts.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isDonut : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set the type of label
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			type : {type : "string", defaultValue : 'value', deprecated: true},

			/**
			 * If set to 'true', the data labels will be automatically placed outside when the data label position property is inside, and vice versa
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			automaticInOutside : {type : "boolean", defaultValue : true, deprecated: true},

			/**
			 * If set to 'true', the value zero is shown in the data labels
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			showZero : {type : "boolean", defaultValue : true, deprecated: true},

			/**
			 * Set whether the chart is a geo chart
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isGeoChart : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set whether the chart is a bubble chart
			 * @deprecated Since version 1.22.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isBubbleChart : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set whether the chart is a stack chart. Set for stack chart only.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isStackMode : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set whether the chart is a percent chart. Set for percent chart only.
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			isPercentMode : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * If set to 'true', the data label position is defined by the property 'outsidePosition', regardless of whether the data label value is negative
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			positionPreference : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * If set to 'true', the data label is visible when it is outside
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			outsideVisible : {type : "boolean", defaultValue : true, deprecated: true},

			/**
			 * If set to 'true', the data label is positioned above the element when it is outside
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			outsidePosition : {type : "sap.viz.ui5.types.Datalabel_outsidePosition", defaultValue : sap.viz.ui5.types.Datalabel_outsidePosition.up, deprecated: true},

			/**
			 * Set painting mode of data labels
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			paintingMode : {type : "sap.viz.ui5.types.Datalabel_paintingMode", defaultValue : sap.viz.ui5.types.Datalabel_paintingMode.rectCoordinate, deprecated: true},

			/**
			 * Set position of data labels
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			position : {type : "sap.viz.ui5.types.Datalabel_position", defaultValue : sap.viz.ui5.types.Datalabel_position.inside, deprecated: true},

			/**
			 * Set orientation of data labels
			 * @deprecated Since version 1.12.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			orientation : {type : "sap.viz.ui5.types.Datalabel_orientation", defaultValue : sap.viz.ui5.types.Datalabel_orientation.vertical, deprecated: true},

			/**
			 * If set to 'true', the data label is automatically hidden when bubble width isn't enough to show the whole label in single bubble chart.
			 * @deprecated Since version 1.20.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			respectShapeWidth : {type : "boolean", defaultValue : false, deprecated: true},

			/**
			 * Set the format strings for the data labels. For dual axis charts, the first array is applied to the primary axis and the second array is applied to the second axis. If you enter fewer format strings into an array than there are measures in the respective axis, then the last format string is applied to all remaining measures. The following characters are reserved as tokens for format code: MDYHSAmdyhsa#?%0@. The following is a simple example: [["0.00%"],["0.00%"]].
			 */
			formatString : {type : "any[]", defaultValue : null}
		}
	}});


	return Datalabel;

});
