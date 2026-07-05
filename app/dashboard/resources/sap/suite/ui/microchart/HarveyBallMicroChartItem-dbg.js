/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"./library",
	"sap/ui/core/Element",
	"sap/suite/ui/microchart/MicroChartUtils"
], function(library, Element, MicroChartUtils)	{
	"use strict";
	const MicroChartColorType = library.MicroChartColorType;
	/**
	 * Constructor for a new HarveyBallMicroChartItem to be used in a {@link sap.suite.ui.microchart.HarveyBallMicroChart}.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Defines the fraction value that is compared with total in a {@link sap.suite.ui.microchart.HarveyBallMicroChart}.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.34
	 *
	 * @public
	 * @alias sap.suite.ui.microchart.HarveyBallMicroChartItem
	 */
	var HarveyBallMicroChartItem = Element.extend("sap.suite.ui.microchart.HarveyBallMicroChartItem", /** @lends sap.suite.ui.microchart.HarveyBallMicroChartItem.prototype */ {
		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {

				/**
				 * The color of the sector representing the fraction value.<br>The same color is used for the fraction
				 * value label defined either by the <code>fraction</code> property or by the <code>fractionLabel</code>
				 * property.
				 * For SAPUI5 1.x releases, we are going to use string as the type for Micro Charts instead of sap.m.ValueCSSColor.
				 * The value will only support MicroChartColorType from the SAPUI5 2.0 release.
				 * @type {sap.suite.ui.microchart.MicroChartColorType | sap.m.ValueCSSColor}
				 */
				color: { group: "Misc", type: "string", defaultValue: MicroChartColorType.Neutral  },

				/**
				 * The fraction value that defines the size of the colored sector.
				 * <br>This property must be set to a value that is a fraction of the <code>total</code>
				 * value defined for the {@link sap.suite.ui.microchart.HarveyBallMicroChart}.
				 */
				fraction: { group: "Misc", type: "float", defaultValue: 0 },

				/**
				 * The fraction label. If this property is specified, it is displayed instead of the label that is
				 * based on the <code>fraction</code> property.
				 */
				fractionLabel: { group: "Misc", type: "string" },

				/**
				 * The scaling factor that is displayed after the fraction value.
				 */
				fractionScale: { group: "Misc", type: "string" },

				/**
				 * If set to <code>true</code>, the <code>fractionLabel</code> property is used instead of the
				 * combination of the fraction value and scaling factor.
				 * <br>The default value is <code>false</code>, which means that the fraction value, defined by
				 * the <code>fraction</code> property, and the scaling factor, defined by the <code>fractionScale</code>
				 * property are displayed separately.
				 */
				formattedLabel: { group: "Misc", type: "boolean", defaultValue: false }

			}
		}
	});

	HarveyBallMicroChartItem.prototype.init = function() {
		this.setAggregation("tooltip", "((AltText))", true);
	};

	MicroChartUtils.extendMicroChartSetColor(HarveyBallMicroChartItem);


	return HarveyBallMicroChartItem;
});
