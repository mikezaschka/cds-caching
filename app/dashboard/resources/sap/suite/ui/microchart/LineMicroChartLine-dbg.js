/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"./library",
	"sap/ui/core/Element",
	"sap/suite/ui/microchart/LineMicroChartEmphasizedPoint",
	"sap/base/Log",
	"sap/suite/ui/microchart/MicroChartUtils",
	"./LineMicroChartPoint"
], function(library, Element, LineMicroChartEmphasizedPoint, Log, MicroChartUtils, LineMicroChartPoint) {
	"use strict";

	var LineType = library.LineType;

	/**
	 * Constructor for a new LineMicroChartLine.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * The container containing all the points of the line.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.60
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.LineMicroChartLine
	 */
	var LineMicroChartLine = Element.extend("sap.suite.ui.microchart.LineMicroChartLine", /** @lends sap.suite.ui.microchart.LineMicroChartLine.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * Defines the color of the chart.
				 * <br>In conjunction with emphasized points, this property is only used if all points have the {@link sap.m.ValueColor.Neutral} color.
				 * The color can be set as an {@link sap.m.ValueCSSColor} or as a plain object. It has the <code>above</code> and <code>below</code> properties that determine the color of the graph above and below the threshold, respectively.
				 *
				 * <br>This property has priority over the property <code>color</code> of {@link sap.suite.ui.microchart.LineMicroChart} in case it is set.
				 * <br>If this property is not defined, the value of the <code>color</code> property from the parent {@link sap.suite.ui.microchart.LineMicroChart} is used instead.
				 */
				color: { type: "any", group: "Appearance"},

				/**
				 * Defines whether the points are shown.
				 * <br>If emphasized points are used, this property is ignored.
				 * <br>If this property is set to <code>true</code>, the points in the <code>points</code> aggregation are shown.
				 *
				 * <br>This property has priority over the property <code>showPoints</code> of {@link sap.suite.ui.microchart.LineMicroChart} in case it is set.
				 * <br>If this property is not defined, the <code>showPoints</code> property of the {@link sap.suite.ui.microchart.LineMicroChart} is used instead.
				 */
				showPoints: { type: "boolean", group: "Appearance"},

				/**
				 * Defines the type of the line.
				 */
				type: { type: "sap.suite.ui.microchart.LineType", group: "Appearance", defaultValue: LineType.Solid}
			},
			defaultAggregation: "points",
			aggregations: {

				/**
				 * Aggregation that contains all data points that should be provided in an ordered way.
				 *
				 * <br><b>Note:</b> Points can be bound without template/factory method.
				 * <br>This approach is more efficient when many points are used, because no new objects will be created for them
				 * and only their representation in the model will be kept. See the {@link https://ui5.sap.com/#/sample/sap.suite.ui.microchart.sample.LineMicroChartBinding/preview samples}.
				 * <br>To use emphasized points, the <code>emphasized</code> property has to be set in the model of the point and can be used together with the properties <code>show</code> and <code>color</code>, as shown in the sample.
				 * When this binding method is used, the #getPoints method will always return an empty array.
				 */
				points: { type: "sap.suite.ui.microchart.LineMicroChartPoint", multiple: true, bindable: "bindable", defaultClass: LineMicroChartPoint }
			}
		}
	});

	// enable calling 'bindAggregation("points")' without a factory
	LineMicroChartLine.getMetadata().getAllAggregations()["points"]._doesNotRequireFactory = true;

	LineMicroChartLine.prototype.bindAggregation = function(sName, oBindingInfo) {
		if (sName === "points") {
			if (!oBindingInfo.factory && !oBindingInfo.template) {
				this._bNoFactory = true;
			}
		}

		Element.prototype.bindAggregation.apply(this, arguments);
	};

	LineMicroChartLine.prototype.updatePoints = function(sReason) {
		if (!this._bNoFactory) {
			return this.updateAggregation("points");
		} else {
			this.invalidate(); // rerender because model changed, but it has to be handeled manually
		}
	};

	LineMicroChartLine.prototype.clone = function() {
		var oClone = Element.prototype.clone.apply(this, arguments);
		// enrich the clone with _bNoFactory value
		oClone._bNoFactory = this._bNoFactory;

		return oClone;
	};

	LineMicroChartLine.prototype._getPoints = function() {
		var that = this;

		if (!this._bNoFactory) {
			var aPoints = this.getAggregation("points"); // for some reason getAggregation can return null instead of an empty array
			return aPoints === null ? [] : aPoints;
		}

		// return point like object in case there is no template for it
		return this.getBinding("points").getContexts().map(function(oPoint) {
			return {
				getX: function () {
					return oPoint.getProperty("x");
				},
				getY: function () {
					return oPoint.getProperty("y");
				},
				getShow: function() {
					return oPoint.getProperty("show") ? oPoint.getProperty("show") : that._getEmphPointPropDefaultValue("show");
				},
				getColor: function() {
					return oPoint.getProperty("color") ? oPoint.getProperty("color") : that._getEmphPointPropDefaultValue("color");
				},
				getMetadata: function() {
					return {
						getName: function () {
							return oPoint.getProperty("emphasized") ? "sap.suite.ui.microchart.LineMicroChartEmphasizedPoint" : "sap.suite.ui.microchart.LineMicroChartPoint";
						}
					};
				}
			};
		});
	};

	/**
	 * Returns default value of the LineMicroChartEmphasizedPoint for the given property
	 *
	 * @param {string} sProperty Name of the property
	 *
	 * @returns {*} Default value of the LineMicroChartEmphasizedPoint for the given property
	 * @private
	 */
	LineMicroChartLine.prototype._getEmphPointPropDefaultValue = function(sProperty) {
		return LineMicroChartEmphasizedPoint.getMetadata().getProperty(sProperty).getDefaultValue();
	};

	LineMicroChartLine.prototype.getColor = function() {
		var sColor = this.getProperty("color"),
			oParent = this.getParent();

		// fallback to LineMicroChart if color is not defined on LineMicroChartLine
		if (sColor === undefined || sColor === null) {
			if (oParent && oParent.isA("sap.suite.ui.microchart.LineMicroChart")) {
				sColor = oParent.getColor();
			}
		}

		return sColor;
	};

	LineMicroChartLine.prototype.validateProperty = function(sPropertyName, value) {
		if (value === null || value === undefined) {
			return Element.prototype.validateProperty.apply(this, [sPropertyName, null]);
		}

		if (sPropertyName === "color" && !this.isColorCorrect(value)) {
			Log.warning("Color property of LineMicroChartLine must be of type sap.m.ValueCSSColor either as single value or as composite value (above: value, below: value)");
			value = null;
		}

		return Element.prototype.validateProperty.apply(this, [sPropertyName, value]);
	};

	LineMicroChartLine.prototype.getShowPoints = function() {
		var oParent = this.getParent(),
			sColor = this.getProperty("showPoints");

		// fallback to LineMicroChart if color is not defined on LineMicroChartLine
		if (sColor === undefined || sColor === null) {
			if (oParent && oParent.isA("sap.suite.ui.microchart.LineMicroChart")) {
				sColor = oParent.getShowPoints();
			}
		}

		return sColor;
	};

	MicroChartUtils.extendMicroChart(LineMicroChartLine);

	return LineMicroChartLine;
});
