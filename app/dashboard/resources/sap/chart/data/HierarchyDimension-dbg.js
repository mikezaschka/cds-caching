/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/chart/data/Dimension",
	"sap/chart/utils/ChartUtils"
], function(
	Dimension,
	ChartUtils
) {
	"use strict";

	/**
	 * Constructor for a new ui5/data/HierarchyDimension.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Definition of a single hierarchy dimension in a chart
	 * @extends sap.chart.data.Dimension
	 *
	 * @constructor
	 * @public
	 * @since 1.54.0
	 * @name sap.chart.data.HierarchyDimension
	 */
	var HierarchyDimension = Dimension.extend("sap.chart.data.HierarchyDimension", {
		metadata : {
			library : "sap.chart",
			properties : {
				/**
				 * Level restriction to be applied to this hierarchy dimension.
				 * NOTE: Setting this property will cause initialization of drill stack.
                 * Getter of this property just returns level explicitly set by user, call {@link sap.chart.Chart#getDrillStack} and refer to 'hierarchylevel' if you need current level after drilling
				 */
				level : {type : "int", defaultValue: 0}
			}
		}
	});

	HierarchyDimension.prototype.setLevel = ChartUtils.makeNotifyParentProperty("level");

	HierarchyDimension.prototype._getEffectiveLevel = function() {
		if (this._iEffectiveLevel == null) {
			return this.getLevel();
		} else {
			return this._iEffectiveLevel;
		}
	};

	return HierarchyDimension;
});
