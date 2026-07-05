/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(function() {
    "use strict";

    var FeedHelper = {};

    FeedHelper.getFeedDefsMap = function(vizType) {
        var allFeeds;
        try {
            allFeeds = sap.viz.api.manifest.Viz.get(vizType)[0].allFeeds();
        } catch (e) {
            try {
                allFeeds = sap.viz.api.metadata.Viz.get(vizType).bindings;
            } catch (error) {
                return null;
            }
        }
        var map = {};
        for (var i = 0; i < allFeeds.length; i++) {
            map[allFeeds[i].id] = allFeeds[i];
        }
        return map;
    };

    FeedHelper.updateAxis = function(dimensions, vizType, feeds) {
        if (!feeds || feeds.length === 0 || !dimensions || dimensions.length === 0) {
            return;
        }
        // Map of dimensions
        var dimMap = {};
        dimensions.forEach(function(dim) {
            dimMap[dim.getName()] = dim;
        });
        // Map of feed definations
        var feedDefsMap = FeedHelper.getFeedDefsMap(vizType);

        // Travesal
        feeds.forEach(function(feed) {
            var def = feedDefsMap[feed.getUid()];
            if (def.type !== 'Dimension') {
                return;
            }
            var aaIndex = def.aaIndex;
            feed.getValues().forEach(function(value) {
                var dim = dimMap[value];
                if (dim) {
                    dim.setProperty('axis', aaIndex, true);
                }
            });
        });
    };

    return FeedHelper;
});
