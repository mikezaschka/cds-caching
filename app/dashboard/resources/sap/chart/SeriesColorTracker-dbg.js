/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/*
 * Keep track of series colors on different *pages*.
 */
sap.ui.define(["sap/ui/thirdparty/jquery"], function(jQuery) {
	"use strict";

	var _COLOR_FEEDS = {
			color: true,
			color2: true
	};

	function SeriesColorTracker() {
		this._mSeriesColor = {};
	}

	/**
	 * Convert CVOM data context into a string key
	 * @param {any} oCtx a single aCtx CVOM data context, which is an array of string/null/undefined/number/object
	 * @returns {string} string representation of the data context
	 */
	function seriesKey(oCtx) {

		var sType = typeof oCtx;
		if (sType === "string" || oCtx instanceof String) {
			return '"' + oCtx + '"';
		} else if (oCtx === null || oCtx === undefined) {
			return sType;
		} else if (Array.isArray(oCtx)) {
			return "[" + oCtx.map(seriesKey).join(",") + "]";
		} else if (sType === "object") {
			// null value is handled in separate if because: typeof null == "object"!
			return "{" + Object.keys(oCtx).map(function(sProp) {
				return '"' + sProp + '":' + seriesKey(oCtx[sProp]);
			}).join(",") + "}";
		} else if (sType === "number" || sType === "boolean") {
			return String(oCtx);
		} else {
			return sType + "<" + String(oCtx) + ">";
		}
	}
	// get item from mSeriesColor which id equal bindingIds. if not found, create a new one
	function getSeriesColorMapping(mSeriesColor, bindingIds){
		var seriesColor;
		for (var i = 0; i < mSeriesColor.length; ++i){
			var item = mSeriesColor[i];
			if (item.fields.length === bindingIds.length){
				var bFound = true;
				for (var j = 0; bFound && j < bindingIds.length; ++j){
					bFound = (bindingIds[j] === item.fields[j]);
				}
				if (bFound) {
					seriesColor = item;
				}
			}
		}
		//
		if (!seriesColor){
		    seriesColor = {fields: bindingIds.slice(), results:{}};
			mSeriesColor.push(seriesColor);
		}
		return seriesColor;
	}
	/**
	 * Add CVOM runtime scales to record if not tracked already
	 * @param {object[]} aRuntimeScales CVOM runtime scales
	 * [{feed:"color",
	 *   fields:["Country", "Year"},
	 *   results:[]}
	 *   ]
	 *
	 *   this._mSeriesColor structure:{
	 *       "color":[{fields:["Country","Year"},  results:{}]
	 *   }
	 */
	SeriesColorTracker.prototype.add = function(aRuntimeScales) {
		var mAllSeriesColor = this._mSeriesColor,
			mSeriesColor;
		if (aRuntimeScales){
			aRuntimeScales.forEach(function(oRTScale) {
				var sFeed = oRTScale.feed;
				if (!_COLOR_FEEDS[sFeed]) {
					return;
				}
				mSeriesColor = mAllSeriesColor[sFeed];
				if (!mSeriesColor) {
					mSeriesColor = [];
					mAllSeriesColor[sFeed] = mSeriesColor;
				}
				var curSeriesColor = getSeriesColorMapping(mSeriesColor, oRTScale.fields);
				var mapping = curSeriesColor.results;
				oRTScale.results.forEach(function(oResult) {
					var sKey = seriesKey(oResult.dataContext);
					if (!mapping[sKey]) {
					    mapping[sKey] = oResult;
					}
				});
			});
		}
	};

	/**
	 * Return currently tracked series colors in CVOM runtime scales format
	 * @returns {object} series colors
	 */
	SeriesColorTracker.prototype.get = function() {
		var aFeeds = Object.keys(this._mSeriesColor);
		var mSeriesColor = this._mSeriesColor;
		var result = [];
		for (var i = 0; i < aFeeds.length; ++i){
			var seriesColors = mSeriesColor[aFeeds[i]];
			var currentSeries = {
				feed:aFeeds[i],
				mappings:[]
			};
			for (var j = 0; j < seriesColors.length; ++j){
				var results = [];
				var colorMapping = seriesColors[j].results;
				var aKeys = Object.keys(colorMapping);
				for (var k = 0; k < aKeys.length; ++k){
					results.push(colorMapping[aKeys[k]]);
				}
				currentSeries.mappings.push({
					results: results,
					fields: seriesColors[j].fields
				});
			}
			result.push(currentSeries);
		}

		return result;
	};

	SeriesColorTracker.prototype.clear = function() {
		this._mSeriesColor = {};
	};

	return SeriesColorTracker;
});
