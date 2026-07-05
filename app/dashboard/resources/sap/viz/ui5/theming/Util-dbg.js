/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/Device",
	"sap/ui/core/theming/Parameters"
], function(Device, Parameters) {
	"use strict";

	var Util = {};

	/**
	 * CSS Parameters to Properties mapping object
	 */
	Util._mapping = {
	  "sapUiChartLabelHoverColor":                        [
	                                                        "categoryAxis.hoverShadow.color",
	                                                        "categoryAxis2.hoverShadow.color",
	                                                        "rowAxis.hoverShadow.color",
	                                                        "columnAxis.hoverShadow.color",
	                                                        "timeAxis.hoverShadow.color"
	                                                      ],
	  "sapUiChartLabelPressedColor":                      [
	                                                        "categoryAxis.mouseDownShadow.color",
	                                                        "categoryAxis2.mouseDownShadow.color",
	                                                        "rowAxis.mouseDownShadow.color",
	                                                        "columnAxis.mouseDownShadow.color",
	                                                        "timeAxis.mouseDownShadow.color"
	                                                      ],
	  "sapUiChartCategoryAxisLabelFontColor":             [
	                                                        "categoryAxis.label.style.color",
	                                                        "categoryAxis2.label.style.color",
	                                                        "categoryAxis.label.parentStyle.color",
	                                                        "categoryAxis2.label.parentStyle.color",
	                                                        "columnAxis.label.style.color",
	                                                        "rowAxis.label.style.color",
	                                                        "timeAxis.label.style.color",
								"plotArea.callout.label.style.color",
								"plotArea.polarAxis.label.style.color"
	                                                      ],
	  "sapUiChartValueAxisLabelFontColor":                [
	                                                        "valueAxis.label.style.color",
								"valueAxis2.label.style.color",
								"plotArea.valueAxis.label.style.color"
	                                                      ],
	  "sapUiChartCategoryAxisLabelFontSize":              [
	                                                        "categoryAxis.label.style.fontSize",
	                                                        "categoryAxis2.label.style.fontSize",
	                                                        "categoryAxis.label.parentStyle.fontSize",
	                                                        "categoryAxis2.label.parentStyle.fontSize",
	                                                        "rowAxis.label.style.fontSize",
	                                                        "columnAxis.label.style.fontSize",
                                                            "timeAxis.label.style.fontSize",
                                                            "plotArea.polarAxis.label.style.fontSize"
	                                                      ],
	  "sapUiChartValueAxisLabelFontSize":                 [
	                                                        "valueAxis.label.style.fontSize",
                                                                "valueAxis2.label.style.fontSize",
                                                                "plotArea.valueAxis.label.style.fontSize"
	                                                      ],
	  "sapUiChartCategoryAxisLineColor":                  [
	                                                        "categoryAxis.color",
	                                                        "categoryAxis2.color",
	                                                        "timeAxis.color"
	                                                      ],
	  "sapUiChartValueAxisLineColor":                     [
	                                                        "valueAxis.color",
	                                                        "valueAxis2.color"
	                                                      ],
	  "sapUiChartBackgroundColor":                        [
	                                                        "general.background.color",
	                                                        "plotArea.background.color",
	                                                        "plotArea.referenceLine.defaultStyle.label.background"
	                                                      ],
	  "sapUiFontFamily":                                  [
	                                                        "plotArea.dataLabel.style.fontFamily",
	                                                        "plotArea.dimensionLabel.style.fontFamily",
	                                                        "plotArea.referenceLine.defaultStyle.label.fontFamily",
	                                                        "plotArea.highlight.centerName.style.fontFamily",
	                                                        "plotArea.highlight.centerValue.style.fontFamily",
	                                                        "categoryAxis.title.style.fontFamily",
	                                                        "categoryAxis2.title.style.fontFamily",
	                                                        "categoryAxis.label.style.fontFamily",
	                                                        "categoryAxis2.label.style.fontFamily",
	                                                        "timeAxis.title.style.fontFamily",
	                                                        "timeAxis.label.style.fontFamily",
	                                                        "valueAxis.title.style.fontFamily",
	                                                        "valueAxis.label.style.fontFamily",
	                                                        "valueAxis2.label.style.fontFamily",
	                                                        "valueAxis2.title.style.fontFamily",
	                                                        "columnAxis.title.style.fontFamily",
	                                                        "columnAxis.label.style.fontFamily",
	                                                        "rowAxis.title.style.fontFamily",
	                                                        "rowAxis.label.style.fontFamily",
	                                                        "legend.title.style.fontFamily",
	                                                        "legend.label.style.fontFamily",
	                                                        "sizeLegend.title.style.fontFamily",
	                                                        "sizeLegend.label.style.fontFamily",
	                                                        "title.style.fontFamily",
                                                                "plotArea.callout.label.style.fontFamily",
                                                                "plotArea.polarAxis.title.style.fontFamily",
                                                                "plotArea.polarAxis.label.style.fontFamily",
                                                                "plotArea.valueAxis.label.style.fontFamily"
	                                                      ],
	  "sapUiChartLabelFontWeight":                        [
	                                                        "plotArea.dataLabel.style.fontWeight",
	                                                        "plotArea.dimensionLabel.style.fontWeight",
	                                                        "plotArea.referenceLine.defaultStyle.label.fontWeight",
	                                                        "plotArea.highlight.centerName.style.fontWeight",
	                                                        "plotArea.highlight.centerValue.style.fontWeight",
	                                                        "categoryAxis.label.style.fontWeight",
	                                                        "categoryAxis2.label.style.fontWeight",
	                                                        "timeAxis.label.style.fontWeight",
	                                                        "valueAxis.label.style.fontWeight",
	                                                        "valueAxis2.label.style.fontWeight",
	                                                        "columnAxis.label.style.fontWeight",
	                                                        "rowAxis.label.style.fontWeight",
	                                                        "legend.label.style.fontWeight",
                                                                "sizeLegend.label.style.fontWeight",
                                                                "plotArea.polarAxis.label.style.fontWeight",
                                                                "plotArea.valueAxis.label.style.fontWeight"
	                                                      ],
	  "sapUiChartLegendLabelFontColor":                   [
	                                                        "legend.label.style.color",
	                                                        "sizeLegend.label.style.color"
	                                                      ],
	  "sapUiChartLegendTitleFontColor":                   [
	                                                        "legend.title.style.color",
	                                                        "sizeLegend.title.style.color"
	                                                      ],
	  "sapUiChartLegendTitleFontSize":                    [
	                                                        "legend.title.style.fontSize",
	                                                        "sizeLegend.title.style.fontSize"
	                                                      ],
	  "sapUiChartLegendLabelFontSize":                    [
	                                                        "legend.label.style.fontSize",
	                                                        "sizeLegend.label.style.fontSize"
	                                                      ],
	  "sapUiChartPaletteUndefinedColor":                  "plotArea.defaultOthersStyle.color",
	  "sapUiChartPaletteSemanticBadLight1":               "general.defaultTimePeriodColor",
	  "sapUiChartGridlineColor":                          [
	                                                        "plotArea.gridline.color",
	                                                        "plotArea.grid.line.color",
	                                                        "plotArea.dataLabel.line.color"
	                                                      ],
	  "sapUiChartReferenceLineColor":                     ["plotArea.referenceLine.defaultStyle.color",
	                                                        "plotArea.referenceLine.defaultStyle.label.background",
	                                                        "plotArea.callout.line.color"
	                                                      ],
	  "sapUiChartReferenceLineLabelColor":                "plotArea.referenceLine.defaultStyle.label.color",
	  "sapUiChartDataLabelFontSize":                      [
	                                                        "plotArea.dataLabel.style.fontSize",
	                                                        "plotArea.dimensionLabel.style.fontSize",
	                                                        "plotArea.referenceLine.defaultStyle.label.fontSize",
	                                                        "plotArea.callout.label.style.fontSize"
	                                                      ],
	  "sapUiChartScrollBarThumbColor":                    [
	                                                        "plotArea.scrollbar.thumb.fill",
	                                                        "legend.scrollbar.thumb.fill"
	                                                      ],
	  "sapUiChartScrollBarTrackColor":                    [
	                                                        "plotArea.scrollbar.track.fill",
	                                                        "legend.scrollbar.track.fill"
	                                                      ],
	  "sapUiChartScrollBarThumbHoverColor":               [
	                                                        "plotArea.scrollbar.thumb.hoverFill",
	                                                        "legend.scrollbar.thumb.hoverFill"
	                                                      ],
	  "sapUiChartScrollbarThumbPadding":                  [
	                                                        "plotArea.scrollbar.spacing",
	                                                        "legend.scrollbar.spacing"
	                                                      ],
	  "sapUiChartScrollbarBorderColor":                   [
	                                                        "plotArea.scrollbar.border.color",
	                                                        "legend.scrollbar.border.color"
	                                                      ],
	  "sapUiChartScrollbarBorderSize":                    [
	                                                        "plotArea.scrollbar.border.width",
	                                                        "legend.scrollbar.border.width"
	                                                      ],
	  "sapUiChartMainTitleFontColor":                       "title.style.color",
	  "sapUiChartAxisTitleFontColor":                       [
	                                                        "categoryAxis.title.style.color",
	                                                        "categoryAxis2.title.style.color",
	                                                        "valueAxis.title.style.color",
	                                                        "valueAxis2.title.style.color",
	                                                        "columnAxis.title.style.color",
	                                                        "rowAxis.title.style.color",
	                                                        "timeAxis.title.style.color",
	                                                        "plotArea.polarAxis.title.style.color",
	                                                        "plotArea.valueAxis.title.style.color"
	                                                      ],
	  "sapUiChartMainTitleFontSize":                      "title.style.fontSize",
	  "sapUiChartAxisTitleFontSize":                      [
	                                                        "categoryAxis.title.style.fontSize",
	                                                        "categoryAxis2.title.style.fontSize",
	                                                        "valueAxis.title.style.fontSize",
	                                                        "valueAxis2.title.style.fontSize",
	                                                        "columnAxis.title.style.fontSize",
	                                                        "rowAxis.title.style.fontSize",
	                                                        "timeAxis.title.style.fontSize",
	                                                        "plotArea.polarAxis.title.style.fontSize",
	                                                        "plotArea.valueAxis.title.style.fontSize"
																												],
		"sapUiChartAxisTitleFontWeight":                    [
	                                                        "categoryAxis.title.style.fontWeight",
	                                                        "categoryAxis2.title.style.fontWeight",
	                                                        "valueAxis.title.style.fontWeight",
	                                                        "valueAxis2.title.style.fontWeight",
	                                                        "columnAxis.title.style.fontWeight",
	                                                        "rowAxis.title.style.fontWeight",
	                                                        "timeAxis.title.style.fontWeight",
	                                                        "plotArea.polarAxis.title.style.fontWeight",
	                                                        "plotArea.valueAxis.title.style.fontWeight"
																												],
	  "sapUiChartTitleFontWeight":                        [
	                                                        "title.style.fontWeight",
	                                                        "legend.title.style.fontWeight",
	                                                        "categoryAxis.label.parentStyle.fontWeight",
	                                                        "categoryAxis2.label.parentStyle.fontWeight",
	                                                        "plotArea.callout.label.style.fontWeight"
	                                                      ],
	  "sapUiChartDataPointBorderColor":                   [
	                                                        "plotArea.dataPoint.stroke.color",
	                                                        "plotArea.area.stroke.color",
	                                                        "interaction.deselected.stroke.color"
	                                                      ],
	  "sapUiChartDataPointBorderHoverSelectedColor":      [
	                                                        "interaction.hover.stroke.color",
	                                                        "interaction.selected.stroke.color"
	                                                      ],
	  "sapUiChartDataPointNotSelectedBackgroundOpacity":  "interaction.deselected.opacity",
	  "sapUiChartTargetColor":                            ["plotArea.target.valueColor",
                            "plotArea.linkline.color"],
	  "sapUiChartTargetShadowColor":                      "plotArea.target.shadowColor",
	  "sapUiChartBubbleBGOpacity":                        "plotArea.dataPoint.opacity",
	  "sapUiGroupContentBackground":                      "tooltip.background.color",
	  "sapVizChartTooltipBorderStroke":                   [
	                                                        "tooltip.background.borderColor",
	                                                        "tooltip.separationLine.color"
	                                                      ],
	  "sapUiChartPopoverDataItemFontColor":               [
	                                                        "tooltip.bodyDimensionLabel.color",
	                                                        "tooltip.bodyDimensionValue.color",
	                                                        "tooltip.bodyMeasureLabel.color",
	                                                        "tooltip.bodyMeasureValue.color",
	                                                        "tooltip.footerLabel.color"
	                                                      ],
	  "sapUiChartLegendHoverBackground":                   ["legend.hoverShadow.color"],
	  "sapUiChartLegendSelectionBackground":               ["legend.mouseDownShadow.color"],
	  "sapUiChartLegendSelectionHoverBackground":          ["legend.hoverSelectedShadow.color"],
	  "sapUiChartPaletteSemanticNeutral":                 ["plotArea.dataPoint.color.total"],
	  "sapUiChartPaletteQualitativeHue1":                 ["plotArea.dataPoint.color.positive"],
	  "sapUiChartPaletteQualitativeHue2":                 ["plotArea.dataPoint.color.negative"],
	  "sapUiChartLightText":                              ["timeAxis.label.style.parentColor"],
	  "sapUiChartZeroAxisColor":                          ["plotArea.gridline.zeroLine.color"],
      "sapUiChartDataLabelFontColor":                     ["plotArea.dataLabel.style.color"],
      "sapUiChartFocusWidth": 							  ["interaction.keyboard.width"],
      "sapUiContentFocusColor": 					  ["interaction.keyboard.color"]
	};

	(function () {
		var isMobile = (Device.system.tablet || Device.system.phone);
		if (isMobile){
	        Util._mapping["sapUiChartBackgroundColor"] = ["general.background.color",
	                                                 "plotArea.background.color",
	                                                  "plotArea.referenceLine.defaultStyle.label.background",
	                                                  "plotArea.scrollbar.track.fill",
	                                                  "legend.scrollbar.track.fill"];
	        Util._mapping["sapUiChartScrollBarThumbColor"] = [];
	        Util._mapping["sapUiChartScrollBarTrackColor"] = [];
	        Util._mapping["sapUiChartScrollBarThumbHoverColor"] = ["plotArea.scrollbar.thumb.hoverFill",
	                                                          "legend.scrollbar.thumb.hoverFill",
	                                                          "plotArea.scrollbar.thumb.fill",
	                                                          "legend.scrollbar.thumb.fill"];
	    } else {
	        Util._mapping["sapUiChartBackgroundColor"] = ["general.background.color",
	                                                "plotArea.background.color",
	                                                "plotArea.referenceLine.defaultStyle.label.background"];
	        Util._mapping["sapUiChartScrollBarThumbColor"] = ["plotArea.scrollbar.thumb.fill",
	                                                     "legend.scrollbar.thumb.fill"];
	        Util._mapping["sapUiChartScrollBarTrackColor"] = ["plotArea.scrollbar.track.fill",
	                                                     "legend.scrollbar.track.fill"];
	        Util._mapping["sapUiChartScrollBarThumbHoverColor"] = ["plotArea.scrollbar.thumb.hoverFill",
	                                                          "legend.scrollbar.thumb.hoverFill"];
	    }
	})();

	Util._exclude = {
	  "valueAxis.color": ["*dual*"],
	  "valueAxis.title.style.color": ["*dual*"],
	  "valueAxis2.color": ["*dual*"],
	  "valueAxis2.title.style.color": ["*dual*"],
	  "interaction.hover.stroke.color": ["*pie*", "*donut*"]
	};

	/**
	 * Read CSS parameters and convert them to CVOM properties
	 *
	 * @return {object}
	 * @example {"plot.dataLabel.style.color": "0xff00ff", "title.style.color":
	 *          "0x00ff00", ...}
	 */
	Util.readCSSParameters = function(chartType, oControl) {
	  var property = {};
	  var mapping = Util._mapping;
	  var exclude = Util._exclude;
	  for (var key in mapping) {
	    if (mapping.hasOwnProperty(key)) {
	      var value = Parameters.get({ name: [key], callback: function() {} });
	      if (value) {
	        var index = value.indexOf('rem');
	        if (index > -1) {
	          var temp = value.substring(0, index);
	          value = temp *
	            parseFloat(window.getComputedStyle(document.documentElement).fontSize) + 'px';
	        }
	        var path = mapping[key];
	        if (Object.prototype.toString.call(path) === '[object Array]') {
	          for (var i = 0; i < path.length; i++) {
	            if (!isExcluded(exclude, path[i], chartType)) {
	              addProperty(property, path[i], value);
	            }
	          }
	        } else {
	          if (!isExcluded(exclude, path, chartType)) {
	            addProperty(property, path, value);
	          }
	        }
	      }
	    }
	  }
	  return property;

	  function addProperty(property, path, value) {
	    var keys = path.split('.');
	    var prop = property;
	    for (var i = 0; i < keys.length - 1; i++) {
	      var key = keys[i];
	      if (prop[key] == undefined || prop[key] == null ) {
	        prop[key] = {};
	      }
	      prop = prop[key];
	    }
	    key = keys[i];
	    prop[key] = value;
	  }

	  function isExcluded(exclude, path, chartType) {
	    var result = false;
	    if (exclude.hasOwnProperty(path)) {
	      var types = exclude[path];
	      for (var i = 0; i < types.length; i++) {
	        var pattern = types[i].replace(/\*/g, '.*').replace(/\?/g, '.').replace(/\|/g, '$|^');
	        var reg = RegExp('^' + pattern + '$');
	        if (reg.test(chartType)) {
	          result = true;
	          break;
	        }
	      }
	    }
	    return result;
	  }
	};


	return Util;

}, /* bExport= */ true);
