/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(function(){"use strict";var e={};e.getFeedDefsMap=function(e){var t;try{t=sap.viz.api.manifest.Viz.get(e)[0].allFeeds()}catch(a){try{t=sap.viz.api.metadata.Viz.get(e).bindings}catch(e){return null}}var a={};for(var r=0;r<t.length;r++){a[t[r].id]=t[r]}return a};e.updateAxis=function(t,a,r){if(!r||r.length===0||!t||t.length===0){return}var n={};t.forEach(function(e){n[e.getName()]=e});var i=e.getFeedDefsMap(a);r.forEach(function(e){var t=i[e.getUid()];if(t.type!=="Dimension"){return}var a=t.aaIndex;e.getValues().forEach(function(e){var t=n[e];if(t){t.setProperty("axis",a,true)}})})};return e});
//# sourceMappingURL=FeedHelper.js.map