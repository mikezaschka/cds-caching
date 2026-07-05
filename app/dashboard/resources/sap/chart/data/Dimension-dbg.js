/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(["sap/ui/core/Element", "sap/chart/utils/ChartUtils", "sap/ui/thirdparty/jquery"], function(Element, ChartUtils, jQuery) {
	"use strict";
	var _SUPPORTED_ROLE = {category:true,category2:true,series:true};

	/**
	 * Constructor for a new ui5/data/Dimension.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Definition of a single dimension in a chart
	 *
	 * <table border="1">
	 *   <tr>
	 *     <th>chartType</th>
	 * 	   <th>binding rules</th>
	 *   </tr>
	 * 	 <tr>
	 *     <td>pie, donut</td>
	 * 	   <td>All dimensions are assigned to feed uid “color”.</td>
	 *   </tr>
	 * 	 <tr>
	 *     <td>scatter, bubble</td>
	 * 	   <td>All dimensions with role category are assigned to feed uid “shape”.</td>
	 *   </tr>
	 * 	 <tr>
	 *     <td>heatmap</td>
	 * 	   <td>All dimensions with role “series” and “category2” are assigned to the feed uid “categoryAxis2”.</td>
	 *   </tr>
	 * 	 <tr>
	 *     <td>treemap</td>
	 * 	   <td>All dimensions are assigned to the feed uid “categoryAxis” in the default sequence.</td>
	 *   </tr>
	 * </table>
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @since 1.32.0
	 * @name sap.chart.data.Dimension
	 */
	var Dimension = Element.extend("sap.chart.data.Dimension", {
		metadata : {
			library : "sap.chart",
			properties : {
				/**
				 * Property in the "data" model holding the (always unique) Dimension key.
				 */
				name : {type : "string"},
				/**
				 * Label for the Dimension, either as a string literal or by a pointer using the binding syntax to some property containing the label.
				 *
				 * <b>NOTE:</b> This property was bound internally if automatically created via metadata of oData service and please call "unbindProperty" before setting.
				 */
				label: {type: "string"},
				/**
				 * Function returning a formatted text for a Dimension key value that will be used for axis labelling. If specified, this property takes precedence over the "textProperty" property of the Dimension.
				 * Dimension key value and the corresponding text will be passed to the supplied function as parameters.
				 */
				textFormatter: {type: "function"},
				/**
				 * Text for a Dimension key value, typically by a pointer using the binding syntax to some property containing the text.
				 *
				 * <b>NOTE:</b> This property was bound internally if automatically created via metadata of oData service and please call "unbindProperty" before setting.
				 */
				textProperty: {type: "string"},
				/**
				 * Whether a text is displayed. If the "textProperty" property has not been specified, it will be derived from the metadata.
				 */
				displayText: {type: "boolean", defaultValue: true},
				/**
				 * How the Dimension will influence the chart layout. Possible values are {@link sap.chart.data.DimensionRoleType category}, {@link sap.chart.data.DimensionRoleType series} or {@link sap.chart.data.DimensionRoleType category2}.
				 * The default is {@link sap.chart.data.DimensionRoleType category}.
				 *
				 * You can create a new dimension as follow:
				 * <pre>
				 * ...
				 * new sap.chart.data.Dimension({name: "DIMENSION1", role: sap.chart.data.DimensionRoleType.category})
				 * ...
				 * </pre>
				 *
				 * Detailed usage of dimension role. Please refer to {@link sap.chart.data.DimensionRoleType DimensionRoleType}
				 *
				 * <b>NOTE:</b> Has no effect if the Dimension is used as inResultDimensions by Chart
				 */
				role: {type: "string", defaultValue: "category"}
			}
		}
	});

	Dimension.prototype.setLabel = ChartUtils.makeNotifyParentProperty("label");
	Dimension.prototype.setTextFormatter = ChartUtils.makeNotifyParentProperty("textFormatter");
	var textPropertySetter = ChartUtils.makeNotifyParentProperty("textProperty");
	Dimension.prototype.setTextProperty = function(sValue, bSuppressInvalidate) {
		return textPropertySetter.apply(this, arguments);
	};
	Dimension.prototype.setDisplayText = ChartUtils.makeNotifyParentProperty("displayText");
	var roleSetter = ChartUtils.makeNotifyParentProperty("role");
	Dimension.prototype.setRole = function(sValue, bSuppressInvalidate) {
		if (!_SUPPORTED_ROLE[sValue]) {
			throw new TypeError("Invalide Dimension role: " + sValue);
		}
		return roleSetter.apply(this, arguments);
	};
	Dimension.prototype._getFixedRole = function() {
		return this._sFixedRole || this.getRole();
	};
	return Dimension;
});