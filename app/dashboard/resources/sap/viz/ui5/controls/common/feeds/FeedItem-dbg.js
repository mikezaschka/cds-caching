/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.viz.ui5.controls.common.feeds.FeedItem.
sap.ui.define(['sap/ui/core/Element','sap/viz/library','./AnalysisObject'],
	function(Element, library, AnalysisObject) {
	"use strict";

	/**
	 * Constructor for a new ui5/controls/common/feeds/FeedItem.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * FeedItem Class
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @since 1.21.0
	 * @name sap.viz.ui5.controls.common.feeds.FeedItem
	 */
	var FeedItem = Element.extend("sap.viz.ui5.controls.common.feeds.FeedItem", /** @lends sap.viz.ui5.controls.common.feeds.FeedItem.prototype */ { metadata : {

		library : "sap.viz",
		properties : {

			/**
			 * Uid of a feed item.
			 * Please reference to bindings section in VIZDOCS to get the exact sUid string for each chart type.
			 *
			 * For example:
			 * 	Bar chart > bindings > categoryAxis ; color ; valueAxis.
			 * 	The 'categoryAxis' should be the sUid for x axis feeding for bar chart.
			 */
			uid : {type : "string", group : "Misc", defaultValue : null},

			/**
			 * Type of a feed item. Enumeration: Measure, Dimension
			 */
			type : {type : "string", group : "Misc", defaultValue : null},

			/**
			 * Value of a feed item.
			 */
			values : {type : "any[]", group : "Misc", defaultValue : null}
		}
	}});

	// /**
	// * This file defines behavior for the control,
	// */
	FeedItem.prototype._toInnerFmt = function(generator) {
		var uid = this.getProperty('uid');
		var type = this.getProperty('type');
		var values = this.getProperty('values');

		if (uid && type) {
			this._analysisObjects = [];
			if (values) {
				var isTimeBased = uid === "timeAxis";
				values.forEach( function(value, index, values) {
					if (typeof value === 'string') {
						this._analysisObjects[index] = new AnalysisObject({
							'uid' : value,
							'name' : value,
							'type' : value === 'MND' ? 'MND' : type
						});
					} else if (value instanceof AnalysisObject){
						this._analysisObjects[index] = value;
					} else {
						return;
					}
					if (isTimeBased){
						//Hard coded here to define a time-based analysis object. It's required by CVOM Viz Frame.
						this._analysisObjects[index].setDataType("date");
					}
				}.bind(this));

			}
			return generator(uid, type, this._analysisObjects);
		}
	};

	FeedItem.toVizControlsFmt = function(feeds) {
		return Array.prototype.map.call(feeds, function(feed) {
			return feed._toInnerFmt(function(id, type, values) {
				return new sap.viz.controls.common.feeds.FeedItem(id, type,
					AnalysisObject.toVizControlsFmt(values));
			});
		});
	};

	FeedItem.fromVizControlsFmt = function(feedsVizControlsFmt) {
		return Array.prototype.map.call(feedsVizControlsFmt, function(instance) {
			return new FeedItem({
				'uid' : instance.id(),
				'type' : instance.type(),
				'values' : AnalysisObject.fromVizControlsFmt(instance.values())
			});
		});
	};

	FeedItem.toLightWeightFmt = function(feeds) {
		return Array.prototype.map.call(feeds, function(feed) {
			return feed._toInnerFmt(function(id, type, values) {
				return {
					'id' : id,
					'type' : type,
					'values' : AnalysisObject.toLightWeightFmt(values)
				};
			});
		});
	};

	FeedItem.fromLightWeightFmt = function(feedsLightWeightFmt) {
		return Array.prototype.map.call(feedsLightWeightFmt, function(instance) {
			return new FeedItem({
				'uid' : instance.id,
				'type' : instance.type,
				'values' : AnalysisObject.fromLightWeightFmt(instance.values)
			});
		});
	};

	return FeedItem;

});
