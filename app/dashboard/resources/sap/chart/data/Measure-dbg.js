/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/Element",
	"sap/chart/utils/ChartUtils",
	"sap/chart/data/MeasureSemantics",
	"sap/ui/thirdparty/jquery"
], function(Element, ChartUtils, MeasureSemantics, jQuery)	{
	"use strict";
	var _SUPPORTED_ROLE = {axis1:true,axis2:true,axis3:true,axis4:true};

	/**
	 * Constructor for a new ui5/data/Measure.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Definition of a single measure in a chart
	 *
	 * <table border="1">
	 *   <tr>
	 *     <th>chartType</th>
	 * 	   <th>binding rules</th>
	 *   </tr>
	 * 	 <tr>
	 *     <td>pie, donut</td>
	 * 	   <td>The measure is assigned to feed uid “size”.</td>
	 *   </tr>
	 * 	 <tr>
	 *     <td>scatter</td>
	 * 	   <td>The first measure with role “axis1”, or (if not exists) the first measure with role “axis2” or (if not exist) with role “axis3”, is assigned to the feed uid “valueAxis”. The other measure is assigned to feed uid “valueAxis2”.</td>
	 *   </tr>
	 *   <tr>
	 *     <td>bubble</td>
	 * 	   <td>The first measure with role “axis1”, or (if not exists) the first measure with role “axis2” or (if not exist) with role “axis3”, is assigned to the feed uid “valueAxis”.
	 *       <br>The first measure with role “axis2”, or (if not exists) the second measure with role “axis1” or (if not exist) the first measure with role “axis3”, is assigned to the feed uid “valueAxis2”.
	 *       <br>The remaining measure is assigned to feed uid “bubbleWidth”.
	 *     </td>
	 *   </tr>
	 * 	 <tr>
	 *     <td>heatmap</td>
	 * 	   <td>The measure is assigned to the feed uid “color”.</td>
	 *   </tr>
	 * 	 <tr>
	 *     <td>treemap</td>
	 * 	   <td>The first measure with role “axis1”, or (if not exists) the first measure with role “axis2” or (if not exist) with role “axis3”, is assigned to the feed uid “color”. The other measure is assigned to feed uid “weight”.</td>
	 *   </tr>
	 *   <tr>
	 *     <td>..dual..</td>
	 * 	   <td>At least one measure is assigned to each of the feed uids “valueAxis” and “valueAxis2”, according to the general rule.</td>
	 *   </tr>
	 * </table>
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @since 1.32.0
	 * @name sap.chart.data.Measure
	 */
	var Measure = Element.extend("sap.chart.data.Measure", {
		metadata: {
			library : "sap.chart",
			properties: {
				/**
				 * Property in the "data" model holding the raw measure value.
				 */
				name: {type: "string"},
				/**
				 * Label for the Measure, either as a string literal or by a pointer using the binding syntax to some property containing the label.
				 */
				label: {type: "string"},
				// Need to discuss behavior for these 2 properties
				/**
				 * Unit for the measure, a pointer using the binding syntax to some field containing the unit.
				 * Value of the given field from the same data record will be displayed after formatted measure value in data label, tooltip and chart popover.
				 * NOTE: To work properly, the unit field must be set as visible dimension in chart, and only one unit value exists for any visible dimension value combination.
				 */
				unitBinding: {type: "string"},
				/**
				 * A (core UI5) format pattern to be used by the formatter to format the measure value.
				 * @deprecated
				 * Please use {@link sap.chart.Chart#setVizProperties} to set related formatStrings instead.
				 *
				 */
				valueFormat: {type: "string", defaultValue: null},
				/**
				 * How values of Measure will be rendered in the chart. Possible role values are {@link sap.chart.data.MeasureRoleType axis1}, {@link sap.chart.data.MeasureRoleType axis2}, {@link sap.chart.data.MeasureRoleType axis3}, and {@link sap.chart.data.MeasureRoleType axis4}.
				 * The default is {@link sap.chart.data.MeasureRoleType axis1}.
				 * They correspond to the well-known concepts of axis identifiers in the Cartesian coordinate system, e.g. a Y-axis in a bar/column/line chart, an X- and a Y-axis in a scatter chart, or two Y-axes in bar charts, and an optional third axis for the weight/size/intensity/temperature of a data point.
				 *
				 * You can create a new measure as follow:
				 * <pre>
				 * ...
				 * new sap.chart.data.Measure({name: "MEASURE1", role: sap.chart.data.MeasureRoleType.axis1})
				 * ...
				 * </pre>
				 *
				 * Detailed usage of measure role. Please refer to {@link sap.chart.data.MeasureRoleType MeasureRoleType}
				 *
				 * <b>NOTE:</b> Role definition would not work for Bullet Chart and users need to set semantics instead.
				 */
				role: {type: "string", defaultValue: "axis1"},
				/**
				 * The semantics of the measure.
				 *
				 * <b>NOTE:</b> Dimension-based coloring (see {@link sap.chart.Chart#setColorings}) does not work when semantics is set to {@link sap.chart.data.MeasureSemantics.Projected} or {@link sap.chart.data.MeasureSemantics.Reference} for visible measure(s).
				 *
				 * <b>NOTE:</b> In Bullet chart measure defined as "Reference" maps to targetValues and "Projected" maps to additionalValues. Measures without definition will be recognized as actualValues.
				 */
				semantics: {type: "sap.chart.data.MeasureSemantics", defaultValue: MeasureSemantics.Actual},
				/**
				 * Semantically related measures for a measure with semantics "actual" value. It is an object with two properties:
				 * <ol>
				 *   <li>"projectedValueMeasure" identifing the projected value measure, and</li>
				 *   <li>"referenceValueMeasure" identifing the reference value measure.</li>
				 * </ol>
				 */
				semanticallyRelatedMeasures: {type: "object", defaultValue: null},
				/**
				 * The analytical extra information
				 *
				 * @experimental
				 * @since 1.63
				 */
				analyticalInfo: {type: "object", defaultValue: null}
			}
		}
	});

	Measure.prototype.setLabel = ChartUtils.makeNotifyParentProperty("label");
	var roleSetter = ChartUtils.makeNotifyParentProperty("role");
	Measure.prototype.setRole = function(sValue, bSuppressInvalidate) {
		if (!_SUPPORTED_ROLE[sValue]) {
			throw new TypeError("Invalide Measure role: " + sValue);
		}
		return roleSetter.apply(this, arguments);
	};
	Measure.prototype.setUnitBinding = ChartUtils.makeNotifyParentProperty("unitBinding");
	Measure.prototype.setValueFormat = ChartUtils.makeNotifyParentProperty("valueFormat");
	Measure.prototype.setSemantics = ChartUtils.makeNotifyParentProperty("semantics");
	Measure.prototype.setSemanticallyRelatedMeasures = ChartUtils.makeNotifyParentProperty("semanticallyRelatedMeasures");
	Measure.prototype._getFixedRole = function() {
		return this._sFixedRole || this.getRole();
	};
	return Measure;
});