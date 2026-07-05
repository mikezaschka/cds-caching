/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/coloring/criticality/DimensionValues',
	'sap/chart/ChartLog',
	"sap/ui/thirdparty/jquery"
], function(ColoringUtils, DimensionValues, ChartLog, jQuery) {
	"use strict";

	var Dim = {};

	var validate = function(aColoringDimension, aActiveDimension, oDimMsr, options) {
		var tempOpt = jQuery.extend({}, options);
		tempOpt.bHasOtherSeriesDim = oDimMsr.aDim.some(function(oDim) {
			return oDim._getFixedRole() === "series" && oDim.getName() !== aActiveDimension[0];
		});
		tempOpt.type = 'Emphasis';
		tempOpt.subType = 'DimensionValues';
		ColoringUtils.checkColoringDimension(aActiveDimension, oDimMsr, aColoringDimension, tempOpt);
		var dimensionColoring = aColoringDimension[aActiveDimension[0]],
			values = dimensionColoring.Values,
			legend = dimensionColoring.Legend || {};
		if (values.length > 1 && !legend.Highlighted) {
			//clid18
			throw new ChartLog('error', 'Colorings.Emphasis.DimensionValues', 'Legend.Highlighted is mandatory when Highlight has multiple values.');
		}
	};

	Dim.qualify = function(oConfig, activeDimension, oDimMsr, options) {
		validate(oConfig, activeDimension, oDimMsr, options);
		var oCandidateSetting;
		if (activeDimension[0]) {
			oCandidateSetting = {
				dim: activeDimension[0],
				setting: oConfig
			};
		}
		return oCandidateSetting;
	};

	Dim.parse = function(oConfig, oLocale) {
		var oLegend = {},
			sDimName = oConfig.dim,
			oDimConfig = oConfig.setting[sDimName],
			values = oDimConfig.Values;
		var aHighlightedValues = Array.isArray(values) ? values : [values];
		var fnHightlightCb = function (oCtx) {
			return aHighlightedValues.indexOf(oCtx[sDimName]) > -1;
		};

		if (oDimConfig.Legend && oDimConfig.Legend.Highlighted != null) {
			oLegend.Highlight = oDimConfig.Legend.Highlighted;
		} else {
			oLegend.Highlight = aHighlightedValues[0];
		}
		if (oDimConfig.Legend && oDimConfig.Legend.Others) {
			oLegend.Others = oDimConfig.Legend.Others;
		} else {
			oLegend.Others = oLocale.getText("COLORING_TYPE_OTHER");
		}

		var mCallbacks = {
			Highlight: fnHightlightCb
		};

		return {
			callbacks: mCallbacks,
			legend: oLegend
		};
	};

	return Dim;
});
