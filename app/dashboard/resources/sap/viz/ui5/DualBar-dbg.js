/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.viz.ui5.DualBar.
sap.ui.define(['sap/viz/library', './core/BaseChart', './DualBarRenderer'],
	function(library, BaseChart) {
		"use strict";

	/**
	 * Constructor for a new sap.viz.ui5.DualBar
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @classdesc Chart sap.viz.ui5.DualBar
	 * @extends sap.viz.ui5.core.BaseChart
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}</b>(<code>new sap.viz.ui5.controls.VizFrame({'vizType': 'dual_bar'})</code>)
	 * <b>control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 * @alias sap.viz.ui5.DualBar
	 */
	var DualBar = BaseChart.extend("sap.viz.ui5.DualBar", /** @lends sap.viz.ui5.DualBar.prototype */ { metadata : {

		library : "sap.viz",


		aggregations : {

			/**
			 * Module sap.viz.modules.rootContainer
			 */
			general : {type : "sap.viz.ui5.types.RootContainer", multiple : false},

			/**
			 * Module sap.viz.modules.controller.interaction
			 */
			interaction : {type : "sap.viz.ui5.types.controller.Interaction", multiple : false},

			/**
			 * Module sap.viz.modules.title
			 */
			title : {type : "sap.viz.ui5.types.Title", multiple : false},

			/**
			 * Module sap.viz.modules.legend
			 */
			legendGroup : {type : "sap.viz.ui5.types.Legend", multiple : false},

			/**
			 * Module sap.viz.modules.legend.common
			 */
			legend : {type : "sap.viz.ui5.types.legend.Common", multiple : false},

			/**
			 * Module sap.viz.chart.elements.Tooltip
			 */
			toolTip : {type : "sap.viz.ui5.types.Tooltip", multiple : false},

			/**
			 * Module sap.viz.modules.xycontainer
			 */
			xyContainer : {type : "sap.viz.ui5.types.XYContainer", multiple : false},

			/**
			 * Module sap.viz.modules.datalabel
			 */
			dataLabel : {type : "sap.viz.ui5.types.Datalabel", multiple : false},

			/**
			 * Module sap.viz.modules.axis
			 */
			xAxis : {type : "sap.viz.ui5.types.Axis", multiple : false},

			/**
			 * Module sap.viz.modules.axis
			 */
			yAxis : {type : "sap.viz.ui5.types.Axis", multiple : false},

			/**
			 * Module sap.viz.modules.background
			 */
			background : {type : "sap.viz.ui5.types.Background", multiple : false},

			/**
			 * Module sap.viz.modules.bar
			 */
			plotArea : {type : "sap.viz.ui5.types.Bar", multiple : false},

			/**
			 * Module sap.viz.modules.axis
			 */
			xAxis2 : {type : "sap.viz.ui5.types.Axis", multiple : false}
		},

		events : {

			/**
			 * Event fires when certain data point(s) is(are) selected, data context of selected item(s) would be passed in accordance with the following format.<code>{name: "selectData",data:[{
			 * //selected element's detail
			 * target:"Dom Element",//an object pointed to corresponding dom element
			 * data:[{val: "...",//value of this element
			 * ctx:{type:"Dimension"||"Measure"||"MND",
			 * //for Dimension
			 * path:{aa:"...",di:"...",dii:"..."},
			 * //for Measure
			 * path:{mg:"...",mi:"...",dii_a1:"...",dii_a2:"..."},
			 * //for MND
			 * path:{mg:"...",mi:"..."}
			 * //path: analysis path
			 * //aa: analysis axis index // 0 for analysis axis 1,  1 for analysis 2
			 * //di: dimension index //zero based
			 * //dii: dimension item index //zero based
			 * //mg: measure group index // 0 for measure group 1,1 for measure group 2
			 * //mi: measure index // measure index in measure group zero based
			 * //dii_a1: each dii of di in analysis axis 1 index
			 * //dii_a2: each dii of di in analysis axis 2 index
			 * }},{
			 * //for bubble, tagcloud and scatter, there will be more than one values in one selected element.
			 * var:"...",ctx:"..."}]},{
			 * //if under multi selection, there will be more than one selected elements
			 * target:"...",data:["..."]}]}
			 */
			selectData : {},

			/**
			 * Event fires when certain data point(s) is(are) deselected, data context of deselected item(s) would be passed in accordance with the following format.<code>{name: "deselectData",data:["---the same as selectedData---"]}
			 */
			deselectData : {},

			/**
			 * This event is deprecated, please use showDetail decoration (refer to properties: interaction.decorations) instead. Event fires when the mouse hover onto the specific part of chart, data context of tooltip would be passed in accordance with the following format.<code>{name:"showTooltip",data:{body:[{
			 * //All measures
			 * name:"...",val:[{//measure value is an array containing only one item
			 * value:"..."}]},"..."],footer:[{label:"...",value:"..."},"..."],plotArea:{
			 * //this object specifies the plot area of the chart
			 * height:"...",width:"...",x:"...",y:"..."},point:{
			 * //this object specifies a point which affects the position of tooltip
			 * x:"...",y:"..."},selectedValues:...//this number specify how many values are selected}}
			 * @deprecated Since version 1.19.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			showTooltip : {deprecated: true},

			/**
			 * This event is deprecated, please use hideDetail decoration (refer to properties: interaction.decorations) instead. Event fires when the mouse hover out of the specific part of chart, no data is passed.
			 * @deprecated Since version 1.19.
			 * This Property has been deprecated. This interface will be removed from the SAPUI5 delivery in one of the next releases.
			 */
			hideTooltip : {deprecated: true},

			/**
			 * Event fires when the loading ends. To use the event listener when creating charts, you must use an event that is passed by the events option. For more information on events options, see the usrOptions section of the <a href="sap.viz.core.html#createViz" target="_blank">createViz</a> function in the API document.
			 */
			initialized : {}
		},

		vizChartType: "viz/dual_bar"

	}});


	return DualBar;

});
